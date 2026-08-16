# Torah Reading Tracker

A personal tracking app for Torah aliyah readings. Log every aliyah you read, visualize your progress across all five books, and forecast when you'll complete the Torah.

## Features

- **Grid views** — color-coded by book, with partial/scheduled/reread state badges
  - *Shabbat grid* — all 54 parshiot × 8 aliyot (including maftir) at a glance
  - *Holiday grid* — yom tov and special occasion readings, with Shabbat variants
  - *Weekday grid* — Monday/Thursday Torah readings (3 aliyot each)
- **Details view** — per-parsha table with pseukim counts, completion %, partial-reading dot indicators, and last-read date
- **Reading Log** — chronological log grouped by year, with occasion and location
- **Calendar view** — grid and agenda views showing readings by date; iCal subscription feed at `/api/calendar.ics`
- **Overview** — summary stats, per-book progress bars, ring chart, year chart, location stats, and a completion forecast with configurable pace
- **Hosafot** — log supplemental readings that span custom verse ranges outside the standard aliyah slots
- **Manage** — add, edit, and delete readings (write access is IP-restricted and/or login-gated — see [Write-access auth](#write-access-auth))
- **Filters** — filter by book, year, or include scheduled future readings

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Mantine 9, Chart.js, Vite |
| Backend | Node.js, Express, better-sqlite3 |
| Database | SQLite (`torah.db`), managed by Drizzle ORM |
| ORM / migrations | Drizzle ORM + Drizzle Kit |
| Calendar data | Hebcal.com REST API (baked cache) |
| Desktop | Electron |
| Mobile | Capacitor (iOS / Android) |
| Reverse proxy | Caddy (recommended, not bundled in this repo) |

## Project Structure

```
torah/
├── src/
│   ├── components/       # React components (Grid, ReadingLog, Calendar, etc.)
│   │   └── shared/       # Reusable sub-components (ReadingRow, SeferDot, etc.)
│   ├── context/          # AppContext — shared state and data fetching
│   ├── hooks/            # useReadingCrud, useTabIndicator, etc.
│   ├── db/
│   │   ├── schema.ts     # Drizzle schema (tables, views, inferred types)
│   │   ├── drizzle-server.ts  # better-sqlite3 Drizzle instance (server)
│   │   ├── drizzle-native.ts  # Capacitor SQLite Drizzle instance (mobile)
│   │   ├── init.ts       # Runs migrations + seed on startup
│   │   └── queries.ts    # Raw SQL query strings for complex reads
│   ├── utils/            # Utility modules (sedra, sedra-parse, details-utils, ip, etc.)
│   ├── data/            # Baked data (sedraCache.ts — parsha dates, generated)
│   ├── api.ts            # Fetch helpers and row mapper
│   ├── compute.ts        # Pure computation helpers (forecasts, stats)
│   ├── constants.ts      # Shared constants
│   └── global.css        # App-wide styles
├── drizzle/
│   ├── 0000_baseline.sql  # Full schema (tables, views, checks) — squashed from the original migration history
│   ├── 0001_seed.sql      # Static Torah seed (sefarim, parshiot, 378 aliyot, occasions, weekday aliyot, chapter verse counts)
│   └── meta/              # Drizzle Kit snapshot state (do not edit manually)
├── scripts/
│   ├── db-init.ts             # Standalone script to initialize a fresh torah.db
│   ├── db-migrate-user-data.ts  # One-off migration helper for existing reading data
│   ├── gen-sedra-cache.ts     # Regenerates src/data/sedraCache.ts from Hebcal
│   └── seed-verse-ranges.mts  # One-time seed of chapter/verse ranges from Hebcal
├── tests/
│   ├── unit/             # Vitest unit tests
│   └── integration/      # Integration tests
├── electron/
│   └── main.cjs          # Electron main process (CommonJS — stays CJS even with "type":"module")
├── server.ts             # Express API server
├── drizzle.config.ts     # Drizzle Kit configuration
├── schema.sql            # Legacy schema reference (superseded by Drizzle)
├── Dockerfile            # Multi-stage build for the Docker deployment
├── docker-compose.yml    # Local/self-host Compose config (builds the image)
├── torah-api.service     # systemd unit file (bare-Node deployment)
├── build-all.sh          # Cross-platform Electron packaging script (Windows/Mac/Linux, uses prebuilt native binaries)
└── deploy.sh             # Deployment script (Docker by default, or DEPLOY_MODE=systemd)
```

## Database

### Schema

**Static Torah structure:**

- `sefarim` — the five books, with display color and sort order
- `torah_chapters` — verse count per chapter per sefer (used to auto-compute pseukim for hosafot)
- `parshiot` — 54 parshiot with chapter/verse range and sefer FK
- `parsha_pairs` — double-parsha pairings (e.g., Vayakhel-Pekudei)
- `aliyot` — 378 standard aliyot (7 + maftir = 8 per parsha) with chapter/verse range

**Reading logs:**

- `readings` — standard Shabbat aliyah readings; `reading_type` is `standard`, `double_parsha`, or `additional`
- `occasions` — named occasions (yom tov, special Shabbatot, etc.) with category and sort order
- `occasion_aliyot` — aliyot for each occasion, with optional Shabbat variant and `covers_aliyah_id` FK for overlap tracking
- `special_readings` — reading log for occasion-specific aliyot
- `weekday_aliyot` — the three aliyot read on Monday/Thursday for each parsha
- `weekday_readings` — reading log for weekday aliyot
- `hosafot_readings` — supplemental readings spanning a custom verse range (not tied to a standard aliyah slot)

**Views:**

- **`v_aliyot`** — joins `aliyot`, `parshiot`, and `sefarim`; adds a `pct` column (each aliyah's share of total pseukim)
- **`v_readings`** — joins `readings` with `v_aliyot` for fully-denormalized reading rows

TypeScript types for all tables and views are exported from `src/db/schema.ts`.

### Setup (fresh database)

The server runs migrations automatically on startup via `src/db/init.ts`. For a brand-new `torah.db`, run the init script once before starting the server:

```bash
npm run db:init
```

This applies all Drizzle migrations in `drizzle/` — `0000_baseline.sql` creates the schema and `0001_seed.sql` seeds the static Torah data (sefarim, parshiot, and all 378 aliyot) as part of that same migration run. The `TORAH_DB_PATH` environment variable controls which file is created (default: `./torah.db`).

### Migrations

Schema changes are managed with Drizzle Kit. After editing `src/db/schema.ts`:

```bash
# Generate a new migration file from the schema diff
npx drizzle-kit generate

# Apply pending migrations to torah.db
npx drizzle-kit migrate

# Or let the server apply them automatically on next startup
npm run backend
```

Migration files live in `drizzle/`. The `drizzle/meta/` directory contains Drizzle Kit's snapshot state — do not edit it manually. Commit both the generated `.sql` file and the updated `meta/` snapshot together.

## Development

```bash
npm install

# Initialize the database (first time only)
npm run db:init

# Run API + Vite dev server together
npm run concurrent

# Or separately
npm run backend    # Express on :3000
npm run frontend   # Vite on :8000

# Tests
npm test               # run once
npm run test:watch     # watch mode
npm run test:coverage  # with coverage report

# Type check
npm run typecheck
```

## Production Build

```bash
npm run build        # outputs to dist/
npm start            # serves dist/ via Express on :3000
```

## Electron (Desktop)

```bash
npm run electron        # build + launch
npm run electron:dev    # dev mode with hot reload
npm run electron:build  # package as distributable (current platform)
```

To cross-build the Electron app for Windows/Mac/Linux from prebuilt native `better-sqlite3` binaries, use `build-all.sh` (run `bash build-all.sh` with no arguments to see usage):

```bash
bash build-all.sh --collect     # save this platform's compiled binary as a prebuild
bash build-all.sh --build-all   # build all three platforms using the collected prebuilds
```

## Capacitor (Mobile)

```bash
npm run cap:sync    # sync web assets to native projects
npm run cap:ios     # open in Xcode
npm run cap:android # open in Android Studio
```

Each `cap:*` command first runs `cap:db`, which builds a fresh pre-populated
SQLite database from the Drizzle migrations into `public/assets/databases/torah.db`.
Capacitor bundles it into the app and copies it onto the device on first launch
(`copyFromAssets`). The seed DB is generated at build time — never committed —
so it always matches the current schema and reference data.

## Deployment (Docker + reverse proxy)

The recommended production setup runs the app in a Docker container behind a reverse proxy (e.g. Caddy) on the host.

```bash
# Build image and start container
./deploy.sh

# Or manually
docker compose build
docker compose up -d
```

`docker-compose.yml` binds the container only to `127.0.0.1:3000` by default — it is not publicly accessible until a reverse proxy is put in front of it. Any IP-based access restriction (e.g. LAN-only) belongs in that reverse proxy (e.g. Traefik's `ipallowlist` middleware), not in the app. Deployment-specific values (private registry image, host bind-mount path) belong in `docker-compose.override.yml`, which Compose merges automatically — see `docker-compose.override.yml.example`.

## Deployment (bare Node + systemd)

Alternatively, deploy without Docker using the systemd service file:

```bash
DEPLOY_MODE=systemd ./deploy.sh
```

Write access to the API (`POST`/`PUT`/`DELETE` on `/api/readings`) is gated by the app's own auth — see [Write-access auth](#write-access-auth) below. Any IP-based restriction should be enforced by the reverse proxy in front of it.

## Write-access auth

Two mutually exclusive auth modes, picked via `TORAH_AUTH_MODE`:

- **`password`** (default) — the app's own login, and nothing else. Write access is purely "is there a valid session", so there's no ambiguity about whether you're actually logged in. Set `TORAH_ADMIN_PASSWORD` (plaintext) and start the app; it hashes the password into the database on that first start, so the plaintext env var doesn't need to stay set — **remove it once the app is up**. If it's still set on a later start and a hash already exists, the app shows a persistent "insecure config" banner, since a leaked plaintext password is worse than a leaked hash. Log in from the Settings drawer.
- **`header`** — trust a header your reverse proxy sets after doing its *own* auth (e.g. Traefik's `basicAuth` middleware sets `X-Forwarded-User` on success; Authelia, oauth2-proxy, Tailscale Serve, and Cloudflare Access all have equivalents). Set `TORAH_AUTH_MODE=header`, `TORAH_AUTH_HEADER` to the header name, and `TORAH_REQUIRE_PROXY_HEADER=true`.

  This only works if **every** router in front of the app either sets that header (after authenticating) or blanks it — never just passes an unauthenticated client's own header through unchanged, or anyone can grant themselves write access by sending it directly.

  Any IP-based restriction (e.g. LAN-only access to an internal hostname) is the reverse proxy's job, not the app's — e.g. Traefik's `ipallowlist` middleware on the router in front of this service. That keeps IP filtering correct regardless of whether the proxy also forwards a real client-IP header to the app.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port the Express server listens on |
| `TORAH_HOST` | `127.0.0.1` | Interface the Express server binds to |
| `TORAH_DB_PATH` | `./torah.db` | Path to the SQLite database |
| `TORAH_AUTH_MODE` | `password` | `password` (built-in login) or `header` (trust an upstream reverse-proxy auth header). See [Write-access auth](#write-access-auth). |
| `TORAH_ADMIN_PASSWORD` | *(none)* | `password` mode, first start only: plaintext password to hash into the DB. Remove after the app has started once. |
| `TORAH_AUTH_HEADER` | `X-Forwarded-User` | `header` mode: name of the header to trust as proof of auth. |
| `TORAH_REQUIRE_PROXY_HEADER` | `false` in dev, `true` in production | `header` mode: only trust `TORAH_AUTH_HEADER` when set by a proxy, never from a direct client. Required for `header` mode. |
| `VITE_HOST` | `127.0.0.1` | Interface the Vite dev server binds to |
| `VITE_DEV_PORT` | `8000` | Port the Vite dev server listens on |
| `VITE_API_PORT` | `3000` | Express port Vite proxies `/api` to in dev |
| `VITE_ALLOWED_HOSTS` | *(none)* | Comma-separated extra hostnames the Vite dev server accepts. `.env.local` is not gitignored in this repo — use `.env` (which is) for machine-specific values, or export the variable in your shell. |

## Data & Attribution

Weekly Torah portion (parsha) dates and aliyah verse ranges come from the
[Hebcal.com](https://www.hebcal.com) REST API. This data is licensed
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

- Parsha dates are baked into `src/data/sedraCache.ts` (regenerate with `npm run gen:sedra-cache`).
- Aliyah verse ranges are seeded once via `scripts/seed-verse-ranges.mts`.

The project carries no `@hebcal/*` package dependency; it uses only the hosted API.
