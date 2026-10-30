#!/usr/bin/env bash
# Woodland Reels builder.
#   ./build.sh setup                      install deps + narrator model (once per machine)
#   ./build.sh voice   <workdir>          narration + caption timing (timeline.json)
#   ./build.sh myvoice <workdir> <file>   use your own recording instead of the AI voice
#   ./build.sh preview <workdir> [times]  still frames -> <workdir>/preview/contact.jpg
#   ./build.sh render  <workdir>          full video -> <workdir>/<name>.mp4 (adds music bed, see mix.sh)
#   ./build.sh remix   <workdir>          re-mix music only onto an already rendered video
set -euo pipefail
E="$(cd "$(dirname "$0")" && pwd)"; M=~/.cache/wlreels
case "$1" in
setup)
  pip install --break-system-packages -q kokoro-onnx soundfile scipy pocketsphinx 2>&1 | grep -v -i warning || true
  (cd "$E" && [ -d node_modules/@fontsource/jost ] || npm i -s @fontsource/cormorant-garamond @fontsource/jost >/dev/null)
  mkdir -p $M
  [ -s $M/kokoro.onnx ] || curl -sSL -o $M/kokoro.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
  [ -s $M/voices.bin ] || curl -sSL -o $M/voices.bin https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
  pip install --break-system-packages -q sherpa-onnx 2>&1 | grep -v -i warning || true
  [ -d $M/sherpa-onnx-zipformer-en-2023-06-26 ] || (curl -sSL https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-zipformer-en-2023-06-26.tar.bz2 | tar xj -C $M)
  [ -s $M/bd.rnnn ] || curl -sSL -o $M/bd.rnnn https://raw.githubusercontent.com/GregorR/rnnoise-models/master/beguiling-drafter-2018-08-30/bd.rnnn
  cat "$E/_helpers.js" "$E/_endcard.js" "$E/_frame.js" > "$E/engine.js"
  echo "setup ok" ;;
voice) python3 "$E/tts.py" "$2" ;;
myvoice) python3 "$E/user_voice.py" "$2" "$3" ;;   # ./build.sh myvoice <workdir> <recording>
preview)
  WD="$2"; T="${3:-}"
  if [ -z "$T" ]; then T=$(python3 -c "import json;b=json.load(open('$WD/timeline.json'))['bounds'];print(','.join(f'{(b[i]+b[i+1])/2+.8:.1f}' for i in range(len(b)-1)))"); fi
  node "$E/render.js" "$WD" preview "$T"
  ins=""; n=0; for t in ${T//,/ }; do ins="$ins -i $WD/preview/f_$t.jpg"; n=$((n+1)); done
  ffmpeg -v error -y $ins -filter_complex "hstack=inputs=$n,scale=$((n*360)):-1" "$WD/preview/contact.jpg"
  echo "$WD/preview/contact.jpg" ;;
render)
  WD="$2"; NAME=$(python3 -c "import json;print(json.load(open('$WD/video.json')).get('file','WL_Reel'))")
  N=$(python3 -c "import json;print(len(json.load(open('$WD/timeline.json'))['bounds'])-1)")
  rm -f "$WD"/parts/scene*.mp4
  for i in $(seq 0 $((N-1))); do node "$E/render.js" "$WD" scene $i & done; wait
  : > "$WD/parts/list.txt"; for i in $(seq 0 $((N-1))); do [ -s "$WD/parts/scene$i.mp4" ] || { echo "scene $i failed"; exit 1; }; echo "file scene$i.mp4" >> "$WD/parts/list.txt"; done
  ffmpeg -v error -y -f concat -i "$WD/parts/list.txt" -c copy "$WD/parts/v.mp4"
  "$E/mix.sh" "$WD"
  ffmpeg -v error -y -i "$WD/parts/v.mp4" -i "$WD/voice_mix.m4a" -map 0:v -map 1:a -c copy -shortest -movflags +faststart "$WD/$NAME.mp4"
  echo "$WD/$NAME.mp4" ;;
remix)
  WD="$2"; NAME=$(python3 -c "import json;print(json.load(open('$WD/video.json')).get('file','WL_Reel'))")
  "$E/mix.sh" "$WD"
  ffmpeg -v error -y -i "$WD/parts/v.mp4" -i "$WD/voice_mix.m4a" -map 0:v -map 1:a -c copy -shortest -movflags +faststart "$WD/$NAME.mp4"
  echo "$WD/$NAME.mp4" ;;
esac
