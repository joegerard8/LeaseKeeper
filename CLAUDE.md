# Lease Keeper

Class project (IS 581): a lease-management app with a manager side (properties, tenants, leases, reminders) and a tenant portal. Built with Next.js 16 (App Router, Server Actions), Drizzle ORM, and SQLite via `better-sqlite3`. Gemini (`@google/genai`) is used for lease/PDF features.

## Running the app

**Use the `mvp:*` scripts.** The repo was scaffolded from a vinext/Cloudflare Sites starter (that's what `README.md` describes), but the app now runs on plain Next.js with a local SQLite file. The `dev`/`build`/`start` scripts (vinext/wrangler) are leftovers and will not work with `better-sqlite3`.

```sh
npm run mvp:dev      # dev server at http://localhost:3000
npm run mvp:build    # production build
npm run mvp:start    # serve the production build
```

### First-time setup

1. Node `>=22.13.0`.
2. `npm install` (only if `node_modules/` is missing).
3. Copy `.env.example` to `.env.local` and fill in `AUTH_SECRET` and `GEMINI_API_KEY` (`GEMINI_MODEL` has a default).
4. If `local.db` doesn't exist: `npm run db:push` to create the tables from `db/schema.ts`.
5. `npm run db:seed` to create the demo manager account (safe to re-run).

### Demo login

- Manager: `demo@leasekeeper.test` / `password123`
- Unauthenticated requests to manager pages (e.g. `/dashboard`) redirect to `/sign-in`.

## Layout

- `app/(manager)/`: manager pages (dashboard, properties, tenants, leases, reminders)
- `app/(tenant)/portal/`: tenant portal
- `app/actions/`: Server Actions (auth, leases, obligations, properties, reminders, tenants)
- `app/sign-in`, `sign-up`, `reset-password`: auth pages
- `db/schema.ts`: Drizzle schema; `db/index.ts` opens `local.db` in the project root
- `lib/`: shared helpers (auth, etc.)
- `scripts/seed.ts`: demo data seeder
- `sample-leases/`: sample lease files for testing uploads

## Database

- After editing `db/schema.ts`: run `npm run db:push` for a quick local sync, or `npm run db:generate` to write a migration into `drizzle/`.
- `local.db`, `local.db-wal` and `local.db-shm` hold local data. Stop the dev server before deleting or replacing them.

## Gotchas

- Git may report "dubious ownership" because `.git` was created by a different Windows user. Fix it with:
  `git config --global --add safe.directory "C:/Users/joefg/OneDrive/Desktop/Fall 2026/IS 581/Lease Keeper"`
- The project lives in OneDrive. If you see file-lock or sync errors on `local.db` or `.next/`, pause OneDrive sync.
- Ignore `.vinext/`, `.wrangler/`, `.sites-runtime/`, `dist/`, `out/` and `.openai/`. They belong to the unused Sites tooling.
