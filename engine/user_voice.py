# usage: python3 user_voice.py <workdir> <audiofile>
# Woodland's own recorded narration -> clean, tight voice.m4a + caption timeline.json
# 1. speech recognition hears what was actually said (asr.py)
# 2. matched to the script in video.json; extra words (repeats, false starts) are cut, keeping the LAST take
# 3. everything that isn't recognised speech (ums, breaths, noise, dead air) is cut; pauses capped
# 4. noise removal + anti-muffle clarity EQ + compression + loudness
# 5. captions force-aligned to the cleaned audio
import json, re, sys, os, subprocess, difflib, numpy as np, soundfile as sf
from pocketsphinx import Decoder
E = os.path.dirname(os.path.abspath(__file__)); M = os.path.expanduser('~/.cache/wlreels')
WD, SRC = sys.argv[1], sys.argv[2]
spec = json.load(open(f'{WD}/video.json'))
END = spec.get('end_lines', ["This is Woodland Architects, Mangalore.", "Follow for more smart home design."])
SAY = {"3": "three", "2": "two", "4": "four", "5": "five", "10": "ten"}; SAY.update(spec.get('say', {}))
L = [(i, ln) for i, sc in enumerate(spec['scenes']) for ln in sc['lines']] + [(len(spec['scenes']), ln) for ln in END]
toks, sec_of = [], []
for s, ln in L:
    for x in ln.replace('-', ' ').split(): toks.append(x); sec_of.append(s)
norm = lambda w: re.sub(r"[^a-z']", "", w.lower())

# ---- 1. what was actually said
asr = json.loads(subprocess.run(['python3', f'{E}/asr.py', SRC], capture_output=True, text=True, check=True).stdout)
for i in range(len(asr) - 1): asr[i][2] = min(asr[i + 1][1], max(asr[i][2], asr[i][1] + .12) + .25)  # word ends
if len(asr) > 1 and asr[1][1] - asr[0][1] > 1: asr[0][1] = asr[1][1] - .4                    # first-token timestamp fix
asr[-1][2] = asr[-1][1] + .6

SCR = {norm(t) for t in toks}
k = 0
while k < len(asr) - 1:
    j = norm(asr[k][0]) + norm(asr[k + 1][0])
    if j in SCR and norm(asr[k][0]) not in SCR | {'a'}: asr[k] = [j, asr[k][1], asr[k + 1][2]]; del asr[k + 1]
    elif j in SCR and norm(asr[k + 1][0]) not in SCR: asr[k] = [j, asr[k][1], asr[k + 1][2]]; del asr[k + 1]
    else: k += 1
# ---- 2. word-by-word alignment to the script (DP), preferring the LAST take of anything repeated
def sim(x, y): return 1 if x == y else difflib.SequenceMatcher(None, x, y).ratio()
A = [norm(w[0]) for w in asr][::-1]; S = [norm(t) for t in toks][::-1]   # reversed => later takes win ties
n, m = len(A), len(S); INS, DEL = 1.0, 1.0
cost = np.zeros((n + 1, m + 1)); cost[:, 0] = np.arange(n + 1) * INS; cost[0, :] = np.arange(m + 1) * DEL
bt = np.zeros((n + 1, m + 1), np.int8)
for i in range(1, n + 1):
    for j in range(1, m + 1):
        sm = sim(A[i - 1], S[j - 1]); sub = cost[i - 1, j - 1] + (0 if sm == 1 else (0.6 if sm > .5 else 1.6))
        ins = cost[i - 1, j] + INS; de = cost[i, j - 1] + DEL
        cost[i, j], bt[i, j] = min((sub, 0), (ins, 1), (de, 2))
i, j, keep_idx = n, m, set()
while i > 0 and j > 0:
    if bt[i, j] == 0: keep_idx.add(n - i); i -= 1; j -= 1
    elif bt[i, j] == 1: i -= 1
    else: j -= 1
FILL = {'um', 'umm', 'uh', 'uhh', 'ah', 'aah', 'er', 'erm', 'hmm', 'mm', 'eh', 'ehm'}
first, last = min(keep_idx), max(keep_idx)
for i in range(len(asr)):
    if i in keep_idx or i < first or i > last: continue
    w = norm(asr[i][0]); nxt = [norm(asr[k][0]) for k in range(i + 1, min(len(asr), i + 6))]
    prv = [norm(asr[k][0]) for k in range(max(0, i - 4), i)]
    if len(w) <= 2: nxt, prv = nxt[:1], prv[-1:]       # short words: only an immediate repeat counts
    if w in FILL or w in nxt or w in prv: continue   # filler or repeated take -> cut
    keep_idx.add(i)                              # a natural extra word -> keep the audio
dropped = [asr[i][0] for i in range(len(asr)) if i not in keep_idx]

# ---- 3. build keep spans from kept words only
PRE, POST, MAXP = .08, .12, float(spec.get('keep_pause', .35))
spans = []
for i in sorted(keep_idx):
    s0, s1 = max(0, asr[i][1] - PRE), asr[i][2] + POST
    if spans and s0 - spans[-1][1] < .25 and (i - 1) in keep_idx: spans[-1][1] = s1
    else: spans.append([s0, s1])
# ---- 4. clean audio (full file), then splice
rn = f"arnndn=m={M}/bd.rnnn:mix=0.45," if os.path.exists(f'{M}/bd.rnnn') else ''
eq = spec.get('voice_eq', 'equalizer=f=220:t=o:w=1:g=-4,equalizer=f=450:t=o:w=1.2:g=-7,equalizer=f=800:t=o:w=1:g=-3,equalizer=f=2800:t=o:w=1:g=4,equalizer=f=4500:t=o:w=1:g=7,treble=g=6:f=7500,deesser=i=0.5')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', SRC, '-af', f'highpass=f=100,{rn}afftdn=nf=-42:nr=10,{eq}', '-ac', '1', '-ar', '48000', f'{WD}/clean.wav'], check=True)
a, sr = sf.read(f'{WD}/clean.wav'); xf = int(.012 * sr); parts = []
for k, (s0, s1) in enumerate(spans):
    seg = a[int(s0 * sr):int(min(s1, len(a) / sr) * sr)].copy()
    if len(seg) < 4 * xf: continue
    seg[:xf] *= np.linspace(0, 1, xf); seg[-xf:] *= np.linspace(1, 0, xf)
    parts.append(seg)
    if k < len(spans) - 1:
        gap = spans[k + 1][0] - s1
        parts.append(np.zeros(int(min(MAXP, max(.12, gap)) * sr)))
tight = np.concatenate([np.zeros(int(.2 * sr))] + parts + [np.zeros(int(.3 * sr))])
sf.write(f'{WD}/tight.wav', tight, sr)

# ---- 5. align captions to the cleaned audio
D0 = Decoder(samprate=16000)
def spoken(tok):
    core = tok.strip('.,:!?'); ws = SAY[core].split() if core in SAY else [core]
    return [norm(w) if norm(w) and D0.lookup_word(norm(w)) else 'the' for w in ws]
al = [spoken(t) for t in toks]; flat = [w for ws in al for w in ws]
pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', f'{WD}/tight.wav', '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True, check=True).stdout
d = Decoder(samprate=16000, bestpath=False); d.set_align_text(' '.join(flat)); d.start_utt(); d.process_raw(pcm, full_utt=True); d.end_utt()
segs = [(s.start_frame / 100, s.end_frame / 100) for s in d.seg() if s.word not in ('<sil>', '<s>', '</s>')]
if len(segs) != len(flat): sys.exit(f'ALIGN FAILED after cleanup: {len(segs)} of {len(flat)} words. Dropped: {dropped}')
words, j = [], 0
for tok, ws in zip(toks, al): words.append([tok, round(segs[j][0], 3), round(segs[j + len(ws) - 1][1], 3)]); j += len(ws)
bounds = [0]
for i in range(1, len(words)):
    if sec_of[i] != sec_of[i - 1]: bounds.append(round(words[i][1] - .2, 3))
total = round(len(tight) / sr, 3); bounds.append(total)
json.dump({'words': words, 'bounds': bounds, 'total': total, 'heard': ' '.join(w[0] for w in asr), 'cut_words': dropped}, open(f'{WD}/timeline.json', 'w'))
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f'{WD}/tight.wav', '-af',
  'acompressor=threshold=-20dB:ratio=2.5:attack=5:release=120,loudnorm=I=-14:TP=-1.5:LRA=7',
  '-ar', '48000', '-ac', '2', '-c:a', 'aac', '-b:a', '192k', f'{WD}/voice.m4a'], check=True)
print(f'raw {len(a)/sr:.1f}s -> clean {total:.1f}s | cut words: {dropped} | scene bounds {bounds}')
