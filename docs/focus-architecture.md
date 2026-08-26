# Focus architecture

## Goal
Track focused work sessions against a user and optionally a task. The MVP uses a server-persisted session record; the browser timer is only a presentation of the session state.

## FocusSession
- `id`: UUID
- `userId`: UUID, required ownership boundary
- `taskId`: UUID, nullable; optional task association
- `startedAt`: timestamp
- `endedAt`: timestamp, nullable while running
- `durationSeconds`: integer, nullable until completion
- `status`: `RUNNING | COMPLETED | CANCELLED`

## Invariants
- A user can only access their own sessions.
- A session cannot be completed twice.
- `durationSeconds` is derived server-side from `startedAt` and completion time; the client must not be trusted for elapsed time.
- At most one RUNNING session per user in the MVP.
- Cancelling a session does not count toward completed focus statistics.

## API contract
- `GET /api/v1/focus` — recent sessions for the authenticated user.
- `POST /api/v1/focus` — start a session; optional `{ taskId }`.
- `POST /api/v1/focus/:id/complete` — complete a running session.
- `POST /api/v1/focus/:id/cancel` — cancel a running session.

## UI MVP
- Start button.
- 25-minute default target, with a simple running elapsed countdown presentation.
- Optional task selector.
- Complete and cancel controls while running.
- Recent sessions list and today's completed focus duration.

## Implementation order
1. Prisma model + database migration.
2. API routes with ownership and state validation.
3. Unit/contract tests.
4. Web API client.
5. Focus page and timer UI.
6. Dashboard focus summary.
