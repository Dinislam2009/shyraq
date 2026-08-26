export const REVIEW_RATINGS = ["AGAIN", "HARD", "GOOD", "EASY"] as const;
export type ReviewRating = (typeof REVIEW_RATINGS)[number];

export interface CardScheduleState {
  repetitions: number;
  interval: number;
  easeFactor: number;
  lapses: number;
}

export interface ScheduledCardState extends CardScheduleState {
  status: "LEARNING" | "REVIEW";
  dueAt: Date;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function scheduleReview(rating: ReviewRating, state: CardScheduleState, now = new Date()): ScheduledCardState {
  let repetitions = state.repetitions;
  let interval = state.interval;
  let easeFactor = state.easeFactor;
  let lapses = state.lapses;
  let status: "LEARNING" | "REVIEW" = "REVIEW";

  if (rating === "AGAIN") {
    repetitions = 0;
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
    lapses += 1;
    status = "LEARNING";
  } else if (rating === "HARD") {
    interval = Math.max(1, interval === 0 ? 1 : Math.round(interval * 1.2));
    easeFactor = Math.max(1.3, easeFactor - 0.15);
    status = repetitions === 0 ? "LEARNING" : "REVIEW";
  } else if (rating === "GOOD") {
    repetitions += 1;
    interval = repetitions === 1 ? 1 : repetitions === 2 ? 6 : Math.max(1, Math.round(interval * easeFactor));
  } else {
    repetitions += 1;
    easeFactor += 0.15;
    interval = repetitions === 1 ? 4 : repetitions === 2 ? 10 : Math.max(1, Math.round(interval * easeFactor * 1.3));
  }

  return { repetitions, interval, easeFactor, lapses, status, dueAt: addDays(now, interval) };
}
