// "Why do you need an architect?" — one draw function per scene. (g, u, d, t)
const PAPER = '#FBF8EF';
function rectP(g, x, y, w, h, p) { poly(g, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], p, true); }
function dimH(g, x0, x1, y, txt, a) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.strokeStyle = C.brown; g.lineWidth = 3;
  g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y);
  [x0, x1].forEach(x => { g.moveTo(x - 10, y + 10); g.lineTo(x + 10, y - 10); g.moveTo(x, y - 18); g.lineTo(x, y + 18); });
  g.stroke(); g.restore();
  label(g, txt, (x0 + x1) / 2, y - 16, C.ink, 32, 'center', a);
}
function check(g, x, y, s, p, col = C.cool) {
  g.save(); g.strokeStyle = col; g.lineWidth = 10; g.lineCap = 'round'; g.lineJoin = 'round';
  poly(g, [[x - s, y], [x - s * .3, y + s * .7], [x + s, y - s * .8]], p); g.restore();
}
function cross(g, x, y, s, p) {
  g.save(); g.strokeStyle = C.heat; g.lineWidth = 10; g.lineCap = 'round';
  poly(g, [[x - s, y - s], [x + s, y + s]], clamp(p * 2)); poly(g, [[x + s, y - s], [x - s, y + s]], clamp(p * 2 - 1)); g.restore();
}

// Hook: a house goes up, then a crack shows what unplanned building costs
function scene0(g, u, d, t) {
  palm(g, 80, 1180, u / 2.2, t);
  house(g, u);
  const cp = ease((u - 3) / 1.2);
  g.save(); g.strokeStyle = C.heat; g.lineWidth = 6; g.lineJoin = 'round';
  poly(g, [[612, 935], [598, 980], [625, 1010], [606, 1060], [632, 1100], [618, 1140]], cp);
  poly(g, [[262, 935], [280, 965], [268, 990]], cp); g.restore();
  label(g, 'UNPLANNED = COSTLY', 540, 1250, C.heat, 30, 'center', ease((u - 3.6) / .6));
  // question mark bubble
  const qa = ease((u - 1.6) / .6);
  if (qa > 0) {
    g.save(); g.globalAlpha *= qa; g.translate(900, 700); g.scale(.8 + .2 * qa, .8 + .2 * qa);
    g.fillStyle = PAPER; g.strokeStyle = C.ink; g.lineWidth = 5; g.beginPath(); g.arc(0, 0, 52, 0, 7); g.fill(); g.stroke();
    g.fillStyle = C.heat; g.font = '700 70px "Cormorant Garamond"'; g.textAlign = 'center'; g.fillText('?', 0, 24); g.restore();
  }
}

// Tip 1: a wasteful plan with a long corridor turns into a plan where that area becomes rooms
function scene1(g, u, d, t) {
  const X0 = 140, X1 = 940, Y0 = 680, Y1 = 1180, MX = 540;
  const k = ease((u - 3.4) / 1.6);           // corridor collapses
  const cTop = 930, cBot = 1030 - 100 * k;   // corridor band
  const rp = ease(u / 1.4);
  // room fills
  g.fillStyle = PAPER; g.globalAlpha = rp; g.fillRect(X0, Y0, X1 - X0, Y1 - Y0); g.globalAlpha = 1;
  if (cBot - cTop > 1) {
    g.save(); g.globalAlpha = rp * (1 - k); g.fillStyle = 'rgba(196,85,47,.18)'; g.fillRect(X0, cTop, X1 - X0, cBot - cTop);
    hatch(g, gg => gg.rect(X0, cTop, X1 - X0, cBot - cTop), 18, C.heat, .45); g.restore();
  }
  // growth highlight on bedrooms
  if (k > 0) { g.save(); g.globalAlpha = .16 * k; g.fillStyle = C.cool; g.fillRect(X0, cBot, X1 - X0, 100 * k); g.restore(); }
  g.strokeStyle = C.ink; g.lineWidth = 8; g.lineJoin = 'miter';
  rectP(g, X0, Y0, X1 - X0, Y1 - Y0, rp);
  g.lineWidth = 6;
  poly(g, [[MX, Y0], [MX, cTop]], ease((u - .6) / .8));
  poly(g, [[X0, cTop], [X1, cTop]], ease((u - .8) / .8));
  poly(g, [[X0, cBot], [X1, cBot]], ease((u - 1) / .8));
  poly(g, [[MX, cBot], [MX, Y1]], ease((u - 1.1) / .8));
  // furniture: sofa, counter, beds that grow
  const fa = ease((u - 1.4) / .8);
  g.save(); g.globalAlpha = fa; g.fillStyle = C.tan;
  g.beginPath(); g.roundRect(190, 760, 230, 60, 10); g.fill();
  g.fillRect(820, 700, 100, 200);
  const bh = 80 + 70 * k;
  g.beginPath(); g.roundRect(200, Y1 - 20 - bh, 150, bh, 10); g.fill();
  g.beginPath(); g.roundRect(600, Y1 - 20 - bh, 150, bh, 10); g.fill();
  g.restore();
  label(g, 'LIVING', 340, 880, C.brown, 26, 'center', fa);
  label(g, 'KITCHEN', 680, 880, C.brown, 26, 'center', fa);
  label(g, 'BED 1', 440, (cBot + Y1) / 2 + 10, C.brown, 26, 'center', fa);
  label(g, 'BED 2', 840, (cBot + Y1) / 2 + 10, C.brown, 26, 'center', fa);
  label(g, 'WASTED CORRIDOR', 540, (cTop + cBot) / 2 + 10, C.heat, 28, 'center', ease((u - 1.8) / .6) * (1 - k));
  label(g, 'SAME PLOT. BIGGER ROOMS.', 540, 1250, C.cool, 30, 'center', ease((u - 5) / .7));
}

// Tip 2: beam clashes with the window, then the drawing fixes it before construction
function scene2(g, u, d, t) {
  const k = ease((u - 3.4) / 1.4);
  const WX0 = 140, WX1 = 720, WY0 = 690, G = 1180;
  g.fillStyle = PAPER; g.fillRect(WX0, WY0, WX1 - WX0, G - WY0);
  hatch(g, gg => gg.rect(WX0, WY0, WX1 - WX0, G - WY0), 22, C.brown, .22);
  // window
  const wx = 300, wy = 860, ww = 260, wh = 220;
  g.fillStyle = '#E4EEF0'; g.fillRect(wx, wy, ww, wh);
  g.strokeStyle = C.brown; g.lineWidth = 5; g.strokeRect(wx, wy, ww, wh);
  g.lineWidth = 3; [1, 2].forEach(i => { g.beginPath(); g.moveTo(wx + ww * i / 3, wy); g.lineTo(wx + ww * i / 3, wy + wh); g.stroke(); });
  // beam: clashing (overlapping window top) -> lifted above lintel level
  const by = 835 - 95 * k;
  g.save(); g.fillStyle = mix('#D9A58A', '#C9C1B0', k); g.globalAlpha = ease(u / .8);
  g.fillRect(WX0, by, WX1 - WX0, 55); g.strokeStyle = C.ink; g.lineWidth = 5; g.strokeRect(WX0, by, WX1 - WX0, 55);
  g.restore();
  label(g, 'BEAM', WX0 + 70, by + 38, C.ink, 24, 'center', ease(u / .8));
  g.strokeStyle = C.ink; g.lineWidth = 7; g.strokeRect(WX0, WY0, WX1 - WX0, G - WY0);
  ground(g, G, 1, 40, 760);
  // clash marker, then fix
  cross(g, wx + ww / 2, 855, 34, ease((u - 1) / .8) * (1 - k));
  label(g, 'CLASH ON SITE', 430, 1250, C.heat, 28, 'center', ease((u - 1.4) / .6) * (1 - k));
  dimH(g, wx, wx + ww, 1150, `7'-0" WINDOW`, ease((u - 4.6) / .6));
  check(g, 640, 1000, 36, ease((u - 5) / .7));
  label(g, 'SOLVED ON PAPER', 430, 1250, C.cool, 28, 'center', ease((u - 5.2) / .6));
  // rework cost meter
  const bx = 820, bw = 110, bh = 380 - 300 * k, base = 1150;
  label(g, 'REWORK', bx + bw / 2, 700, C.brown, 26, 'center', ease((u - 1.6) / .6));
  g.save(); g.globalAlpha = ease((u - 1.6) / .6);
  g.strokeStyle = C.brown; g.lineWidth = 3; g.strokeRect(bx, base - 400, bw, 400);
  g.fillStyle = mix(C.heat, C.cool, k); g.fillRect(bx + 8, base - bh, bw - 16, bh - 8);
  g.restore();
  label(g, k > .5 ? 'LOW' : 'HIGH', bx + bw / 2, base + 60, mix(C.heat, C.cool, k), 26, 'center', ease((u - 1.8) / .6));
}

// Tip 3: approved licence drawing + estimate bars rising
function scene3(g, u, d, t) {
  // drawing sheet
  const sx = 100, sy = 690, sw = 470, sh = 500;
  const sp = ease(u / 1);
  g.save(); g.globalAlpha = sp; g.fillStyle = PAPER; g.fillRect(sx, sy, sw, sh); g.restore();
  g.strokeStyle = C.ink; g.lineWidth = 5; rectP(g, sx, sy, sw, sh, sp);
  g.lineWidth = 2; g.strokeStyle = C.brown; rectP(g, sx + 18, sy + 18, sw - 36, sh - 36, ease((u - .3) / .8));
  // tiny plan on the sheet
  g.lineWidth = 5; g.strokeStyle = C.ink;
  const pp = ease((u - .6) / 1.2);
  rectP(g, sx + 60, sy + 60, 260, 300, pp);
  poly(g, [[sx + 190, sy + 60], [sx + 190, sy + 230]], pp); poly(g, [[sx + 60, sy + 230], [sx + 320, sy + 230]], pp);
  // title block
  g.lineWidth = 3; rectP(g, sx + 250, sy + 390, 200, 90, ease((u - 1) / .6));
  label(g, 'LICENCE DWG', sx + 350, sy + 444, C.brown, 20, 'center', ease((u - 1.2) / .5));
  // stamp
  const st = eo((u - 2.2) / .35);
  if (st > 0) {
    g.save(); g.translate(sx + 300, sy + 300); g.rotate(-.22); const s = 1.6 - .6 * st; g.scale(s, s); g.globalAlpha *= st;
    g.strokeStyle = C.cool; g.lineWidth = 6; g.beginPath(); g.roundRect(-150, -48, 300, 96, 12); g.stroke();
    g.fillStyle = C.cool; g.font = '600 46px Jost'; g.textAlign = 'center'; g.letterSpacing = '6px'; g.fillText('APPROVED', 6, 16); g.restore();
  }
  // estimate bars
  const bars = [['CIVIL', 330], ['FINISH', 240], ['MEP', 150]];
  label(g, 'ESTIMATE', 800, 700, C.brown, 28, 'center', ease((u - 2.8) / .6));
  bars.forEach(([name, h], i) => {
    const x = 665 + i * 115, base = 1150; const bp = ease((u - 3.2 - i * .35) / .9);
    g.save(); g.fillStyle = [C.gold, C.tan, C.cool][i]; g.fillRect(x, base - h * bp, 80, h * bp); g.restore();
    label(g, name, x + 40, base + 40, C.ink, 22, 'center', bp);
  });
  g.save(); g.strokeStyle = C.ink; g.lineWidth = 3; g.setLineDash([12, 10]);
  poly(g, [[640, 800], [990, 800]], ease((u - 4.6) / .8)); g.restore();
  label(g, 'BUDGET FIXED', 815, 780, C.ink, 24, 'center', ease((u - 5) / .6));
}

// Closing: finished house, planned and dimensioned
function scene4(g, u, d, t) {
  palm(g, 80, 1180, 1, t);
  house(g, 9, ease((u - .6) / 2));
  dimH(g, 150, 930, 650, `40'-0"`, ease((u - .4) / .8));
  check(g, 940, 760, 40, ease((u - 1.4) / .8));
}

const SCENES = [scene0, scene1, scene2, scene3, scene4];
