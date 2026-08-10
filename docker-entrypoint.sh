#!/bin/sh
set -e
if [ ! -f "$TORAH_DB_PATH" ]; then
  echo "No database found at $TORAH_DB_PATH — it will be created and seeded by migrations."
fi
exec node dist-server/server.js
