# Shyraq

Modern offline-first flashcard and spaced-repetition platform.

## Product rules
- No AI
- No subscriptions / premium tiers
- Same full feature set for every user
- Offline-first review
- FSRS scheduler
- Email + password authentication
- Public decks and later collaboration
- Maximum import/export and data portability

## Architecture
Next.js 16 + React 19 + TypeScript + Tailwind + Supabase + Dexie/IndexedDB + FSRS.

Review actions are append-only events. Cloud sync uses cursors and a change log so offline devices can reconcile without silently losing review history.
