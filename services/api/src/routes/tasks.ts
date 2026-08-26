import type { FastifyPluginAsync } from "fastify";
import { v7 as uuidv7, validate as uuidValidate } from "uuid";
import { prisma } from "../lib/prisma";

interface CreateTaskBody {
  id?: string;
  title: string;
  description?: string | null;
  priority?: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  dueAt?: string | null;
}

interface TaskParams {
  id: string;
}

export const taskRoutes: FastifyPluginAsync = async (app) => {
  app.get("/tasks", async (request) => {
    const userId = request.userId!;

    return prisma.task.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: [{ createdAt: "desc" }],
    });
  });

  app.post<{ Body: CreateTaskBody }>("/tasks", async (request, reply) => {
    const userId = request.userId!;
    const { id, title, description = null, priority = "NONE", dueAt = null } = request.body;

    if (typeof title !== "string" || title.trim().length === 0 || title.length > 500) {
      return reply.code(400).send({
        error: "INVALID_TITLE",
        message: "Title must be between 1 and 500 characters",
      });
    }

    if (id && !uuidValidate(id)) {
      return reply.code(400).send({
        error: "INVALID_ID",
        message: "Task id must be a valid UUID",
      });
    }

    const task = await prisma.task.create({
      data: {
        id: id ?? uuidv7(),
        userId,
        title: title.trim(),
        description,
        priority,
        dueAt: dueAt ? new Date(dueAt) : null,
      },
    });

    return reply.code(201).send(task);
  });

  app.delete<{ Params: TaskParams }>("/tasks/:id", async (request, reply) => {
    const userId = request.userId!;
    const { id } = request.params;

    const task = await prisma.task.findFirst({
      where: { id, userId, deletedAt: null },
      select: { id: true, version: true },
    });

    if (!task) {
      return reply.code(404).send({
        error: "NOT_FOUND",
        message: "Task not found",
      });
    }

    await prisma.task.update({
      where: { id: task.id },
      data: {
        deletedAt: new Date(),
        version: { increment: 1 },
      },
    });

    return reply.code(204).send();
  });
};
