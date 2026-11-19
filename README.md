# WIP: Next Time (Itachi) render chunks
Finished per-beat picture chunks (beats 1-30 of 33, frames 0-1885). Paused by the user on 19 Nov.
Resume (from the `studio` branch checkout, in `engine/`):
1. Copy these files to `out/itachi/chunks/`.
2. `npx remotion bundle src/index.ts --out-dir ../out/itachi/bundle`
3. `BTL_GL=swangle python3 scripts/render_beats.py ../out/itachi/bundle ItachiNextTime src/episodes/itachi/beats.json ../out/itachi/chunks 2 1886`
   (renders beats 31-33 only; skips finished chunks)
4. Score: `python engine/audio-lib/score_itachi.py audio/voice/itachi-next-time/{voice.wav,words.json,lines.json} out/itachi/audio 2155 engine/src/episodes/itachi/beats.json` (TTS venv)
5. `engine/scripts/finish_episode.sh out/itachi/chunks out/itachi/audio/mix_premaster.wav out/itachi` → QC gate → copy to `videos/between-the-lies/` and push.
