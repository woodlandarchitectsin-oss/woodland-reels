const W = 1080, H = 1920;
const C = { bg: '#F5F0E0', ink: '#1a1109', brown: '#5A4525', gold: '#C8973A', tan: '#A88F5C',
  heat: '#C4552F', cool: '#3E7C8C', glow: '#F2C46B' };
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const eo = x => 1 - Math.pow(1 - clamp(x), 3);

function poly(g, pts, p = 1, close = false) { // draw polyline revealed to fraction p
  if (close) pts = pts.concat([pts[0]]);
  let L = 0; const seg = [];
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
  let rem = L * clamp(p); if (rem <= 0) return;
  g.beginPath(); g.moveTo(...pts[0]);
  for (let i = 1; i < pts.length; i++) {
    if (rem >= seg[i - 1]) { g.lineTo(...pts[i]); rem -= seg[i - 1]; }
    else { const f = rem / seg[i - 1]; g.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f); break; }
  }
  g.stroke();
}
function hatch(g, path, gap = 16, color = C.brown, a = .35) {
  g.save(); g.beginPath(); path(g); g.clip();
  g.strokeStyle = color; g.globalAlpha *= a; g.lineWidth = 2;
  for (let x = -H; x < W + H; x += gap) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + H, H); g.stroke(); }
  g.restore();
}
function label(g, txt, x, y, color = C.brown, size = 30, align = 'center', alpha = 1) {
  g.save(); g.globalAlpha *= alpha; g.fillStyle = color; g.font = `600 ${size}px Jost`; g.textAlign = align;
  g.letterSpacing = '4px'; g.fillText(txt, x, y); g.restore();
}
function arrowHead(g, x, y, ang, s = 18) {
  g.beginPath(); g.moveTo(x, y);
  g.lineTo(x - s * Math.cos(ang - .45), y - s * Math.sin(ang - .45));
  g.lineTo(x - s * Math.cos(ang + .45), y - s * Math.sin(ang + .45)); g.closePath(); g.fill();
}
// particles flowing along a path function f(s)->[x,y,colorMix]
function flow(g, f, t, n, speed, color, alpha = 1, len = .035) {
  for (let i = 0; i < n; i++) {
    const s = ((i / n) + t * speed) % 1;
    const a = Math.min(1, s * 8, (1 - s) * 8) * alpha;
    const p1 = f(s), p0 = f(Math.max(0, s - len));
    g.save(); g.globalAlpha *= a; g.strokeStyle = typeof color === 'function' ? color(s) : color; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.stroke();
    g.fillStyle = g.strokeStyle; arrowHead(g, p1[0] + (p1[0] - p0[0]) * .25, p1[1] + (p1[1] - p0[1]) * .25, Math.atan2(p1[1] - p0[1], p1[0] - p0[0]), 20);
    g.restore();
  }
}
function mix(c1, c2, f) {
  const h = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const a = h(c1), b = h(c2); return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * f)).join(',')})`;
}
function ground(g, y, p = 1, x0 = 40, x1 = 1040) {
  g.strokeStyle = C.ink; g.lineWidth = 6; poly(g, [[x0, y], [x0 + (x1 - x0) * p, y]]);
  g.save(); g.globalAlpha *= p; hatch(g, gg => gg.rect(x0, y, (x1 - x0) * p, 26), 14, C.brown, .4); g.restore();
}
function sun(g, x, y, r, t, a = 1) {
  g.save(); g.globalAlpha *= a; g.fillStyle = C.gold; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  g.strokeStyle = C.gold; g.lineWidth = 5; g.lineCap = 'round';
  for (let i = 0; i < 12; i++) { const an = i * Math.PI / 6 + t * .4; g.beginPath(); g.moveTo(x + Math.cos(an) * (r + 16), y + Math.sin(an) * (r + 16)); g.lineTo(x + Math.cos(an) * (r + 38), y + Math.sin(an) * (r + 38)); g.stroke(); }
  g.restore();
}
function palm(g, x, y, p, t) {
  g.save(); g.strokeStyle = C.brown; g.lineWidth = 9; g.lineCap = 'round';
  const top = [x + 40, y - 330];
  const trunk = []; for (let i = 0; i <= 20; i++) { const s = i / 20; trunk.push([x + 40 * s * s, y - 330 * s]); }
  poly(g, trunk, ease(p * 1.5));
  g.lineWidth = 6; g.strokeStyle = '#4E6B3A';
  const fp = ease((p - .4) * 2.2);
  for (let i = 0; i < 7; i++) {
    const an = -Math.PI / 2 + (i - 3) * .48 + Math.sin(t * 1.3 + i) * .04; const L = 150;
    const pts = []; for (let k = 0; k <= 12; k++) { const s = k / 12; pts.push([top[0] + Math.cos(an) * L * s, top[1] + Math.sin(an) * L * s + 90 * s * s]); }
    poly(g, pts, fp);
  }
  g.restore();
}
// ---------- Scene drawings: u = local time, d = duration ----------
function house(g, u, glow = 0, sc = 1, oy = 0) {
  g.save(); g.translate(540, oy); g.scale(sc, sc); g.translate(-540, 0);
  const p = k => ease((u - k * .35) / 1.1);
  g.strokeStyle = C.ink; g.lineWidth = 6; g.lineJoin = 'round'; g.lineCap = 'round';
  ground(g, 1180, p(0));
  // walls
  const wall = [[240, 1180], [240, 930], [840, 930], [840, 1180]];
  g.fillStyle = '#FBF8EF'; g.globalAlpha = p(1); g.fillRect(240, 930, 600, 250); g.globalAlpha = 1;
  poly(g, wall, p(1));
  // roof (hip) with tiles
  const roof = [[150, 935], [380, 700], [700, 700], [930, 935]];
  const rp = p(2);
  g.save(); g.globalAlpha = rp; g.fillStyle = '#E7C2A4';
  g.beginPath(); g.moveTo(...roof[0]); roof.slice(1).forEach(q => g.lineTo(...q)); g.closePath(); g.fill();
  g.strokeStyle = C.heat; g.globalAlpha = rp * .55; g.lineWidth = 3;
  for (let yy = 730; yy < 935; yy += 26) { const f = (yy - 700) / 235; g.beginPath(); g.moveTo(380 - 230 * f, yy); g.lineTo(700 + 230 * f, yy); g.stroke(); }
  g.restore();
  g.strokeStyle = C.ink; g.lineWidth = 6; poly(g, roof, rp, true);
  // door + windows
  const wp = p(3);
  const win = (x, y, w, h) => {
    g.save(); g.globalAlpha = wp;
    if (glow > 0) { g.shadowColor = C.glow; g.shadowBlur = 50 * glow; g.fillStyle = mix('#FBF8EF', '#F2B84B', glow); g.fillRect(x, y, w, h); g.shadowBlur = 0; }
    g.strokeStyle = C.brown; g.lineWidth = 5; g.strokeRect(x, y, w, h);
    g.lineWidth = 3; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(x + w * i / 4, y); g.lineTo(x + w * i / 4, y + h); g.stroke(); }
    g.restore();
  };
  win(300, 990, 120, 110); win(660, 990, 120, 110);
  g.save(); g.globalAlpha = wp;
  if (glow > 0) { g.shadowColor = C.glow; g.shadowBlur = 50 * glow; g.fillStyle = mix('#FBF8EF', '#F2B84B', glow * .8); g.fillRect(490, 975, 100, 205); g.shadowBlur = 0; }
  g.strokeStyle = C.brown; g.lineWidth = 5; g.strokeRect(490, 975, 100, 205); g.beginPath(); g.moveTo(540, 975); g.lineTo(540, 1180); g.stroke();
  g.restore();
  // pillars of verandah
  g.restore();
}