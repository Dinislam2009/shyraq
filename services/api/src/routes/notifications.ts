import type { FastifyPluginAsync } from "fastify";
import { v7 as uuidv7 } from "uuid";
import { prisma } from "../lib/prisma.js";

export const notificationRoutes: FastifyPluginAsync = async (app) => {
  app.get("/notifications", async (request) => {
    const userId = request.userId!;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const unreadCount = await prisma.notification.count({ where: { userId, readAt: null } });
    return { notifications, unreadCount };
  });

  app.patch<{ Params: { id: string } }>("/notifications/:id/read", async (request, reply) => {
    const userId = request.userId!;
    const updated = await prisma.notification.updateMany({
      where: { id: request.params.id, userId, readAt: null },
      data: { readAt: new Date() },
    });
    if (updated.count === 0) return reply.code(404).send({ error: "NOTIFICATION_NOT_FOUND" });
    return { ok: true };
  });

  app.patch<{ Body: Partial<{
    taskReminders: boolean;
    habitReminders: boolean;
    focusReminders: boolean;
    learningReminders: boolean;
  }> }>("/notification-preferences", async (request) => {
    const userId = request.userId!;
    const preferences = await prisma.notificationPreferences.upsert({
      where: { userId },
      create: { id: uuidv7(), userId, ...request.body },
      update: request.body,
    });
    return preferences;
  });

  app.get("/notification-preferences", async (request) => {
    const userId = request.userId!;
    return prisma.notificationPreferences.upsert({
      where: { userId },
      create: { id: uuidv7(), userId },
      update: {},
    });
  });
};
