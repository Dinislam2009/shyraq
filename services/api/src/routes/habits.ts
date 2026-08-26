import type { FastifyPluginAsync } from "fastify";
import { v7 as uuidv7, validate as uuidValidate } from "uuid";
import { prisma } from "../lib/prisma.js";

interface HabitParams { id: string }
interface CompletionBody { date?: string }
interface CreateHabitBody { title: string; description?: string | null; frequency?: "DAILY" }
interface UpdateHabitBody { title?: string; description?: string | null; frequency?: "DAILY" }

const day = (value: string) => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parsed.getTime()) ? parsed : null;
};

export const habitRoutes: FastifyPluginAsync = async (app) => {
  app.get("/habits", async (request) => {
    const userId = request.userId!;
    const habits = await prisma.habit.findMany({
      where: { userId, archivedAt: null },
      include: { completions: { orderBy: { date: "desc" }, take: 90 } },
      orderBy: { createdAt: "desc" },
    });
    return habits;
  });

  app.post<{ Body: CreateHabitBody }>("/habits", async (request, reply) => {
    const userId = request.userId!;
    const { title, description = null, frequency = "DAILY" } = request.body;
    if (typeof title !== "string" || title.trim().length === 0 || title.length > 200) {
      return reply.code(400).send({ error: "INVALID_TITLE", message: "Title must be between 1 and 200 characters" });
    }
    return reply.code(201).send(await prisma.habit.create({
      data: { id: uuidv7(), userId, title: title.trim(), description, frequency },
    }));
  });

  app.patch<{ Params: HabitParams; Body: UpdateHabitBody }>("/habits/:id", async (request, reply) => {
    const userId = request.userId!;
    const { id } = request.params;
    if (!uuidValidate(id)) return reply.code(400).send({ error: "INVALID_ID", message: "Habit id must be a valid UUID" });
    const current = await prisma.habit.findFirst({ where: { id, userId, archivedAt: null } });
    if (!current) return reply.code(404).send({ error: "NOT_FOUND", message: "Habit not found" });
    const { title, description, frequency } = request.body;
    if (title !== undefined && (title.trim().length === 0 || title.length > 200)) {
      return reply.code(400).send({ error: "INVALID_TITLE", message: "Title must be between 1 and 200 characters" });
    }
    return reply.send(await prisma.habit.update({ where: { id }, data: {
      ...(title !== undefined ? { title: title.trim() } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(frequency !== undefined ? { frequency } : {}),
    } }));
  });

  app.delete<{ Params: HabitParams }>("/habits/:id", async (request, reply) => {
    const userId = request.userId!;
    const { id } = request.params;
    if (!uuidValidate(id)) return reply.code(400).send({ error: "INVALID_ID", message: "Habit id must be a valid UUID" });
    const current = await prisma.habit.findFirst({ where: { id, userId, archivedAt: null } });
    if (!current) return reply.code(404).send({ error: "NOT_FOUND", message: "Habit not found" });
    await prisma.habit.update({ where: { id }, data: { archivedAt: new Date() } });
    return reply.code(204).send();
  });

  app.post<{ Params: HabitParams; Body: CompletionBody }>("/habits/:id/completions", async (request, reply) => {
    const userId = request.userId!;
    const { id } = request.params;
    if (!uuidValidate(id)) return reply.code(400).send({ error: "INVALID_ID", message: "Habit id must be a valid UUID" });
    const habit = await prisma.habit.findFirst({ where: { id, userId, archivedAt: null } });
    if (!habit) return reply.code(404).send({ error: "NOT_FOUND", message: "Habit not found" });
    const date = request.body?.date ?? new Date().toISOString().slice(0, 10);
    const parsed = day(date);
    if (!parsed) return reply.code(400).send({ error: "INVALID_DATE", message: "date must be YYYY-MM-DD" });
    const completion = await prisma.habitCompletion.upsert({
      where: { habitId_date: { habitId: id, date: parsed } },
      create: { id: uuidv7(), habitId: id, userId, date: parsed },
      update: {},
    });
    return reply.code(201).send(completion);
  });

  app.delete<{ Params: HabitParams }>("/habits/:id/completions/today", async (request, reply) => {
    const userId = request.userId!;
    const { id } = request.params;
    const date = day(new Date().toISOString().slice(0, 10))!;
    await prisma.habitCompletion.deleteMany({ where: { habitId: id, userId, date } });
    return reply.code(204).send();
  });
};
