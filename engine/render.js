// usage: node render.js <workdir> preview t1,t2,...  |  node render.js <workdir> scene <i>
// workdir holds video.json, scenes.js, timeline.json (from tts.py)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const E = __dirname; const [WD, mode, arg] = process.argv.slice(2);
const b64 = f => fs.readFileSync(f).toString('base64');
const fd = E + '/node_modules/@fontsource/';
const html = `<!doctype html><html><head><style>
@font-face{font-family:Jost;font-weight:600;src:url(data:font/woff2;base64,${b64(fd + 'jost/files/jost-latin-600-normal.woff2')})}
@font-face{font-family:Jost;font-weight:700;src:url(data:font/woff2;base64,${b64(fd + 'jost/files/jost-latin-700-normal.woff2')})}
@font-face{font-family:"Cormorant Garamond";font-weight:700;src:url(data:font/woff2;base64,${b64(fd + 'cormorant-garamond/files/cormorant-garamond-latin-700-normal.woff2')})}
body{margin:0}</style></head><body><canvas id=c width=1080 height=1920></canvas>
<script>const SPEC=${fs.readFileSync(WD + '/video.json')};const TL=${fs.readFileSync(WD + '/timeline.json')};</script>
<script>${fs.readFileSync(E + '/engine.js')}</script>
<script>${fs.readFileSync(WD + '/scenes.js')}</script>
<script>const LOGO=new Image();LOGO.src='data:image/png;base64,${b64(E + '/assets/wl_logo_full.png')}';
window.ready=Promise.all([document.fonts.load('600 30px Jost'),document.fonts.load('700 30px Jost'),document.fonts.load('700 30px "Cormorant Garamond"'),LOGO.decode()]);
window.frame=t=>{render(t);return document.getElementById('c').toDataURL('image/jpeg',.92).slice(23)};</script></body></html>`;
(async () => {
  const br = await chromium.launch(); const pg = await br.newPage({ viewport: { width: 1080, height: 1920 } });
  pg.on('pageerror', e => { console.error('PAGEERR', e.message); process.exit(1); });
  await pg.setContent(html); await pg.evaluate(() => window.ready);
  const TL = JSON.parse(fs.readFileSync(WD + '/timeline.json'));
  if ((JSON.parse(fs.readFileSync(WD + '/video.json')).scenes.length + 1) !== TL.bounds.length - 1) { console.error('scene count mismatch: rerun tts.py'); process.exit(1); }
  if (mode === 'preview') {
    fs.mkdirSync(WD + '/preview', { recursive: true });
    for (const t of arg.split(',')) fs.writeFileSync(`${WD}/preview/f_${t}.jpg`, Buffer.from(await pg.evaluate(t => frame(t), +t), 'base64'));
  } else {
    const i = +arg; const t0 = TL.bounds[i], t1 = TL.bounds[i + 1]; const F0 = Math.round(t0 * 30), n = Math.round(t1 * 30) - F0;
    fs.mkdirSync(WD + '/parts', { recursive: true }); const tmp = `${WD}/parts/scene${i}.tmp.mp4`;
    const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30', tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = 0; f < n; f++) {
      const buf = Buffer.from(await pg.evaluate(t => frame(t), (F0 + f) / 30), 'base64');
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
    ff.stdin.end(); const code = await new Promise(r => ff.on('close', r));
    if (code === 0) fs.renameSync(tmp, `${WD}/parts/scene${i}.mp4`); else process.exit(code);
  }
  await br.close();
})();
