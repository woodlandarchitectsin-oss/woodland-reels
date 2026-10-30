# usage: python3 asr.py <audio> -> prints JSON [[word, start, end], ...] of what was actually spoken
import sys, json, os, subprocess, numpy as np, sherpa_onnx
M = os.path.expanduser('~/.cache/wlreels/sherpa-onnx-zipformer-en-2023-06-26')
rec = sherpa_onnx.OfflineRecognizer.from_transducer(encoder=f'{M}/encoder-epoch-99-avg-1.int8.onnx', decoder=f'{M}/decoder-epoch-99-avg-1.onnx',
    joiner=f'{M}/joiner-epoch-99-avg-1.int8.onnx', tokens=f'{M}/tokens.txt', num_threads=2, decoding_method='modified_beam_search')
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', sys.argv[1], '-af', 'highpass=f=80', '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
a = np.frombuffer(raw, np.float32); SR = 16000; words = []
CH = len(a) + 1 if len(a) <= 100 * SR else 30 * SR  # one pass for normal reels
for off in range(0, len(a), CH - 2 * SR):  # 20 s chunks, 2 s overlap
    s = rec.create_stream(); s.accept_waveform(SR, a[off:off + CH]); rec.decode_stream(s); r = s.result
    cur = None
    for tok, ts in zip(r.tokens, r.timestamps):
        t = off / SR + ts
        if tok.startswith(('▁', ' ')) or cur is None:
            if cur: words.append(cur)
            cur = [tok.lstrip('▁ ').lower(), t, t + .1]
        else: cur[0] += tok.lower(); cur[2] = t + .1
    if cur: words.append(cur)
# drop duplicates from chunk overlap
out = []
for w in sorted(words, key=lambda x: x[1]):
    if out and w[1] < out[-1][2] - .05 and w[0] == out[-1][0]: continue
    if out and w[1] < out[-1][1] + .05: continue
    out.append([w[0], round(w[1], 2), round(w[2], 2)])
print(json.dumps(out))
