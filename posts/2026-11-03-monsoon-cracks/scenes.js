// 'Why houses in Mangaluru crack after the monsoon' — duplex house, new diagrams per tip.
// Signature: (g, u, d, t)

function rain(g, t, a, x0 = 60, x1 = 1020, y0 = 610, y1 = 1170, n = 46) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.strokeStyle = C.cool; g.lineWidth = 3; g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = x0 + ((i * 197) % (x1 - x0));
    const y = y0 + (((i * 131) + t * 620) % (y1 - y0));
    g.beginPath(); g.moveTo(x, y); g.lineTo(x - 8, y + 26); g.stroke();
  }
  g.restore();
}
function crackPath(g, pts, p, color = C.heat, w = 5) {
  g.save(); g.strokeStyle = color; g.lineWidth = w; g.lineJoin = 'miter'; g.lineCap = 'round'; poly(g, pts, p); g.restore();
}
function brickWall(g, x, y, w, h, a = 1) {
  g.save(); g.globalAlpha *= a; g.fillStyle = '#EBCDB4'; g.fillRect(x, y, w, h);
  g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.strokeStyle = '#B98F6E'; g.lineWidth = 3;
  for (let r = 0, yy = y; yy < y + h; r++, yy += 44) {
    g.beginPath(); g.moveTo(x, yy); g.lineTo(x + w, yy); g.stroke();
    for (let xx = x + (r % 2 ? 0 : 60); xx < x + w; xx += 120) { g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx, yy + 44); g.stroke(); }
  }
  g.restore();
  g.strokeStyle = C.ink; g.lineWidth = 6; g.globalAlpha = a; g.strokeRect(x, y, w, h); g.globalAlpha = 1;
}
function concrete(g, x, y, w, h, a = 1) {
  g.save(); g.globalAlpha *= a; g.fillStyle = '#D9D4C7'; g.fillRect(x, y, w, h);
  g.beginPath(); g.rect(x, y, w, h); g.clip(); g.fillStyle = '#A9A08C';
  for (let i = 0; i < Math.floor(w * h / 900); i++) { const px = x + ((i * 73) % w), py = y + ((i * 151) % h); g.beginPath(); g.arc(px, py, 2.5 + (i % 3), 0, 7); g.fill(); }
  g.restore();
  g.save(); g.globalAlpha *= a; g.strokeStyle = C.ink; g.lineWidth = 6; g.strokeRect(x, y, w, h); g.restore();
}

// 0 Hook: duplex in the rain, cracks zig-zag across the wall
function scene0(g, u, d, t) {
  rain(g, t, ease((u - .3) / 1) * (1 - .0));
  houseStyle(g, u, 'duplex');
  const c1 = [[420, 975], [445, 1010], [430, 1040], [462, 1075], [450, 1110], [478, 1150]];
  const c2 = [[780, 810], [760, 840], [775, 870], [752, 905], [764, 940]];
  const c3 = [[640, 1135], [664, 1110], [655, 1080], [682, 1050]];
  const s = firstWordAt('cracks', TL.bounds[0]);
  crackPath(g, c1, ease((u - (s - TL.bounds[0]) + .1) / .8));
  crackPath(g, c2, ease((u - (s - TL.bounds[0]) - .3) / .8));
  crackPath(g, c3, ease((u - (s - TL.bounds[0]) - .6) / .8));
  const w = firstWordAt('water', TL.bounds[0]) - TL.bounds[0];
  const a = ease((u - w) / .6);
  label(g, 'WATER', 200, 720, C.cool, 34, 'center', a);
  label(g, 'MOVEMENT', 890, 720, C.heat, 34, 'center', ease((u - w - .5) / .6));
}

// 1 Sloped apron + drain: water first seeps under the footing, then is carried away
function scene1(g, u, d, t) {
  const G = 1000, WX = 300, WT = 60;
  const fix = ease((u - 3.2) / 1.2); // apron + drain appear
  // soil
  g.save(); g.fillStyle = '#E9DCC0'; g.fillRect(60, G, 960, 250); g.restore();
  hatch(g, gg => gg.rect(60, G, 960, 250), 30, C.tan, .25);
  // soggy patch under footing (fades when fixed)
  const wet = ease((u - .8) / 1.6) * (1 - fix);
  g.save(); g.globalAlpha = wet * .45; g.fillStyle = C.cool;
  g.beginPath(); g.ellipse(WX + 170, G + 180, 230, 70, 0, 0, 7); g.fill(); g.restore();
  // footing + wall (sinks slightly when wet)
  const sink = 14 * wet;
  g.save(); g.translate(0, sink);
  concrete(g, WX - 70, G + 150, WT + 140, 50);
  g.fillStyle = '#FBF8EF'; g.fillRect(WX, 650, WT, G + 150 - 650);
  hatch(g, gg => gg.rect(WX, 650, WT, G + 150 - 650), 14, C.brown, .5);
  g.strokeStyle = C.ink; g.lineWidth = 6; g.strokeRect(WX, 650, WT, G + 150 - 650);
  g.restore();
  // crack in wall when sinking
  crackPath(g, [[WX + 8, 760 + sink], [WX + 30, 790 + sink], [WX + 18, 820 + sink], [WX + 50, 860 + sink]], wet);
  // ground line
  g.strokeStyle = C.ink; g.lineWidth = 6; poly(g, [[60, G], [WX, G]]); poly(g, [[WX + WT, G], [1020, G]]);
  // inside floor label
  label(g, 'INSIDE', 170, 960, C.brown, 26);
  // rain
  rain(g, t, 1, 380, 1020, 610, G - 10, 26);
  // without fix: water soaks down beside the wall
  if (fix < 1) flow(g, s => [WX + WT + 60 + 30 * Math.sin(s * 6), G - 40 + 230 * s], t, 4, .5, C.heat, ease((u - .6) / .8) * (1 - fix));
  // apron: concrete wedge sloping away, then drain
  if (fix > 0) {
    const ax1 = WX + WT + 330 * fix;
    g.save(); g.fillStyle = '#D9D4C7'; g.beginPath();
    g.moveTo(WX + WT, G - 40); g.lineTo(ax1, G - 40 + 30 * fix); g.lineTo(ax1, G); g.lineTo(WX + WT, G); g.closePath(); g.fill();
    g.strokeStyle = C.ink; g.lineWidth = 5; g.stroke(); g.restore();
    const dp = ease((u - 4.2) / .8);
    if (dp > 0) {
      const DX = WX + WT + 340;
      g.save(); g.globalAlpha = dp; g.fillStyle = '#FBF8EF'; g.fillRect(DX, G - 10, 120, 90);
      g.strokeStyle = C.ink; g.lineWidth = 6; g.beginPath(); g.moveTo(DX, G - 10); g.lineTo(DX, G + 80); g.lineTo(DX + 120, G + 80); g.lineTo(DX + 120, G - 10); g.stroke();
      g.fillStyle = C.cool; g.globalAlpha = dp * .55; g.fillRect(DX + 6, G + 45 + 6 * Math.sin(t * 3), 108, 30 - 6 * Math.sin(t * 3)); g.restore();
      flow(g, s => [WX + WT + 20 + 360 * s, G - 52 + 30 * s + (s > .9 ? (s - .9) * 500 : 0)], t, 5, .45, C.cool, dp);
      label(g, 'SLOPED APRON', WX + WT + 170, G + 70, C.ink, 26, 'center', dp);
      label(g, 'DRAIN', DX + 60, G + 125, C.cool, 28, 'center', dp);
    }
  }
  label(g, wet > .3 ? 'SOFT SOIL' : (fix > .9 ? 'FIRM SOIL' : ''), WX + 170, G + 235, fix > .5 ? C.cool : C.heat, 26, 'center', Math.max(wet, fix));
}

// 2 Plinth beam + DPC: rising damp arrows blocked
function scene2(g, u, d, t) {
  const G = 1120;
  const beamA = ease((u - 1.0) / 1.0), dpcA = ease((u - 3.4) / .8);
  // soil
  g.save(); g.fillStyle = '#E9DCC0'; g.fillRect(60, G, 960, 130); g.restore();
  hatch(g, gg => gg.rect(60, G, 960, 130), 30, C.tan, .25);
  g.strokeStyle = C.ink; g.lineWidth = 6; poly(g, [[60, G], [1020, G]], ease(u / .8));
  // basement masonry (stone) from G-? up to beam
  const BY = 1000, BH = 80;
  g.save(); g.fillStyle = '#E2D6BC'; g.fillRect(160, BY + BH, 760, G - BY - BH + 120); g.restore();
  g.save(); g.beginPath(); g.rect(160, BY + BH, 760, 160); g.clip(); g.strokeStyle = C.tan; g.lineWidth = 3;
  for (let i = 0; i < 14; i++) { g.beginPath(); g.ellipse(190 + i * 56, BY + BH + 30 + (i % 2) * 50, 26, 18, 0, 0, 7); g.stroke(); } g.restore();
  g.strokeStyle = C.ink; g.lineWidth = 6; g.strokeRect(160, BY + BH, 760, 160);
  // plinth beam sliding in from left
  const bx = 160 - 800 * (1 - beamA);
  g.save(); g.beginPath(); g.rect(60, 0, 980, 1920); g.clip();
  concrete(g, bx, BY, 760, BH, beamA);
  g.save(); g.globalAlpha = beamA; g.fillStyle = C.ink;
  for (let i = 0; i < 2; i++) [BY + 20, BY + BH - 20].forEach(yy => { g.beginPath(); g.arc(bx + 30 + i * 700, yy, 8, 0, 7); g.fill(); });
  g.strokeStyle = C.ink; g.lineWidth = 4; [BY + 20, BY + BH - 20].forEach(yy => { g.beginPath(); g.moveTo(bx + 30, yy); g.lineTo(bx + 730, yy); g.stroke(); });
  g.restore(); g.restore();
  label(g, 'PLINTH BEAM', 540, BY + 52, C.ink, 26, 'center', ease((u - 2) / .6));
  // DPC black layer on top
  g.save(); g.globalAlpha = dpcA; g.fillStyle = C.ink; g.fillRect(160, BY - 12 * dpcA, 760 * dpcA, 12); g.restore();
  label(g, 'DPC', 960, BY + 2, C.ink, 28, 'center', dpcA);
  // two walls above
  [[230, 60], [790, 60]].forEach(([x, w]) => {
    const a = ease((u - .2) / .8);
    g.save(); g.globalAlpha = a; g.fillStyle = '#FBF8EF'; g.fillRect(x, 640, w, BY - 12 - 640);
    hatch(g, gg => gg.rect(x, 640, w, BY - 12 - 640), 14, C.brown, .5);
    g.strokeStyle = C.ink; g.lineWidth = 6; g.strokeRect(x, 640, w, BY - 12 - 640); g.restore();
  });
  // rising damp: arrows go up through walls before DPC, stopped after
  const stop = dpcA;
  [260, 820].forEach((x, k) => {
    const top = BY - 12 + (G + 100 - (BY - 12)) * 0;
    const reach = 260 * (1 - stop);
    flow(g, s => [x + (k ? 0 : 0), G + 100 - (G + 100 - (BY - 12) + reach) * s], t + k * .3, 3, .55, s2 => mix(C.cool, C.heat, stop), ease((u - .5) / .8));
    // damp stain on wall when not blocked
    g.save(); g.globalAlpha = .28 * (1 - stop) * ease((u - 1) / 1.2); g.fillStyle = C.heat; g.fillRect(x - 30, BY - 12 - 220, 60, 220); g.restore();
  });
  label(g, stop > .5 ? 'DAMP BLOCKED' : 'RISING DAMP', 540, 760, stop > .5 ? C.cool : C.heat, 30, 'center', ease((u - 1) / .6));
  // tie arrows on beam
  if (beamA >= 1) {
    const pa = ease((u - 2.4) / .6) * (0.6 + .4 * Math.sin(t * 4) ** 2);
    g.save(); g.globalAlpha = pa; g.strokeStyle = C.gold; g.fillStyle = C.gold; g.lineWidth = 5;
    g.beginPath(); g.moveTo(330, 900); g.lineTo(750, 900); g.stroke(); arrowHead(g, 330, 900, Math.PI); arrowHead(g, 750, 900, 0); g.restore();
    label(g, 'TIES THE WALLS', 540, 880, C.gold, 24, 'center', pa);
  }
}

// 3 Chicken mesh at concrete/brick junction
function scene3(g, u, d, t) {
  const a = ease(u / .8);
  // RCC column + beam above, brick infill
  concrete(g, 140, 640, 140, 560, a);
  concrete(g, 140, 640, 820, 110, a);
  brickWall(g, 280, 750, 680, 450, a);
  label(g, 'CONCRETE', 210, 1240, C.ink, 26, 'center', a);
  label(g, 'BRICK', 620, 1240, C.brown, 26, 'center', a);
  // hairline crack along the joints (problem)
  const meshA = ease((u - 3.2) / 1.4);
  const crackA = ease((u - 1) / 1.2) * (1 - meshA);
  g.save(); g.globalAlpha = crackA > 0 ? 1 : 0;
  crackPath(g, [[284, 1190], [290, 1100], [282, 1000], [292, 900], [284, 800], [300, 756], [420, 750], [560, 758], [700, 750], [840, 756], [955, 752]], crackA * 1.0, C.heat, 5);
  g.restore();
  // expansion arrows (both materials move differently)
  const ea = ease((u - 1.4) / .6) * (1 - meshA);
  if (ea > 0) {
    const o = 8 * Math.sin(t * 5);
    g.save(); g.globalAlpha = ea; g.fillStyle = C.heat; g.strokeStyle = C.heat; g.lineWidth = 5;
    g.beginPath(); g.moveTo(240 - o, 980); g.lineTo(180 - o, 980); g.stroke(); arrowHead(g, 180 - o, 980, Math.PI);
    g.beginPath(); g.moveTo(330 + o, 980); g.lineTo(400 + o, 980); g.stroke(); arrowHead(g, 400 + o, 980, 0);
    g.restore();
  }
  // mesh strip: diamond grid over the L-shaped joint
  if (meshA > 0) {
    g.save(); g.beginPath();
    g.rect(220, 690 + (1 - meshA) * 520, 130, 520 * meshA);
    g.rect(220, 690, 750 * meshA, 120);
    g.clip();
    g.fillStyle = 'rgba(62,124,140,.10)'; g.fillRect(0, 0, 1080, 1920);
    g.strokeStyle = C.cool; g.lineWidth = 2.5;
    for (let k = -1400; k < 1400; k += 26) {
      g.beginPath(); g.moveTo(k, 600); g.lineTo(k + 700, 1300); g.stroke();
      g.beginPath(); g.moveTo(k + 700, 600); g.lineTo(k, 1300); g.stroke();
    }
    g.restore();
    label(g, 'CHICKEN MESH', 640, 870, C.cool, 30, 'center', ease((u - 4.2) / .6));
    label(g, '6" EACH SIDE', 640, 910, C.cool, 22, 'center', ease((u - 4.6) / .6));
  }
}

// 4 Closing: duplex, rain eases, sun returns, no cracks
function scene4(g, u, d, t) {
  rain(g, t, 1 - ease(u / 1.5));
  sun(g, 930, 690, 44, t, ease((u - .6) / 1));
  houseStyle(g, 4 + u, 'duplex');
  const a = ease((u - 1) / .6);
  g.save(); g.globalAlpha = a; g.strokeStyle = C.cool; g.lineWidth = 8; g.lineCap = 'round';
  g.beginPath(); g.arc(160, 760, 52, 0, 7); g.stroke();
  poly(g, [[132, 762], [154, 784], [192, 740]], ease((u - 1.3) / .5)); g.restore();
}

const SCENES = [scene0, scene1, scene2, scene3, scene4];
