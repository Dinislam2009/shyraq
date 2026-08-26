CREATE TABLE "focus_sessions" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "task_id" UUID,
  "started_at" TIMESTAMPTZ NOT NULL,
  "ended_at" TIMESTAMPTZ,
  "duration_seconds" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'RUNNING',
  CONSTRAINT "focus_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "focus_sessions_user_id_started_at_idx" ON "focus_sessions"("user_id", "started_at");
CREATE INDEX "focus_sessions_user_id_status_idx" ON "focus_sessions"("user_id", "status");
CREATE INDEX "focus_sessions_task_id_idx" ON "focus_sessions"("task_id");

ALTER TABLE "focus_sessions"
  ADD CONSTRAINT "focus_sessions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "focus_sessions"
  ADD CONSTRAINT "focus_sessions_task_id_fkey"
  FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
