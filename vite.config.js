import { existsSync, readFileSync } from 'node:fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { nativeLicensesMarkdown } from './scripts/native-licenses-bundle.mjs';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));
// The schema version this build migrates databases to: one step per drizzle journal entry (see
// readMigrationSteps in src/utils/migrationSteps.ts). A running app's db is always at it.
const { entries: migrationEntries } = JSON.parse(readFileSync(new URL('./drizzle/meta/_journal.json', import.meta.url), 'utf-8'));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const DEV_PORT    = Number.parseInt(env.VITE_DEV_PORT || '8000', 10);
  const DEV_HOST    = env.VITE_HOST || '127.0.0.1';
  const API_PORT    = Number.parseInt(env.VITE_API_PORT || '3000', 10);
  const EXTRA_HOSTS = env.VITE_ALLOWED_HOSTS
    ? env.VITE_ALLOWED_HOSTS.split(',').map(h => h.trim()).filter(Boolean)
    : [];

  return {
    plugins: [
      react(),
      {
        // The build writes these into dist/ (scripts/post-build-licenses.mjs); the dev server doesn't
        // serve dist/, so serve them here. The third-party list only exists after a build.
        name: 'dev-license-files',
        apply: 'serve',
        configureServer: (server) => {
          const files = {
            '/LICENSE.txt': 'LICENSE',
            '/THIRD_PARTY_LICENSES.md': 'dist/THIRD_PARTY_LICENSES.md',
          };
          for (const [url, file] of Object.entries(files)) {
            server.middlewares.use(url, (_req, res) => {
              res.setHeader('Content-Type', 'text/plain; charset=utf-8');
              res.end(existsSync(file) ? readFileSync(file, 'utf-8') : `${file} not generated yet. Run "npm run build" first.\n`);
            });
          }
          server.middlewares.use('/THIRD_PARTY_LICENSES_NATIVE.md', (_req, res) => {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end(nativeLicensesMarkdown());
          });
        },
      },
    ],
    define: {
      __APP_VERSION__: JSON.stringify(version),
      __SCHEMA_VERSION__: JSON.stringify(migrationEntries.length),
    },
    test: {
      globals: true,
      // Use the standard forked-process pool, not the VM-based 'vmForks'. Under
      // vmForks each file runs in a separate VM realm whose globals differ from the
      // ones @testing-library/react binds auto-cleanup to, so the jsdom DOM is never
      // cleared between tests (renders pile up → "Found multiple elements") and mock
      // resets misfire. It's timing-sensitive: green locally, 140 failures in CI.
      pool: 'forks',
      // Starting jsdom is a big share of the suite's time, so only the React component/hook
      // tests (.tsx) get it (and the RTL/jest-dom setup); everything else runs in node.
      projects: [
        { extends: true, test: { name: 'dom',  environment: 'jsdom', setupFiles: ['./tests/setup.js'], include: ['tests/**/*.test.tsx'] } },
        // Unit tests share module evaluation per worker (isolate: false); integration tests
        // import server.ts with DB/env state, so they keep a fresh module graph per file.
        { extends: true, test: { name: 'node-unit',        environment: 'node', isolate: false, include: ['tests/unit/**/*.test.{ts,js}'] } },
        { extends: true, test: { name: 'node-integration', environment: 'node',                 include: ['tests/integration/**/*.test.{ts,js}'] } },
      ],
      coverage: {
        provider: 'v8',
        include: ['src/api.ts', 'src/compute.ts', 'src/utils/**/*.ts', 'server.ts', 'src/components/**/*.tsx', 'src/hooks/**/*.{ts,tsx}', 'src/db/web.ts', 'src/context/AppContext.tsx'],
        reporter: ['text', 'lcov'],
      },
    },
    server: {
      port: DEV_PORT,
      host: DEV_HOST,
      proxy: { '/api': `http://localhost:${API_PORT}` },
      allowedHosts: EXTRA_HOSTS,
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'react';
            if (id.includes('node_modules/@mantine')) return 'mantine';
            if (id.includes('node_modules/chart.js')) return 'chartjs';
          },
        },
      },
    },
  };
});
