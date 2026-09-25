# Shyraq

Modern offline-first flashcard and spaced-repetition platform.

## Product rules

- No AI.
- No subscriptions or premium tiers.
- Every user gets the same feature set.
- Offline-first review with cloud sync.
- FSRS-based scheduling.
- Email + password authentication.
- Public decks, creator profiles, follows, copies and collaboration.
- Maximum import/export and data portability.
- Analytics are built into the core product.

## Stack

- Next.js 16.3
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase Postgres + Auth + Storage + Realtime
- Dexie / IndexedDB for local review state
- ts-fsrs for scheduling
- sql.js + fflate for Anki/backup processing
- KaTeX for formulas

## Local setup

1. Install Node.js 22+.
2. Create `.env.local` from `.env.example`.
3. Set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Install dependencies:
   `npm install`
5. Start the app:
   `npm run dev`

## Checks

```bash
npm run lint
npm run build
```

Supabase helpers:

```bash
npm run db:push
npm run db:types
```

## Main product areas

### Review

- FSRS scheduling
- Batch review sessions
- Keyboard shortcuts
- Swipe controls
- Multiple-choice interaction
- Review timing
- New/review daily limits
- Offline review queue
- Sync conflict detection
- Cached review sessions

### Card editing

- Basic, Reverse, Cloze, Multiple Choice, Image and Custom cards
- Rich formatting
- Code blocks
- Inline/display LaTeX
- Custom templates and template preview
- Images, audio and video
- Image occlusion
- Tags
- Bulk card actions
- Concurrent edit protection

### Import/export

- CSV
- JSON
- Full `shyraq-backup-v2`
- ZIP backup with media
- Anki `.apkg`
- Imported Anki review history
- FSRS state reconstruction from Anki history
- Imported media mapping

### Collaboration

- Personal and team workspaces
- Viewer / Reviewer / Editor / Admin / Owner permissions
- Workspace invitations
- Realtime deck/card refresh
- Presence on deck pages
- Optimistic concurrency protection for card edits

### Community

- Public deck discovery
- Creator profiles
- Follow/copy
- Author update acceptance
- Deck reporting
- Creator moderation

### Analytics

- 30-day activity
- Accuracy
- Answer distribution
- Study time
- Average response time
- Deck-level performance
- Daily detail
- Study streak

## Security

All Shyraq public application tables use RLS. User media is stored in a private Storage bucket.

Account deletion is handled through a JWT-protected Supabase Edge Function so the privileged service key never reaches the browser.

Legacy unrelated tables from the old schema are RLS-locked and are not used by the Shyraq application.

## Deployment

GitHub Actions runs lint and build checks on every push to `main`.

Supabase is the current backend source of truth. Production Vercel deployment still requires connecting the repository/project and configuring the two public Supabase environment variables in Vercel.
