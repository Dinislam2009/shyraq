import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../lib/prisma.js";

interface SyncQuery {
  cursor?: string;
  limit?: string;
}

export const syncRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: SyncQuery }>("/sync", async (request, reply) => {
    const userId = request.userId!;
    const cursor = request.query.cursor ?? "0";
    const limit = Math.min(Math.max(Number(request.query.limit ?? 200), 1), 500);

    if (!/^\d+$/.test(cursor)) {
      return reply.code(400).send({
        error: "INVALID_CURSOR",
        message: "cursor must be a non-negative integer",
      });
    }

    const cursorValue = BigInt(cursor);
    const operations = await prisma.syncOperation.findMany({
      where: { userId, sequence: { gt: cursorValue } },
      orderBy: { sequence: "asc" },
      take: limit,
    });

    const nextCursor = operations.length > 0
      ? operations[operations.length - 1]!.sequence.toString()
      : cursor;

    return {
      cursor,
      nextCursor,
      hasMore: operations.length === limit,
      operations: operations.map((operation) => ({
        ...operation,
        sequence: operation.sequence.toString(),
      })),
    };
  });
};
