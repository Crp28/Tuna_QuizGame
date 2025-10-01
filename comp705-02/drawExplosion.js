MaxTrail = 12          // for longer trail
shakeMagnitude = 20     // for stronger shake

function endGame() {
  isGameRunning = false;
  isGameOver = true;
  isExploding = true;
  explosionStart = Date.now();  
  shakeStart = Date.now();

  explosionSegments = snake.map((seg, idx) => {
    let angle = Math.random() * Math.PI * 2;
    let speed = 7 + Math.random() * 8;
    let segColor = randomColor();
    if (idx === 0) segColor = "#fff200";
    return {
      ...seg,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 1,
      color: segColor,
      trail: [{x:seg.x, y:seg.y, alpha:1}]
    };
  });
  requestAnimationFrame(explosionLoop);
  setTimeout(showGameOverPopup, 1100);
}

function explosionLoop() {
  const elapsed = Date.now() - explosionStart;
  const shake = Math.max(0, shakeMagnitude * (1 - (elapsed / 650)));
  const offsetX = (Math.random() - 0.5) * shake;
  const offsetY = (Math.random() - 0.5) * shake;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, offsetX, offsetY);
  ctx.clearRect(-offsetX, -offsetY, canvas.width, canvas.height);

  let done = true;

  if (explosionSegments.length > 0) {
    const head = explosionSegments[0];

    // 🌟 Radial Starburst
    for (let j = 0; j < 13; j++) {
      const burstAngle = (Math.PI * 2 * j / 13) + (elapsed / 200) + Math.random() * 0.15;
      const r = 60 + Math.sin(elapsed / 230 + j) * 8 + Math.random() * 12;
      const x = head.x + gridSize / 2 + Math.cos(burstAngle) * r;
      const y = head.y + gridSize / 2 + Math.sin(burstAngle) * r;
      const radius = 16 + Math.sin(elapsed / 140 + j) * 4;

      ctx.save();
      ctx.globalAlpha = 0.35 + Math.sin(elapsed / 90 + j) * 0.5;
      ctx.shadowColor = `hsla(${(elapsed / 2 + j * 40) % 360},100%,70%,1)`;
      ctx.shadowBlur = 12;
      ctx.fillStyle = `hsla(${(elapsed / 3 + j * 30) % 360},95%,75%,0.7)`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }

    // 💥 Central flash glow
    ctx.save();
    ctx.globalAlpha = 0.25 + 0.2 * Math.sin(elapsed / 60);
    ctx.shadowColor = "#fff";
    ctx.shadowBlur = 60;
    ctx.fillStyle = "#fff3";
    ctx.beginPath();
    ctx.arc(head.x + gridSize / 2, head.y + gridSize / 2, 60 + elapsed * 0.08, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
  }

  // ✨ Particle segments and trails
  explosionSegments.forEach(seg => {
    seg.x += seg.vx;
    seg.y += seg.vy;
    seg.alpha -= 0.027;

    if (seg.alpha > 0.02) done = false;

    seg.trail.push({ x: seg.x, y: seg.y, alpha: seg.alpha });
    if (seg.trail.length > MaxTrail) seg.trail.shift();

    // 🌀 Tapered fading trail
    for (let i = 0; i < seg.trail.length - 1; i++) {
      const t0 = seg.trail[i];
      const t1 = seg.trail[i + 1];

      ctx.save();
      ctx.globalAlpha = Math.max(0, t0.alpha * 0.2);
      ctx.strokeStyle = seg.color;
      ctx.lineWidth = 6 - 5 * (i / MaxTrail);
      ctx.beginPath();
      ctx.moveTo(t0.x + gridSize / 2, t0.y + gridSize / 2);
      ctx.lineTo(t1.x + gridSize / 2, t1.y + gridSize / 2);
      ctx.stroke();
      ctx.restore();
    }

    // 🧨 Segment core with glow
    ctx.save();
    ctx.globalAlpha = Math.max(0, seg.alpha);
    ctx.shadowColor = seg.color;
    ctx.shadowBlur = 30;
    ctx.fillStyle = seg.color;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(seg.x, seg.y, gridSize, gridSize, 10);
    else ctx.rect(seg.x, seg.y, gridSize, gridSize);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });

  ctx.restore();

  if (!done && isExploding) {
    requestAnimationFrame(explosionLoop);
  }
}
