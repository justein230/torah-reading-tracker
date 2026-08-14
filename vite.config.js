import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const DEV_PORT    = Number.parseInt(env.VITE_DEV_PORT || '8000', 10);
  const DEV_HOST    = env.VITE_HOST || '127.0.0.1';
  const API_PORT    = Number.parseInt(env.VITE_API_PORT || '3000', 10);
  const EXTRA_HOSTS = env.VITE_ALLOWED_HOSTS
    ? env.VITE_ALLOWED_HOSTS.split(',').map(h => h.trim()).filter(Boolean)
    : [];

  return {
    plugins: [react()],
    test: {
      globals: true,
      environment: 'jsdom',
      // Use the standard forked-process pool, not the VM-based 'vmForks'. Under
      // vmForks each file runs in a separate VM realm whose globals differ from the
      // ones @testing-library/react binds auto-cleanup to, so the jsdom DOM is never
      // cleared between tests (renders pile up → "Found multiple elements") and mock
      // resets misfire. It's timing-sensitive: green locally, 140 failures in CI.
      pool: 'forks',
      setupFiles: ['./tests/setup.js'],
      coverage: {
        provider: 'v8',
        // 'src/utils.ts' is listed separately: 'src/utils/**/*.ts' matches the directory,
        // not the sibling module of the same name, which left a fully-tested file out of
        // the report (and scored as 0% by Sonar, which analyses it either way).
        include: ['src/api.ts', 'src/compute.ts', 'src/utils.ts', 'src/utils/**/*.ts', 'server.ts', 'src/components/**/*.tsx', 'src/hooks/**/*.tsx', 'src/db/web.ts', 'src/context/AppContext.tsx'],
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
