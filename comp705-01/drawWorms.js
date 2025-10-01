function generateWormsForQuestion(q) {
  const labels = ["A", "B", "C", "D"];
  const positions = [];
  const minHeadDistance = 5;
  const minWormDistance = 3;
  const edgeBuffer = 1;
  const maxAttempts = 4000;
  let attempts = 0;
  const head = snake[0];

  function distance(ax, ay, bx, by) {
    return Math.abs(ax - bx) + Math.abs(ay - by);
  }

  // Try to find good positions for 4 worms
  while (positions.length < 4 && attempts < maxAttempts) {
    const gx = edgeBuffer + Math.floor(Math.random() * (gridW - 2 * edgeBuffer));
    const gy = reservedRows + edgeBuffer + Math.floor(Math.random() * (gridH - reservedRows - 2 * edgeBuffer));
    const px = gx * gridSize;
    const py = gy * gridSize;

    const tooCloseToSnake = snake.some(seg => seg.x === px && seg.y === py);
    const tooCloseToHead = distance(gx, gy, head.x / gridSize, head.y / gridSize) < minHeadDistance;
    const tooCloseToOthers = positions.some(pos => distance(gx, gy, pos.gx, pos.gy) < minWormDistance);

    if (!tooCloseToSnake && !tooCloseToHead && !tooCloseToOthers) {
      positions.push({ x: px, y: py, gx, gy });
    }
    attempts++;
  }

  // Fallback if not enough good positions
  while (positions.length < 4) {
    const gx = edgeBuffer + Math.floor(Math.random() * (gridW - 2 * edgeBuffer));
    const gy = reservedRows + edgeBuffer + Math.floor(Math.random() * (gridH - reservedRows - 2 * edgeBuffer));
    const px = gx * gridSize;
    const py = gy * gridSize;

    if (!positions.some(pos => pos.x === px && pos.y === py)) {
      positions.push({ x: px, y: py, gx, gy });
    }
  }

  // Assign worm data
  return labels.map((label, i) => ({
    x: positions[i].x,
    y: positions[i].y,
    label,
    isCorrect: label === q.answer,
    color: randomBrightColor()  // Use a more vibrant random color
  }));
}

function drawWorm(index, colorMap) {
  const labels = ["A", "B", "C", "D"];
  const label = labels[index];
  const color = colorMap[label] || "#ffffff";
  
  return `
    <div style="
      background: ${color}20; 
      border: 2px solid ${color}; 
      border-radius: 12px; 
      padding: 5px 7px; 
      margin: 3px; 
      font-weight: bold; 
      color: ${color}; 
      box-shadow: 0 0 6px ${color}; 
      transition: transform 0.2s ease;
    ">
      <span style="color:${color}; font-size: 1.1em;">${label}:</span>
      <span style="color:${color}; font-size: 1em;">${question.options[index]}</span>
    </div>`;
}

function randomBrightColor() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 85%, 65%)`;
}

