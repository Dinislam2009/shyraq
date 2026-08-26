CREATE TABLE "flashcard_reviews" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "deck_id" UUID NOT NULL,
  "card_id" UUID NOT NULL,
  "correct" BOOLEAN NOT NULL,
  "reviewed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "flashcard_reviews_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "flashcard_reviews_user_id_reviewed_at_idx" ON "flashcard_reviews"("user_id", "reviewed_at");
CREATE INDEX "flashcard_reviews_deck_id_reviewed_at_idx" ON "flashcard_reviews"("deck_id", "reviewed_at");
CREATE INDEX "flashcard_reviews_card_id_reviewed_at_idx" ON "flashcard_reviews"("card_id", "reviewed_at");

ALTER TABLE "flashcard_reviews"
  ADD CONSTRAINT "flashcard_reviews_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "flashcard_reviews"
  ADD CONSTRAINT "flashcard_reviews_deck_id_fkey"
  FOREIGN KEY ("deck_id") REFERENCES "flashcard_decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "flashcard_reviews"
  ADD CONSTRAINT "flashcard_reviews_card_id_fkey"
  FOREIGN KEY ("card_id") REFERENCES "flashcards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
