CREATE TABLE "flashcard_decks" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "archived_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "flashcard_decks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "flashcards" (
  "id" UUID NOT NULL,
  "deck_id" UUID NOT NULL,
  "front" TEXT NOT NULL,
  "back" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "flashcards_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "flashcard_decks_user_id_archived_at_idx" ON "flashcard_decks"("user_id", "archived_at");
CREATE INDEX "flashcards_deck_id_position_idx" ON "flashcards"("deck_id", "position");

ALTER TABLE "flashcard_decks"
  ADD CONSTRAINT "flashcard_decks_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "flashcards"
  ADD CONSTRAINT "flashcards_deck_id_fkey"
  FOREIGN KEY ("deck_id") REFERENCES "flashcard_decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
