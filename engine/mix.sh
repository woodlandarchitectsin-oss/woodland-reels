#!/usr/bin/env bash
# usage: ./mix.sh <workdir>   -> adds music bed under voice.m4a (ducked), writes voice_mix.m4a
# video.json: "music": "calm" | "warm" | "none"   (default calm)   "music_db": -20 (bed level, default -20)
set -euo pipefail
E="$(cd "$(dirname "$0")" && pwd)"; WD="$1"
STY=$(python3 -c "import json;print(json.load(open('$WD/video.json')).get('music','calm'))")
DB=$(python3 -c "import json;print(json.load(open('$WD/video.json')).get('music_db',-20))")
if [ "$STY" = "none" ]; then cp "$WD/voice.m4a" "$WD/voice_mix.m4a"; exit 0; fi
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$WD/voice.m4a")
python3 "$E/music.py" "$D" "$WD/music.wav" "$STY" >/dev/null
ffmpeg -v error -y -i "$WD/voice.m4a" -i "$WD/music.wav" -filter_complex \
 "[1:a]aformat=sample_rates=48000:channel_layouts=stereo,equalizer=f=2500:t=o:w=2:g=-7,volume=${DB}dB[m];[0:a]aformat=sample_rates=48000:channel_layouts=stereo,asplit=2[v][sc];[m][sc]sidechaincompress=threshold=0.03:ratio=6:attack=40:release=600[md];[v][md]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.89[a]" \
 -map "[a]" -c:a aac -b:a 192k "$WD/voice_mix.m4a"
echo "mixed music ($STY) -> $WD/voice_mix.m4a"
