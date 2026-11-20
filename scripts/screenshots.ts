/**
 * Captures the store screenshots from a demo database and frames each one with a caption and
 * device mockup: Play Store phone shots (scripts/screenshot-frame.html) or App Store iPhone and
 * iPad shots (scripts/screenshot-frame-ios.html).
 *
 *   npm run db:demo -- showcase && npm run build && npm run screenshots          # Play
 *   npm run screenshots:ios                                                      # App Store
 *   npm run screenshots -- --db demo/torah-demo-complete.db --as-of 2026-11-02
 *
 * Runs the built app (dist/) on its own port against a throwaway copy of the demo db, so neither
 * torah.db nor the demo file is written to, and stops the server when done. Output:
 *   store/screenshots/raw/NN-name.png    the bare 1170×2460 phone capture
 *   store/screenshots/play/NN-name.jpg   the framed 1080×1920 image to upload (JPEG: Play rejects alpha)
 *   store/screenshots/play/feature-graphic.jpg   the 1024×500 feature graphic
 * and with --platform ios (JPEG too, so there is no alpha channel):
 *   store/screenshots/raw/ios-{iphone,ipad}/NN-name.png        the bare captures
 *   store/screenshots/appstore/iphone-6.9/NN-name.jpg          framed 1320×2868
 *   store/screenshots/appstore/ipad-13/NN-name.jpg             framed 2048×2732
 */
import fs   from 'node:fs';
import os   from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import Database from 'better-sqlite3';
import { chromium, type Browser, type Locator, type Page } from 'playwright';
import { hashPassword, generateBootstrapPassword } from '../src/utils/auth.js';
import { localDateStr } from '../src/utils/dates.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const { values } = parseArgs({
  options: {
    db:      { type: 'string', default: 'demo/torah-demo-showcase.db' },
    'as-of': { type: 'string' },
    port:    { type: 'string', default: '3100' },
    only:    { type: 'string' },   // comma-separated shot names, to iterate on a few
    platform: { type: 'string', default: 'play' },   // play | ios
  },
});
if (values.platform !== 'play' && values.platform !== 'ios') throw new Error('--platform must be play or ios');
const AS_OF   = values['as-of'] ?? localDateStr();
const BASE    = `http://127.0.0.1:${values.port}`;
const SHOTS_DIR = path.join(ROOT, 'store/screenshots');

/** One set of images: a device size to capture at and the frame it is placed in. */
interface Target {
  viewport:  { width: number; height: number };
  scale:     number;
  template:  string;                          // in scripts/
  canvas:    { width: number; height: number };
  device?:   'iphone' | 'ipad';               // the iOS frame's {{device}} slot
  rawDir:    string;
  outDir:    string;
  featureGraphic: boolean;
}

// The app's phone layout (bottom nav, agenda calendar, tap tooltips) needs a touch device.
// Each viewport plus the frame's status bar is the device's full screen:
//   play    820 + 40 → a 390×860 phone
//   iphone  878 + 54 → a 430×932 phone (6.9" iPhone, 1320×2868 at 3×)
//   ipad   1069 + 24 → an 820×1093 tablet (10.9" iPad Air width, which is ≥768px: the tab bar replaces the bottom nav)
const TARGETS: Target[] = values.platform === 'play'
  ? [{
      viewport: { width: 390, height: 820 }, scale: 3, template: 'screenshot-frame.html', canvas: { width: 1080, height: 1920 },
      rawDir: path.join(SHOTS_DIR, 'raw'), outDir: path.join(SHOTS_DIR, 'play'), featureGraphic: true,
    }]
  : [{
      viewport: { width: 430, height: 878 }, scale: 3, template: 'screenshot-frame-ios.html', canvas: { width: 1320, height: 2868 }, device: 'iphone',
      rawDir: path.join(SHOTS_DIR, 'raw/ios-iphone'), outDir: path.join(SHOTS_DIR, 'appstore/iphone-6.9'), featureGraphic: false,
    }, {
      viewport: { width: 820, height: 1069 }, scale: 2, template: 'screenshot-frame-ios.html', canvas: { width: 2048, height: 2732 }, device: 'ipad',
      rawDir: path.join(SHOTS_DIR, 'raw/ios-ipad'), outDir: path.join(SHOTS_DIR, 'appstore/ipad-13'), featureGraphic: false,
    }];

interface Shot {
  name:    string;
  caption: string;
  /** Leaves the page showing this shot. Runs in order on one page, so app state carries over. */
  show:    (page: Page) => Promise<void>;
}

const TABLET_MIN_WIDTH = 768;   // where the app swaps its bottom nav for the header's tab bar (global.css)

/** Opens a tab from the bottom nav on a phone, or the header's tab bar on a tablet. */
const tab = (label: string) => async (page: Page) => {
  // The bottom nav stays in the DOM on a tablet (collapsed to zero height), so go by width: 768px is its breakpoint.
  const phone = page.viewportSize()!.width < TABLET_MIN_WIDTH;
  await (phone ? page.locator('.bottom-nav-item', { hasText: label }) : page.getByRole('tab', { name: label })).click();
  await settle(page);
};

/** Scrolls the app's main pane so `target` sits just under the fixed header. */
async function scrollUnderHeader(page: Page, target: Locator): Promise<void> {
  const top = await target.evaluate(el => el.getBoundingClientRect().top);
  const headerBottom = await page.locator('.app-header').evaluate(el => el.getBoundingClientRect().bottom);
  await page.locator('.mantine-AppShell-main').evaluate((el, by) => el.scrollBy({ top: by }), top - headerBottom - 12);
  await page.waitForTimeout(300);
}

const SHOTS: Shot[] = [
  {
    name: 'overview', caption: 'See how much of the Torah you’ve read',
    show: settle,
  },
  {
    name: 'grid', caption: 'Find the aliyot you haven’t read yet',
    show: tab('Grids'),
  },
  {
    name: 'log', caption: 'Keep track of past and upcoming readings',
    show: tab('Reading Log'),
  },
  {
    name: 'details', caption: 'Detailed statistics for every parsha',
    show: async page => {
      await tab('Details')(page);
      await page.getByRole('button', { name: 'Most Complete' }).click();
      await settle(page);
    },
  },
  {
    name: 'calendar', caption: 'Browse your readings by date',
    show: async page => {
      // The agenda opens on January; start two reading months before this one instead (months
      // without readings have no label), with the first upcoming day open.
      await tab('Calendar')(page);
      if (await page.locator('.cal-agenda-future-badge').count() === 0) return;   // tablets open the month grid instead, which needs no scrolling
      await page.locator('.collapsible-summary', { has: page.locator('.cal-agenda-future-badge') }).first().click();
      const labels = page.locator('.cal-agenda-month-label');
      const months = (await labels.allTextContents()).map(t => localDateStr(new Date(`1 ${t}`)).slice(0, 7));
      const past   = months.filter(m => m < AS_OF.slice(0, 7)).length;
      const start  = Math.max(0, past - 2);
      await scrollUnderHeader(page, labels.nth(start));
    },
  },
  {
    name: 'add', caption: 'Log a reading in a few taps',
    show: async page => {
      await tab('Reading Log')(page);
      await page.locator('.collapsible-summary', { hasText: 'Add a Reading' }).click();
      await page.getByPlaceholder('Select parsha…').click();
      await page.locator('.parsha-picker-row', { hasText: 'Vayishlach' }).click();
      await page.getByPlaceholder('Select aliyah…').click();
      for (const n of [4, 5]) await page.getByRole('option', { name: new RegExp(`^Aliyah ${n}`) }).click();
      await page.keyboard.press('Escape');
      await page.getByPlaceholder('e.g. Home, Shul').fill('Beth Shalom');
      await page.getByPlaceholder('e.g. Home, Shul').blur();
      await settle(page);
      await scrollUnderHeader(page, page.getByText('Reading Type'));
    },
  },
];

// ── server ───────────────────────────────────────────────────────────────────

/** Copies the demo db and gives the copy a known admin password, so the script can log in. */
function prepareDb(source: string): { dir: string; dbPath: string; password: string } {
  if (!fs.existsSync(source)) throw new Error(`${source} not found; run npm run db:demo first`);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'torah-screenshots-'));
  const dbPath = path.join(dir, 'torah.db');
  fs.copyFileSync(source, dbPath);
  const password = generateBootstrapPassword();
  const raw = new Database(dbPath);
  raw.prepare('INSERT OR REPLACE INTO admin_password (id, password_hash) VALUES (1, ?)').run(hashPassword(password));
  raw.close();
  return { dir, dbPath, password };
}

async function startServer(dbPath: string) {
  if (!fs.existsSync(path.join(ROOT, 'dist/index.html'))) throw new Error('dist/ not found; run npm run build first');
  // SERVICE_MODE=prod skips .env, whose TORAH_ADMIN_PASSWORD would show the insecure-config banner.
  const server = spawn(process.execPath, ['--import', 'tsx', 'server.ts'], {
    cwd: ROOT,
    env: { ...process.env, SERVICE_MODE: 'prod', PORT: values.port, TORAH_DB_PATH: dbPath, TORAH_HOST: '127.0.0.1' },
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null) throw new Error(`server exited with code ${server.exitCode}`);
    const up = await fetch(`${BASE}/api/meta`).then(r => r.ok, () => false);
    if (up) return server;
    await new Promise(r => setTimeout(r, 200));
  }
  server.kill();
  throw new Error('server did not start');
}

// ── browser ──────────────────────────────────────────────────────────────────

/** Playwright's own Chromium if it's installed, else the system Chrome. */
async function launchBrowser(): Promise<Browser> {
  try {
    return await chromium.launch();
  } catch {
    return chromium.launch({ channel: 'chrome' });
  }
}

/** Waits for data, fonts, and the ring/chart entry animations. */
async function settle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
}

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const dataUri    = (file: string, type: string) => `data:${type};base64,${fs.readFileSync(file).toString('base64')}`;
const font       = (file: string) => dataUri(path.join(ROOT, 'node_modules/@fontsource', file), 'font/woff2');
const FONTS = {
  font600:    font('inter/files/inter-latin-600-normal.woff2'),
  font800:    font('inter/files/inter-latin-800-normal.woff2'),
  fontHebrew: font('noto-sans-hebrew/files/noto-sans-hebrew-hebrew-700-normal.woff2'),
};

/** Fills a template's {{slots}} and saves it as a JPEG (Play and the App Store reject images with an alpha channel). */
async function render(browser: Browser, template: string, size: { width: number; height: number }, slots: Record<string, string>, outJpg: string): Promise<void> {
  const html = Object.entries({ ...FONTS, ...slots })
    .reduce((h, [slot, value]) => h.replaceAll(`{{${slot}}}`, value), fs.readFileSync(path.join(ROOT, 'scripts', template), 'utf8'));
  const page = await browser.newPage({ viewport: size });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: outJpg, type: 'jpeg', quality: 92 });
  await page.close();
}

// ── main ─────────────────────────────────────────────────────────────────────

const only  = values.only?.split(',');
const shots = SHOTS.map((s, i) => ({ ...s, file: `${String(i + 1).padStart(2, '0')}-${s.name}` }))
  .filter(s => !only || only.includes(s.name));

const { dir, dbPath, password } = prepareDb(path.resolve(ROOT, values.db));
const server  = await startServer(dbPath);
const browser = await launchBrowser();
try {
  for (const target of TARGETS) {
    fs.mkdirSync(target.rawDir, { recursive: true });
    fs.mkdirSync(target.outDir, { recursive: true });

    const context = await browser.newContext({ viewport: target.viewport, deviceScaleFactor: target.scale, isMobile: true, hasTouch: true, locale: 'en-US', colorScheme: 'dark' });
    const page = await context.newPage();
    await page.clock.setFixedTime(new Date(`${AS_OF}T10:00:00`));
    await page.goto(BASE);
    await settle(page);

    for (const shot of shots) {
      // The add-reading form only renders once logged in; log in just for it, so every other
      // shot stays free of the edit/delete icons.
      if (shot.name === 'add') {
        const res = await page.request.post(`${BASE}/api/auth/login`, { data: { password } });
        if (!res.ok()) throw new Error(`login failed: ${res.status()}`);
        await page.reload();
        await settle(page);
      }
      await shot.show(page);
      const raw = path.join(target.rawDir, `${shot.file}.png`);
      await page.screenshot({ path: raw });
      await render(browser, target.template, target.canvas,
        { caption: escapeHtml(shot.caption), shot: dataUri(raw, 'image/png'), device: target.device ?? '' }, path.join(target.outDir, `${shot.file}.jpg`));
      console.log(`${path.basename(target.outDir)}/${shot.file}  “${shot.caption}”`);
    }
    await context.close();

    if (target.featureGraphic && shots.some(s => s.name === 'overview')) {
      await render(browser, 'feature-graphic.html', { width: 1024, height: 500 }, { shot: dataUri(path.join(target.rawDir, '01-overview.png'), 'image/png') }, path.join(target.outDir, 'feature-graphic.jpg'));
      console.log('feature-graphic');
    }
  }
} finally {
  await browser.close();
  server.kill();
  fs.rmSync(dir, { recursive: true, force: true });
}
console.log(`→ ${path.relative(ROOT, SHOTS_DIR)}/`);
