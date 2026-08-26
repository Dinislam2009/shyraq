import type { FastifyPluginAsync } from "fastify";
import { v7 as uuidv7, validate as uuidValidate } from "uuid";
import { prisma } from "../lib/prisma.js";

interface IdParams { id: string }
interface CardParams { id: string; cardId: string }
interface DeckBody { name: string; description?: string | null }
interface CardBody { front: string; back: string; position?: number }
interface ReviewBody { correct: boolean }

const validText = (value: unknown, max = 5000) => typeof value === "string" && value.trim().length > 0 && value.length <= max;

export const learningRoutes: FastifyPluginAsync = async (app) => {
  app.get("/learning/decks", async (request) => {
    const userId = request.userId!;
    return prisma.flashcardDeck.findMany({
      where: { userId, archivedAt: null },
      include: { _count: { select: { cards: true } } },
      orderBy: { createdAt: "desc" },
    });
  });

  app.post<{ Body: DeckBody }>("/learning/decks", async (request, reply) => {
    const userId = request.userId!;
    const { name, description = null } = request.body;
    if (!validText(name, 200)) return reply.code(400).send({ error: "INVALID_NAME", message: "Deck name must be between 1 and 200 characters" });
    return reply.code(201).send(await prisma.flashcardDeck.create({
      data: { id: uuidv7(), userId, name: name.trim(), description },
      include: { _count: { select: { cards: true } } },
    }));
  });

  app.patch<{ Params: IdParams; Body: Partial<DeckBody> & { archived?: boolean } }>("/learning/decks/:id", async (request, reply) => {
    const userId = request.userId!;
    const { id } = request.params;
    if (!uuidValidate(id)) return reply.code(400).send({ error: "INVALID_ID" });
    const current = await prisma.flashcardDeck.findFirst({ where: { id, userId, archivedAt: null } });
    if (!current) return reply.code(404).send({ error: "NOT_FOUND" });
    const { name, description, archived } = request.body;
    if (name !== undefined && !validText(name, 200)) return reply.code(400).send({ error: "INVALID_NAME" });
    return prisma.flashcardDeck.update({ where: { id }, data: {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(archived !== undefined ? { archivedAt: archived ? new Date() : null } : {}),
    }, include: { _count: { select: { cards: true } } } });
  });

  app.delete<{ Params: IdParams }>("/learning/decks/:id", async (request, reply) => {
    const userId = request.userId!;
    const { id } = request.params;
    if (!uuidValidate(id)) return reply.code(400).send({ error: "INVALID_ID" });
    const current = await prisma.flashcardDeck.findFirst({ where: { id, userId, archivedAt: null } });
    if (!current) return reply.code(404).send({ error: "NOT_FOUND" });
    await prisma.flashcardDeck.update({ where: { id }, data: { archivedAt: new Date() } });
    return reply.code(204).send();
  });

  app.get<{ Params: IdParams }>("/learning/decks/:id/cards", async (request, reply) => {
    const userId = request.userId!;
    const { id } = request.params;
    if (!uuidValidate(id)) return reply.code(400).send({ error: "INVALID_ID" });
    const deck = await prisma.flashcardDeck.findFirst({ where: { id, userId, archivedAt: null } });
    if (!deck) return reply.code(404).send({ error: "NOT_FOUND" });
    return prisma.flashcard.findMany({ where: { deckId: id }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] });
  });

  app.post<{ Params: IdParams; Body: CardBody }>("/learning/decks/:id/cards", async (request, reply) => {
    const userId = request.userId!;
    const { id } = request.params;
    if (!uuidValidate(id)) return reply.code(400).send({ error: "INVALID_ID" });
    const deck = await prisma.flashcardDeck.findFirst({ where: { id, userId, archivedAt: null } });
    if (!deck) return reply.code(404).send({ error: "NOT_FOUND" });
    const { front, back, position = 0 } = request.body;
    if (!validText(front) || !validText(back)) return reply.code(400).send({ error: "INVALID_CARD", message: "Front and back are required" });
    return reply.code(201).send(await prisma.flashcard.create({ data: { id: uuidv7(), deckId: id, front: front.trim(), back: back.trim(), position } }));
  });

  app.patch<{ Params: CardParams; Body: Partial<CardBody> }>("/learning/decks/:id/cards/:cardId", async (request, reply) => {
    const userId = request.userId!;
    const { id, cardId } = request.params;
    if (!uuidValidate(id) || !uuidValidate(cardId)) return reply.code(400).send({ error: "INVALID_ID" });
    const deck = await prisma.flashcardDeck.findFirst({ where: { id, userId, archivedAt: null } });
    if (!deck) return reply.code(404).send({ error: "NOT_FOUND" });
    const current = await prisma.flashcard.findFirst({ where: { id: cardId, deckId: id } });
    if (!current) return reply.code(404).send({ error: "CARD_NOT_FOUND" });
    const { front, back, position } = request.body;
    if (front !== undefined && !validText(front)) return reply.code(400).send({ error: "INVALID_CARD" });
    if (back !== undefined && !validText(back)) return reply.code(400).send({ error: "INVALID_CARD" });
    return prisma.flashcard.update({ where: { id: cardId }, data: {
      ...(front !== undefined ? { front: front.trim() } : {}),
      ...(back !== undefined ? { back: back.trim() } : {}),
      ...(position !== undefined ? { position } : {}),
    } });
  });

  app.delete<{ Params: CardParams }>("/learning/decks/:id/cards/:cardId", async (request, reply) => {
    const userId = request.userId!;
    const { id, cardId } = request.params;
    if (!uuidValidate(id) || !uuidValidate(cardId)) return reply.code(400).send({ error: "INVALID_ID" });
    const deck = await prisma.flashcardDeck.findFirst({ where: { id, userId, archivedAt: null } });
    if (!deck) return reply.code(404).send({ error: "NOT_FOUND" });
    const current = await prisma.flashcard.findFirst({ where: { id: cardId, deckId: id } });
    if (!current) return reply.code(404).send({ error: "CARD_NOT_FOUND" });
    await prisma.flashcard.delete({ where: { id: cardId } });
    return reply.code(204).send();
  });

  app.post<{ Params: CardParams; Body: ReviewBody }>("/learning/decks/:id/cards/:cardId/reviews", async (request, reply) => {
    const userId = request.userId!;
    const { id, cardId } = request.params;
    if (!uuidValidate(id) || !uuidValidate(cardId)) return reply.code(400).send({ error: "INVALID_ID" });
    if (typeof request.body?.correct !== "boolean") return reply.code(400).send({ error: "INVALID_REVIEW" });
    const deck = await prisma.flashcardDeck.findFirst({ where: { id, userId, archivedAt: null } });
    if (!deck) return reply.code(404).send({ error: "NOT_FOUND" });
    const card = await prisma.flashcard.findFirst({ where: { id: cardId, deckId: id } });
    if (!card) return reply.code(404).send({ error: "CARD_NOT_FOUND" });
    return reply.code(201).send(await prisma.flashcardReview.create({
      data: { id: uuidv7(), userId, deckId: id, cardId, correct: request.body.correct },
    }));
  });

  app.get<{ Params: IdParams }>("/learning/decks/:id/progress", async (request, reply) => {
    const userId = request.userId!;
    const { id } = request.params;
    if (!uuidValidate(id)) return reply.code(400).send({ error: "INVALID_ID" });
    const deck = await prisma.flashcardDeck.findFirst({ where: { id, userId, archivedAt: null } });
    if (!deck) return reply.code(404).send({ error: "NOT_FOUND" });
    const [cardCount, reviewCount, correctCount] = await Promise.all([
      prisma.flashcard.count({ where: { deckId: id } }),
      prisma.flashcardReview.count({ where: { deckId: id, userId } }),
      prisma.flashcardReview.count({ where: { deckId: id, userId, correct: true } }),
    ]);
    const reviewedCardIds = await prisma.flashcardReview.findMany({ where: { deckId: id, userId }, distinct: ["cardId"], select: { cardId: true } });
    return { cardCount, reviewCount, correctCount, reviewedCardCount: reviewedCardIds.length, completionPercent: cardCount === 0 ? 0 : Math.round((reviewedCardIds.length / cardCount) * 100) };
  });
};
