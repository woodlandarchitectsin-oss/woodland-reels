// Example: 'Keep your home cool without AC' — one draw function per spec scene, in order.
// Signature: (g, u, d, t) — g canvas ctx, u seconds since scene start, d scene duration, t global time.
function scene0(g, u, d, t) {
  sun(g, 930, 690, 46, t, ease(u / .8));
  palm(g, 80, 1180, u / 2.2, t);
  house(g, u);
  // heat shimmer -> cool waves
  const f = ease((u - 4) / 2);
  for (let i = 0; i < 3; i++) {
    const y = 625 + i * 28; g.save(); g.globalAlpha = ease(u - 1.5) * .9;
    g.strokeStyle = mix(C.heat, C.cool, f); g.lineWidth = 5; g.lineCap = 'round'; g.beginPath();
    for (let x = 0; x <= 200; x += 5) g.lineTo(440 + x, y + Math.sin(x / 18 + t * 4 + i) * 8);
    g.stroke(); g.restore();
  }
}
function scene1(g, u, d, t) {
  const G = 1200, WX = 560, WT = 44, WTOP = 800, slope = .36;
  const L = 40 + 210 * ease((u - 1.8) / 3.2);
  g.strokeStyle = C.ink; g.lineWidth = 6; g.lineJoin = 'round'; g.lineCap = 'round';
  // roof surfaces
  const rx0 = 120, ry0 = WTOP - (WX + WT - rx0) * slope - 20;
  const ex = WX + WT + L, ey = WTOP - 20 + L * slope;
  const roofPoly = [[rx0, ry0], [ex, ey], [ex, ey + 30], [rx0, ry0 + 30]];
  // sun + rays (marching)
  const SUNX = 975, SUNY = 690, dx = -1, dy = 1.6; const nrm = Math.hypot(dx, dy);
  sun(g, SUNX, SUNY, 50, t);
  const inPoly = (x, y, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { if (((P[i][1] > y) != (P[j][1] > y)) && (x < (P[j][0] - P[i][0]) * (y - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0])) c = !c; } return c; };
  let shadeY = G;
  const rayA = ease((u - .4) / 1);
  for (let k = 0; k < 9; k++) {
    let x = SUNX - 70 - k * 52 + 0, y = SUNY + 40 + k * 18; const sx = x, sy = y; if (sx < WX + WT + 60) continue;
    let hit = 'none';
    for (let s = 0; s < 900; s++) {
      x += dx / nrm * 4; y += dy / nrm * 4;
      if (inPoly(x, y, roofPoly)) { hit = 'roof'; break; }
      if (x <= WX + WT && y > WTOP - 20 && y < G) { hit = 'wall'; break; }
      if (y >= G) { hit = 'ground'; break; }
    }
    const rp = clamp(rayA * 1.4 - k * .04);
    g.save(); g.strokeStyle = C.gold; g.lineWidth = 4; g.setLineDash([16, 12]); g.lineDashOffset = -t * 40;
    poly(g, [[sx, sy], [x, y]], rp); g.restore();
    if (rp >= 1) { g.fillStyle = C.gold; arrowHead(g, x, y, Math.atan2(dy, dx), 18); }
  }
  // shadow line from overhang tip
  const tipX = ex, tipY = ey + 30; const tY = tipY + (tipX - (WX + WT)) * (dy / -dx);
  shadeY = Math.min(G, tY);
  // shaded zone on exterior
  g.save(); g.fillStyle = C.cool; g.globalAlpha = .13;
  g.beginPath(); g.moveTo(WX + WT, WTOP); g.lineTo(tipX, tipY); g.lineTo(WX + WT, shadeY); g.closePath(); g.fill(); g.restore();
  g.save(); g.strokeStyle = C.cool; g.globalAlpha = .7; g.lineWidth = 3; g.setLineDash([10, 10]);
  g.beginPath(); g.moveTo(tipX, tipY); g.lineTo(WX + WT, shadeY); g.stroke(); g.restore();
  // wall: hot part glow
  if (shadeY < G) {
    g.save(); const gr = g.createLinearGradient(WX + WT, 0, WX + WT + 70, 0);
    gr.addColorStop(0, 'rgba(196,85,47,.55)'); gr.addColorStop(1, 'rgba(196,85,47,0)');
    g.fillStyle = gr; g.fillRect(WX + WT, shadeY, 70, G - shadeY); g.restore();
  }
  g.fillStyle = '#FBF8EF'; g.fillRect(WX, WTOP, WT, G - WTOP);
  hatch(g, gg => gg.rect(WX, WTOP, WT, G - WTOP), 14, C.brown, .5);
  g.strokeStyle = C.ink; g.lineWidth = 6; g.strokeRect(WX, WTOP, WT, G - WTOP);
  // window in wall
  g.fillStyle = '#FBF8EF'; g.fillRect(WX - 3, 950, WT + 6, 140); g.lineWidth = 3;
  [WX + 12, WX + WT - 12].forEach(xx => { g.beginPath(); g.moveTo(xx, 950); g.lineTo(xx, 1090); g.stroke(); });
  g.lineWidth = 6; g.beginPath(); g.moveTo(WX, 950); g.lineTo(WX + WT, 950); g.moveTo(WX, 1090); g.lineTo(WX + WT, 1090); g.stroke();
  // roof
  g.fillStyle = '#E7C2A4'; g.beginPath(); roofPoly.forEach((q, i) => i ? g.lineTo(...q) : g.moveTo(...q)); g.closePath(); g.fill();
  g.save(); g.beginPath(); roofPoly.forEach((q, i) => i ? g.lineTo(...q) : g.moveTo(...q)); g.closePath(); g.clip();
  g.strokeStyle = C.heat; g.globalAlpha = .5; g.lineWidth = 3; for (let x = rx0; x < ex; x += 26) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 1920); g.stroke(); } g.restore();
  g.strokeStyle = C.ink; g.lineWidth = 6; poly(g, roofPoly, 1, true);
  ground(g, G);
  // interior: thermometer
  const cool = clamp((G - shadeY) / (G - WTOP) * -1 + 1); // 1 when fully shaded
  const tx = 300, ty = 930;
  g.save(); g.strokeStyle = C.ink; g.lineWidth = 5; g.fillStyle = '#FBF8EF';
  g.beginPath(); g.roundRect(tx - 16, ty, 32, 190, 16); g.fill(); g.stroke();
  g.beginPath(); g.arc(tx, ty + 205, 30, 0, 7); g.fill(); g.stroke();
  const col = mix(C.heat, C.cool, cool); g.fillStyle = col;
  g.beginPath(); g.arc(tx, ty + 205, 20, 0, 7); g.fill();
  const lvl = 160 - 110 * cool; g.fillRect(tx - 7, ty + 195 - lvl, 14, lvl);
  g.restore();
  label(g, cool > .6 ? 'COOL ROOM' : 'HOT ROOM', tx, ty - 30, col, 30);
  // dimension 3'-0"
  const da = ease((u - 5) / .8);
  if (da > 0) {
    const yy = ey - 70; g.save(); g.globalAlpha = da; g.strokeStyle = C.brown; g.lineWidth = 3;
    g.beginPath(); g.moveTo(WX + WT, yy); g.lineTo(ex, yy);
    [WX + WT, ex].forEach(xx => { g.moveTo(xx - 10, yy + 10); g.lineTo(xx + 10, yy - 10); g.moveTo(xx, yy - 18); g.lineTo(xx, yy + 18); }); g.stroke();
    g.restore(); label(g, `3'-0"`, (WX + WT + ex) / 2, yy - 18, C.ink, 40, 'center', da);
  }
  label(g, 'SHADED WALL', 790, 1100, C.cool, 28, 'center', ease((u - 6) / .8));
}
function scene2(g, u, d, t) {
  const F = 1150, CEIL = 830, LX = 210, RX = 850, WT = 36, W0 = 940, W1 = 1065;
  g.strokeStyle = C.ink; g.lineWidth = 6; g.lineJoin = 'round'; g.lineCap = 'round';
  const a = ease(u / 1);
  g.save(); g.globalAlpha = a;
  // gable roof
  const roof = [[LX - 50, CEIL + 10], [540, 690], [RX + WT + 50, CEIL + 10]];
  g.fillStyle = '#E7C2A4'; g.beginPath(); g.moveTo(...roof[0]); g.lineTo(...roof[1]); g.lineTo(...roof[2]); g.closePath(); g.fill();
  poly(g, roof, 1, true);
  // walls with window gaps
  [LX, RX].forEach(x => {
    [[CEIL + 10, W0], [W1, F]].forEach(([y0, y1]) => {
      g.fillStyle = '#FBF8EF'; g.fillRect(x, y0, WT, y1 - y0); hatch(g, gg => gg.rect(x, y0, WT, y1 - y0), 14, C.brown, .5);
      g.strokeStyle = C.ink; g.lineWidth = 6; g.strokeRect(x, y0, WT, y1 - y0);
    });
  });
  // sofa
  g.fillStyle = C.tan; g.globalAlpha = a * .8; g.beginPath(); g.roundRect(430, 1075, 210, 75, 14); g.fill(); g.beginPath(); g.roundRect(430, 1040, 40, 110, 10); g.fill();
  g.globalAlpha = a;
  // curtains (on inside of left window)
  g.strokeStyle = C.gold; g.lineWidth = 5;
  for (let c = 0; c < 2; c++) {
    g.beginPath(); for (let y = W0; y <= W1; y += 4) { const s = (y - W0) / (W1 - W0); g.lineTo(LX + WT + 12 + c * 14 + Math.sin(y / 14 - t * 6 + c) * 6 * s + 34 * s * eo((u - 1) / 1.5), y); } g.stroke();
  }
  g.restore();
  ground(g, F, 1, 230, 1040);
  // sea waves on left
  for (let i = 0; i < 4; i++) {
    g.save(); g.strokeStyle = C.cool; g.globalAlpha = a * (.9 - i * .15); g.lineWidth = 5; g.beginPath();
    for (let x = 20; x <= 190; x += 4) g.lineTo(x, F - 10 + i * 22 + Math.sin(x / 16 + t * 2.5 + i) * 6);
    g.stroke(); g.restore();
  }
  label(g, 'SEA BREEZE', 105, 1105, C.cool, 28, 'center', ease((u - .5) / 1));
  // airflow
  const fa = ease((u - 1) / 1.2);
  [W0 + 25, W0 + 62, W0 + 99].forEach((yy, k) => {
    const f = s => { const x = -40 + s * 1160; const inside = clamp((x - LX) / (RX + WT - LX)); return [x, yy + Math.sin(inside * Math.PI) * (k - 1) * 40 + Math.sin(inside * Math.PI) * 30]; };
    g.save(); g.globalAlpha = fa * .25; g.strokeStyle = C.cool; g.lineWidth = 3; g.setLineDash([6, 12]);
    g.beginPath(); for (let s = 0; s <= 1; s += .01) g.lineTo(...f(s)); g.stroke(); g.restore();
    flow(g, f, t + k * .13, 4, .22, C.cool, fa);
  });
  label(g, 'OPPOSITE WALLS', 540, 1240, C.ink, 28, 'center', ease((u - 2.6) / .8));
}
function scene3(g, u, d, t) {
  const G = 1180, OL = 90, OR = 990, CL = 430, CR = 650, CEIL = 860, WT = 34;
  g.strokeStyle = C.ink; g.lineWidth = 6; g.lineJoin = 'round'; g.lineCap = 'round';
  const a = ease(u / 1);
  g.save(); g.globalAlpha = a;
  // roofs: each wing slopes down into the courtyard
  const roofL = [[OL - 50, CEIL - 10], [260, 700], [CL + 50, CEIL - 10]];
  const roofR = [[CR - 50, CEIL - 10], [820, 700], [OR + WT + 50, CEIL - 10]];
  [roofL, roofR].forEach(r => { g.fillStyle = '#E7C2A4'; g.beginPath(); g.moveTo(...r[0]); g.lineTo(...r[1]); g.lineTo(...r[2]); g.closePath(); g.fill(); poly(g, r, 1, true); });
  // walls: outer with low window, inner with door opening
  const wall = (x, gaps) => {
    let y = CEIL - 10; gaps.concat([[G, G]]).forEach(([g0, g1]) => {
      g.fillStyle = '#FBF8EF'; g.fillRect(x, y, WT, g0 - y); hatch(g, gg => gg.rect(x, y, WT, g0 - y), 14, C.brown, .5);
      g.strokeStyle = C.ink; g.lineWidth = 6; g.strokeRect(x, y, WT, g0 - y); y = g1;
    });
  };
  wall(OL, [[1030, 1110]]); wall(OR, [[1030, 1110]]); wall(CL - WT, [[1000, G]]); wall(CR, [[1000, G]]);
  // courtyard plant
  g.fillStyle = C.brown; g.fillRect(515, 1130, 50, 50);
  g.strokeStyle = '#4E6B3A'; g.lineWidth = 6;
  for (let i = 0; i < 5; i++) { const an = -Math.PI / 2 + (i - 2) * .35 + Math.sin(t * 2 + i) * .05; g.beginPath(); g.moveTo(540, 1130); g.quadraticCurveTo(540 + Math.cos(an) * 30, 1130 + Math.sin(an) * 50, 540 + Math.cos(an) * 55, 1130 + Math.sin(an) * 85); g.stroke(); }
  g.restore();
  ground(g, G, 1, 40, 1040);
  // flows: cool in low from both sides, rise through courtyard, out top
  const fa = ease((u - 1.2) / 1.2);
  [-1, 1].forEach(side => {
    [0, 1].forEach(k => {
      const f = s => {
        const xo = side < 0 ? -20 : 1100, xc = 540 + side * (25 + k * 30);
        if (s < .55) { const q = s / .55; return [xo + (xc - xo) * q, 1070 + k * 40 + Math.sin(q * Math.PI) * 10]; }
        const q = (s - .55) / .45; return [xc + side * Math.sin(q * 3) * 8, 1070 + k * 40 - q * (330 + k * 30)];
      };
      flow(g, f, t + k * .2 + (side > 0 ? .1 : 0), 4, .17, s => mix(C.cool, C.heat, clamp((s - .45) / .4)), fa, .03);
    });
  });
  label(g, 'COOL AIR IN', 210, 1240, C.cool, 26, 'center', ease((u - 2) / .8));
  label(g, 'COOL AIR IN', 870, 1240, C.cool, 26, 'center', ease((u - 2) / .8));
  label(g, 'HOT AIR OUT', 540, 650, C.heat, 30, 'center', ease((u - 3) / .8));
}
function scene4(g, u, d, t) {
  // dusk sky
  const k = ease(u / 3);
  g.save(); const gr = g.createLinearGradient(0, 300, 0, 1300);
  gr.addColorStop(0, 'rgba(214,150,110,0)'); gr.addColorStop(.45, `rgba(214,150,110,${.4 * k})`); gr.addColorStop(1, 'rgba(214,150,110,0)');
  g.fillStyle = gr; g.fillRect(0, 300, W, 1000); g.restore();
  sun(g, 900, 760 + 120 * k, 44, t * .3, 1 - k * .5);
  palm(g, 80, 1180, 1, t);
  house(g, 9, ease((u - 1) / 2.5));
}
const SCENES = [scene0, scene1, scene2, scene3, scene4];
