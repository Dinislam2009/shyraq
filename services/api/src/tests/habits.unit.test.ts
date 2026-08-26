import assert from "node:assert/strict";
import test from "node:test";

function streakFromDates(dates: string[], today: string): number {
  const completed = new Set(dates);
  let streak = 0;
  const cursor = new Date(`${today}T00:00:00.000Z`);

  while (completed.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

test("habit streak counts consecutive completed days ending today", () => {
  assert.equal(
    streakFromDates(["2026-08-26", "2026-08-25", "2026-08-24", "2026-08-22"], "2026-08-26"),
    3,
  );
});

test("habit streak is zero when today is not completed", () => {
  assert.equal(streakFromDates(["2026-08-25", "2026-08-24"], "2026-08-26"), 0);
});

test("habit completion date is idempotent", () => {
  const dates = ["2026-08-26"];
  const next = Array.from(new Set([...dates, "2026-08-26"]));
  assert.deepEqual(next, dates);
});
