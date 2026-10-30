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
// ---------- House styles: vary every video (record the style in video.json "house_style") ----------
// houseStyle(g, u, style, glow): 'kerala' (hip roof, default house()), 'modern' (flat-roof box with cantilever + fins),
// 'duplex' (two storey, gable roof, balcony), 'courtyard' (low wide villa with central open court)
function _win(g, x, y, w, h, a, glow, bars = 3) {
  g.save(); g.globalAlpha *= a;
  g.fillStyle = glow > 0 ? mix('#E4EEF0', '#F2B84B', glow) : '#E4EEF0';
  if (glow > 0) { g.shadowColor = C.glow; g.shadowBlur = 40 * glow; }
  g.fillRect(x, y, w, h); g.shadowBlur = 0;
  g.strokeStyle = C.brown; g.lineWidth = 4; g.strokeRect(x, y, w, h);
  g.lineWidth = 2.5; for (let i = 1; i < bars; i++) { g.beginPath(); g.moveTo(x + w * i / bars, y); g.lineTo(x + w * i / bars, y + h); g.stroke(); }
  g.restore();
}
function _box(g, x, y, w, h, p, fill = '#FBF8EF') {
  g.save(); g.globalAlpha *= clamp(p * 1.5); g.fillStyle = fill; g.fillRect(x, y, w, h); g.restore();
  g.strokeStyle = C.ink; g.lineWidth = 6; poly(g, [[x, y + h], [x, y], [x + w, y], [x + w, y + h]], p);
}
function houseStyle(g, u, style = 'kerala', glow = 0) {
  if (style === 'kerala') return house(g, u, glow);
  const p = k => ease((u - k * .35) / 1.1);
  g.lineJoin = 'round'; g.lineCap = 'round';
  ground(g, 1180, p(0));
  if (style === 'modern') {
    _box(g, 300, 960, 560, 220, p(1));
    _box(g, 180, 770, 560, 190, p(2), '#F1E7D3');
    g.strokeStyle = C.ink; g.lineWidth = 12; poly(g, [[150, 765], [880, 765]], p(2.5)); poly(g, [[150, 958], [880, 958]], p(2.5));
    g.save(); g.globalAlpha *= p(3); g.strokeStyle = C.tan; g.lineWidth = 9;
    for (let x = 580; x <= 720; x += 28) { g.beginPath(); g.moveTo(x, 790); g.lineTo(x, 945); g.stroke(); } g.restore();
    _win(g, 220, 800, 300, 120, p(3), glow, 4);
    _win(g, 360, 1000, 260, 180, p(3.4), glow, 3);
    _win(g, 680, 1010, 120, 110, p(3.6), glow, 2);
    g.save(); g.globalAlpha *= p(3.8); g.fillStyle = '#4E6B3A';
    [[880, 1180], [925, 1180]].forEach(([x, y]) => { g.beginPath(); g.ellipse(x, y - 40, 26, 42, 0, 0, 7); g.fill(); }); g.restore();
  } else if (style === 'duplex') {
    _box(g, 220, 970, 640, 210, p(1));
    g.strokeStyle = C.ink; g.lineWidth = 10; poly(g, [[180, 968], [900, 968]], p(1.6));
    _box(g, 300, 800, 480, 168, p(2));
    const rp = p(2.6);
    g.save(); g.globalAlpha *= rp; g.fillStyle = '#E7C2A4'; g.beginPath(); g.moveTo(250, 805); g.lineTo(540, 650); g.lineTo(830, 805); g.closePath(); g.fill();
    g.strokeStyle = C.heat; g.globalAlpha *= .5; g.lineWidth = 3;
    for (let y = 680; y < 805; y += 22) { const f = (y - 650) / 155; g.beginPath(); g.moveTo(540 - 290 * f, y); g.lineTo(540 + 290 * f, y); g.stroke(); } g.restore();
    g.strokeStyle = C.ink; g.lineWidth = 6; poly(g, [[250, 805], [540, 650], [830, 805]], rp, true);
    g.save(); g.globalAlpha *= p(3); g.strokeStyle = C.brown; g.lineWidth = 3;
    poly(g, [[180, 930], [900, 930]]); for (let x = 190; x <= 890; x += 30) { g.beginPath(); g.moveTo(x, 930); g.lineTo(x, 966); g.stroke(); } g.restore();
    _win(g, 340, 830, 140, 90, p(3.2), glow); _win(g, 600, 830, 140, 90, p(3.3), glow);
    _win(g, 270, 1020, 150, 110, p(3.5), glow); _win(g, 660, 1020, 150, 110, p(3.6), glow);
    g.save(); g.globalAlpha *= p(3.6); g.fillStyle = glow > 0 ? mix('#FBF8EF', '#F2B84B', glow * .8) : '#FBF8EF'; g.fillRect(490, 1000, 100, 180);
    g.strokeStyle = C.brown; g.lineWidth = 5; g.strokeRect(490, 1000, 100, 180); g.restore();
  } else if (style === 'courtyard') {
    _box(g, 120, 980, 340, 200, p(1)); _box(g, 620, 980, 340, 200, p(1.1));
    const rp = p(2);
    [[90, 490], [590, 990]].forEach(([a, b]) => {
      g.save(); g.globalAlpha *= rp; g.fillStyle = '#E7C2A4'; g.beginPath(); g.moveTo(a, 985); g.lineTo((a + b) / 2, 860); g.lineTo(b, 985); g.closePath(); g.fill(); g.restore();
      g.strokeStyle = C.ink; g.lineWidth = 6; poly(g, [[a, 985], [(a + b) / 2, 860], [b, 985]], rp, true);
    });
    g.strokeStyle = C.ink; g.lineWidth = 5; poly(g, [[460, 1180], [460, 1060], [620, 1060], [620, 1180]], p(2.6));
    g.save(); g.globalAlpha *= p(3); g.strokeStyle = '#4E6B3A'; g.lineWidth = 6;
    for (let i = 0; i < 6; i++) { const an = -Math.PI / 2 + (i - 2.5) * .3; g.beginPath(); g.moveTo(540, 1150); g.quadraticCurveTo(540 + Math.cos(an) * 30, 1110, 540 + Math.cos(an) * 60, 1150 + Math.sin(an) * 110); g.stroke(); } g.restore();
    _win(g, 170, 1030, 110, 100, p(3.2), glow); _win(g, 320, 1030, 100, 100, p(3.3), glow);
    _win(g, 660, 1030, 100, 100, p(3.4), glow); _win(g, 800, 1030, 110, 100, p(3.5), glow);
  }
}

// ---------- Real project media (plans, renders, site photos) ----------
// video.json "images": {"plan": "plan.png", "r1": "render1.jpg"} -> IMG.plan, IMG.r1 (loaded by render.js)
function drawCover(g, img, x, y, w, h, zoom = 1, fx = .5, fy = .5) {
  const s = Math.max(w / img.width, h / img.height) * zoom, iw = img.width * s, ih = img.height * s;
  g.drawImage(img, x + (w - iw) * fx, y + (h - ih) * fy, iw, ih);
}
function framed(g, x, y, w, h, fn) { // paper mat + ink frame around media
  g.save(); g.fillStyle = '#FBF8EF'; g.shadowColor = 'rgba(26,17,9,.18)'; g.shadowBlur = 24; g.fillRect(x - 14, y - 14, w + 28, h + 28); g.restore();
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); fn(); g.restore();
  g.strokeStyle = C.ink; g.lineWidth = 4; g.strokeRect(x, y, w, h);
}
// slow push-in on a render/photo; dir 1 = drift right, -1 = drift left
function kenBurns(g, img, x, y, w, h, u, d, dir = 1) {
  const k = clamp(u / Math.max(d, .1));
  framed(g, x, y, w, h, () => drawCover(g, img, x, y, w, h, 1.04 + .1 * k, .5 + dir * .06 * (k - .5), .5));
}
// plan drawing revealed by a gold scan line, white/transparent backgrounds look best (multiply blend)
function planReveal(g, img, x, y, w, h, p) {
  const s = Math.min(w / img.width, h / img.height), iw = img.width * s, ih = img.height * s, ix = x + (w - iw) / 2, iy = y + (h - ih) / 2;
  g.save(); g.fillStyle = '#FBF8EF'; g.fillRect(x, y, w, h);
  g.beginPath(); g.rect(ix, iy, iw * clamp(p), ih); g.clip(); g.globalCompositeOperation = 'multiply'; g.drawImage(img, ix, iy, iw, ih); g.restore();
  if (p > 0 && p < 1) { g.save(); g.strokeStyle = C.gold; g.lineWidth = 6; g.beginPath(); g.moveTo(ix + iw * p, iy - 10); g.lineTo(ix + iw * p, iy + ih + 10); g.stroke(); g.restore(); }
  g.strokeStyle = C.ink; g.lineWidth = 4; g.strokeRect(x, y, w, h);
}
// highlight a region of a plan (pulsing gold ring) with a label: rx,ry,rw,rh in canvas px
function pinArea(g, rx, ry, rw, rh, txt, a, t) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.strokeStyle = C.gold; g.lineWidth = 6 + Math.sin(t * 5) * 1.5;
  g.beginPath(); g.roundRect(rx, ry, rw, rh, 10); g.stroke();
  g.fillStyle = 'rgba(200,151,58,.12)'; g.fill(); g.restore();
  label(g, txt, rx + rw / 2, ry - 14, C.ink, 24, 'center', a);
}
