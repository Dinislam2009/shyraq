import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../lib/prisma.js";

const clampDays = (value: unknown) => {
  const days = Number(value ?? 7);
  if (!Number.isFinite(days)) return 7;
  return Math.min(30, Math.max(7, Math.floor(days)));
};
const dayKey = (date: Date) => date.toISOString().slice(0, 10);

export const analyticsRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: { days?: string } }>("/analytics", async (request) => {
    const days = clampDays(request.query.days);
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));
    const userId = request.userId!;

    const [tasks, completions, focusSessions, reviews, habits, decks] = await Promise.all([
      prisma.task.findMany({ where: { userId, status: "COMPLETED", updatedAt: { gte: start } }, select: { updatedAt: true } }),
      prisma.habitCompletion.findMany({ where: { userId, date: { gte: start } }, select: { date: true } }),
      prisma.focusSession.findMany({ where: { userId, status: "COMPLETED", startedAt: { gte: start } }, select: { startedAt: true, durationSeconds: true } }),
      prisma.flashcardReview.findMany({ where: { userId, reviewedAt: { gte: start } }, select: { reviewedAt: true, correct: true } }),
      prisma.habit.findMany({ where: { userId, archivedAt: null }, select: { id: true } }),
      prisma.flashcardDeck.findMany({ where: { userId, archivedAt: null }, select: { id: true } }),
    ]);

    const series = Array.from({ length: days }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return { date: dayKey(date), tasksCompleted: 0, habitsCompleted: 0, focusMinutes: 0, reviews: 0, correctReviews: 0 };
    });
    const byDay = new Map(series.map((item) => [item.date, item]));
    for (const task of tasks) byDay.get(dayKey(task.updatedAt))!.tasksCompleted += 1;
    for (const completion of completions) byDay.get(dayKey(completion.date))!.habitsCompleted += 1;
    for (const session of focusSessions) byDay.get(dayKey(session.startedAt))!.focusMinutes += Math.floor((session.durationSeconds ?? 0) / 60);
    for (const review of reviews) {
      const item = byDay.get(dayKey(review.reviewedAt));
      if (item) { item.reviews += 1; if (review.correct) item.correctReviews += 1; }
    }

    const totalReviews = reviews.length;
    const correctReviews = reviews.filter((review) => review.correct).length;
    return {
      days,
      range: { from: series[0].date, to: series[series.length - 1].date },
      totals: {
        tasksCompleted: tasks.length,
        habitsCompleted: completions.length,
        focusMinutes: focusSessions.reduce((sum, session) => sum + Math.floor((session.durationSeconds ?? 0) / 60), 0),
        reviews: totalReviews,
        correctReviews,
        reviewAccuracy: totalReviews ? Math.round((correctReviews / totalReviews) * 100) : 0,
        activeHabits: habits.length,
        activeDecks: decks.length,
      },
      series,
    };
  });
};
