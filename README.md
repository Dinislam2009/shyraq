# Shyraq

**Shyraq** — modern, universal, offline-first flashcard and spaced-repetition platform for students, university learners, language learners, exam preparation, professionals, and anyone who learns through repetition.

The product is designed around one principle: **the complete product is available to every user**. There is no AI, no subscription, no Premium/Pro tier, no artificial feature lock, and no gamification requirement.
> **Status note (source-audited):** A checked item means the feature has a working implementation in the repository at a functional/foundation level. An unchecked item means the feature is not fully implemented or still needs production hardening. The repository source code, not this README, is the source of truth.


---

## 1. Product vision

Shyraq is not intended to be a clone of Anki. Anki is an important technical/reference point, especially for scheduling and migration, but Shyraq is building its own category around:

- modern UI/UX;
- powerful spaced repetition;
- offline-first learning;
- complete data portability;
- flexible card creation;
- public knowledge sharing;
- creator profiles;
- personal and team workspaces;
- collaboration;
- transparent privacy and sync;
- deep learning analytics;
- equal access to all product features.

The first target is a professional web application. Native/cross-platform mobile applications come after the web product reaches a stable product baseline.

---

## 2. Non-negotiable product rules

- **No AI.**
- **No subscriptions.**
- **No Premium / Pro / paid feature tiers.**
- **Every user receives the same feature set.**
- **No gamification as a core product mechanic.**
- Account-based product with email + password authentication.
- No mandatory email verification code.
- Offline review must work.
- Cloud sync must never silently destroy review history.
- Review events are append-only and auditable.
- Users own their data and can export it.
- User media is private by default.
- Public decks are opt-in.
- Collaboration uses granular permissions.
- Privacy and transparency are first-class requirements.
- The product must remain useful without an internet connection.
- Mobile is a planned first-class client, not a reduced web experience.

---

# 3. Product roadmap

## Phase 0 — Foundation and architecture

### Goal
Create a stable technical foundation before adding advanced product features.

### Planned/implemented foundation

- [x] Next.js App Router application
- [x] React + TypeScript
- [x] Tailwind CSS
- [x] Supabase Postgres
- [x] Supabase Auth
- [x] Supabase Storage
- [x] Supabase Realtime foundation
- [x] Dexie / IndexedDB local storage
- [x] FSRS scheduler
- [x] SQL.js for Anki SQLite processing
- [x] fflate for ZIP backup processing
- [x] KaTeX for mathematics
- [x] GitHub source control
- [x] GitHub Actions CI
- [x] Vercel deployment integration
- [x] Generated database types synchronized with the current Supabase schema (legacy generated models remain isolated)
- [x] Database schema kept in the repository
- [x] RLS-based database security
- [x] Private media bucket

---

# 4. Authentication and account system

## Authentication

- [x] Email + password signup
- [x] Email + password login
- [x] Logout
- [x] Protected application routes
- [x] Supabase session/cookie handling
- [x] Automatic profile creation
- [x] Automatic personal workspace creation
- [x] No email verification code requirement
- [x] Optional Google login (provider enablement is deployment configuration)
- [x] Optional Apple login (provider enablement is deployment configuration)
- [x] Password reset UX refinement
- [x] Auth error UX refinement
- [x] Session/device management UI

## Profile

- [x] Display name
- [x] Username
- [x] Bio
- [x] Public creator profile
- [x] Profile settings
- [x] Avatar upload
- [x] Profile statistics
- [x] Public creator deck collections
- [x] Creator activity/history controls

## Account lifecycle

- [x] Account deletion backend foundation
- [x] Final account-deletion UI and confirmation flow
- [x] Data deletion/export explanation before deletion
- [x] Complete cleanup verification for user-owned media and data

---

# 5. Workspace architecture

Shyraq supports both individual and collaborative learning.

## Personal workspace

- [x] Automatic personal workspace
- [x] Deck ownership
- [x] Personal cards
- [x] Personal collections
- [x] Personal review history
- [x] Personal review preferences

## Team workspace

- [x] Team workspace creation
- [x] Team members
- [x] Workspace invitations
- [x] Role management
- [x] Member removal
- [x] Granular permissions foundation
- [x] Owner
- [x] Admin
- [x] Editor
- [x] Reviewer
- [x] Viewer
- [x] Complete invite acceptance UX
- [x] Invite cancellation/revocation UI
- [x] Workspace activity/audit log
- [x] Workspace-level settings
- [x] Workspace member search/filter
- [x] Fine-grained per-deck permissions UI

## Workspace switching

- [x] Workspace selection foundation
- [x] Global workspace switcher in the main application shell
- [x] Persist selected workspace
- [x] Workspace-aware global search
- [x] Workspace-aware dashboard
- [x] Workspace-aware analytics

---

# 6. Deck system

## Deck creation

- [x] Create deck
- [x] Edit deck
- [x] Delete deck
- [x] Description
- [x] Workspace association
- [x] Visibility
- [x] Deck status
- [x] Default card template

## Deck management

- [x] Deck page
- [x] Card count
- [x] Study action
- [x] Card management
- [x] Template management
- [x] Public/private visibility
- [x] Public deck updates
- [x] Deck cover image
- [x] Deck color/icon customization
- [x] Deck archive
- [x] Deck trash / restore
- [x] Permanent deletion confirmation with dependency summary
- [x] Deck duplication UX improvements
- [x] Deck settings page

## Deck organization

- [x] Tags
- [x] Collections
- [x] Favorites
- [x] Marked cards
- [x] Suspended cards
- [x] Nested/tag hierarchy
- [x] Saved filters
- [x] Smart collections
- [x] Custom deck sorting
- [x] Drag-and-drop deck/card organization (block-level and card/deck reordering are implemented)

---

# 7. Card system

## Card types

- [x] Basic
- [x] Reverse
- [x] Cloze
- [x] Multiple Choice
- [x] Image
- [x] Custom

## Card content

- [x] Front
- [x] Back
- [x] Explanation
- [x] Tags
- [x] Images
- [x] Audio
- [x] Video
- [x] Code blocks
- [x] Inline code
- [x] LaTeX
- [x] Rich formatting
- [x] Custom media
- [x] Image occlusion foundation
- [x] Full visual image-occlusion editor
- [x] Drag/resize occlusion rectangles
- [x] Multiple occlusion groups
- [x] Advanced cloze/image workflows

## Card editor

Target editor:

**Notion-like editing experience + split-screen live preview.**

- [x] Split-screen editor foundation
- [x] Live preview
- [x] Template selection
- [x] Card-type selection
- [x] Formatting controls
- [x] Code blocks
- [x] LaTeX
- [x] Media upload
- [x] Tags
- [x] Full WYSIWYG document editor
- [x] Slash commands
- [x] Drag-and-drop blocks
- [x] Block-level formatting
- [x] Keyboard-first editing
- [x] Markdown shortcuts
- [x] Rich link handling
- [x] Better table support
- [x] Better code-language selector
- [x] Media library picker
- [x] Card template variables beyond front/back
- [x] Advanced template CSS editor

## Bulk card creation

- [x] Front | Back quick format
- [x] Multi-line quick import
- [x] CSV import
- [x] JSON import
- [x] Paste-to-create bulk cards
- [x] Bulk editor
- [x] Bulk tag assignment
- [x] Bulk template assignment
- [x] Bulk media attachment
- [x] Duplicate detection before creation

## Card list

- [x] Search
- [x] Filter by type
- [x] Filter by status
- [x] Select visible cards
- [x] Bulk mark/unmark
- [x] Bulk suspend/unsuspend
- [x] Bulk delete
- [x] Inline editing foundation
- [x] Fully customizable columns
- [x] Column visibility settings
- [x] Column ordering
- [x] Multi-sort
- [x] Saved table views
- [x] Advanced filter builder
- [x] Keyboard navigation
- [x] Bulk edit modal with all card fields

## Card state

- [x] Marked
- [x] Suspended
- [x] Favorite
- [x] Difficult-card foundation
- [x] User-defined markers
- [x] Custom card statuses
- [x] Card history view
- [x] Trash / restore

---

# 8. Review engine

The review engine is one of Shyraq's core systems.

## Scheduler

- [x] FSRS-based scheduling
- [x] Desired retention
- [x] Maximum interval
- [x] Learning steps
- [x] Relearning steps
- [x] Interval fuzzing
- [x] Short-term scheduling
- [x] New-card daily limit
- [x] Review daily limit
- [x] Scheduler profiles
- [x] Multiple scheduler engines
- [x] User-selectable scheduler
- [x] Advanced scheduler diagnostics
- [x] Scheduler migration tools

Long-term direction:

**FSRS first, multiple scheduler engines later.**

## Review interaction

- [x] Preloaded review batches
- [x] Front/back flow
- [x] Answer reveal
- [x] Again
- [x] Hard
- [x] Good
- [x] Easy
- [x] Keyboard shortcuts
- [x] Swipe gestures
- [x] Multiple-choice interaction
- [x] Review timing
- [x] Progress indicator
- [x] Session completion
- [x] Load-more sessions
- [x] Review statistics entry point
- [x] Custom review-button labels
- [x] Custom review-button order
- [x] Keyboard-hint preference
- [x] Swipe preference
- [x] Fully customizable review-button colors/styles
- [x] Per-card review interaction preferences
- [x] Review-session configuration screen
- [x] Undo last answer
- [x] Pause/resume session
- [x] Review session summary
- [x] Better accessibility controls

## Review philosophy

- No gamification requirement.
- No artificial streak pressure.
- No forced motivational mechanics.
- The scheduler should determine learning intervals.
- Users should be able to understand and control their review settings.
- Review history must remain intact even when sync conflicts occur.

---

# 9. Offline-first architecture

Offline functionality is a core requirement, not an optional enhancement.

## Local storage

- [x] Dexie / IndexedDB
- [x] Offline review queue
- [x] Local review events
- [x] Cached review sessions
- [x] Device ID
- [x] Pending event status
- [x] Full local mirror of decks/cards across personal and shared workspaces
- [x] Full cold-start offline application
- [x] Offline card creation
- [x] Offline card editing
- [x] Offline deck management
- [x] Offline media cache management
- [x] Storage quota UI

## Sync

- [x] Automatic review-event sync
- [x] Append-only review events
- [x] Sync cursor
- [x] Sync change log
- [x] Conflict detection
- [x] Conflict records
- [x] Conflict resolution UI
- [x] Keep remote state
- [x] Apply incoming state
- [x] Local pending event protection
- [x] Retry behavior
- [x] Background sync refinement
- [x] Full bidirectional local database synchronization
- [x] Better sync progress UI
- [x] Sync health indicator
- [x] Per-device sync history
- [x] Sync diagnostics export

## Conflict model

The system must never silently overwrite a newer review state with an older offline event.

Conflict handling:

1. Preserve the incoming review event.
2. Preserve the current remote state.
3. Create a conflict record.
4. Show both states to the user.
5. Allow the user to keep the remote state or apply the incoming state.
6. Keep the review history auditable.

---

# 10. Review history and auditability

- [x] Full review event storage
- [x] Event timestamps
- [x] Device IDs
- [x] Previous state
- [x] Next state
- [x] Rating
- [x] Elapsed review time
- [x] Event metadata
- [x] Conflict preservation
- [x] Dedicated review-history UI
- [x] Per-card review timeline
- [x] Per-deck review timeline
- [x] Event filtering
- [x] Event export
- [x] Advanced audit/debug view

---

# 11. Import and migration

Data portability is a primary product requirement.

## Standard imports

- [x] CSV
- [x] JSON
- [x] Shyraq JSON backup
- [x] Shyraq ZIP backup
- [x] Anki .apkg
- [x] Additional generic flashcard formats
- [x] Import preview
- [x] Import validation report
- [x] Duplicate handling controls
- [x] Import rollback

## Anki migration

Target:

**Move from Anki to Shyraq without losing meaningful learning data.**

- [x] Read Anki SQLite collection
- [x] Read collection.anki2
- [x] Read collection.anki21
- [x] Read collection.sqlite
- [x] Parse decks
- [x] Parse cards
- [x] Parse notes
- [x] Parse tags
- [x] Parse review history
- [x] Extract image references
- [x] Extract sound references
- [x] Import media
- [x] Preserve imported review events
- [x] Reconstruct Shyraq review state from history
- [ ] Exact Anki template engine compatibility
- [ ] Exact Anki card styling compatibility
- [ ] Exact Anki scheduling-state compatibility
- [ ] Cloze/template edge-case compatibility
- [x] Import validation/diff report
- [x] Large collection performance optimization
- [x] Server-backed import progress UI for long-running imports
- [x] Import recovery after interrupted upload

Shyraq should maximize Anki compatibility while explicitly avoiding the claim that every internal Anki implementation detail is identical to FSRS/Shyraq.

---

# 12. Export and backup

## Export formats

- [x] JSON
- [x] CSV
- [x] ZIP
- [x] Media binaries
- [x] Review history
- [x] Review states
- [x] Templates
- [x] Tags
- [x] Collections
- [x] Public follows/copy metadata
- [x] shyraq-backup-v2

## Backup requirements

- [x] Complete backup endpoint
- [x] Private media included
- [x] Media size protection
- [x] JSON database backup
- [x] CSV card export
- [x] Scheduled automatic backup versions
- [x] Backup history UI
- [x] One-click restore
- [x] Restore preview with a complete pre-restore change summary
- [x] Restore conflict detection
- [x] Selective restore
- [x] Backup integrity checksum
- [x] Large-backup streaming

Target principle:

**A user's data should remain portable even if they stop using Shyraq.**

---

# 13. Media system

- [x] Private Supabase Storage bucket
- [x] Image upload
- [x] Audio upload
- [x] Video upload
- [x] Media metadata
- [x] Signed media URLs
- [x] Media references inside cards
- [x] Media export
- [x] Anki media migration
- [x] Dedicated media library
- [x] Media search
- [x] Media reuse across cards
- [x] Media deletion/orphan cleanup
- [x] Media compression
- [x] Image optimization
- [x] Audio/video metadata display
- [x] Offline media cache

---

# 14. Templates

- [x] Default Basic template
- [x] Custom templates
- [x] Template CRUD
- [x] Template selection per card
- [x] Front template
- [x] Back template
- [x] CSS
- [x] Live review rendering
- [x] Advanced template editor
- [x] Template variables
- [x] Conditional fields
- [x] Template duplication
- [x] Template import/export
- [x] Template compatibility layer for Anki

---

# 15. Tags, collections and organization

## Tags

- [x] Card tags
- [x] Tag filtering
- [x] Tag display
- [x] Tag manager
- [x] Rename tag globally
- [x] Merge tags
- [x] Delete tags
- [x] Tag hierarchy
- [x] Tag usage statistics

## Collections

- [x] Collections
- [x] Collection cards
- [x] Collection creation
- [x] Collection detail page
- [x] Collection editing
- [x] Collection sorting
- [x] Collection sharing
- [x] Smart collections
- [x] Collection rules

## Favorites / difficult cards

- [x] Favorite foundation
- [x] Marked cards
- [x] Suspended cards
- [x] Difficult-card foundation
- [x] Custom markers
- [x] Marker manager
- [x] Saved difficult-card filters

---

# 16. Public deck library

Public sharing is a major Shyraq feature.

## Discovery

- [x] Public deck discovery
- [x] Search
- [x] Public deck pages
- [x] Creator attribution
- [x] Card previews
- [x] Category system
- [x] Subject filters
- [x] Language filters
- [x] Difficulty filters
- [x] Sort by recent
- [x] Sort by popularity
- [x] Search ranking
- [x] Featured public collection discovery/curation workflow

## Public deck actions

- [x] Follow
- [x] Copy
- [x] Report
- [x] Author update tracking
- [x] User-controlled author-update policy
- [x] Accept future updates
- [x] Ask before updates
- [x] Local-change protection
- [x] Unfollow management
- [x] Copy/update history
- [x] Deck version history
- [x] Visual update diff

## Public deck update model

Users choose whether author updates should:

- ask before applying;
- automatically apply when safe.

Local changes must remain protected.

If a local edit conflicts with an author update:

- do not silently overwrite it;
- show the conflict;
- show both versions;
- let the user decide.

---

# 17. Creator profiles and community

- [x] Public creator profile
- [x] Username
- [x] Display name
- [x] Bio
- [x] Public decks
- [x] Follow/copy
- [x] Creator avatar
- [x] Creator statistics
- [x] Creator collections
- [x] Creator activity controls
- [x] Block/mute creator
- [x] Community moderation/report history

---

# 18. Moderation

## Deck reports

- [x] Report public deck
- [x] Report reasons
- [x] Optional details
- [x] Report status
- [x] Creator moderation page
- [x] Reviewing
- [x] Resolved
- [x] Dismissed
- [x] Platform-wide moderation queue
- [x] Moderator roles
- [x] Report escalation
- [x] Abuse-rate limiting
- [x] Automated spam protection without AI
- [x] Audit log
- [x] Moderator actions history

The moderation system should remain transparent and should not rely on AI classification.

---

# 19. Collaboration

Collaboration is planned after the public sharing foundation.

## Current foundation

- [x] Team workspaces
- [x] Members
- [x] Invitations
- [x] Granular roles
- [x] Permissions foundation
- [x] Conflict-safe card updates
- [x] Realtime refresh foundation
- [x] Presence foundation

## Full collaboration target

- [x] Realtime card editing
- [x] Realtime deck editing
- [x] Presence indicators
- [x] Active editor indicators
- [x] Cursor/selection presence where practical
- [x] Optimistic updates
- [x] Conflict detection
- [x] Conflict resolution UI
- [x] Version history
- [x] Restore previous version
- [x] Comments
- [x] Mentions
- [x] Activity feed
- [x] Workspace audit log
- [x] Fine-grained permissions per deck
- [x] Fine-grained permissions per collection

Conflict model target:

**Detect first, preserve both versions, then let the user resolve.**

---

# 20. Analytics and statistics

Analytics are a core feature, not a Premium feature.

## Dashboard

- [x] Due today
- [x] New cards
- [x] Reviews
- [x] Study time
- [x] Study streak
- [x] Deck overview
- [x] More detailed daily planning
- [x] Workspace overview
- [x] Personalized but non-AI insights

## Statistics

- [x] 30-day activity
- [x] Reviews per day
- [x] Accuracy
- [x] Answer distribution
- [x] Study time
- [x] Average response time
- [x] Deck performance
- [x] Daily detail
- [x] Streak
- [x] Retention curve
- [x] Forecast of due workload
- [x] New/review balance
- [x] Card difficulty distribution
- [x] Learning/relearning breakdown
- [x] Scheduler effectiveness metrics
- [x] Per-card performance
- [x] Per-tag performance
- [x] Per-collection performance
- [x] Historical comparison
- [x] CSV/JSON analytics export

The dashboard should expose a large amount of information while maintaining a visually minimal hierarchy.

---

# 21. UI/UX

## Design direction

- Modern SaaS interface
- Calm study-focused visual language
- Light mode
- Dark mode
- Professional desktop experience
- Responsive mobile web
- Minimal visual noise
- Strong typography hierarchy
- Accessible controls
- Fast navigation

## Navigation

Target navigation includes:

- Dashboard
- Review
- My decks
- Public decks
- Collections
- Import
- Export
- Profile
- Review settings
- Sync
- Moderation
- Workspace
- General settings

## Language

Target supported languages:

- [x] English
- [x] Russian
- [x] Kazakh
- [ ] Complete production-grade translation coverage
- [ ] Server-rendered/localized text instead of DOM translation
- [x] Persistent language preference across devices
- [x] Locale-aware dates/numbers
- [ ] Translation QA

---

# 22. Search

Global search is planned as a major productivity feature.

- [x] Search decks
- [x] Search cards
- [x] Search tags
- [x] Search collections
- [x] Search creators
- [x] Search public decks
- [x] Search workspace content
- [x] Search filters
- [x] Keyboard shortcut
- [x] Command palette
- [x] Recent searches
- [x] Saved searches

Target shortcut:

Cmd/Ctrl + K

---

# 23. Notifications and activity

- [x] Sync conflict notification
- [x] Author deck-update notification
- [x] Workspace invitation notification
- [x] Collaboration activity notification
- [x] Moderation notification
- [x] Backup notification
- [x] Offline/online state notification
- [x] In-app notification center
- [x] Notification preferences

No paid notification tiers.

---

# 24. Accessibility

- [x] Full keyboard navigation
- [x] Screen-reader labels
- [x] Focus management
- [x] Accessible review controls
- [x] Reduced motion support
- [x] High-contrast support
- [x] Proper semantic headings
- [x] ARIA audit
- [x] Color-independent state indicators
- [x] Accessible media controls

---

# 25. Security and privacy

## Database

- [x] RLS on Shyraq application tables
- [x] User-scoped access policies
- [x] Workspace-scoped access policies
- [x] Public deck policies
- [x] Private media policies
- [x] Sync conflict policies
- [x] Report policies
- [x] Collaboration policies
- [x] Foreign-key indexes
- [x] Performance cleanup

## Secrets

- [x] Browser uses public Supabase key only
- [x] Service-role key never shipped to client
- [x] Privileged account deletion handled server-side
- [x] Final production secret audit
- [x] Environment-variable audit
- [x] Dependency security audit

## Authentication security

- [ ] Enable Supabase leaked-password protection
- [x] Password reset hardening
- [x] Login rate limiting
- [x] Abuse protection
- [x] Session/device management

## Privacy

- [x] Private user media
- [x] User-controlled public deck visibility
- [x] Data export
- [x] Account deletion foundation
- [x] Privacy policy
- [x] Terms of service
- [x] Data retention documentation
- [x] Public/community content policy

Legacy tables from the old project must remain isolated from the Shyraq application and should not be exposed through the Shyraq UI.

---

# 26. Performance

- [x] Server-side data fetching where appropriate
- [x] Batched review queue
- [x] IndexedDB offline queue
- [x] Signed media URLs
- [x] Database indexes
- [x] CI build verification
- [ ] Full page performance audit
- [x] Bundle-size audit
- [x] Image optimization
- [x] Large-deck virtualization
- [x] Large-card-list virtualization
- [x] Large Anki import optimization
- [x] Large media backup optimization
- [x] Cold-start optimization
- [x] Offline cache optimization

Target:

- fast first load;
- fast review transition;
- smooth large card lists;
- no UI blocking during sync/import/export.

---

# 27. Reliability and error handling

- [x] Sync retry foundation
- [x] Conflict preservation
- [x] Local pending review storage
- [x] Review history preservation
- [x] CI build
- [x] Global error boundary
- [x] User-friendly error pages
- [x] Import failure recovery
- [x] Export failure recovery
- [x] Upload retry
- [x] Background sync retry
- [x] Error logging/observability
- [x] Health status page
- [x] Recovery diagnostics

---

# 28. Testing

## Automated

- [x] ESLint
- [x] TypeScript/Next build
- [x] GitHub Actions CI
- [x] Unit tests for scheduler integration
- [x] Unit tests for import parsers
- [x] Unit tests for export/restore
- [x] Unit tests for sync conflict logic
- [x] Unit tests for permission logic
- [x] Unit tests for deck update reconciliation
- [x] Database/RLS integration tests (env-gated Supabase integration suite)
- [x] API tests

## End-to-end

- [x] Signup
- [x] Login
- [ ] Create deck
- [ ] Create card
- [ ] Review card
- [ ] Offline review
- [ ] Sync
- [ ] Conflict resolution
- [ ] Import CSV
- [ ] Import JSON
- [ ] Import Anki
- [ ] Export backup
- [ ] Restore backup
- [ ] Public deck
- [ ] Follow/copy
- [ ] Author update
- [ ] Report
- [ ] Workspace invite
- [ ] Collaboration permissions
- [ ] Account deletion

## Browser verification

- [ ] Desktop verification
- [ ] Mobile responsive verification
- [x] Dark mode verification
- [ ] All three language verification
- [ ] Console-error audit
- [ ] Accessibility audit

---

# 29. Mobile strategy

Mobile is a planned first-class product.

## Web first

- [ ] Finish production-grade responsive web app
- [x] Mobile review UX
- [ ] Mobile card editor
- [ ] Mobile deck management
- [x] Mobile offline behavior
- [x] Mobile navigation

## Native/cross-platform later

Framework intentionally remains undecided until the web product stabilizes.

Potential requirements:

- iOS
- Android
- shared sync engine
- shared data model
- offline-first local database
- push notifications
- media caching
- biometric/device security where appropriate

The mobile application should preserve the same feature philosophy: no Premium feature split.

---

# 30. Internationalization strategy

Initial supported locales:

1. Kazakh
2. Russian
3. English

Requirements:

- complete UI translation;
- no hard-coded visible product strings where possible;
- localized validation/errors;
- localized dates;
- localized numbers;
- localized empty states;
- localized accessibility labels;
- language preference persistence;
- language preference synchronization;
- translation QA on every major screen.

The current global client translation layer is a temporary bridge. The final implementation should move product text into proper component-level/server-compatible translation keys.

---

# 31. Deployment

## GitHub

- [x] Repository
- [x] Main branch
- [x] GitHub Actions
- [x] Automated lint
- [x] Automated build

## Supabase

- [x] Production project
- [x] PostgreSQL
- [x] Auth
- [x] Storage
- [x] RLS
- [x] Core schema
- [x] Sync schema
- [x] Collaboration schema
- [x] Public deck schema
- [x] Reporting schema
- [x] Generated database types
- [ ] Final production security audit
- [ ] Final production performance audit

## Vercel

- [x] Vercel integration connected
- [ ] Production deployment verification
- [ ] Production domain
- [ ] Production environment variables
- [ ] Preview deployment verification
- [ ] Runtime error monitoring
- [x] Production smoke tests
- [ ] Custom domain / DNS
- [ ] HTTPS verification
- [ ] Deployment rollback procedure

Required public environment variables:

~~~env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...

# Server-only (never use NEXT_PUBLIC_) for scheduled backups
SUPABASE_SERVICE_ROLE_KEY=...
CRON_SECRET=...
~~~

Never place the Supabase service-role/secret key in browser-exposed environment variables.

---

# 32. Production launch checklist

Before calling Shyraq production-ready:

### Core
- [ ] Signup works
- [ ] Login works
- [x] Logout works
- [x] Profile works
- [x] Deck CRUD works
- [x] Card CRUD works
- [x] Templates work
- [x] Review works
- [x] FSRS works
- [x] Offline review works
- [x] Sync works
- [x] Conflict resolution works
- [x] Import works
- [x] Export works
- [x] Backup/restore works

### Community
- [x] Public decks work
- [x] Creator profiles work
- [x] Follow works
- [x] Copy works
- [x] Author updates work
- [x] Reports work
- [x] Moderation works

### Collaboration
- [x] Workspace creation works
- [x] Invitations work
- [x] Roles work
- [x] Permissions work
- [ ] Concurrent editing protection works
- [ ] Conflict resolution works

### Data
- [x] Full backup verified
- [x] Media backup verified
- [x] Anki import verified
- [x] Review history verified
- [x] Restore verified
- [x] Data deletion verified

### Security
- [x] RLS audit complete
- [x] Storage policy audit complete
- [ ] Auth security audit complete
- [ ] Leaked-password protection enabled
- [x] Secret audit complete
- [x] Dependency audit complete

### UX
- [ ] Kazakh UI complete
- [ ] Russian UI complete
- [ ] English UI complete
- [x] Light mode
- [x] Dark mode
- [x] Responsive layout
- [x] Keyboard navigation
- [ ] Accessibility audit

### Quality
- [x] Unit tests
- [x] Integration tests
- [ ] E2E tests
- [ ] Browser verification
- [ ] Performance audit
- [ ] Error monitoring
- [ ] Production smoke test

---

# 33. Post-launch roadmap

After the stable web release:

### Stage A — Product hardening
- Improve offline mirror.
- Improve sync diagnostics.
- Finish complete i18n.
- Finish accessibility.
- Finish dark mode.
- Finish backup/restore.
- Finish account lifecycle.
- Improve testing coverage.

### Stage B — Community
- Improve public discovery.
- Add categories and filters.
- Improve creator profiles.
- Improve deck versioning.
- Improve moderation.

### Stage C — Collaboration
- Realtime editing.
- Comments.
- Mentions.
- Activity feeds.
- Full audit history.
- Advanced conflict resolution.

### Stage D — Mobile
- Choose mobile framework.
- Build shared data/sync layer.
- Build iOS/Android clients.
- Offline-first mobile review.
- Push notifications.
- Media caching.

### Stage E — Advanced scheduling
- Multiple schedulers.
- Scheduler profiles.
- Advanced analytics.
- Migration tools between schedulers.

---

# 34. Explicitly out of scope

The following are intentionally **not** part of the Shyraq product direction:

- AI card generation
- AI tutor
- AI chat
- AI summarization
- AI grading
- AI recommendations
- Premium-only features
- Subscription plans
- Paywalls
- Gamification-first mechanics
- Artificial usage limits
- Artificial feature limits

Shyraq should compete through product quality, learning workflow, portability, offline reliability, customization, collaboration, and UX — not through feature gating.

---

# 35. Definition of the finished Shyraq product

The long-term finished product should allow a user to:

1. Create an account.
2. Enter a personal or team workspace.
3. Create or import a deck.
4. Create any supported card type.
5. Add rich text, formulas, code, images, audio and video.
6. Customize templates.
7. Organize cards with tags, collections, favorites and markers.
8. Study with FSRS.
9. Study completely offline.
10. Synchronize safely across devices.
11. Resolve conflicts without losing review events.
12. Inspect complete review history.
13. Analyze learning performance.
14. Export the complete dataset and media.
15. Import from Anki with maximum practical compatibility.
16. Publish a deck publicly.
17. Build a creator profile.
18. Follow or copy public decks.
19. Receive/accept author updates safely.
20. Report problematic public content.
21. Collaborate in team workspaces.
22. Control permissions.
23. Edit collaboratively without silent data loss.
24. Use the application in Kazakh, Russian or English.
25. Use light or dark mode.
26. Use the product on desktop and mobile.
27. Delete the account and control their data.
28. Leave Shyraq without losing ownership of their learning data.

---

# 36. Current implementation status

Shyraq already contains a substantial working foundation: authentication, workspaces, deck/card management, FSRS review, offline review queue, sync/conflict handling, Anki import, backup/export, media handling, public decks, creator profiles, follow/copy, author-update protection, reports/moderation, statistics, review settings, and the three-language UI foundation.

The remaining checklist above is the **complete product roadmap**, including both unfinished implementation work and later-stage product expansion. A checked item means the feature exists in the repository at a functional foundation level; an unchecked item means it still needs implementation, hardening, or production QA.

---

## Local development

### Requirements

- Node.js 22+
- npm
- Supabase project

### Environment

Create .env.local:

~~~env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
~~~

Do not expose a service-role/secret key to the browser.

### Install

~~~bash
npm install
~~~

### Development

~~~bash
npm run dev
~~~

### Checks

~~~bash
npm run lint
npm run build
~~~

### Database helpers

~~~bash
npm run db:push
npm run db:types
~~~

---

## Tech stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase Postgres
- Supabase Auth
- Supabase Storage
- Supabase Realtime
- Dexie / IndexedDB
- ts-fsrs
- sql.js
- fflate
- KaTeX
- GitHub Actions
- Vercel

---

## Repository structure

~~~text
src/
  app/                 # Next.js routes and server actions
  components/          # UI and interactive components
  lib/
    import/            # Import parsers
    offline/           # IndexedDB/Dexie
    supabase/           # Supabase clients and queries
    sync/               # Offline/cloud synchronization
    i18n.ts              # Locale dictionaries
  types/                # Generated database types

supabase/
  schema.sql             # Database source of truth

.github/
  workflows/
    ci.yml               # Lint/build CI
~~~

---

## License

License and open-source distribution terms are intentionally to be finalized before public release.
