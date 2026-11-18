#!/bin/bash
# usage: scripts/finish_episode.sh <chunks_dir> <mix_premaster.wav> <out_dir>  → picture.mp4, mix_master.wav, final.mp4
set -e
CH=$1; MIX=$2; OUT=$3
ls "$CH"/c*.mp4 | grep -v tmp | sort | sed "s#^#file '#; s#\$#'#" > "$OUT/concat.txt"
ffmpeg -v error -y -f concat -safe 0 -i "$OUT/concat.txt" -c copy "$OUT/picture.mp4"
J=$(ffmpeg -hide_banner -i "$MIX" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$J" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -v error -y -i "$MIX" -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=48000" -ar 48000 -c:a pcm_s24le "$OUT/mix_master.wav"
ffmpeg -v error -y -i "$OUT/picture.mp4" -i "$OUT/mix_master.wav" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "$OUT/final.mp4"
ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT/final.mp4"
