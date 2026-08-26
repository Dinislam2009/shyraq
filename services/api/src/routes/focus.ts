import type { FastifyPluginAsync } from "fastify";
import { v7 as uuidv7, validate as uuidValidate } from "uuid";
import { prisma } from "../lib/prisma.js";

interface CreateFocusBody {
  taskId?: string | null;
}

interface FocusParams {
  id: string;
}

export const focusRoutes: FastifyPluginAsync = async (app) => {
  app.get("/focus", async (request) => {
    const userId = request.userId!;

    return prisma.focusSession.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      include: { task: true },
    });
  });

  app.post<{ Body: CreateFocusBody }>("/focus", async (request, reply) => {
    const userId = request.userId!;
    const taskId = request.body?.taskId ?? null;

    if (taskId !== null && !uuidValidate(taskId)) {
      return reply.code(400).send({ error: "INVALID_TASK_ID", message: "taskId must be a valid UUID" });
    }

    const running = await prisma.focusSession.findFirst({ where: { userId, status: "RUNNING" } });
    if (running) {
      return reply.code(409).send({ error: "FOCUS_ALREADY_RUNNING", message: "A focus session is already running" });
    }

    if (taskId) {
      const task = await prisma.task.findFirst({ where: { id: taskId, userId, deletedAt: null } });
      if (!task) return reply.code(404).send({ error: "TASK_NOT_FOUND", message: "Task not found" });
    }

    const session = await prisma.focusSession.create({
      data: { id: uuidv7(), userId, taskId, startedAt: new Date(), status: "RUNNING" },
      include: { task: true },
    });

    return reply.code(201).send(session);
  });

  app.post<{ Params: FocusParams }>("/focus/:id/complete", async (request, reply) => {
    const userId = request.userId!;
    const { id } = request.params;
    if (!uuidValidate(id)) return reply.code(400).send({ error: "INVALID_ID", message: "Focus session id must be a valid UUID" });

    const session = await prisma.focusSession.findFirst({ where: { id, userId } });
    if (!session) return reply.code(404).send({ error: "NOT_FOUND", message: "Focus session not found" });
    if (session.status !== "RUNNING") return reply.code(409).send({ error: "SESSION_NOT_RUNNING", message: "Focus session is not running" });

    const endedAt = new Date();
    const durationSeconds = Math.max(0, Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000));

    return reply.send(await prisma.focusSession.update({
      where: { id },
      data: { endedAt, durationSeconds, status: "COMPLETED" },
      include: { task: true },
    }));
  });

  app.post<{ Params: FocusParams }>("/focus/:id/cancel", async (request, reply) => {
    const userId = request.userId!;
    const { id } = request.params;
    if (!uuidValidate(id)) return reply.code(400).send({ error: "INVALID_ID", message: "Focus session id must be a valid UUID" });

    const session = await prisma.focusSession.findFirst({ where: { id, userId } });
    if (!session) return reply.code(404).send({ error: "NOT_FOUND", message: "Focus session not found" });
    if (session.status !== "RUNNING") return reply.code(409).send({ error: "SESSION_NOT_RUNNING", message: "Focus session is not running" });

    return reply.send(await prisma.focusSession.update({
      where: { id },
      data: { endedAt: new Date(), status: "CANCELLED" },
      include: { task: true },
    }));
  });
};
