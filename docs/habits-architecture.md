# Habits architecture

## Goal

Habits are recurring behaviors owned by a user. A completion is a dated record for one habit, allowing streaks and daily progress to be derived without storing mutable streak counters.

## Data model

### Habit

- `id`: UUID
- `userId`: UUID, owner
- `title`: required string
- `frequency`: v1 uses `DAILY`; keep the field extensible for future weekly schedules
- `createdAt`: timestamp
- `archivedAt`: nullable timestamp; archive instead of destructive delete when history exists

### HabitCompletion

- `id`: UUID
- `habitId`: UUID
- `userId`: UUID
- `date`: calendar date in the user's selected timezone
- `createdAt`: timestamp
- unique constraint on `(habitId, date)`

The completion record is the source of truth. Streaks are derived from consecutive completed calendar dates, which avoids counter drift after edits, retries, or sync operations.

## API contract (v1)

Authenticated endpoints:

- `GET /api/v1/habits` — list active habits with today's completion state
- `POST /api/v1/habits` — create a daily habit
- `PATCH /api/v1/habits/:id` — rename/archive a habit
- `DELETE /api/v1/habits/:id` — destructive delete only when explicitly requested
- `POST /api/v1/habits/:id/completions` — mark a habit complete for a date; idempotent
- `DELETE /api/v1/habits/:id/completions/:date` — undo completion
- `GET /api/v1/habits/:id/stats` — return current streak, best streak, and completion count

All endpoints are scoped by the authenticated `userId`; clients cannot address another user's habit or completion by ID.

## Frontend contract

The first UI should stay intentionally simple:

- today's habit list
- one-tap completion toggle
- current streak
- today's completion progress
- create/archive habit

Do not build the final visual design yet. Reuse the existing dashboard/task primitives so the data model and behavior can stabilize first.

## Implementation order

1. Prisma schema and migration.
2. Authenticated API routes and validation.
3. Unit tests for date uniqueness, ownership, idempotent completion, and streak calculation.
4. Frontend `/habits` page and dashboard summary.
5. End-to-end contract test.
6. Only after the functional surface is stable: final UI/UX pass.
