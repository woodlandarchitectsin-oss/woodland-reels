// ---------- Brand frame: grid, logo, kicker/title, tip dots, captions, end card ----------
// Globals provided by render.js: SPEC (video.json), TL (timeline.json), LOGO (Image), SCENES (from scenes.js)
function firstWordAt(word, from) { const w = TL.words.find(w => w[1] >= from - .01 && w[0].replace(/[.,:!?]$/, '') === word); return w ? w[1] : Infinity; }
function render(t) {
  const cv = document.getElementById('c'), g = cv.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
  g.strokeStyle = C.brown; g.globalAlpha = .06; g.lineWidth = 2;
  for (let x = 0; x <= W; x += 60) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  for (let y = 0; y <= H; y += 60) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  g.globalAlpha = 1;
  const B = TL.bounds, N = B.length - 1; let s = 0; while (s < N - 1 && t >= B[s + 1]) s++;
  const u = t - B[s], d = B[s + 1] - B[s];
  const isEnd = s === N - 1;
  if (!isEnd) {
    g.save(); g.globalCompositeOperation = 'multiply'; const lw = 290, lh = lw * LOGO.height / LOGO.width; g.drawImage(LOGO, 540 - lw / 2, 110, lw, lh); g.restore();
    const sc = SPEC.scenes[s]; const ta = eo(u / .6);
    let title = sc.title;
    if (sc.title2 && t >= firstWordAt(sc.title2_at, B[s])) title = sc.title2;
    g.save(); g.globalAlpha = ta; g.translate(0, (1 - ta) * 30);
    if (sc.kicker) label(g, sc.kicker, 540, 420, C.gold, 32);
    g.fillStyle = C.ink; let fs = 104; g.font = `700 ${fs}px "Cormorant Garamond"`;
    while (g.measureText(title).width > 960 && fs > 60) { fs -= 4; g.font = `700 ${fs}px "Cormorant Garamond"`; }
    g.textAlign = 'center'; g.fillText(title, 540, 535);
    const tips = SPEC.scenes.filter(x => x.tip).length;
    if (sc.tip) { for (let i = 0; i < tips; i++) { g.fillStyle = i < sc.tip ? C.gold : 'rgba(90,69,37,.2)'; g.beginPath(); g.roundRect(540 - (tips * 44 - 12) / 2 + i * 44, 575, 32, 8, 4); g.fill(); } }
    g.restore();
    g.save(); g.globalAlpha = ease(u / .45); SCENES[s](g, u, d, t); g.restore();
  } else {
    g.save(); g.globalAlpha = ease(u / .45); endCard(g, u, d, t); g.restore();
  }
  // captions: 3-word chunks (break on punctuation), active word gold, brand words always gold
  const W_ = TL.words; const chunks = []; let cur = [];
  W_.forEach((w, i) => { cur.push(i); if (cur.length >= 3 || /[.,:!?]$/.test(w[0])) { chunks.push(cur); cur = []; } });
  if (cur.length) chunks.push(cur);
  let ci = -1; chunks.forEach((c, i) => { if (t >= W_[c[0]][1] - .05) ci = i; });
  if (ci >= 0 && t < W_[W_.length - 1][2] + .6) {
    const c = chunks[ci]; let fsz = 74; g.font = `700 ${fsz}px Jost`; g.textAlign = 'left';
    const txt = c.map(i => W_[i][0].replace(/[.,:!?]$/, ''));
    const sp = 22; let widths = txt.map(x => g.measureText(x).width); let total = widths.reduce((a, b) => a + b, 0) + sp * (txt.length - 1);
    if (total > 940) { fsz = Math.floor(74 * 940 / total); g.font = `700 ${fsz}px Jost`; widths = txt.map(x => g.measureText(x).width); total = widths.reduce((a, b) => a + b, 0) + sp * (txt.length - 1); }
    const pop = eo((t - W_[c[0]][1] + .05) / .18);
    let x = 540 - total / 2; const y = 1400;
    g.save(); g.globalAlpha = .9 * pop; g.fillStyle = '#FBF8EF'; g.beginPath(); g.roundRect(540 - total / 2 - 34, y - 72, total + 68, 104, 22); g.fill();
    g.strokeStyle = 'rgba(90,69,37,.25)'; g.lineWidth = 2; g.stroke(); g.restore();
    txt.forEach((w, j) => {
      const wd = W_[c[j]]; const on = t >= wd[1] - .04; const active = on && (j === txt.length - 1 || t < W_[c[j + 1]][1] - .04);
      g.save(); g.globalAlpha = on ? 1 : .35; g.fillStyle = (active || /^(Woodland|Architects)/.test(wd[0])) ? C.gold : C.ink;
      const sz = active ? 1 + .06 * (1 - eo((t - wd[1]) / .15)) : 1;
      g.translate(x + widths[j] / 2, y); g.scale(sz, sz); g.fillText(w, -widths[j] / 2, 0); g.restore();
      x += widths[j] + sp;
    });
  }
}
