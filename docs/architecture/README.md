# Shyraq Architecture

## Fixed decisions

- Modular monolith backend
- UUIDv7 identifiers
- UTC timestamps + IANA user timezone
- Offline-first clients
- RxDB local database
- PostgreSQL server database
- Versioned LWW for mutable entities
- Append-only sync semantics for historical event entities such as reviews
- Sync cursor + idempotent operations
- FSRS-6 learning scheduler
- Supabase Auth
- Fastify + TypeScript API
- Next.js web
- Expo/React Native mobile
- Electron desktop
- pnpm + Turborepo monorepo
- AI: none
