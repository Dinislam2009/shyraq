# Shyraq — Master Feature Roadmap

> **Product definition:** Shyraq is a Personal Life OS for managing tasks, time, habits, focus, learning, digital wellbeing, progress, and social accountability.
>
> **Reference products:** TickTick, Anki, one sec, YPT.
>
> **Explicit exclusion:** Structured is NOT part of Shyraq. Do not add Structured features unless explicitly requested later.

## Non-negotiable development rule

This document is the master roadmap. Do not shorten the roadmap, skip phases, or replace planned functionality with a simpler substitute just to move faster. A phase may be marked complete only after its planned functionality is implemented, verified, and integrated with the existing architecture.

Do not start visual redesign before the functional architecture for the planned feature set is stable.

---

# Phase 0 — Product Architecture

- [ ] Define module boundaries
- [ ] Define shared domain models
- [ ] Define permissions and ownership rules
- [ ] Define API conventions
- [ ] Define cross-module relationships
- [ ] Define responsive web architecture
- [ ] Define future mobile architecture constraints
- [ ] Maintain this roadmap as the source of truth

# Phase 1 — Core Tasks

- [x] Task creation
- [x] Task editing/deletion
- [x] Subtasks
- [x] Description
- [x] Priority
- [ ] Tags
- [ ] Lists
- [ ] Advanced filters
- [ ] Recurring tasks
- [ ] Due dates
- [ ] Start/end time
- [ ] Duration
- [ ] Multiple reminders
- [ ] Persistent reminder
- [ ] Email reminder
- [ ] Location reminder
- [ ] Voice task creation
- [ ] Natural-language date/time parsing

# Phase 2 — Planning

- [ ] Today view
- [ ] Tomorrow view
- [ ] Calendar
- [ ] Year view
- [ ] Month view
- [ ] Week view
- [ ] Day schedule
- [ ] Multi-day schedule
- [ ] Timeline
- [ ] Kanban
- [ ] Eisenhower Matrix
- [ ] Countdown

# Phase 3 — Habits

- [x] Habit creation
- [x] Habit completion
- [x] Streak calculation
- [ ] Habit schedules/frequencies expansion
- [ ] Habit reminders
- [ ] Habit statistics
- [ ] Habit history
- [ ] Habit routines

# Phase 4 — Focus & Productivity

- [x] Focus sessions
- [ ] Pomodoro
- [ ] Custom focus durations
- [ ] Break settings
- [ ] Focus history
- [ ] Focus statistics
- [ ] Daily productivity review
- [ ] Combined task/focus statistics

# Phase 5 — Learning / Anki Engine

- [x] Decks
- [x] Cards
- [x] Reviews
- [x] Review progress
- [ ] Subdecks
- [ ] Tags
- [ ] Card fields
- [ ] Card templates
- [ ] Basic question/answer cards
- [ ] Reversed cards
- [ ] Typing-answer cards
- [ ] Cloze cards
- [ ] Image-based cards
- [ ] Images
- [ ] Audio
- [ ] Video
- [ ] Rich formatting
- [ ] Custom card design
- [x] Again
- [x] Hard
- [x] Good
- [x] Easy
- [x] Review scheduling foundation
- [ ] Full spaced-repetition engine
- [ ] New/learning/review states
- [ ] Relearning
- [ ] Intervals
- [ ] Card difficulty/ease
- [ ] Repetition count
- [ ] Error/lapse count
- [ ] Next review date
- [ ] Card search
- [ ] Card filtering
- [ ] Card suspension
- [ ] Card moving
- [ ] Review history
- [ ] Learning statistics
- [ ] Future-review forecast
- [ ] Cross-device sync
- [ ] Backups

# Phase 6 — Digital Wellbeing / one sec-inspired Layer

- [ ] Website blocking
- [ ] Scheduled blocking
- [ ] Focus blocking mode
- [ ] Full blocking mode
- [ ] Doomscrolling protection
- [ ] Opening intervention/pause
- [ ] Breathing intervention
- [ ] Intention prompt
- [ ] Confirmation before distraction apps/sites
- [ ] Emotion check-in
- [ ] Useful alternative suggestions
- [ ] Distraction statistics
- [ ] App/site opening statistics
- [ ] Time saved statistics
- [ ] Habit-change trends

> System-level mobile app blocking requires the future native mobile application. Web-only restrictions must remain clearly scoped to what the browser can actually enforce.

# Phase 7 — YPT-inspired Social Study / Accountability

- [ ] Study timer
- [ ] Subject-based time tracking
- [ ] Study history
- [ ] Daily study time
- [ ] Daily planner / to-do
- [ ] Time-block study planning
- [ ] Daily result review
- [ ] Focus mode
- [ ] Friends
- [ ] Groups
- [ ] Group creation
- [ ] Join groups
- [ ] Member activity
- [ ] Shared study sessions
- [ ] Realtime ranking
- [ ] Category/group ranking
- [ ] Competition/challenges
- [ ] Daily statistics
- [ ] Weekly statistics
- [ ] Monthly statistics
- [ ] Subject statistics
- [ ] Study-time graphs
- [ ] Future smartwatch integration

# Phase 8 — Notifications

- [x] Notification model
- [x] Notification API
- [x] Read/unread state
- [x] Unread count
- [x] Notification preferences
- [x] Web notification center
- [ ] Task reminders integration
- [ ] Habit reminders integration
- [ ] Focus reminders integration
- [ ] Learning reminders integration
- [ ] Notification scheduling

# Phase 9 — Analytics / Unified Progress

- [x] Analytics foundation
- [ ] Task completion analytics
- [ ] Habit analytics
- [ ] Focus analytics
- [ ] Learning analytics
- [ ] Study-time analytics
- [ ] Distraction analytics
- [ ] Unified productivity dashboard
- [ ] Daily/weekly/monthly reports
- [ ] Trends
- [ ] Goals vs actuals
- [ ] Cross-module insights

# Phase 10 — Collaboration

- [ ] Shared lists
- [ ] Task assignment
- [ ] Shared projects
- [ ] Permissions
- [ ] Collaboration activity

# Phase 11 — Search / Organization / Power User Tools

- [ ] Global search
- [ ] Advanced filters
- [ ] Saved filters/views
- [ ] Tags across modules
- [ ] Templates
- [ ] Bulk actions
- [ ] Keyboard shortcuts
- [ ] Command menu
- [ ] Custom dashboards
- [ ] Widgets

# Phase 12 — Integrations

- [ ] Calendar integrations
- [ ] External calendar sync
- [ ] Import/export
- [ ] Email integrations
- [ ] Automation hooks
- [ ] Third-party integrations

# Phase 13 — AI Layer

- [ ] Natural-language task creation
- [ ] Natural-language date/time parsing
- [ ] AI planning assistance
- [ ] AI schedule suggestions
- [ ] Voice → task
- [ ] Voice → notes
- [ ] Smart task breakdown
- [ ] Smart reminders
- [ ] Learning assistance
- [ ] Productivity insights

# Phase 14 — Mobile

- [ ] Native mobile architecture
- [ ] Mobile task experience
- [ ] Mobile calendar
- [ ] Mobile habits
- [ ] Mobile focus
- [ ] Mobile learning
- [ ] Mobile digital wellbeing controls
- [ ] Mobile notifications
- [ ] Mobile widgets
- [ ] System-level distraction blocking where platform APIs permit
- [ ] Wearable support

# Phase 15 — Design / UX System

Only after the functional architecture is stable.

- [ ] Final information architecture
- [ ] Design system
- [ ] Typography
- [ ] Spacing system
- [ ] Components
- [ ] Navigation
- [ ] Dashboard
- [ ] Tasks UI
- [ ] Calendar UI
- [ ] Habits UI
- [ ] Focus UI
- [ ] Learning UI
- [ ] Digital wellbeing UI
- [ ] Social UI
- [ ] Analytics UI
- [ ] Notifications UI
- [ ] Responsive layouts
- [ ] Accessibility
- [ ] Empty/loading/error states
- [ ] Onboarding

# Phase 16 — Quality & Security

- [ ] Full API contract coverage
- [ ] Web integration tests
- [ ] End-to-end tests
- [ ] Regression suite
- [ ] Authentication/authorization audit
- [ ] Data ownership audit
- [ ] Validation audit
- [ ] Rate limiting
- [ ] Error handling
- [ ] Performance testing
- [ ] Database/index review
- [ ] Security review

# Phase 17 — Production

- [ ] Production environment
- [ ] Database production configuration
- [ ] Migrations strategy
- [ ] Monitoring
- [ ] Logging
- [ ] Error tracking
- [ ] Backups
- [ ] Deployment pipeline
- [ ] Domain
- [ ] HTTPS
- [ ] Production smoke tests
- [ ] Release checklist

---

## Current verified state

- Tasks — implemented foundation
- Projects — implemented and contract-tested
- Habits — implemented and tested
- Focus — implemented and contract-tested
- Learning/Flashcards — implemented and contract-tested
- Analytics — implemented and contract-tested
- Notifications — implemented and contract-tested
- Server synchronization infrastructure — retained as backend infrastructure
- Offline-first user mode — **explicitly excluded**
- Structured — **explicitly excluded**

## Product direction

Shyraq is not an education-only application and is not a TickTick clone. It is a general Personal Life OS that combines selected capabilities from TickTick, Anki, one sec, and YPT into one coherent product.
