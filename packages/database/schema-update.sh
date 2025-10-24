#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCHEMA_FILE="$SCRIPT_DIR/prisma/schema.prisma"

if [ ! -f "$SCHEMA_FILE" ]; then
  echo "File not found: $SCHEMA_FILE" >&2
  exit 1
fi

# Replace only uncommented provider lines set to "sqlite", keep existing spacing.
sed -i.bak -E 's/^([[:space:]]*provider[[:space:]]*=[[:space:]]*)"sqlite"/\1"postgresql"/' "$SCHEMA_FILE"

echo "Updated provider to postgresql in $SCHEMA_FILE (backup at $SCHEMA_FILE.bak)"