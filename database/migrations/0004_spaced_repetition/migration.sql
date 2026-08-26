CREATE TABLE "card_states" (
  "id" UUID NOT NULL,
  "card_id" UUID NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'NEW',
  "repetitions" INTEGER NOT NULL DEFAULT 0,
  "interval" INTEGER NOT NULL DEFAULT 0,
  "ease_factor" DECIMAL(4,2) NOT NULL DEFAULT 2.50,
  "due_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_reviewed_at" TIMESTAMPTZ,
  "lapses" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "card_states_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "card_states_card_id_key" ON "card_states"("card_id");
CREATE INDEX "card_states_due_at_idx" ON "card_states"("due_at");

ALTER TABLE "card_states"
  ADD CONSTRAINT "card_states_card_id_fkey"
  FOREIGN KEY ("card_id") REFERENCES "flashcards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "flashcard_reviews"
  ADD COLUMN "rating" TEXT NOT NULL DEFAULT 'GOOD';
