import assert from "node:assert/strict";
import test from "node:test";
import { scheduleReview } from "../lib/spaced-repetition.js";

const now = new Date("2026-08-27T12:00:00.000Z");
const fresh = { repetitions: 0, interval: 0, easeFactor: 2.5, lapses: 0 };

test("again resets learning and schedules one day", () => {
  const next = scheduleReview("AGAIN", fresh, now);
  assert.equal(next.status, "LEARNING");
  assert.equal(next.repetitions, 0);
  assert.equal(next.interval, 1);
  assert.equal(next.lapses, 1);
  assert.equal(next.easeFactor, 2.3);
  assert.equal(next.dueAt.toISOString(), "2026-08-28T12:00:00.000Z");
});

test("good promotes a new card to review", () => {
  const next = scheduleReview("GOOD", fresh, now);
  assert.equal(next.status, "REVIEW");
  assert.equal(next.repetitions, 1);
  assert.equal(next.interval, 1);
  assert.equal(next.easeFactor, 2.5);
});

test("easy increases ease and gives a longer first interval", () => {
  const next = scheduleReview("EASY", fresh, now);
  assert.equal(next.status, "REVIEW");
  assert.equal(next.repetitions, 1);
  assert.equal(next.interval, 4);
  assert.equal(next.easeFactor, 2.65);
});

test("hard reduces ease but keeps a progressing review interval", () => {
  const next = scheduleReview("HARD", { repetitions: 3, interval: 10, easeFactor: 2.5, lapses: 0 }, now);
  assert.equal(next.status, "REVIEW");
  assert.equal(next.repetitions, 3);
  assert.equal(next.interval, 12);
  assert.equal(next.easeFactor, 2.35);
});
