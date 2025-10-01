function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

// 🪱 Draw Worms - Enlarged for Better Label Fit
worms.forEach((worm, i) => {
  ctx.save();

  const t = Date.now() / 600 + i;
  const dx = awaitingInitialMove ? 0 : Math.sin(t) * 2;
  const dy = awaitingInitialMove ? 0 : Math.cos(t + 0.4) * 2;

  const cx = worm.x + gridSize / 2 + dx;
  const cy = worm.y + gridSize / 2 + dy;

  // Outer glow
  ctx.shadowColor = worm.color;
  ctx.shadowBlur = 28;

  // Bigger body
  ctx.beginPath();
  ctx.arc(cx, cy, gridSize / 1.85, 0, 2 * Math.PI);  // Enlarged radius
  ctx.fillStyle = worm.color;
  ctx.fill();

  // Label glow and outline
  ctx.shadowColor = "#fff";
  ctx.shadowBlur = 22;
  ctx.globalAlpha = 0.92;
  ctx.font = `bold ${Math.floor(gridSize * 1.0)}px Segoe UI, Arial`;  // Slightly larger text
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Stroke around letter
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#ffffff";
  ctx.strokeText(worm.label, cx, cy + 1);  // Slight vertical tweak

  // Fill letter
  ctx.fillStyle = "#111";
  ctx.fillText(worm.label, cx, cy + 1);

  ctx.globalAlpha = 1;
  ctx.restore();
});


  // 🐍 Draw Snake
  snake.forEach((segment, idx) => {
    ctx.save();

    if (slowGlowAlpha > 0.03) {
      const hue = (slowGlowPhase * 36 + idx * 23) % 360;
      const pulse = 0.8 + 0.25 * Math.sin(slowGlowPhase + idx * 0.6);
      ctx.shadowColor = `hsl(${hue}, 98%, 75%)`;
      ctx.shadowBlur = 40 * pulse * slowGlowAlpha;
    } else {
      ctx.shadowColor = idx === 0 ? "#ffe082" : "#26ffd5";
      ctx.shadowBlur = idx === 0 ? 18 : 8;
    }

    const hue1 = (180 + idx * 8) % 360;
    const hue2 = (hue1 + 40) % 360;
    const grad = ctx.createLinearGradient(
      segment.x, segment.y,
      segment.x + gridSize, segment.y + gridSize
    );
    grad.addColorStop(0, `hsl(${hue1}, 80%, 85%)`);
    grad.addColorStop(1, `hsl(${hue2}, 65%, 60%)`);

    ctx.fillStyle = grad;
    ctx.strokeStyle = slowGlowAlpha > 0.03 ? "#fff" : "#111";
    ctx.lineWidth = 2;

    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(segment.x, segment.y, gridSize, gridSize, 7);
    } else {
      ctx.rect(segment.x, segment.y, gridSize, gridSize);
    }

    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });
}
