# Shyraq — Master Roadmap

> This is the authoritative development order for Shyraq. Do not skip phases or reorder major work without explicitly updating this roadmap.

## Development order

- [x] Phase 0 — Architecture
- [x] Phase 1 — Infrastructure
- [x] Phase 2 — Auth + User
- [ ] Phase 3 — Database Core
- [x] Phase 4 — Tasks + Projects
- [x] Phase 5 — Calendar
- [x] Phase 6 — Habits
- [x] Phase 7 — Focus
- [ ] Phase 8 — Learning / Flashcards
- [ ] Phase 9 — Spaced Repetition
- [ ] Phase 10 — Analytics
- [ ] Phase 11 — Notifications
- [ ] Phase 12 — Offline / Sync
- [ ] Phase 13 — Web Polish
- [ ] Phase 14 — Mobile
- [ ] Phase 15 — Final Testing
- [ ] Phase 16 — Production

## Current position

**Phase 8 is active.** Tasks + Projects, Calendar, Habits, and Focus have been implemented and locally verified. The current work is Learning / Flashcards. Do not move to Spaced Repetition, Analytics, Web Polish, Mobile, or Production until the Learning phase is implemented and verified.

## Phase 0 — Architecture

- Monorepo structure
- Web/API separation
- Shared packages
- API conventions
- Auth architecture
- Database/migration strategy

## Phase 1 — Infrastructure

- Next.js web app
- Fastify API
- PostgreSQL/Supabase
- Prisma
- Environment configuration
- Local development workflow

## Phase 2 — Auth + User

- Supabase authentication
- API auth plugin
- User identity/ownership
- Protected routes
- Session handling

## Phase 3 — Database Core

- Core schema
- Migration history
- Prisma generated client
- Referential integrity
- Indexes and constraints

## Phase 4 — Tasks + Projects

- Task CRUD
- Status/priority
- Due dates
- Task ownership
- Projects — API/schema/basic web page
- Project/task relationships
- Task completion flows
- Integration and verification

## Phase 5 — Calendar

- Calendar view
- Due dates/events
- Task scheduling
- Day/week navigation
- Calendar ↔ tasks integration
- Integration and verification

## Phase 6 — Habits

- Habit CRUD
- Daily completion
- Streak calculation
- Habit history
- Habit dashboard

## Phase 7 — Focus

- Start focus session
- Task-linked focus
- Complete/cancel session
- Live timer
- Focus history
- Today focus statistics

## Phase 8 — Learning / Flashcards

- Learning items
- Flashcard CRUD
- Decks/collections
- Review interface
- Learning progress

### Implemented so far

- Flashcard deck model and migration
- Flashcard model and deck relationship
- Authenticated deck CRUD API
- Authenticated card CRUD API
- Contract test coverage
- Web API client
- Basic Learning workspace with deck selection, review, card creation/deletion

### Remaining before Phase 8 completion

- Review UX verification
- Learning progress tracking
- Full typecheck/API contract verification
- Final web verification

## Phase 9 — Spaced Repetition

- Review scheduling
- Memory/repetition model
- Due reviews
- Review history
- Adaptive intervals

## Phase 10 — Analytics

- Study time
- Task completion
- Habit consistency
- Learning progress
- Focus analytics
- Weekly/monthly summaries

## Phase 11 — Notifications

- Reminder model
- Task reminders
- Habit reminders
- Review reminders
- Focus/session reminders

## Phase 12 — Offline / Sync

- Offline-first data layer
- Local persistence
- Sync queue
- Conflict resolution
- Cursor-based sync
- Recovery/retry behavior

## Phase 13 — Web Polish

Only after the core product phases are functionally complete:

- Information architecture refinement
- UX pass
- Visual design system
- Responsive layouts
- Accessibility
- Loading/error/empty states
- Motion and interaction polish

## Phase 14 — Mobile

- Mobile app foundation
- Shared domain/API usage
- Core mobile flows
- Offline support
- Notifications

## Phase 15 — Final Testing

- Unit tests
- API contract tests
- Integration tests
- E2E tests
- Cross-device checks
- Regression pass
- Performance checks

## Phase 16 — Production

- Production environment
- Database deployment
- Web deployment
- API deployment
- Monitoring/logging
- Security review
- Backup/recovery
- Release checklist

## Rules for future work

1. Check this roadmap before starting a new major feature.
2. Work on the earliest unfinished dependency unless there is a documented reason to deviate.
3. Do not start the large Web Polish/design phase just because a screen looks basic; finish the product functionality first.
4. If a proposed task changes the order, explicitly call out the deviation before implementing it.
5. Update this file when a phase materially changes status.
6. Keep implementation and tests aligned: a feature is not considered complete merely because its UI exists.
