import type { FastifyPluginAsync } from "fastify";
import { v7 as uuidv7, validate as uuidValidate } from "uuid";
import { prisma } from "../lib/prisma.js";

interface CreateTaskBody {
  id?: string;
  operationId?: string;
  title: string;
  description?: string | null;
  priority?: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  dueAt?: string | null;
}

interface UpdateTaskBody {
  operationId?: string;
  title?: string;
  description?: string | null;
  status?: "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  priority?: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  dueAt?: string | null;
}

interface TaskParams {
  id: string;
}

const isValidDate = (value: string) => !Number.isNaN(Date.parse(value));

export const taskRoutes: FastifyPluginAsync = async (app) => {
  app.get("/tasks", async (request) => {
    const userId = request.userId!;

    return prisma.task.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ createdAt: "desc" }],
    });
  });

  app.post<{ Body: CreateTaskBody }>("/tasks", async (request, reply) => {
    const userId = request.userId!;
    const {
      id,
      operationId = uuidv7(),
      title,
      description = null,
      priority = "NONE",
      dueAt = null,
    } = request.body;

    if (typeof title !== "string" || title.trim().length === 0 || title.length > 500) {
      return reply.code(400).send({ error: "INVALID_TITLE", message: "Title must be between 1 and 500 characters" });
    }
    if (id && !uuidValidate(id)) {
      return reply.code(400).send({ error: "INVALID_ID", message: "Task id must be a valid UUID" });
    }
    if (!uuidValidate(operationId)) {
      return reply.code(400).send({ error: "INVALID_OPERATION_ID", message: "operationId must be a valid UUID" });
    }
    if (dueAt !== null && !isValidDate(dueAt)) {
      return reply.code(400).send({ error: "INVALID_DUE_AT", message: "dueAt must be a valid ISO date" });
    }

    const existingOperation = await prisma.syncOperation.findUnique({ where: { operationId } });
    if (existingOperation) {
      return reply.code(200).send(await prisma.task.findUnique({ where: { id: existingOperation.entityId } }));
    }

    const taskId = id ?? uuidv7();
    const task = await prisma.$transaction(async (tx) => {
      const created = await tx.task.create({
        data: {
          id: taskId,
          userId,
          title: title.trim(),
          description,
          priority,
          dueAt: dueAt ? new Date(dueAt) : null,
        },
      });

      await tx.syncOperation.create({
        data: {
          operationId,
          userId,
          entityType: "TASK",
          entityId: created.id,
          operation: "CREATE",
          version: created.version,
          payload: created,
        },
      });
      return created;
    });

    return reply.code(201).send(task);
  });

  app.patch<{ Params: TaskParams; Body: UpdateTaskBody }>("/tasks/:id", async (request, reply) => {
    const userId = request.userId!;
    const { id } = request.params;
    const { operationId = uuidv7(), title, description, status, priority, dueAt } = request.body;

    if (!uuidValidate(id) || !uuidValidate(operationId)) {
      return reply.code(400).send({ error: "INVALID_ID", message: "Task id and operationId must be valid UUIDs" });
    }
    if (title !== undefined && (title.trim().length === 0 || title.length > 500)) {
      return reply.code(400).send({ error: "INVALID_TITLE", message: "Title must be between 1 and 500 characters" });
    }
    if (dueAt !== undefined && dueAt !== null && !isValidDate(dueAt)) {
      return reply.code(400).send({ error: "INVALID_DUE_AT", message: "dueAt must be a valid ISO date" });
    }

    const existingOperation = await prisma.syncOperation.findUnique({ where: { operationId } });
    if (existingOperation) {
      return reply.send(await prisma.task.findUnique({ where: { id: existingOperation.entityId } }));
    }

    const current = await prisma.task.findFirst({ where: { id, userId, deletedAt: null } });
    if (!current) {
      return reply.code(404).send({ error: "NOT_FOUND", message: "Task not found" });
    }

    const task = await prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: { id },
        data: {
          ...(title !== undefined ? { title: title.trim() } : {}),
          ...(description !== undefined ? { description } : {}),
          ...(status !== undefined ? { status } : {}),
          ...(priority !== undefined ? { priority } : {}),
          ...(dueAt !== undefined ? { dueAt: dueAt ? new Date(dueAt) : null } : {}),
          version: { increment: 1 },
        },
      });

      await tx.syncOperation.create({
        data: {
          operationId,
          userId,
          entityType: "TASK",
          entityId: updated.id,
          operation: "UPDATE",
          version: updated.version,
          payload: updated,
        },
      });
      return updated;
    });

    return reply.send(task);
  });

  app.delete<{ Params: TaskParams }>("/tasks/:id", async (request, reply) => {
    const userId = request.userId!;
    const { id } = request.params;
    const operationId = uuidv7();

    if (!uuidValidate(id)) {
      return reply.code(400).send({ error: "INVALID_ID", message: "Task id must be a valid UUID" });
    }

    const task = await prisma.task.findFirst({ where: { id, userId, deletedAt: null } });
    if (!task) {
      return reply.code(404).send({ error: "NOT_FOUND", message: "Task not found" });
    }

    await prisma.$transaction(async (tx) => {
      const deleted = await tx.task.update({
        where: { id },
        data: { deletedAt: new Date(), version: { increment: 1 } },
      });

      await tx.syncOperation.create({
        data: {
          operationId,
          userId,
          entityType: "TASK",
          entityId: deleted.id,
          operation: "DELETE",
          version: deleted.version,
          payload: deleted,
        },
      });
    });

    return reply.code(204).send();
  });
};
