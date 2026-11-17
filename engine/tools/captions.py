# Phrase captions from narration.txt + words.json (same word count required). Writes captions.json (+ .srt).
# Usage: python captions.py narration.txt words.json out.json out.srt [highlight words...]
import json, re, sys
txt, wj, oj, osrt, *hl = sys.argv[1:]
lines = [re.sub(r"\s*\{[0-9.]+\}\s*$", "", l.strip()) for l in open(txt) if l.strip()]
toks = [t for l in lines for t in l.split()]
words = json.load(open(wj))["words"]
assert len(toks) == len(words), (len(toks), len(words))
caps = []
def emit(chunk):
    caps.append({"text": " ".join(t for t, _ in chunk), "s": chunk[0][1]["s"], "e": chunk[-1][1]["e"],
                 "hl": [i for i, (t, _) in enumerate(chunk) if re.sub(r"[^\w']", "", t) in hl or t in hl]})
def split(seg):  # balanced split, prefer commas, max 8 words per caption
    if len(seg) <= 8: return [seg]
    commas = [i + 1 for i, (t, _) in enumerate(seg[:-1]) if t[-1] in ",:;" and 3 <= i + 1 <= len(seg) - 3]
    if commas:
        c = min(commas, key=lambda i: abs(i - len(seg) / 2)); return split(seg[:c]) + split(seg[c:])
    STOP = {"a", "an", "the", "in", "of", "to", "for", "with", "her", "his", "he", "she", "make", "was", "and", "at", "who", "it", "that", "so", "if", "made"}
    mid = len(seg) / 2
    cands = [i for i in range(3, len(seg) - 2)]
    STARTS = {"in", "who", "he", "she", "where", "that", "then", "with", "if", "for", "so", "and", "but", "when", "make", "to"}
    w_ = lambda i: re.sub(r"[^\w']", "", seg[i][0]).lower()
    cut = min(cands, key=lambda i: abs(i - mid) + (3 if w_(i - 1) in STOP else 0) - (2.5 if w_(i) in STARTS else 0))
    return split(seg[:cut]) + split(seg[cut:])
sent = []
for t, w in zip(toks, words):
    sent.append((t, w))
    if t[-1] in ".?!": [emit(c) for c in split(sent)]; sent = []
if sent: [emit(c) for c in split(sent)]
# hold each caption until the next one if the gap is short (< 0.45 s) -> no on/off flicker; otherwise +0.25 s tail
for i in range(len(caps) - 1):
    gap = caps[i + 1]["s"] - caps[i]["e"]
    caps[i]["e"] = caps[i + 1]["s"] if gap < 0.45 else caps[i]["e"] + 0.25
caps[-1]["e"] += 0.6
json.dump(caps, open(oj, "w"), indent=0)
ts = lambda s: f"{int(s//3600):02d}:{int(s%3600//60):02d}:{int(s%60):02d},{int(round(s%1*1000)):03d}"
open(osrt, "w").write("\n".join(f"{i+1}\n{ts(c['s'])} --> {ts(c['e'])}\n{c['text']}\n" for i, c in enumerate(caps)))
print(len(caps), "captions; longest:", max(len(c["text"]) for c in caps), "chars")
