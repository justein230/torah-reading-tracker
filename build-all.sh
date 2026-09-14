#!/usr/bin/env bash
set -e

BINARY_DIR="$(dirname "$0")/prebuilt-binaries"
RELEASE_DIR="node_modules/better-sqlite3/build/Release"
BINARY="$RELEASE_DIR/better_sqlite3.node"

usage() {
  echo "Usage: $0 [--collect | --build-all | --build-win | --build-mac | --build-linux]"
  echo ""
  echo "  --collect       Save the current compiled binary as the native-platform prebuild."
  echo "                  Run this on Windows, Mac, and Linux after 'npx electron-rebuild'."
  echo "  --build-win     Build Windows installer using prebuilt binary."
  echo "  --build-mac     Build macOS DMG using prebuilt binary."
  echo "  --build-linux   Rebuild natively and build Linux AppImage."
  echo "  --build-all     Build all three platforms."
  exit 1
}

collect() {
  mkdir -p "$BINARY_DIR"
  case "$(uname -s)" in
    Linux*)   DEST="$BINARY_DIR/better_sqlite3_linux.node" ;;
    Darwin*)  DEST="$BINARY_DIR/better_sqlite3_mac.node" ;;
    MINGW*|CYGWIN*|MSYS*) DEST="$BINARY_DIR/better_sqlite3_win.node" ;;
    *)        echo "Unknown platform: $(uname -s)"; exit 1 ;;
  esac
  cp "$BINARY" "$DEST"
  echo "Saved binary to $DEST"
}

require_binary() {
  local file="$BINARY_DIR/$1"
  if [ ! -f "$file" ]; then
    echo "Missing prebuilt binary: $file"
    echo "Run 'npx electron-rebuild && ./build-all.sh --collect' on the target platform first."
    exit 1
  fi
}

build_win() {
  require_binary "better_sqlite3_win.node"
  echo "==> Building for Windows (via Podman + electronuserland/builder:wine)..."
  cp "$BINARY_DIR/better_sqlite3_win.node" "$BINARY"
  node scripts/build-electron.mjs
  podman run --rm \
    --userns=keep-id \
    -v "$(pwd):/project:z" \
    -w /project \
    electronuserland/builder:wine \
    npx electron-builder --win --config.npmRebuild=false
  echo "==> Windows build complete."
}

build_mac() {
  require_binary "better_sqlite3_mac.node"
  echo "==> Building for macOS..."
  cp "$BINARY_DIR/better_sqlite3_mac.node" "$BINARY"
  node scripts/build-electron.mjs
  npx electron-builder --mac --config.npmRebuild=false
  echo "==> macOS build complete."
}

build_linux() {
  echo "==> Building for Linux (rebuilding native modules)..."
  npx electron-rebuild
  node scripts/build-electron.mjs
  npx electron-builder --linux
  echo "==> Linux build complete."
}

case "$1" in
  --collect)     collect ;;
  --build-win)   build_win ;;
  --build-mac)   build_mac ;;
  --build-linux) build_linux ;;
  --build-all)
    build_win
    build_mac
    build_linux
    ;;
  *) usage ;;
esac
