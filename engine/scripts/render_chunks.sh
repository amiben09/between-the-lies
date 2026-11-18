#!/bin/bash
# usage: scripts/render_chunks.sh <Comp> <outdir> <total_frames> [chunk=240] [concurrency=3]  — resumable (skips finished chunks)
COMP=$1; OUT=$2; TOTAL=$3; CH=${4:-240}; CC=${5:-3}
cd "$(dirname "$0")/.."
for ((a=0; a<TOTAL; a+=CH)); do
  b=$((a+CH-1)); [ $b -ge $TOTAL ] && b=$((TOTAL-1))
  f=$(printf "%s/c%05d.mp4" "$OUT" $a)
  [ -s "$f" ] && continue
  t0=$(date +%s)
  for try in 1 2 3; do
  npx remotion render src/index.ts "$COMP" "$f.tmp.mp4" --frames=$a-$b --codec h264 --crf 17 --concurrency $CC --gl=${BTL_GL:-angle} --log=error --timeout=240000 2>&1 | grep -v "^Rendered\|^Stitched\|^Bundling\|^Getting" ; [ -s "$f.tmp.mp4" ] && mv "$f.tmp.mp4" "$f"
  [ -s "$f" ] && break; echo "retry $a try $try"; pkill -f chrome-headless; sleep 2
  done
  echo "chunk $a-$b $(( $(date +%s)-t0 ))s"
done
echo DONE
