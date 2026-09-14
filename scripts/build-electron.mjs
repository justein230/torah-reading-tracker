// Builds the frontend and compiles server.ts -> dist-server/server.js for Electron packaging.
// A plain Node script (not a shell script) so it runs the same way on Windows, macOS and Linux.
//
// electron-rebuild is intentionally NOT run here: build-all.sh's Windows/Mac builds swap in
// a prebuilt native binary and would have it clobbered by a rebuild for the host platform.
import { execSync } from 'node:child_process';

execSync('npm run build', { stdio: 'inherit' });
execSync('npx tsc -p tsconfig.server.json', { stdio: 'inherit' });
