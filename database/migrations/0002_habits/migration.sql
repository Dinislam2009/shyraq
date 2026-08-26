CREATE TABLE "habits" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "frequency" TEXT NOT NULL DEFAULT 'DAILY',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "archived_at" TIMESTAMPTZ,
  CONSTRAINT "habits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "habit_completions" (
  "id" UUID NOT NULL,
  "habit_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "date" DATE NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "habit_completions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "habit_completions_habit_id_date_key" ON "habit_completions"("habit_id", "date");
CREATE INDEX "habits_user_id_archived_at_idx" ON "habits"("user_id", "archived_at");
CREATE INDEX "habit_completions_user_id_date_idx" ON "habit_completions"("user_id", "date");

ALTER TABLE "habits"
  ADD CONSTRAINT "habits_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "habit_completions"
  ADD CONSTRAINT "habit_completions_habit_id_fkey"
  FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "habit_completions"
  ADD CONSTRAINT "habit_completions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
