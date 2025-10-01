// All game/question logic

let questions = [];
let leaderboard = [];
let usedQuestions = [];
let questionsLoaded = false, leaderboardLoaded = false;

const reservedTop = 100;
const gridSize = 24;

let isSlow = false;
let slowTimeout = null;
let slowFlash = false;

const canvas = document.getElementById("gameCanvas");
canvas.width = 900;
canvas.height = 700;
const ctx = canvas.getContext("2d");
const gridW = Math.floor(canvas.width / gridSize);
const gridH = Math.floor(canvas.height / gridSize);
const reservedRows = Math.ceil(reservedTop / gridSize);

let snake = [];
let direction = { x: 0, y: 0 };
let nextDir = direction;
let worms = [];
let question = {};
let isGameRunning = false, isGameOver = false;
let score = 0, level = 1;
let t0 = null, t1 = 0;

let lastStepTime = 0;
const START_STEP_DELAY = 180;
const MIN_STEP_DELAY = 105;
let stepDelay = START_STEP_DELAY;

// --- Animation State ---
let slowGlowPhase = 0;
let slowGlowAlpha = 0;
let isExploding = false;
let explosionStart = 0;
let explosionSegments = [];
let shakeMagnitude = 0;
let shakeStart = 0;

const splash = document.getElementById("splashScreen");
const scoreBox = document.getElementById("scoreBox");
const questionPanel = document.getElementById("questionPanel");
const MAX_TRAIL = 999;
let awaitingInitialMove = false;

function decode(text) {
  try {
    return atob(text); // base64 decode
  } catch (e) {
    return text;
  }
}

function loadQuestions() {
  return fetch('load_questions.php')
    .then(r => r.json())
    .then(data => {
      questions = data.map(q => ({
        question: decode(q.question),
        options: q.options.map(decode),
        answer: decode(q.answer)
      }));
      questionsLoaded = true;
    });
}

function loadLeaderboard() {
  return fetch('load_leaderboard.php')
    .then(r => r.json())
    .then(data => { leaderboard = data; leaderboardLoaded = true; });
}
function saveLeaderboard() {
  fetch('save_leaderboard.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(leaderboard)
  });
}

function saveLeaderboardEntry(entry) {
  fetch('save_leaderboard.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([entry])  // wrap in array for consistency
  });
}


function setLeaderboard(arr) {
  leaderboard = arr;
  renderMainLeaderboard();
}


function randomColor() {
  let h, s, l;
  while (true) {
    h = Math.floor(Math.random() * 360);
    if (h >= 210 && h <= 270) continue;
    s = 70 + Math.floor(Math.random() * 20);
    l = 65 + Math.floor(Math.random() * 18);
    break;
  }
  return `hsl(${h},${s}%,${l}%)`;
}
function getRandomQuestion() {
  if (usedQuestions.length >= questions.length) usedQuestions = [];
  let idx;
  do { idx = Math.floor(Math.random() * questions.length); }
  while (usedQuestions.includes(idx));
  usedQuestions.push(idx);
  return questions[idx];
}


function resetGame() {
  snake = [
    { x: gridSize*4, y: gridSize*8 },
    { x: gridSize*3, y: gridSize*8 },
    { x: gridSize*2, y: gridSize*8 }
  ];
  direction = { x: 0, y: 0 };
  nextDir = { x: 0, y: 0 };
  isGameOver = false;
  score = 0;
  level = 1;
  usedQuestions = [];
  t0 = Date.now();
  lastStepTime = 0;
  awaitingInitialMove = true;
  updateScore();
  nextQuestion();
  drawGame();
}

function nextQuestion() {
  question = getRandomQuestion();
  worms = generateWormsForQuestion(question);
  updateQuestionPanel();
}
function startGame() {
  resetGame();
  isGameRunning = true;
  isGameOver = false;
  splash.style.display = "none";
  lastStepTime = Date.now();
  requestAnimationFrame(gameLoop);
}


function moveSnake() {
  direction = nextDir;
  if (direction.x === 0 && direction.y === 0) return true;
  if (!t0) t0 = Date.now();

  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };
  snake.unshift(head);

  let eatenIdx = worms.findIndex(w => w.x === head.x && w.y === head.y);
  if (eatenIdx !== -1) {
    let worm = worms[eatenIdx];
    if (worm.isCorrect) {
      score += 1;
      level += 1;
      updateScore();
      checkLevelProgress();
      nextQuestion();

      // ✅ Update leaderboard immediately
      let nick = (typeof USERNAME !== 'undefined' && USERNAME) ? USERNAME : "Guest";
      const newEntry = {
        name: nick,
        level: level,
        time: t0 ? ((Date.now() - t0) / 1000).toFixed(2) * 1 : 0
      };

      // Replace old entry if same user exists, else push new
      const existingIndex = leaderboard.findIndex(e => e.name === newEntry.name);
      if (existingIndex !== -1) {
        leaderboard[existingIndex] = newEntry;
      } else {
        leaderboard.push(newEntry);
      }

      leaderboard.sort((a, b) => b.level - a.level || a.time - b.time);
      saveLeaderboardEntry(newEntry);   // ✅ save to DB
      setLeaderboard(leaderboard);      // ✅ update UI

      // Slow-motion flash effect
      isSlow = true;
      if (slowTimeout) clearTimeout(slowTimeout);
      slowTimeout = setTimeout(() => { isSlow = false; }, 2000);

    } else {
      endGame();
      return false;
    }
  } else {
    snake.pop();
  }
  return true;
}

function checkCollision() {
  const head = snake[0];
  if (direction.x === 0 && direction.y === 0) return false;
  if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height)
    return true;
  for (let i = 1; i < snake.length; i++)
    if (snake[i].x === head.x && snake[i].y === head.y)
      return true;
  return false;
}
function gameLoop() {
  if (!isGameRunning) return;
  let now = Date.now();
  if (!lastStepTime) lastStepTime = now;
  stepDelay = isSlow ? 340 : Math.max(MIN_STEP_DELAY, START_STEP_DELAY - 2 * level);

  let fadeSpeed = 0.09;
  if (isSlow) {
    slowGlowPhase += 0.09;
    slowGlowAlpha += fadeSpeed * (1 - slowGlowAlpha);
  } else {
    slowGlowAlpha += fadeSpeed * (0 - slowGlowAlpha);
    slowGlowPhase = 0;
  }

  if (awaitingInitialMove && (nextDir.x === 0 && nextDir.y === 0)) {
    drawGame();
    updateScore();
    requestAnimationFrame(gameLoop);
    return;
  } else if (awaitingInitialMove) {
    direction = nextDir;
    awaitingInitialMove = false;
  }

  while (now - lastStepTime >= stepDelay) {
    if (!moveSnake()) return;
    if (checkCollision()) {
      endGame();
      return;
    }
    lastStepTime += stepDelay;
  }
  drawGame();
  updateScore();
  requestAnimationFrame(gameLoop);
}

function updateScore() {
  let seconds = t0 ? ((Date.now() - t0) / 1000).toFixed(1) : "0.0";
  scoreBox.textContent = `Level: ${level}  |  Time: ${seconds} s`;
}


document.addEventListener("keydown", function handleKey(e) {
  if (!isGameRunning) {
    if (e.key.toLowerCase() === 's') {
      if (questionsLoaded && leaderboardLoaded) startGame();
      return;
    }
  }
  if (!isGameRunning) return;
  if (awaitingInitialMove) {
    let moved = false;
    if ((e.key === "ArrowUp" || e.key.toLowerCase() === "w") && direction.y === 0) {
      nextDir = { x: 0, y: -gridSize }; moved = true;
    } else if ((e.key === "ArrowDown" || e.key.toLowerCase() === "s") && direction.y === 0) {
      nextDir = { x: 0, y: gridSize }; moved = true;
    } else if ((e.key === "ArrowLeft" || e.key.toLowerCase() === "a") && direction.x === 0) {
      nextDir = { x: -gridSize, y: 0 }; moved = true;
    } else if ((e.key === "ArrowRight" || e.key.toLowerCase() === "d") && direction.x === 0) {
      nextDir = { x: gridSize, y: 0 }; moved = true;
    }
    if (moved) {
      direction = nextDir;
      awaitingInitialMove = false;
      t0 = Date.now();
      lastStepTime = t0;
    }
    return;
  }
  const key = e.key.toLowerCase();
  if ((key === "arrowup" || key === "w") && direction.y === 0) {
    nextDir = { x: 0, y: -gridSize };
  } else if ((key === "arrowdown" || key === "s") && direction.y === 0) {
    nextDir = { x: 0, y: gridSize };
  } else if ((key === "arrowleft" || key === "a") && direction.x === 0) {
    nextDir = { x: -gridSize, y: 0 };
  } else if ((key === "arrowright" || key === "d") && direction.x === 0) {
    nextDir = { x: gridSize, y: 0 };
  }
});

function getCookie(name) {
  let match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function checkLevelProgress() {
  // ✅ Update question count in splash screen
  const questionCountEl = document.getElementById("questionCount");
  if (questionCountEl && Array.isArray(questions)) {
    questionCountEl.textContent = questions.length;
  }

  const total = questions.length;
  const answered = usedQuestions.length;
  if (answered >= Math.ceil(total / 2)) {
    showNextLevelButton();
  }
}


Promise.all([loadQuestions(), loadLeaderboard()]).then(() => {
  questionsLoaded = leaderboardLoaded = true;
  splash.style.display = "";
  drawGame();
  updateScore();
  updateQuestionPanel();
  renderMainLeaderboard();
  checkLevelProgress();
});
