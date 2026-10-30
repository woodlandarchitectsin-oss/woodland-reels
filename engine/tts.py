# usage: python3 tts.py <workdir>   -> writes narr.wav, voice.m4a, timeline.json
# Reads video.json: voice, speed, scenes[].lines, end_lines, say{display->spoken}
import json, re, sys, os, subprocess, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
from pocketsphinx import Decoder
from scipy.signal import resample_poly
WD = sys.argv[1]; E = os.path.dirname(os.path.abspath(__file__)); M = os.path.expanduser('~/.cache/wlreels')
spec = json.load(open(f'{WD}/video.json'))
k = Kokoro(f'{M}/kokoro.onnx', f'{M}/voices.bin')
VOICE = spec.get('voice', 'am_michael'); SPEED = spec.get('speed', 1.05)
END = spec.get('end_lines', ["This is Woodland Architects, Mangalore.", "Follow for more smart home design."])
SAY = {"Mangalore": "mango lore", "AC": "A C", "3": "three", "2": "two", "4": "four", "5": "five", "10": "ten"}
SAY.update(spec.get('say', {}))  # display token -> words spoken (for alignment)
TTS_FIX = spec.get('tts_fix', {})  # raw text replacements before speech, e.g. {"AC": "A.C."}
DEC = Decoder(samprate=16000)
def norm(w): return re.sub(r"[^a-z']", "", w.lower())
def spoken(tok):
    core = tok.strip('.,:!?')
    ws = SAY[core].split() if core in SAY else [core]
    out = []
    for w in ws:
        n = norm(w)
        out.append(n if n and DEC.lookup_word(n) else 'the')  # unknown word -> placeholder keeps alignment going
    return out
L = [(i, ln) for i, sc in enumerate(spec['scenes']) for ln in sc['lines']] + [(len(spec['scenes']), ln) for ln in END]
SR = 24000; out = [np.zeros(int(.35 * SR))]; t = .35; words = []; bounds = [0]; prev = 0
for sec, line in L:
    if sec != prev: bounds.append(round(t - .2, 3)); prev = sec
    txt = line
    for a, b in TTS_FIX.items(): txt = txt.replace(a, b)
    txt = re.sub(r'\bAC\b', 'A.C.', txt).replace('3-', 'three-')
    a, sr = k.create(txt, voice=VOICE, speed=SPEED, lang='en-us')
    idx = np.where(np.abs(a) > .01)[0]; a = a[max(0, idx[0] - 200):idx[-1] + 800]
    toks = line.replace('-', ' ').split()
    al = [spoken(x) for x in toks]
    flat = [w for ws in al for w in ws]
    d = Decoder(samprate=16000, bestpath=False)
    pcm = (resample_poly(a, 2, 3) * 32767).clip(-32768, 32767).astype(np.int16).tobytes()
    segs = []
    try:
        d.set_align_text(' '.join(flat)); d.start_utt(); d.process_raw(pcm, full_utt=True); d.end_utt()
        segs = [(s.start_frame / 100, s.end_frame / 100) for s in d.seg() if s.word not in ('<sil>', '<s>', '</s>')]
    except Exception as ex: print('align error', ex)
    dur = len(a) / SR
    if len(segs) == len(flat):
        j = 0
        for tok, ws in zip(toks, al):
            words.append([tok, round(t + segs[j][0], 3), round(t + segs[j + len(ws) - 1][1], 3)]); j += len(ws)
    else:  # fallback: spread by character length
        print('ALIGN FALLBACK:', line)
        tot = sum(len(x) + 1 for x in toks); c = 0
        for tok in toks:
            s0 = .05 + (dur - .1) * c / tot; c += len(tok) + 1; words.append([tok, round(t + s0, 3), round(t + .05 + (dur - .1) * c / tot, 3)])
    out.append(a); t += dur
    gap = .28; out.append(np.zeros(int(gap * SR))); t += gap
out.append(np.zeros(int(.6 * SR))); t += .6
bounds.append(round(t, 3))
sf.write(f'{WD}/narr.wav', np.concatenate(out), SR)
json.dump({'words': words, 'bounds': bounds, 'total': t}, open(f'{WD}/timeline.json', 'w'))
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f'{WD}/narr.wav', '-af', 'highpass=f=70,acompressor=threshold=-18dB:ratio=2.5:attack=5:release=100,loudnorm=I=-14:TP=-1.5:LRA=7', '-ar', '48000', '-ac', '2', '-c:a', 'aac', '-b:a', '192k', f'{WD}/voice.m4a'], check=True)
print(f'narration {t:.1f}s, scene bounds {bounds}')
