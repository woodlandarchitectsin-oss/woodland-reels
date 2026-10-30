# usage: python3 music.py <seconds> <out.wav> [style]
# Generates an original, royalty-free warm ambient bed (soft pads + gentle piano plucks).
# style: "calm" (default, D major) or "warm" (F major). Deterministic per style.
import sys, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve
DUR = float(sys.argv[1]); OUT = sys.argv[2]; STYLE = sys.argv[3] if len(sys.argv) > 3 else 'calm'
SR = 44100; n = int(DUR * SR) + SR
rng = np.random.default_rng(7 if STYLE == 'calm' else 11)
f = lambda m: 440 * 2 ** ((m - 69) / 12)
root = 62 if STYLE == 'calm' else 65
# I - vi - IV - V(sus) voicings (midi offsets)
prog = [[0, 4, 7, 11, 14], [-3, 0, 4, 7, 12], [-7, -3, 0, 4, 9], [-5, 0, 2, 7, 11]]
bpm = 70; beat = 60 / bpm; bar = beat * 4
L = np.zeros(n); R = np.zeros(n)
t_all = np.arange(n) / SR
def add(sig, start, pan=0.):
    i0 = int(start * SR)
    if i0 >= n: return
    i1 = min(n, i0 + len(sig)); s = sig[:i1 - i0]
    L[i0:i1] += s * (1 - pan) * .5 + s * .5; R[i0:i1] += s * (1 + pan) * .5 + s * .5
k = 0; t0 = 0.
while t0 < DUR + bar:
    ch = prog[k % 4]; dur = bar * 2
    m = int(dur * SR) + int(1.5 * SR); tt = np.arange(m) / SR
    env = np.minimum(1, tt / 1.6) * np.minimum(1, np.maximum(0, (dur + 1.5 - tt) / 1.8))
    pad = np.zeros(m)
    for o in ch:
        fr = f(root - 12 + o)
        for det in (-.12, .12):
            pad += np.sin(2 * np.pi * fr * (1 + det / 100) * tt + rng.random() * 6) * .5
            pad += np.sin(2 * np.pi * 2 * fr * tt) * .06
    pad *= env * (1 + .08 * np.sin(2 * np.pi * .25 * tt)) * .045
    add(pad, t0)
    bass = np.sin(2 * np.pi * f(root - 24 + ch[0]) * tt) * env * .10
    add(bass, t0)
    # gentle piano-like plucks on 8ths, sparse
    for b in range(16):
        if rng.random() < .45: continue
        note = root + 12 + ch[rng.integers(0, len(ch))] - (12 if rng.random() < .3 else 0)
        ln = int(2.2 * SR); tp = np.arange(ln) / SR; fr = f(note)
        pl = (np.sin(2 * np.pi * fr * tp) + .35 * np.sin(4 * np.pi * fr * tp) + .12 * np.sin(6 * np.pi * fr * tp))
        pl *= np.exp(-tp * 2.4) * np.minimum(1, tp / .006) * (.10 + .05 * rng.random())
        add(pl, t0 + b * beat / 2, pan=rng.uniform(-.5, .5))
    t0 += dur; k += 1
st = np.stack([L, R], 1)
sos = butter(4, 3200, 'low', fs=SR, output='sos'); st = sosfilt(sos, st, axis=0)
sos = butter(2, 60, 'high', fs=SR, output='sos'); st = sosfilt(sos, st, axis=0)
ir_t = np.arange(int(2.5 * SR)) / SR
for c in range(2):
    ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 2.2); ir[0] = 0
    st[:, c] = st[:, c] + fftconvolve(st[:, c], ir, mode='full')[:n] * .012
st = st[:int(DUR * SR)]
fade = int(1.5 * SR); st[:fade] *= np.linspace(0, 1, fade)[:, None]; st[-int(2.5 * SR):] *= np.linspace(1, 0, int(2.5 * SR))[:, None]
st /= np.max(np.abs(st)) + 1e-9; st *= .7
sf.write(OUT, st.astype(np.float32), SR)
print(f'music {DUR:.1f}s -> {OUT}')
