function endCard(g, u, d, t) {
  const a = eo(u / .7), sc = .88 + .12 * a;
  const lw = 640, lh = lw * LOGO.height / LOGO.width, cy = 470 + lh / 2;
  g.save(); g.globalAlpha = a; g.globalCompositeOperation = 'multiply';
  g.translate(540, cy); g.scale(sc, sc); g.drawImage(LOGO, -lw / 2, -lh / 2, lw, lh); g.restore();
  const y1 = 470 + lh + 90;
  const r = ease((u - .5) / .8);
  g.save(); g.strokeStyle = C.gold; g.lineWidth = 3;
  g.beginPath(); g.moveTo(540 - 60 - 300 * r, y1 - 12); g.lineTo(540 - 60, y1 - 12); g.moveTo(540 + 60, y1 - 12); g.lineTo(540 + 60 + 300 * r, y1 - 12); g.stroke();
  g.fillStyle = C.gold; g.beginPath(); g.arc(540, y1 - 12, 7 * r, 0, 7); g.fill(); g.restore();
  label(g, 'MANGALURU  \u00B7  BANGALORE', 540, y1 + 60, C.gold, 34, 'center', ease((u - .7) / .6));
  g.save(); g.globalAlpha = ease((u - 1) / .6); g.fillStyle = C.brown; g.font = '700 58px "Cormorant Garamond"'; g.textAlign = 'center';
  g.fillText('Architecture \u00B7 Interiors \u00B7 Turnkey', 540, y1 + 145); g.restore();
  const fw = TL.words.find(w => w[0] === 'Follow'); const fp = eo((t - fw[1] + .1) / .35);
  if (fp > 0) {
    const pul = 1 + .04 * Math.sin(Math.max(0, t - fw[1]) * 6) * Math.exp(-Math.max(0, t - fw[1]) * .8);
    g.save(); g.globalAlpha = fp; g.translate(540, y1 + 232); g.scale(pul * (.85 + .15 * fp), pul * (.85 + .15 * fp));
    g.fillStyle = C.ink; g.beginPath(); g.roundRect(-230, -48, 460, 96, 48); g.fill();
    g.fillStyle = '#F5F0E0'; g.font = '600 38px Jost'; g.textAlign = 'center'; g.letterSpacing = '6px'; g.fillText('FOLLOW FOR MORE', 0, 14); g.restore();
  }
}