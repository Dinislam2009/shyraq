# Shyraq

Cross-platform personal productivity and learning OS.

## Architecture

- Web: Next.js + React
- Mobile: Expo + React Native
- Desktop: Electron + React
- Backend: Fastify + TypeScript
- Server database: PostgreSQL
- Authentication: Supabase Auth
- Local database: RxDB
- Learning engine: FSRS-6
- Sync: offline-first, versioned LWW for mutable entities, append-only events for history entities
- Monorepo: pnpm + Turborepo

AI is intentionally not part of the product architecture.
