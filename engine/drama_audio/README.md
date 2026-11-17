# Drama sound (100 % synthesized, owned by the channel: no licences, no Content ID claims)
| Tool | Does |
|---|---|
| `auto_cue.py lines.json -o cue.json` | builds the music cue sheet from the voice's beats (HOOK→hook, LOVE→tender, CRACK→tension, WOUND→grief, TURN→rise + hit, REVELATION→tension, PAYOFF→resolve + hit, [beat]→silence) |
| `score.py cue.json -o music.wav` | renders the original score: felt piano, string ensemble, low-string pulses, risers, cinematic hits, hall reverb |
| `sfx_drama.py events.json -o sfx.wav` | 16 drama effects (rain, window rain, thunder, heartbeat, clock, breaths, knocks, door, footsteps, city night, ice, glass, paper, candle, whoosh, tinnitus). `--list`, `--demo` |
| `mix_drama.py --voice --music --sfx -o mix.wav` | voice clean-up, ducking under speech (9 dB), lookahead limiter, -14 LUFS / -1.5 dBTP |

Test (Mr. Freeze test script): mix -14.2 LUFS, true peak -1.5 dBTP; whisper understood 204/205 words over the full mix.
