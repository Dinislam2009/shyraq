import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
dotenv.config({ path: path.join(repoRoot, ".env") });

const apiBaseUrl = process.env.SHYRAQ_TEST_API_URL ?? "http://localhost:4000";
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const email = process.env.SHYRAQ_TEST_EMAIL;
const password = process.env.SHYRAQ_TEST_PASSWORD;
const enabled = Boolean(supabaseUrl && supabaseAnonKey && email && password);

test("authenticated flashcard deck, card, and review progress contract", { skip: !enabled }, async () => {
  const supabase = createClient(supabaseUrl!, supabaseAnonKey!, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
  const { data, error } = await supabase.auth.signInWithPassword({ email: email!, password: password! });
  assert.ifError(error);
  assert.ok(data.session?.access_token);
  const authHeaders = { authorization: `Bearer ${data.session.access_token}` };
  const jsonHeaders = { ...authHeaders, "content-type": "application/json" };

  const createDeck = await fetch(`${apiBaseUrl}/api/v1/learning/decks`, { method: "POST", headers: jsonHeaders, body: JSON.stringify({ name: `Learning contract ${randomUUID()}`, description: "initial" }) });
  const deckText = await createDeck.text();
  assert.equal(createDeck.status, 201, `deck create failed: HTTP ${createDeck.status}: ${deckText}`);
  const deck = JSON.parse(deckText) as { id: string; _count?: { cards: number } };
  assert.ok(deck.id);
  assert.equal(deck._count?.cards, 0);

  const createCard = await fetch(`${apiBaseUrl}/api/v1/learning/decks/${deck.id}/cards`, { method: "POST", headers: jsonHeaders, body: JSON.stringify({ front: "Capital of Kazakhstan?", back: "Astana", position: 0 }) });
  const cardText = await createCard.text();
  assert.equal(createCard.status, 201, `card create failed: HTTP ${createCard.status}: ${cardText}`);
  const card = JSON.parse(cardText) as { id: string; front: string; back: string; state: { status: string; interval: number; repetitions: number } };
  assert.ok(card.id);
  assert.equal(card.front, "Capital of Kazakhstan?");
  assert.equal(card.state.status, "NEW");
  assert.equal(card.state.interval, 0);

  const progressBefore = await fetch(`${apiBaseUrl}/api/v1/learning/decks/${deck.id}/progress`, { headers: authHeaders });
  const progressBeforeText = await progressBefore.text();
  assert.equal(progressBefore.status, 200, `progress before review failed: HTTP ${progressBefore.status}: ${progressBeforeText}`);
  assert.deepEqual(JSON.parse(progressBeforeText), { cardCount: 1, reviewCount: 0, correctCount: 0, reviewedCardCount: 0, dueCount: 1, completionPercent: 0 });

  const review = await fetch(`${apiBaseUrl}/api/v1/learning/decks/${deck.id}/cards/${card.id}/reviews`, { method: "POST", headers: jsonHeaders, body: JSON.stringify({ rating: "GOOD" }) });
  const reviewText = await review.text();
  assert.equal(review.status, 201, `review failed: HTTP ${review.status}: ${reviewText}`);
  const reviewBody = JSON.parse(reviewText) as { review: { correct: boolean; rating: string }; state: { status: string; repetitions: number; interval: number; easeFactor: string | number } };
  assert.equal(reviewBody.review.correct, true);
  assert.equal(reviewBody.review.rating, "GOOD");
  assert.equal(reviewBody.state.status, "REVIEW");
  assert.equal(reviewBody.state.repetitions, 1);
  assert.equal(reviewBody.state.interval, 1);

  const dueAfterGood = await fetch(`${apiBaseUrl}/api/v1/learning/decks/${deck.id}/due`, { headers: authHeaders });
  const dueAfterGoodText = await dueAfterGood.text();
  assert.equal(dueAfterGood.status, 200, `due cards after review failed: HTTP ${dueAfterGood.status}: ${dueAfterGoodText}`);
  assert.equal((JSON.parse(dueAfterGoodText) as unknown[]).length, 0);

  const progressAfter = await fetch(`${apiBaseUrl}/api/v1/learning/decks/${deck.id}/progress`, { headers: authHeaders });
  const progressAfterText = await progressAfter.text();
  assert.equal(progressAfter.status, 200, `progress after review failed: HTTP ${progressAfter.status}: ${progressAfterText}`);
  assert.deepEqual(JSON.parse(progressAfterText), { cardCount: 1, reviewCount: 1, correctCount: 1, reviewedCardCount: 1, dueCount: 0, completionPercent: 100 });

  const list = await fetch(`${apiBaseUrl}/api/v1/learning/decks/${deck.id}/cards`, { headers: authHeaders });
  const listText = await list.text();
  assert.equal(list.status, 200, `card list failed: HTTP ${list.status}: ${listText}`);
  const cards = JSON.parse(listText) as Array<{ id: string }>;
  assert.ok(cards.some((item) => item.id === card.id));

  const update = await fetch(`${apiBaseUrl}/api/v1/learning/decks/${deck.id}/cards/${card.id}`, { method: "PATCH", headers: jsonHeaders, body: JSON.stringify({ back: "Astana, Kazakhstan" }) });
  const updateText = await update.text();
  assert.equal(update.status, 200, `card update failed: HTTP ${update.status}: ${updateText}`);
  assert.equal((JSON.parse(updateText) as { back: string }).back, "Astana, Kazakhstan");

  const removeCard = await fetch(`${apiBaseUrl}/api/v1/learning/decks/${deck.id}/cards/${card.id}`, { method: "DELETE", headers: authHeaders });
  assert.equal(removeCard.status, 204, `card delete failed: HTTP ${removeCard.status}: ${await removeCard.text()}`);

  const archiveDeck = await fetch(`${apiBaseUrl}/api/v1/learning/decks/${deck.id}`, { method: "PATCH", headers: jsonHeaders, body: JSON.stringify({ archived: true }) });
  assert.equal(archiveDeck.status, 200, `deck archive failed: HTTP ${archiveDeck.status}: ${await archiveDeck.text()}`);
});
