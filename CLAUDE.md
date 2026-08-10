# Torah Tracker — CLAUDE.md

## Project Overview

Torah reading tracker: React 19 + TypeScript frontend (Vite), Express/Node backend, SQLite via Drizzle ORM. Tracks which aliyot (Torah portions) have been read across years 2011 and 2023–2026.

**Key count:** 54 parshiot × 7 aliyot = 378 standard aliyot. Weekday, holiday, and occasion readings are tracked separately.

## Stack

- **Frontend:** React 19, TypeScript, Vite, pure CSS modules
- **Backend:** Express (`server.ts`), better-sqlite3, Drizzle ORM
- **DB:** SQLite (`torah.db`), schema in `src/db/schema.ts`, numbered SQL migrations in `drizzle/`
- **Desktop:** Electron
- **Mobile:** Capacitor

## Commands

```bash
npm run build       # vite build → dist/
npm test            # vitest run
npm run typecheck   # tsc --noEmit
```

## Terminology

Torah is the holy book of the Jewish people. It is divided into parshiot (singular: Parsha), and the parshiot in turn are divided into aliyot (singular: aliyah). Each aliyah is made up of pseukim (singular: pasuk). Occasionally, aliyot are split differently than the standard, and additional ones are added or two different aliyot are combined. These are called hosafot (single: hosafah).

**Dev:** Vite on port 8000 (env: `VITE_DEV_PORT`), proxying `/api` → Express on port 3000 (env: `VITE_API_PORT`).

**Kill the dev server after every test.** Never leave it running between commands. `npm run concurrent` spawns `concurrently`, which in turn spawns `nodemon` (wrapping `tsx server.ts`) and `vite` as children — killing only the port-8000/3000 listeners via `lsof -ti` leaves the `concurrently`/`nodemon` wrapper processes running. Instead: `pkill -f "concurrently -n api,vite"` (kills the whole tree) or individually `pkill -f "nodemon --exec tsx server.ts"` and `pkill -f vite`. Verify with `ps -ef | grep -i "concurrently\|nodemon\|vite"` before considering the server stopped — it should return nothing.

## Architecture Patterns

**Frontend data flow:** App fetches `/api/meta` on load (`initData()`), which seeds all sefer/parsha lookup maps dynamically — `SEFER_ORDER`, `SEFER_MAP`, `TLIT` are never hardcoded. `SEFER_COLORS` (Okabe-Ito palette) is the only hardcoded UI concern. Stats recompute on every filter change via `computeStats()` in `src/compute.ts`.

**Backend:** All API logic lives in `server.ts`. Raw SQL query strings are centralized in `src/db/queries.ts`. Schema definitions (source of truth) are in `src/db/schema.ts`. Migrations run automatically on server start via `initDb()`.

**Shared components** live under `src/components/shared/` and are reused across multiple views.

**Utilities** for domain logic (parsha parsing, IP allowlisting, export, form reducers) live in `src/utils/`.

**Tests:** Unit tests in `tests/unit/`, integration in `tests/integration/`, shared helpers in `tests/helpers/`. Coverage targets: `src/api.ts`, `src/compute.ts`, `src/utils/**/*.ts`, `server.ts`, `src/components/**/*.tsx`, `src/db/web.ts`, `src/context/AppContext.tsx`. Out of scope: `src/db/schema.ts`, `queries.ts`, `drizzle-server.ts`, `drizzle-native.ts`, `init.ts` (declarative/glue, exercised indirectly by integration tests), `src/db/native.ts` (Capacitor-only, not exercised by this app's test suite).

## Database Schema

Tables: `sefarim` → `parshiot` → `aliyot` → `readings`. Also: `parsha_pairs`, `occasion_aliyot`, `special_readings`, `weekday_aliyot`, `weekday_readings`. `foreign_keys = OFF` pragma is intentional during migrations (table recreations require it).

## Key Constraints

- **No Prettier** — code uses intentional column alignment that Prettier would destroy. Don't introduce it without explicit discussion.
- When adding a new API endpoint, add the SQL query string to `src/db/queries.ts`, not inline in `server.ts`.
- New shared/pure logic should go in `src/utils/` with a corresponding unit test.

## Primary Concerns

- Ensure all facets of the computations and double-counting are unit-tested and taken care of. Bugs in this part of the code are the most damaging.
- Try and make all code written as readable, reusable and easy to understand as possible.

## Working Efficiently

- Default to handling tasks inline with your own tools. Don't spawn subagents (Explore/Plan/etc.) unless explicitly asked — they start cold, re-derive context you already have, and return verbose reports.
- Never both read files yourself and delegate the same exploration to an agent. Pick one.
- For well-scoped changes to known files, plan inline instead of fanning out. Prefer "propose a plan, don't edit yet" over a heavyweight multi-agent planning pass.
- When you do delegate, cap the agent's output (e.g. "report in under 200 words, no full-file quotes").

## Git Rules

- Use `git stash apply` instead of `git stash pop` — apply preserves the stash so changes can be recovered if something goes wrong. Only drop the stash explicitly once the changes are confirmed safe.
- Before stashing to move work across branches, check divergence first (`git log HEAD..origin/main --oneline`). If the target branch has diverged, prefer `git diff | git apply` or re-apply manually rather than stashing.
