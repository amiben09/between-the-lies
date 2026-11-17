#!/usr/bin/env bash
# Create a new BETWEEN THE LIES episode folder from the templates.
# Usage: tools/new_episode.sh <slug> [episodes_dir]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SLUG="${1:-}"
DEST_ROOT="${2:-$ROOT/episodes}"

if [[ -z "$SLUG" ]]; then
  echo "usage: $0 <slug> [episodes_dir]" >&2; exit 2
fi
if [[ ! "$SLUG" =~ ^[a-z0-9][a-z0-9-]{1,60}$ ]]; then
  echo "error: slug must be lowercase letters, digits and dashes (2-61 chars): '$SLUG'" >&2; exit 2
fi
DEST="$DEST_ROOT/$SLUG"
if [[ -e "$DEST" ]]; then
  echo "error: $DEST already exists (not overwriting)" >&2; exit 1
fi

mkdir -p "$DEST"/{05_voice,08_qc,09_render}
for f in 00_brief 01_dossier 02_timeline 03_relationships 04_script 06_cast 07_shotplan; do
  cp "$ROOT/templates/$f.md" "$DEST/$f.md"
done
cp "$ROOT/templates/08_qc_report.md" "$DEST/08_qc/QC_REPORT.md"
sed -i "s/<EPISODE TITLE>/$SLUG/; s/<SUBJECT>/$SLUG/; s/<TITLE>/$SLUG/" "$DEST"/*.md "$DEST/08_qc/QC_REPORT.md"
echo "created $DEST"
find "$DEST" -maxdepth 2 | sort | sed "s|$DEST_ROOT/||"
