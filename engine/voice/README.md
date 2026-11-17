# Narrator voice (free, owned)
Kokoro-82M (Apache-2.0): free for commercial use, runs on CPU. Stock voices only. Never clone or imitate a real narrator.

## Setup (once)
```bash
uv venv /root/.cache/btl-tts --python 3.12
uv pip install --python /root/.cache/btl-tts/bin/python kokoro soundfile scipy torch \
  --index-url https://download.pytorch.org/whl/cpu --extra-index-url https://pypi.org/simple
uv pip install --python /root/.cache/btl-tts/bin/python \
  "en_core_web_sm @ https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl"
apt-get install -y espeak-ng
# word timings: whisper.cpp `whisper-cli` + a ggml model (e.g. ggml-base.bin)
```

## Use
```bash
VIRTUAL_ENV=/root/.cache/btl-tts /root/.cache/btl-tts/bin/python engine/voice/tts.py episodes/<slug>/04_script.md \
  -o episodes/<slug>/05_voice --voice am_michael --speed 0.95
```
Writes `voice.wav` (48 kHz/24-bit), `words.json` (script spelling + punctuation, whisper times, `accent` for *starred* words)
and `lines.json` (per-line spans with beats, used by `engine/drama_audio/auto_cue.py`).

Voices that tested 100 % intelligible: `am_michael` (default, warm), `am_onyx` (deep), `am_fenrir` (younger), `bm_george` (British).
Test result on the Mr. Freeze test script: 66.3 s, 3.09 words/s, 205/205 words timed by whisper.
