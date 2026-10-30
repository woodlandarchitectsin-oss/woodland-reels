// Deepu Residence, Hosangadi — project reveal from plan + renders.
// IMGSRC (data URIs) is prepended by make_scenes.sh
const IM = {}; window.SCENES_READY = Promise.all(Object.entries(IMGSRC).map(([k, s]) => { const i = new Image(); i.src = s; IM[k] = i; return i.decode(); }));
function lt(word, i, fb) { const v = firstWordAt(word, TL.bounds[i]) - TL.bounds[i]; return isFinite(v) ? v : fb; }
const BX = 40, BY = 600, BW = 1000, BH = 660;
const lerpR = (a, b, f) => ({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, w: a.w + (b.w - a.w) * f, h: a.h + (b.h - a.h) * f });
// draw crop r of image into the picture box; returns mapper source->canvas
function pic(g, img, r, a = 1, clipW = 1) {
  g.save(); g.globalAlpha *= a; g.beginPath(); g.roundRect(BX, BY, BW * clipW, BH, 18); g.clip();
  g.drawImage(img, r.x, r.y, r.w, r.h, BX, BY, BW, BH); g.restore();
  return (x, y) => [BX + (x - r.x) / r.w * BW, BY + (y - r.y) / r.h * BH];
}
function frameBox(g, a = 1) { g.save(); g.globalAlpha *= a; g.strokeStyle = C.ink; g.lineWidth = 5; g.beginPath(); g.roundRect(BX, BY, BW, BH, 18); g.stroke(); g.restore(); }
function pill(g, txt, x, y, col, a, align = 'center', size = 26) {
  if (a <= 0) return; g.save(); g.globalAlpha *= a; g.font = `600 ${size}px Jost`; g.letterSpacing = '4px';
  const w = g.measureText(txt).width + 36, x0 = align === 'left' ? x - 18 : align === 'right' ? x - w + 18 : x - w / 2;
  g.fillStyle = 'rgba(251,248,239,.93)'; g.beginPath(); g.roundRect(x0, y - size - 6, w, size + 26, 12); g.fill();
  g.strokeStyle = col; g.lineWidth = 2.5; g.stroke(); g.restore(); label(g, txt, x, y + 2, col, size, align, a);
}
function callout(g, p, lx, ly, txt, a, align) {
  if (a <= 0) return; g.save(); g.globalAlpha *= a; g.strokeStyle = C.gold; g.fillStyle = C.gold; g.lineWidth = 4;
  g.beginPath(); g.arc(p[0], p[1], 10, 0, 7); g.fill();
  g.beginPath(); g.arc(p[0], p[1], 10 + 14 * ((Date.now ? 0 : 0) + .5), 0, 7); g.globalAlpha *= .4; g.stroke(); g.globalAlpha /= .4;
  poly(g, [p, [lx, p[1] + (ly - p[1]) * .0 + (ly - p[1])]], ease(a * 1.5)); g.restore();
  pill(g, txt, lx, ly, C.ink, ease((a - .3) / .7), align);
}

function scene0(g, u, d, t) {
  const r = lerpR({ x: 40, y: 340, w: 1080, h: 713 }, { x: 110, y: 380, w: 960, h: 634 }, ease(u / d));
  const sk = ease((u - .1) / 1.8), tR = lt('contemporary', 0, 2.6), rv = ease((u - tR) / 1.3);
  pic(g, IM.sketch, r, 1, sk);
  if (rv > 0) pic(g, IM.ext, r, 1, rv);
  // wipe edge line
  const ex = BX + BW * (rv > 0 && rv < 1 ? rv : sk < 1 ? sk : -1);
  if (ex > BX) { g.save(); g.strokeStyle = C.gold; g.lineWidth = 6; g.beginPath(); g.moveTo(ex, BY); g.lineTo(ex, BY + BH); g.stroke(); g.restore(); }
  frameBox(g);
  pill(g, rv > .5 ? 'FINAL RENDER' : 'CONCEPT SKETCH', 1010, BY + 50, rv > .5 ? C.cool : C.brown, ease((u - .6) / .6), 'right', 22);
}
function scene1(g, u, d, t) {
  const r = lerpR({ x: 300, y: 20, w: 780, h: 515 }, { x: 430, y: 70, w: 620, h: 409 }, ease(u / d));
  const m = pic(g, IM.det, r); frameBox(g);
  const t1 = lt('timber', 1, 1.5), t2 = lt('double', 1, 4);
  callout(g, m(800, 330), 760, 1215, 'TIMBER LOUVERS', ease((u - t1) / .8), 'center');
  callout(g, m(550, 380), 330, 700, 'DOUBLE-HEIGHT GLASS', ease((u - t2) / .8), 'center');
}
function scene2(g, u, d, t) {
  const r = lerpR({ x: 260, y: 560, w: 850, h: 561 }, { x: 410, y: 620, w: 660, h: 436 }, ease(u / d));
  const m = pic(g, IM.ext, r); frameBox(g);
  const t1 = lt('wooden', 2, 2), t2 = lt('porch', 2, 5);
  callout(g, m(760, 728), 760, 690, 'WOODEN CEILING', ease((u - t1) / .8), 'center');
  callout(g, m(1020, 880), 820, 1220, 'TWO-CAR PORCH', ease((u - t2) / .8), 'center');
}
function scene3(g, u, d, t) {
  const f = ease((u - lt('Four', 3, 7) + .3) / 2.6);
  const r = lerpR({ x: 120, y: 590, w: 1000, h: 660 }, { x: 120, y: 110, w: 1000, h: 660 }, f);
  const m = pic(g, IM.plan, r); frameBox(g);
  const P = [[640, 1080], [520, 880], [620, 655], [775, 690], [935, 665]], names = ['sitout', 'living', 'dining', 'family', 'courtyard'];
  const times = names.map((w, i) => lt(w, 3, 1 + i * 1.2));
  // dashed walk path
  g.save(); g.beginPath(); g.roundRect(BX, BY, BW, BH, 18); g.clip();
  g.lineDashOffset = -t * 40; g.lineCap = 'round';
  for (let i = 1; i < P.length; i++) { const p = ease((u - times[i] + .4) / .8); if (p > 0) { g.setLineDash([]); g.strokeStyle = 'rgba(26,17,9,.55)'; g.lineWidth = 14; poly(g, [m(...P[i - 1]), m(...P[i])], p); g.setLineDash([16, 12]); g.strokeStyle = C.glow; g.lineWidth = 7; poly(g, [m(...P[i - 1]), m(...P[i])], p); } }
  g.setLineDash([]);
  P.forEach((q, i) => { const a = ease((u - times[i] + .2) / .5); if (a <= 0) return; const c = m(...q); g.globalAlpha = a; g.fillStyle = C.gold; g.beginPath(); g.arc(c[0], c[1], 13, 0, 7); g.fill(); g.strokeStyle = C.gold; g.lineWidth = 3; g.globalAlpha = a * .5; g.beginPath(); g.arc(c[0], c[1], 22 + 6 * Math.sin(t * 4 + i), 0, 7); g.stroke(); g.globalAlpha = 1; });
  g.restore();
  pill(g, '4 BEDROOMS  ·  PRAYER  ·  WET KITCHEN', 540, 1215, C.ink, ease((u - lt('Four', 3, 7)) / .8), 'center', 24);
}
function scene4(g, u, d, t) {
  const r = lerpR({ x: 560, y: 790, w: 545, h: 360 }, { x: 580, y: 815, w: 510, h: 337 }, ease(u / d));
  const m = pic(g, IM.det, r); frameBox(g);
  const names = ['Stone', 'concrete', 'wood', 'plaster'], xs = [647, 747, 837, 1025];
  names.forEach((w, i) => { const a = ease((u - lt(w, 4, .5 + i * .6)) / .5); if (a <= 0) return; const c = m(xs[i], 890); g.save(); g.globalAlpha = a; g.strokeStyle = C.gold; g.lineWidth = 6; g.beginPath(); g.roundRect(c[0] - 95 * a, c[1] - 120, 190 * a, 240, 10); g.stroke(); g.restore(); });
}
function scene5(g, u, d, t) {
  const r = lerpR({ x: 110, y: 380, w: 960, h: 634 }, { x: 20, y: 300, w: 1100, h: 726 }, ease(u / d));
  pic(g, IM.ext, r); frameBox(g);
  pill(g, 'DEEPU RESIDENCE  ·  HOSANGADI', 540, 1215, C.ink, ease((u - .5) / .8), 'center', 24);
}
const SCENES = [scene0, scene1, scene2, scene3, scene4, scene5];
