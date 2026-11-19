# Torah Reading Tracker


A personal tracking app for Torah aliyah readings. Log every aliyah you read, visualize your progress across all five books, and forecast when you'll complete the Torah.

<a href="https://play.google.com/store/apps/details?id=com.justein.torahtracker">
  <img alt="Get it on Google Play" height="60" src="./assets/GetItOnGooglePlay_Badge_Web_color_English.svg" />
</a>

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
│   ├── gen-sedra-cache.ts     # Regenerates src/data/sedraCache.ts from Hebcal
│   └── seed-verse-ranges.mts  # One-time seed of chapter/verse ranges from Hebcal
├── tests/
│   ├── unit/             # Vitest unit tests
│   └── integration/      # Integration tests
├── electron/
│   └── main.cjs          # Electron main process (CommonJS — stays CJS even with "type":"module")
├── server.ts             # Express API server
├── drizzle.config.ts     # Drizzle Kit configuration
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

## Documentation

Deployment, configuration and backup guides are on the docs site: <https://justein230.github.io/torah-reading-tracker/>. Its source is in `site/` (Docusaurus); preview it with `npm --prefix site install` then `npm run docs:dev`, and build it with `npm run docs:build`.

## Development environment variables

These only affect the dev servers. Production settings (`PORT`, `TORAH_*`, auth) are on the [docs site](https://justein230.github.io/torah-reading-tracker/deploy/configuration).

| Variable | Default | Description |
|---|---|---|
| `VITE_HOST` | `127.0.0.1` | Interface the Vite dev server binds to |
| `VITE_DEV_PORT` | `8000` | Port the Vite dev server listens on |
| `VITE_API_PORT` | `3000` | Express port Vite proxies `/api` to in dev |
| `VITE_ALLOWED_HOSTS` | *(none)* | Comma-separated extra hostnames the Vite dev server accepts. `.env.local` is not gitignored in this repo — use `.env` (which is) for machine-specific values, or export the variable in your shell. |

## Data & Attribution

Weekly Torah portion (parsha) dates, holiday dates and aliyah verse ranges are adapted from the
[Hebcal.com](https://www.hebcal.com) REST API (combined parshiot are split and entries re-keyed). This data is
licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The credit appears in the app on the Overview
tab and in the About dialog.

- Parsha dates are baked into `src/data/sedraCache.ts` (regenerate with `npm run gen:sedra-cache`).
- Holiday dates are baked into `src/data/holidayCache.ts` (regenerate with `npm run gen:holiday-cache`).
- Aliyah verse ranges are seeded once via `scripts/seed-verse-ranges.mts`.

The project carries no `@hebcal/*` package dependency; it uses only the hosted API.

## License

Torah Tracker is released under the [MIT License](LICENSE). The licenses of the third-party packages and native
libraries it includes are shown in the app under About (the "i" icon) → Licenses; see
[docs/LICENSES.md](docs/LICENSES.md) for how they are produced.

*Google Play and the Google Play logo are trademarks of Google LLC.*
