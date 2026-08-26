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
  const headers = { authorization: `Bearer ${data.session.access_token}`, "content-type": "application/json" };

  const createDeck = await fetch(`${apiBaseUrl}/api/v1/learning/decks`, {
    method: "POST", headers,
    body: JSON.stringify({ name: `Learning contract ${randomUUID()}`, description: "initial" }),
  });
  const deckText = await createDeck.text();
  assert.equal(createDeck.status, 201, `deck create failed: HTTP ${createDeck.status}: ${deckText}`);
  const deck = JSON.parse(deckText) as { id: string; _count?: { cards: number } };
  assert.ok(deck.id);
  assert.equal(deck._count?.cards, 0);

  const createCard = await fetch(`${apiBaseUrl}/api/v1/learning/decks/${deck.id}/cards`, {
    method: "POST", headers,
    body: JSON.stringify({ front: "Capital of Kazakhstan?", back: "Astana", position: 0 }),
  });
  const cardText = await createCard.text();
  assert.equal(createCard.status, 201, `card create failed: HTTP ${createCard.status}: ${cardText}`);
  const card = JSON.parse(cardText) as { id: string; front: string; back: string };
  assert.ok(card.id);
  assert.equal(card.front, "Capital of Kazakhstan?");

  const progressBefore = await fetch(`${apiBaseUrl}/api/v1/learning/decks/${deck.id}/progress`, { headers });
  const progressBeforeText = await progressBefore.text();
  assert.equal(progressBefore.status, 200, `progress before review failed: HTTP ${progressBefore.status}: ${progressBeforeText}`);
  assert.deepEqual(JSON.parse(progressBeforeText), { cardCount: 1, reviewCount: 0, correctCount: 0, reviewedCardCount: 0, completionPercent: 0 });

  const review = await fetch(`${apiBaseUrl}/api/v1/learning/decks/${deck.id}/cards/${card.id}/reviews`, {
    method: "POST", headers, body: JSON.stringify({ correct: true }),
  });
  const reviewText = await review.text();
  assert.equal(review.status, 201, `review failed: HTTP ${review.status}: ${reviewText}`);
  assert.equal((JSON.parse(reviewText) as { correct: boolean }).correct, true);

  const progressAfter = await fetch(`${apiBaseUrl}/api/v1/learning/decks/${deck.id}/progress`, { headers });
  const progressAfterText = await progressAfter.text();
  assert.equal(progressAfter.status, 200, `progress after review failed: HTTP ${progressAfter.status}: ${progressAfterText}`);
  assert.deepEqual(JSON.parse(progressAfterText), { cardCount: 1, reviewCount: 1, correctCount: 1, reviewedCardCount: 1, completionPercent: 100 });

  const list = await fetch(`${apiBaseUrl}/api/v1/learning/decks/${deck.id}/cards`, { headers });
  const listText = await list.text();
  assert.equal(list.status, 200, `card list failed: HTTP ${list.status}: ${listText}`);
  const cards = JSON.parse(listText) as Array<{ id: string }>;
  assert.ok(cards.some((item) => item.id === card.id));

  const update = await fetch(`${apiBaseUrl}/api/v1/learning/decks/${deck.id}/cards/${card.id}`, {
    method: "PATCH", headers,
    body: JSON.stringify({ back: "Astana, Kazakhstan" }),
  });
  const updateText = await update.text();
  assert.equal(update.status, 200, `card update failed: HTTP ${update.status}: ${updateText}`);
  assert.equal((JSON.parse(updateText) as { back: string }).back, "Astana, Kazakhstan");

  const removeCard = await fetch(`${apiBaseUrl}/api/v1/learning/decks/${deck.id}/cards/${card.id}`, { method: "DELETE", headers });
  assert.equal(removeCard.status, 204, `card delete failed: HTTP ${removeCard.status}: ${await removeCard.text()}`);

  const archiveDeck = await fetch(`${apiBaseUrl}/api/v1/learning/decks/${deck.id}`, {
    method: "PATCH", headers, body: JSON.stringify({ archived: true }),
  });
  assert.equal(archiveDeck.status, 200, `deck archive failed: HTTP ${archiveDeck.status}: ${await archiveDeck.text()}`);
});
