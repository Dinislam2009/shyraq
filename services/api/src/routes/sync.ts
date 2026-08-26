import type { FastifyPluginAsync } from "fastify";
import { v7 as uuidv7, validate as uuidValidate } from "uuid";
import { prisma } from "../lib/prisma.js";

interface SyncQuery {
  cursor?: string;
  limit?: string;
}

interface PushOperation {
  operationId: string;
  entityType: "TASK";
  entityId: string;
  operation: "CREATE" | "UPDATE" | "DELETE";
  baseVersion: number;
  payload: Record<string, unknown>;
  createdAt: string;
}

interface PushBody {
  operations: PushOperation[];
}

const taskPayload = (payload: Record<string, unknown>) => ({
  title: typeof payload.title === "string" ? payload.title : undefined,
  description: typeof payload.description === "string" || payload.description === null ? payload.description : undefined,
  status: typeof payload.status === "string" ? payload.status : undefined,
  priority: typeof payload.priority === "string" ? payload.priority : undefined,
  dueAt: typeof payload.dueAt === "string" ? new Date(payload.dueAt) : payload.dueAt === null ? null : undefined,
});

export const syncRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: PushBody }>("/sync/push", async (request, reply) => {
    const userId = request.userId!;
    const operations = request.body?.operations;

    if (!Array.isArray(operations) || operations.length > 100) {
      return reply.code(400).send({ error: "INVALID_OPERATIONS", message: "operations must be an array with at most 100 items" });
    }

    try {
      const results = await prisma.$transaction(async (tx) => {
        const applied: Array<{ operationId: string; entityId: string; status: "APPLIED" | "DUPLICATE" | "CONFLICT" }> = [];

        for (const operation of operations) {
          if (
            !operation ||
            operation.entityType !== "TASK" ||
            !["CREATE", "UPDATE", "DELETE"].includes(operation.operation) ||
            !uuidValidate(operation.operationId) ||
            !uuidValidate(operation.entityId) ||
            !Number.isInteger(operation.baseVersion) ||
            operation.baseVersion < 0 ||
            !operation.payload ||
            typeof operation.payload !== "object" ||
            Number.isNaN(Date.parse(operation.createdAt))
          ) {
            throw new Error("INVALID_OPERATION");
          }

          const duplicate = await tx.syncOperation.findUnique({ where: { operationId: operation.operationId } });
          if (duplicate) {
            applied.push({ operationId: operation.operationId, entityId: duplicate.entityId, status: "DUPLICATE" });
            continue;
          }

          const current = await tx.task.findFirst({ where: { id: operation.entityId, userId } });
          const clientTime = new Date(operation.createdAt);

          if (operation.operation === "CREATE" && !current) {
            const created = await tx.task.create({
              data: {
                id: operation.entityId,
                userId,
                title: typeof operation.payload.title === "string" ? operation.payload.title.trim() : "Untitled",
                description: typeof operation.payload.description === "string" ? operation.payload.description : null,
                status: typeof operation.payload.status === "string" ? operation.payload.status : "TODO",
                priority: typeof operation.payload.priority === "string" ? operation.payload.priority : "NONE",
                dueAt: typeof operation.payload.dueAt === "string" ? new Date(operation.payload.dueAt) : null,
              },
            });
            await tx.syncOperation.create({
              data: {
                operationId: operation.operationId,
                userId,
                entityType: "TASK",
                entityId: created.id,
                operation: "CREATE",
                version: created.version,
                payload: created,
              },
            });
            applied.push({ operationId: operation.operationId, entityId: created.id, status: "APPLIED" });
            continue;
          }

          if (!current || current.updatedAt > clientTime) {
            applied.push({ operationId: operation.operationId, entityId: operation.entityId, status: "CONFLICT" });
            continue;
          }

          const updated = await tx.task.update({
            where: { id: current.id },
            data: operation.operation === "DELETE"
              ? { deletedAt: clientTime, version: { increment: 1 } }
              : { ...taskPayload(operation.payload), deletedAt: null, version: { increment: 1 } },
          });

          await tx.syncOperation.create({
            data: {
              operationId: operation.operationId,
              userId,
              entityType: "TASK",
              entityId: updated.id,
              operation: operation.operation,
              version: updated.version,
              payload: updated,
            },
          });
          applied.push({ operationId: operation.operationId, entityId: updated.id, status: "APPLIED" });
        }

        return applied;
      });

      return reply.send({ results });
    } catch (error) {
      if (error instanceof Error && error.message === "INVALID_OPERATION") {
        return reply.code(400).send({ error: "INVALID_OPERATION", message: "One or more operations are invalid" });
      }
      throw error;
    }
  });

  app.get<{ Querystring: SyncQuery }>("/sync", async (request, reply) => {
    const userId = request.userId!;
    const cursor = request.query.cursor ?? "0";
    const limit = Math.min(Math.max(Number(request.query.limit ?? 200), 1), 500);

    if (!/^\d+$/.test(cursor)) {
      return reply.code(400).send({ error: "INVALID_CURSOR", message: "cursor must be a non-negative integer" });
    }

    const operations = await prisma.syncOperation.findMany({
      where: { userId, sequence: { gt: BigInt(cursor) } },
      orderBy: { sequence: "asc" },
      take: limit,
    });

    const nextCursor = operations.length > 0 ? operations[operations.length - 1]!.sequence.toString() : cursor;

    return {
      cursor,
      nextCursor,
      hasMore: operations.length === limit,
      operations: operations.map((operation) => ({ ...operation, sequence: operation.sequence.toString() })),
    };
  });

  app.get("/sync/clock", async () => ({ now: new Date().toISOString() }));
};
