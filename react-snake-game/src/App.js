import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import translations from './translations';
import LanguageSwitcher from './LanguageSwitcher';
import LoginPage from './LoginPage';
import UserPanel from './UserPanel';
import QuestionBankSelector from './QuestionBankSelector';
import PracticeModePopup from './PracticeModePopup';

const GRID_SIZE = 24;
const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 700;
const GRID_W = Math.floor(CANVAS_WIDTH / GRID_SIZE);
const GRID_H = Math.floor(CANVAS_HEIGHT / GRID_SIZE);
const RESERVED_TOP = 100;
const RESERVED_ROWS = Math.ceil(RESERVED_TOP / GRID_SIZE);
const START_STEP_DELAY = 180;
const MIN_STEP_DELAY = 105;

// Utility functions

const getColor = (() => {
  const hues = [310, 200, 64, 135];
  let index = 0;

  return () => {
    const hue = hues[index];
    index = (index + 1) % hues.length;
    return `hsl(${hue}, 85%, 65%)`;
  };
})();

// Water-themed color palette for Maori ocean theme
const getWaterColor = () => {
  const waterHues = [180, 190, 195, 200, 210]; // Cyan/turquoise/blue range
  const h = waterHues[Math.floor(Math.random() * waterHues.length)];
  const s = 70 + Math.floor(Math.random() * 25); // 70-95% saturation
  const l = 55 + Math.floor(Math.random() * 25); // 55-80% lightness
  return `hsl(${h},${s}%,${l}%)`;
};

const getRandomQuestion = (questions, usedQuestions) => {
  if (!questions || questions.length === 0) {
    console.error('No questions available');
    return { question: null, questionIndex: null, usedQuestions: [] };
  }
  if (usedQuestions.length >= questions.length) {
    usedQuestions = [];
  }
  let idx;
  do {
    idx = Math.floor(Math.random() * questions.length);
  } while (usedQuestions.includes(idx));
  usedQuestions.push(idx);
  return { question: questions[idx], questionIndex: idx, usedQuestions };
};

const generateWormsForQuestion = (question, snake) => {
  const labels = ["A", "B", "C", "D"];
  const positions = [];
  const minHeadDistance = 5;
  const minWormDistance = 3;
  const edgeBuffer = 1;
  const maxAttempts = 4000;
  let attempts = 0;
  const head = snake[0];

  const distance = (ax, ay, bx, by) => {
    return Math.abs(ax - bx) + Math.abs(ay - by);
  };

  while (positions.length < 4 && attempts < maxAttempts) {
    const gx = edgeBuffer + Math.floor(Math.random() * (GRID_W - 2 * edgeBuffer));
    const gy = RESERVED_ROWS + edgeBuffer + Math.floor(Math.random() * (GRID_H - RESERVED_ROWS - 2 * edgeBuffer));
    const px = gx * GRID_SIZE;
    const py = gy * GRID_SIZE;

    const tooCloseToSnake = snake.some(seg => seg.x === px && seg.y === py);
    const tooCloseToHead = distance(gx, gy, head.x / GRID_SIZE, head.y / GRID_SIZE) < minHeadDistance;
    const tooCloseToOthers = positions.some(pos => distance(gx, gy, pos.gx, pos.gy) < minWormDistance);

    if (!tooCloseToSnake && !tooCloseToHead && !tooCloseToOthers) {
      positions.push({ x: px, y: py, gx, gy });
    }
    attempts++;
  }

  while (positions.length < 4) {
    const gx = edgeBuffer + Math.floor(Math.random() * (GRID_W - 2 * edgeBuffer));
    const gy = RESERVED_ROWS + edgeBuffer + Math.floor(Math.random() * (GRID_H - RESERVED_ROWS - 2 * edgeBuffer));
    const px = gx * GRID_SIZE;
    const py = gy * GRID_SIZE;

    if (!positions.some(pos => pos.x === px && pos.y === py)) {
      positions.push({ x: px, y: py, gx, gy });
    }
  }

  return labels.map((label, i) => ({
    x: positions[i].x,
    y: positions[i].y,
    label,
    color: getColor()
    // Note: isCorrect field removed - correctness checking now done server-side
  }));
};

function App() {
  // Language state
  const [language, setLanguage] = useState('en');
  const t = translations[language];

  // Auth state
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Question bank state
  const [currentBank, setCurrentBank] = useState('comp705-01');

  // Game UI state (low-frequency)
  const [questions, setQuestions] = useState([
    {
      question: "Questions will show after game start.",
      options: ["", "", "", ""],
      answer: "A"
    },
  ]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [questionsLoaded, setQuestionsLoaded] = useState(true);
  const [leaderboardLoaded, setLeaderboardLoaded] = useState(true);

  // UI snapshot state (not used for movement/drawing timing)
  const [worms, setWorms] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [gameTime, setGameTime] = useState(0);
  const [showSplash, setShowSplash] = useState(true);
  const [showNextLevel, setShowNextLevel] = useState(false);
  const [questionAnimationClass, setQuestionAnimationClass] = useState('fade-in');
  const [lastWrongQuestion, setLastWrongQuestion] = useState(null);
  const [lastCorrectAnswer, setLastCorrectAnswer] = useState(null);

  // Practice mode state
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [showPracticeModePopup, setShowPracticeModePopup] = useState(false);
  const [practiceModeDisabled, setPracticeModeDisabled] = useState(false);
  const [performanceHistory, setPerformanceHistory] = useState([]);
  const [currentGameStart, setCurrentGameStart] = useState(null);
  const [lastMoveTime, setLastMoveTime] = useState(null);

  // Canvas & images
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const tunaImagesRef = useRef({});
  const bgImageRef = useRef(null);

  // Timing/animation refs
  const lastStepTimeRef = useRef(0);
  const slowGlowPhaseRef = useRef(0);
  const slowGlowAlphaRef = useRef(0);

  // Explosion animation refs
  const isExplodingRef = useRef(false);
  const explosionStartRef = useRef(0);
  const explosionSegmentsRef = useRef([]);
  const shakeStartRef = useRef(0);

  // Authoritative high-frequency game state (refs)
  const snakeRef = useRef([
    { x: GRID_SIZE * 4, y: GRID_SIZE * 8 },
    { x: GRID_SIZE * 3, y: GRID_SIZE * 8 },
    { x: GRID_SIZE * 2, y: GRID_SIZE * 8 }
  ]);
  const wormsRef = useRef([]);
  const directionRef = useRef({ x: 0, y: 0 }); // current movement applied on tick
  const nextDirRef = useRef({ x: 0, y: 0 });   // next movement from input (applied next tick)
  const pendingDirRef = useRef(null);          // one extra buffered turn for the following tick
  const awaitingInitialMoveRef = useRef(true);
  const startTimeRef = useRef(null);
  const isSlowRef = useRef(false);
  const levelRef = useRef(1);
  const usedQuestionsRef = useRef([]);
  const currentQuestionIndexRef = useRef(null);

  // Preload tuna images and background
  useEffect(() => {
    const imagesToLoad = [
      'head_up', 'head_down', 'head_left', 'head_right',
      'straight_body_vertical_up', 'straight_body_vertical_down',
      'straight_body_horizontal_left', 'straight_body_horizontal_right',
      'turning_body_up_left', 'turning_body_up_right',
      'turning_body_down_left', 'turning_body_down_right',
      'tail_vertical_up', 'tail_vertical_down',
      'tail_horizontal_left', 'tail_horizontal_right', 'worms'
    ];

    imagesToLoad.forEach(name => {
      const img = new Image();
      img.src = `${process.env.PUBLIC_URL}/${name}.png`;
      tunaImagesRef.current[name] = img;
    });

    // Load background image
    const bgImg = new Image();
    bgImg.src = `${process.env.PUBLIC_URL}/bg.png`;
    bgImageRef.current = bgImg;
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // Load questions and leaderboard
  useEffect(() => {
    if (!user) return;

    const loadQuestions = async () => {
      try {
        const response = await fetch(`/api/questions?folder=${currentBank}`, {
          credentials: 'include'
        });
        const data = await response.json();
        if (data && Array.isArray(data) && data.length > 0) {
          setQuestions(data);
        }
        setQuestionsLoaded(true);
      } catch (error) {
        console.error('Failed to load questions:', error);
        window.alert('Failed to load questions.');
        setQuestionsLoaded(true);
      }
    };

    const loadLeaderboard = async () => {
      try {
        const response = await fetch(`/api/leaderboard?folder=${currentBank}`, {
          credentials: 'include'
        });
        const data = await response.json();
        setLeaderboard(Array.isArray(data) ? data : []);
        setLeaderboardLoaded(true);
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
        setLeaderboard([]);
        setLeaderboardLoaded(true);
      }
    };

    loadQuestions();
    loadLeaderboard();
  }, [user, currentBank]);

  // Initialize first question
  useEffect(() => {
    if (questions.length > 0 && !currentQuestion) {
      const { question, questionIndex, usedQuestions: newUsed } = getRandomQuestion(questions, usedQuestionsRef.current || []);
      setCurrentQuestion(question);
      currentQuestionIndexRef.current = questionIndex;
      usedQuestionsRef.current = newUsed;

      const newWorms = generateWormsForQuestion(question, snakeRef.current);
      wormsRef.current = newWorms;
      setWorms(newWorms);

      const animations = ["fade-in", "zoom-in", "slide-left", "bounce-in"];
      setQuestionAnimationClass(animations[Math.floor(Math.random() * animations.length)]);
    }
  }, [questions, currentQuestion]);

  // Water splash explosion animation loop - Maori ocean theme
  const explosionLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const MAX_TRAIL = 15;
    const SHAKE_MAGNITUDE = 12; // Gentler shake for water theme

    const elapsed = Date.now() - explosionStartRef.current;
    const shake = Math.max(0, SHAKE_MAGNITUDE * (1 - (elapsed / 500)));
    const offsetX = (Math.random() - 0.5) * shake;
    const offsetY = (Math.random() - 0.5) * shake;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, offsetX, offsetY);
    ctx.clearRect(-offsetX, -offsetY, canvas.width, canvas.height);

    let done = true;

    if (explosionSegmentsRef.current.length > 0) {
      const head = explosionSegmentsRef.current[0];
      const centerX = head.x + GRID_SIZE / 2;
      const centerY = head.y + GRID_SIZE / 2;

      // 🌊 Water ripple waves expanding outward
      const numRipples = 4;
      for (let i = 0; i < numRipples; i++) {
        const rippleDelay = i * 150;
        const rippleElapsed = elapsed - rippleDelay;
        if (rippleElapsed > 0) {
          const rippleRadius = rippleElapsed * 0.4;
          const rippleAlpha = Math.max(0, 0.6 - rippleElapsed / 800);

          ctx.save();
          ctx.globalAlpha = rippleAlpha;
          ctx.strokeStyle = `hsla(195, 85%, 70%, ${rippleAlpha})`;
          ctx.lineWidth = 3 - (i * 0.5);
          ctx.shadowColor = "#4dd0e1";
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(centerX, centerY, rippleRadius, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.restore();
        }
      }

      // 💧 Water droplet spray particles
      for (let j = 0; j < 20; j++) {
        const angle = (Math.PI * 2 * j / 20) + (elapsed / 300);
        const distance = 30 + elapsed * 0.15 + Math.sin(elapsed / 100 + j) * 8;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance - (elapsed * 0.1); // Slight upward drift
        const dropletSize = 5 + Math.sin(elapsed / 80 + j) * 3;
        const alpha = Math.max(0, 0.7 - elapsed / 900);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.shadowColor = "#26c6da";
        ctx.shadowBlur = 10;
        ctx.fillStyle = `hsla(190, 80%, 75%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, dropletSize, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
      }

      // 🫧 Rising bubbles
      for (let b = 0; b < 12; b++) {
        const bubbleX = centerX + (Math.random() - 0.5) * 80;
        const bubbleY = centerY - (elapsed * 0.2) + b * 15;
        const bubbleSize = 6 + Math.random() * 8;
        const bubbleAlpha = Math.max(0, 0.5 - elapsed / 1000);

        if (bubbleAlpha > 0.05) {
          ctx.save();
          ctx.globalAlpha = bubbleAlpha * 0.6;
          ctx.fillStyle = `hsla(180, 60%, 85%, ${bubbleAlpha * 0.4})`;
          ctx.strokeStyle = `hsla(190, 80%, 90%, ${bubbleAlpha})`;
          ctx.lineWidth = 2;
          ctx.shadowColor = "#b2ebf2";
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(bubbleX, bubbleY, bubbleSize, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      }

      // 💎 Central splash impact
      ctx.save();
      ctx.globalAlpha = Math.max(0, 0.4 - elapsed / 600);
      ctx.shadowColor = "#80deea";
      ctx.shadowBlur = 40;
      ctx.fillStyle = `hsla(185, 90%, 80%, ${Math.max(0, 0.3 - elapsed / 600)})`;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 45 + elapsed * 0.12, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }

    // 🐟 Tuna segments dispersing with water trails
    explosionSegmentsRef.current.forEach(seg => {
      seg.x += seg.vx;
      seg.y += seg.vy;
      seg.vy += 0.15; // Gravity effect
      seg.vx *= 0.98; // Water resistance
      seg.vy *= 0.98;
      seg.alpha -= 0.022;

      if (seg.alpha > 0.02) done = false;

      seg.trail.push({ x: seg.x, y: seg.y, alpha: seg.alpha });
      if (seg.trail.length > MAX_TRAIL) seg.trail.shift();

      // 💧 Flowing water trails
      for (let i = 0; i < seg.trail.length - 1; i++) {
        const t0 = seg.trail[i];
        const t1 = seg.trail[i + 1];

        ctx.save();
        ctx.globalAlpha = Math.max(0, t0.alpha * 0.25);
        ctx.strokeStyle = seg.color;
        ctx.lineWidth = 7 - 6 * (i / MAX_TRAIL);
        ctx.shadowColor = seg.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(t0.x + GRID_SIZE / 2, t0.y + GRID_SIZE / 2);
        ctx.lineTo(t1.x + GRID_SIZE / 2, t1.y + GRID_SIZE / 2);
        ctx.stroke();
        ctx.restore();
      }

      // 🐠 Segment with water shimmer
      ctx.save();
      ctx.globalAlpha = Math.max(0, seg.alpha);
      ctx.shadowColor = "#4dd0e1";
      ctx.shadowBlur = 25;
      ctx.fillStyle = seg.color;
      ctx.strokeStyle = `hsla(190, 100%, 95%, ${seg.alpha * 0.8})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(seg.x, seg.y, GRID_SIZE, GRID_SIZE, 10);
      else ctx.rect(seg.x, seg.y, GRID_SIZE, GRID_SIZE);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });

    ctx.restore();

    if (!done && isExplodingRef.current) {
      requestAnimationFrame(explosionLoop);
    }
  }, []);

  // Helper: pick tuna image based on adjacent segments and current direction
  const getTunaImage = useCallback((segment, idx, snakeArr) => {
    const prev = idx > 0 ? snakeArr[idx - 1] : null;
    const next = idx < snakeArr.length - 1 ? snakeArr[idx + 1] : null;

    const dirFromPrev = prev ? {
      x: segment.x - prev.x,
      y: segment.y - prev.y
    } : null;

    const dirToNext = next ? {
      x: next.x - segment.x,
      y: next.y - segment.y
    } : null;

    // Head
    if (idx === 0) {
      if (dirToNext) {
        if (dirToNext.x > 0) return 'head_left';
        if (dirToNext.x < 0) return 'head_right';
        if (dirToNext.y > 0) return 'head_up';
        if (dirToNext.y < 0) return 'head_down';
      }
      const d = directionRef.current || { x: 0, y: 0 };
      if (d.x > 0) return 'head_right';
      if (d.x < 0) return 'head_left';
      if (d.y > 0) return 'head_down';
      if (d.y < 0) return 'head_up';
      return 'head_right';
    }

    // Tail
    if (idx === snakeArr.length - 1) {
      if (dirFromPrev) {
        if (dirFromPrev.x > 0) return 'tail_horizontal_left';
        if (dirFromPrev.x < 0) return 'tail_horizontal_right';
        if (dirFromPrev.y > 0) return 'tail_vertical_up';
        if (dirFromPrev.y < 0) return 'tail_vertical_down';
      }
      return 'tail_horizontal_right';
    }

    // Body
    if (dirFromPrev && dirToNext) {
      const isTurning = dirFromPrev.x !== dirToNext.x && dirFromPrev.y !== dirToNext.y;
      if (isTurning) {
        if (dirFromPrev.x > 0 && dirToNext.y < 0) return 'turning_body_up_left';
        if (dirFromPrev.x > 0 && dirToNext.y > 0) return 'turning_body_down_left';
        if (dirFromPrev.x < 0 && dirToNext.y < 0) return 'turning_body_up_right';
        if (dirFromPrev.x < 0 && dirToNext.y > 0) return 'turning_body_down_right';
        if (dirFromPrev.y > 0 && dirToNext.x < 0) return 'turning_body_up_left';
        if (dirFromPrev.y > 0 && dirToNext.x > 0) return 'turning_body_up_right';
        if (dirFromPrev.y < 0 && dirToNext.x < 0) return 'turning_body_down_left';
        if (dirFromPrev.y < 0 && dirToNext.x > 0) return 'turning_body_down_right';
      } else {
        if (dirFromPrev.x !== 0) {
          return dirFromPrev.x > 0 ? 'straight_body_horizontal_left' : 'straight_body_horizontal_right';
        } else {
          return dirFromPrev.y > 0 ? 'straight_body_vertical_up' : 'straight_body_vertical_down';
        }
      }
    }

    return 'straight_body_horizontal_right';
  }, []);

  // Draw to canvas (read refs directly)
  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    if (bgImageRef.current && bgImageRef.current.complete) {
      ctx.drawImage(bgImageRef.current, 0, 0, canvas.width, canvas.height);
    }

    // Very light grid
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 0.5;

    for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    ctx.restore();

    const wormsToDraw = wormsRef.current || [];
    const snakeToDraw = snakeRef.current || [];
    const awaiting = awaitingInitialMoveRef.current;

    // Worms
    wormsToDraw.forEach((worm, i) => {
      ctx.save();

      const t = Date.now() / 600 + i;
      const dx = awaiting ? 0 : Math.sin(t) * 2;
      const dy = awaiting ? 0 : Math.cos(t + 0.4) * 2;

      const cx = worm.x + GRID_SIZE / 2 + dx;
      const cy = worm.y + GRID_SIZE / 2 + dy;

      const wormsImg = tunaImagesRef.current['worms'];

      if (wormsImg && wormsImg.complete) {
        ctx.shadowColor = worm.color;
        ctx.shadowBlur = 35;

        const crabSize = GRID_SIZE * 1.5;
        const offsetX = (GRID_SIZE - crabSize) / 2;
        const offsetY = (GRID_SIZE - crabSize) / 2;

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = crabSize;
        tempCanvas.height = crabSize;

        tempCtx.drawImage(wormsImg, 0, 0, crabSize, crabSize);

        try {
          const imageData = tempCtx.getImageData(0, 0, crabSize, crabSize);
          const data = imageData.data;
          const colorMatch = worm.color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
          if (colorMatch) {
            const [, h, s, l] = colorMatch.map(Number);
            const hslToRgb = (h, s, l) => {
              h /= 360; s /= 100; l /= 100;
              const a = s * Math.min(l, 1 - l);
              const f = n => {
                const k = (n + h * 12) % 12;
                return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
              };
              return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
            };
            const [r, g, b] = hslToRgb(h, s, l);
            for (let i = 0; i < data.length; i += 4) {
              if (data[i + 3] > 0) {
                const alpha = 0.7;
                data[i] = data[i] * (1 - alpha) + r * alpha;
                data[i + 1] = data[i + 1] * (1 - alpha) + g * alpha;
                data[i + 2] = data[i + 2] * (1 - alpha) + b * alpha;
              }
            }
            tempCtx.putImageData(imageData, 0, 0);
          }
        } catch (e) {
          // ignore CORS errors (fallback handled below)
        }

        ctx.drawImage(tempCanvas, worm.x + dx + offsetX, worm.y + dy + offsetY);
      } else {
        ctx.shadowColor = worm.color;
        ctx.shadowBlur = 28;
        ctx.beginPath();
        ctx.arc(cx, cy, GRID_SIZE / 1.85, 0, 2 * Math.PI);
        ctx.fillStyle = worm.color;
        ctx.fill();
      }

      ctx.shadowColor = "#fff";
      ctx.shadowBlur = 25;
      ctx.globalAlpha = 0.95;
      ctx.font = `bold ${Math.floor(GRID_SIZE * 0.45)}px Segoe UI, Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#ffffff";
      ctx.strokeText(worm.label, cx, cy + 1);
      ctx.fillStyle = "#111";
      ctx.fillText(worm.label, cx, cy + 1);
      ctx.globalAlpha = 1;
      ctx.restore();
    });

    // Snake
    snakeToDraw.forEach((segment, idx) => {
      ctx.save();

      const imageName = getTunaImage(segment, idx, snakeToDraw);
      const img = tunaImagesRef.current[imageName];

      if (slowGlowAlphaRef.current > 0.03) {
        const hue = (slowGlowPhaseRef.current * 36 + idx * 23) % 360;
        const pulse = 0.8 + 0.25 * Math.sin(slowGlowPhaseRef.current + idx * 0.6);
        ctx.shadowColor = `hsl(${hue}, 98%, 75%)`;
        ctx.shadowBlur = 40 * pulse * slowGlowAlphaRef.current;
      } else {
        ctx.shadowColor = idx === 0 ? "#ffe082" : "#26ffd5";
        ctx.shadowBlur = idx === 0 ? 6 : 3;
      }

      if (img && img.complete) {
        ctx.drawImage(img, segment.x, segment.y, GRID_SIZE, GRID_SIZE);
      } else {
        const hue1 = (180 + idx * 8) % 360;
        const hue2 = (hue1 + 40) % 360;
        const grad = ctx.createLinearGradient(
          segment.x, segment.y,
          segment.x + GRID_SIZE, segment.y + GRID_SIZE
        );
        grad.addColorStop(0, `hsl(${hue1}, 80%, 85%)`);
        grad.addColorStop(1, `hsl(${hue2}, 65%, 60%)`);

        ctx.fillStyle = grad;
        ctx.strokeStyle = slowGlowAlphaRef.current > 0.03 ? "#fff" : "#111";
        ctx.lineWidth = 2;

        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(segment.x, segment.y, GRID_SIZE, GRID_SIZE, 7);
        } else {
          ctx.rect(segment.x, segment.y, GRID_SIZE, GRID_SIZE);
        }

        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    });
  }, [getTunaImage]);

  // Update game time
  useEffect(() => {
    if (isGameRunning && startTimeRef.current) {
      const interval = setInterval(() => {
        setGameTime((Date.now() - startTimeRef.current) / 1000);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isGameRunning]);

  // End game callback (reads refs)
  const endGame = useCallback(() => {
    setIsGameRunning(false);
    setIsGameOver(true);

    // Trigger explosion animation
    isExplodingRef.current = true;
    explosionStartRef.current = Date.now();
    shakeStartRef.current = Date.now();

    explosionSegmentsRef.current = snakeRef.current.map((seg, idx) => {
      let angle = Math.random() * Math.PI * 2;
      let speed = 6 + Math.random() * 7; // Slightly slower for water effect
      let segColor = getWaterColor();
      if (idx === 0) segColor = "#00e5ff"; // Bright cyan for head (water splash)
      return {
        ...seg,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2, // Initial upward motion for splash
        alpha: 1,
        color: segColor,
        trail: [{ x: seg.x, y: seg.y, alpha: 1 }]
      };
    });

    requestAnimationFrame(explosionLoop);

    // Practice mode detection (unchanged logic, adapted to refs where needed)
    if (!isPracticeMode && currentGameStart) {
      const gameEndTime = Date.now();
      const gameDuration = (gameEndTime - currentGameStart) / 1000;
      const snakeLength = snakeRef.current.length;
      const timeSinceLastMove = lastMoveTime ? (gameEndTime - lastMoveTime) / 1000 : 0;

      const performance = {
        duration: gameDuration,
        level: levelRef.current,
        snakeLength: snakeLength,
        timeSinceLastMove: timeSinceLastMove,
        timestamp: gameEndTime
      };

      setPerformanceHistory(prev => {
        const updated = [...prev, performance];
        if (updated.length > 5) updated.shift();
        return updated;
      });

      if (performanceHistory.length >= 2 && !practiceModeDisabled) {
        const recentGames = [...performanceHistory, performance].slice(-3);
        const isStruggling = detectStrugglingPlayer(recentGames);
        if (isStruggling) setShowPracticeModePopup(true);
      }
    }

    // Save score (non practice)
    if (!isPracticeMode && user) {
      const finalEntry = {
        name: user.username,
        level: levelRef.current,
        time: startTimeRef.current ? ((Date.now() - startTimeRef.current) / 1000).toFixed(2) : 0,
        folder: currentBank
      };

      setLeaderboard(prev => {
        const updated = [...prev, finalEntry];
        updated.sort((a, b) => b.level - a.level || a.time - b.time);
        fetch('/api/leaderboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalEntry)
        }).catch(err => console.error('Failed to save score:', err));
        return updated;
      });
    }

    // Delay showing splash until after explosion completes
    setTimeout(() => {
      setShowSplash(true);
      isExplodingRef.current = false; // Allow input after splash is shown
    }, 1100);
  }, [user, currentGameStart, lastMoveTime, performanceHistory, practiceModeDisabled, isPracticeMode, currentBank, explosionLoop]);

  const detectStrugglingPlayer = (recentGames) => {
    let strugglingCount = 0;
    for (const game of recentGames) {
      let indicators = 0;
      if (game.duration < 10) indicators++;
      if (game.snakeLength < 5 && game.duration > 3) indicators++;
      if (game.timeSinceLastMove > 3) indicators++;
      if (indicators >= 2) strugglingCount++;
    }
    return strugglingCount >= 2;
  };

  // Main game loop with tempo-safe two-stage input buffer
  useEffect(() => {
    if (!isGameRunning) return;

    const isOpposite = (a, b) => (a.x + b.x === 0 && a.y + b.y === 0);
    const isSame = (a, b) => (a.x === b.x && a.y === b.y);

    // One-tick move, returns false if died
    const moveSnakeOnce = async () => {
      // Apply the next scheduled direction; keep moving in that direction
      const d = nextDirRef.current;
      directionRef.current = d;
      if (d.x === 0 && d.y === 0) return true; // idle before first move

      const head = {
        x: snakeRef.current[0].x + d.x,
        y: snakeRef.current[0].y + d.y
      };
      const newSnake = [head, ...snakeRef.current];

      const eatenIdx = (wormsRef.current || []).findIndex(w => w.x === head.x && w.y === head.y);
      if (eatenIdx !== -1) {
        const worm = wormsRef.current[eatenIdx];
        
        // Check answer with backend
        try {
          const response = await fetch('/api/questions/check-answer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              folder: currentBank,
              questionIndex: currentQuestionIndexRef.current,
              selectedAnswer: worm.label
            })
          });
          
          const result = await response.json();
          
          if (result.success && result.correct) {
            // Level up
            levelRef.current = (levelRef.current || 1) + 1;
            setLevel(levelRef.current);

            // Leaderboard (non practice)
            if (!isPracticeMode && user) {
              const newEntry = {
                name: user.username,
                level: levelRef.current,
                time: startTimeRef.current ? ((Date.now() - startTimeRef.current) / 1000).toFixed(2) : 0,
                folder: currentBank
              };
              setLeaderboard(prev => {
                const idx = prev.findIndex(e => e.name === user.username);
                const updated = idx !== -1 ? Object.assign([...prev], { [idx]: newEntry }) : [...prev, newEntry];
                updated.sort((a, b) => b.level - a.level || a.time - b.time);
                fetch('/api/leaderboard', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newEntry)
                }).catch(err => console.error('Failed to save score:', err));
                return updated;
              });
            }

            // Next question + worms
            const { question, questionIndex, usedQuestions: newUsed } = getRandomQuestion(questions, usedQuestionsRef.current || []);
            if (question) {
              setCurrentQuestion(question);
              currentQuestionIndexRef.current = questionIndex;
              usedQuestionsRef.current = newUsed;

              const newWorms = generateWormsForQuestion(question, newSnake);
              wormsRef.current = newWorms;
              setWorms(newWorms);
            }

            // Commit snake
            snakeRef.current = newSnake;

            // Slow-motion effect
            isSlowRef.current = true;
            setTimeout(() => {
              isSlowRef.current = false;
            }, 2000);

            // Next level CTA
            if (!isPracticeMode && usedQuestionsRef.current && usedQuestionsRef.current.length >= Math.ceil(questions.length / 2)) {
              setShowNextLevel(true);
            }

            // Question animation
            const animations = ["fade-in", "zoom-in", "slide-left", "bounce-in"];
            setQuestionAnimationClass(animations[Math.floor(Math.random() * animations.length)]);

            // After a successful move, promote pending turn (if valid vs new direction)
            if (pendingDirRef.current) {
              const pd = pendingDirRef.current;
              if (!isOpposite(pd, directionRef.current) && !isSame(pd, directionRef.current)) {
                nextDirRef.current = pd;
              }
              pendingDirRef.current = null;
            }

            return true;
          } else {
            // Wrong answer - store it for display in splash
            setLastWrongQuestion(currentQuestion);
            setLastCorrectAnswer(result.correctAnswer || 'Unknown');
            endGame();
            return false;
          }
        } catch (error) {
          console.error('Error checking answer:', error);
          // On error, treat as wrong answer
          setLastWrongQuestion(currentQuestion);
          setLastCorrectAnswer('Error');
          endGame();
          return false;
        }
      } else {
        // Move forward (pop tail)
        newSnake.pop();
        snakeRef.current = newSnake;

        // After a successful move, promote pending turn (if valid vs new direction)
        if (pendingDirRef.current) {
          const pd = pendingDirRef.current;
          if (!isOpposite(pd, directionRef.current) && !isSame(pd, directionRef.current)) {
            nextDirRef.current = pd;
          }
          pendingDirRef.current = null;
        }

        return true;
      }
    };

    const checkCollision = () => {
      const head = snakeRef.current[0];
      const d = directionRef.current;
      if (d.x === 0 && d.y === 0) return false;
      if (head.x < 0 || head.x >= CANVAS_WIDTH || head.y < 0 || head.y >= CANVAS_HEIGHT) return true;
      for (let i = 1; i < snakeRef.current.length; i++) {
        if (snakeRef.current[i].x === head.x && snakeRef.current[i].y === head.y) return true;
      }
      return false;
    };

    const gameLogicLoop = async () => {
      const now = Date.now();
      if (!lastStepTimeRef.current) lastStepTimeRef.current = now;

      const baseDelay = isSlowRef.current ? 340 : Math.max(MIN_STEP_DELAY, START_STEP_DELAY - 2 * (levelRef.current || 1));
      const stepDelay = isPracticeMode ? baseDelay + 80 : baseDelay;

      // Slow glow animation
      const fadeSpeed = 0.09;
      if (isSlowRef.current) {
        slowGlowPhaseRef.current += 0.09;
        slowGlowAlphaRef.current += fadeSpeed * (1 - slowGlowAlphaRef.current);
      } else {
        slowGlowAlphaRef.current += fadeSpeed * (0 - slowGlowAlphaRef.current);
        slowGlowPhaseRef.current = 0;
      }

      // Awaiting initial move (keep drawing, no movement yet)
      if (awaitingInitialMoveRef.current && (nextDirRef.current.x === 0 && nextDirRef.current.y === 0)) {
        return;
      }

      while (now - lastStepTimeRef.current >= stepDelay) {
        // If this is the first move, clear the awaitingInitialMove flag after executing it
        const wasAwaitingInitialMove = awaitingInitialMoveRef.current;
        
        const moveResult = await moveSnakeOnce();
        
        if (wasAwaitingInitialMove) {
          awaitingInitialMoveRef.current = false;
        }
        
        if (!moveResult) return;
        if (checkCollision()) {
          endGame();
          return;
        }
        lastStepTimeRef.current += stepDelay;
      }
    };

    // Start loops
    const logicIntervalId = setInterval(gameLogicLoop, 16); // ~60Hz logic
    let rafId = null;
    const drawLoop = () => {
      drawGame();
      rafId = requestAnimationFrame(drawLoop);
      gameLoopRef.current = rafId;
    };
    rafId = requestAnimationFrame(drawLoop);
    gameLoopRef.current = rafId;

    return () => {
      clearInterval(logicIntervalId);
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [isGameRunning, isPracticeMode, drawGame, endGame, questions, currentBank, user, currentQuestion]);

  const startGame = useCallback(() => {
    if (!questions || questions.length === 0) {
      console.error('No questions available');
      return;
    }

    // Reset explosion state
    isExplodingRef.current = false;

    // Initialize refs
    const initialSnake = [
      { x: GRID_SIZE * 4, y: GRID_SIZE * 8 },
      { x: GRID_SIZE * 3, y: GRID_SIZE * 8 },
      { x: GRID_SIZE * 2, y: GRID_SIZE * 8 }
    ];
    snakeRef.current = initialSnake;
    directionRef.current = { x: 0, y: 0 };
    nextDirRef.current = { x: 0, y: 0 };
    pendingDirRef.current = null;
    awaitingInitialMoveRef.current = true;
    isSlowRef.current = false;
    levelRef.current = 1;
    startTimeRef.current = null; // set on first input

    // UI state
    setIsGameOver(false);
    setLevel(1);
    setCurrentGameStart(Date.now());
    setLastMoveTime(null);
    lastStepTimeRef.current = 0;
    setShowSplash(false);
    setShowNextLevel(false);
    setShowPracticeModePopup(false); // Close practice mode popup if open
    setLastWrongQuestion(null); // Reset last wrong question
    setLastCorrectAnswer(null); // Reset last correct answer

    const { question, questionIndex, usedQuestions: newUsed } = getRandomQuestion(questions, []);
    if (!question) {
      console.error('Could not get a valid question');
      return;
    }

    setCurrentQuestion(question);
    currentQuestionIndexRef.current = questionIndex;
    usedQuestionsRef.current = newUsed;

    const newWorms = generateWormsForQuestion(question, initialSnake);
    wormsRef.current = newWorms;
    setWorms(newWorms);

    const animations = ["fade-in", "zoom-in", "slide-left", "bounce-in"];
    setQuestionAnimationClass(animations[Math.floor(Math.random() * animations.length)]);

    setIsGameRunning(true);
  }, [questions]);

  const handlePracticeModeAccept = (dontShowAgain) => {
    setIsPracticeMode(true);
    setShowPracticeModePopup(false);
    if (dontShowAgain) setPracticeModeDisabled(true);
  };

  const handlePracticeModeDecline = (dontShowAgain) => {
    setShowPracticeModePopup(false);
    if (dontShowAgain) setPracticeModeDisabled(true);
  };

  const handleExitPracticeMode = () => {
    setIsPracticeMode(false);
  };

  // Keyboard input: tempo-safe two-stage buffer
  useEffect(() => {
    const isOpposite = (a, b) => (a.x + b.x === 0 && a.y + b.y === 0);
    const isSame = (a, b) => (a.x === b.x && a.y === b.y);

    const handleKey = (e) => {
      // Block all input during explosion animation
      if (isExplodingRef.current) {
        return;
      }

      if (!isGameRunning) {
        if (e.key.toLowerCase() === 's' && questionsLoaded && leaderboardLoaded) {
          startGame();
        }
        return;
      }

      const key = e.key.toLowerCase();
      let newDir = null;
      if (key === 'arrowup' || key === 'w') newDir = { x: 0, y: -GRID_SIZE };
      else if (key === 'arrowdown' || key === 's') newDir = { x: 0, y: GRID_SIZE };
      else if (key === 'arrowleft' || key === 'a') newDir = { x: -GRID_SIZE, y: 0 };
      else if (key === 'arrowright' || key === 'd') newDir = { x: GRID_SIZE, y: 0 };
      if (!newDir) return;

      // Determine current effective direction (or infer from body if idle)
      const moving = (directionRef.current.x !== 0 || directionRef.current.y !== 0);
      const eff = moving
        ? directionRef.current
        : (snakeRef.current.length > 1
          ? {
            x: snakeRef.current[0].x - snakeRef.current[1].x,
            y: snakeRef.current[0].y - snakeRef.current[1].y
          }
          : { x: 0, y: 0 });

      // First valid input: start rhythm from this press (snake.js)
      if (awaitingInitialMoveRef.current) {
        if (!isOpposite(newDir, eff)) {
          nextDirRef.current = newDir;
          // Don't set awaitingInitialMoveRef to false here!
          // It will be set to false after the first move executes in gameLogicLoop
          const now = Date.now();
          startTimeRef.current = now;
          lastStepTimeRef.current = now;
          directionRef.current = newDir; // visual orientation
          setLastMoveTime(now);
          // Clear any pending direction to prevent suicide from multiple quick inputs
          pendingDirRef.current = null;
        }
        // IMPORTANT: Return here regardless of whether input was valid or not
        // This ensures we ignore ALL inputs until the first move actually executes
        return;
      }

      // After first move:
      setLastMoveTime(Date.now());

      const currentDir = directionRef.current;
      const primaryQueued = !isSame(nextDirRef.current, currentDir); // a turn already scheduled?

      if (!primaryQueued) {
        // No primary turn queued: schedule for next tick if not reversing
        if (!isOpposite(newDir, currentDir) && !isSame(newDir, currentDir)) {
          nextDirRef.current = newDir;
          // Clear any stale pending (shouldn't exist)
          pendingDirRef.current = null;
        }
      } else {
        // One primary turn already queued (nextDirRef): allow ONE extra pending turn validated vs that primary
        const primary = nextDirRef.current;
        if (!isOpposite(newDir, primary) && !isSame(newDir, primary)) {
          // Last intent wins for the pending slot
          pendingDirRef.current = newDir;
        }
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isGameRunning, questionsLoaded, leaderboardLoaded, startGame]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    setLevel(1);
    setIsGameRunning(false);
    setIsGameOver(false);
    setShowSplash(true);
  };

  const handleBankChange = (bank) => {
    if (bank && bank.folder) {
      setCurrentBank(bank.folder);
      setLevel(1);
      setIsGameRunning(false);
      setIsGameOver(false);
      setShowSplash(true);
      usedQuestionsRef.current = [];
    }
  };

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        color: '#ffe082',
        fontSize: '1.5rem'
      }}>
        Loading...
      </div>
    );
  }

  // Render login form if not authenticated
  if (!user) {
    return (
      <>
        <LanguageSwitcher
          currentLanguage={language}
          onLanguageChange={setLanguage}
          translations={t}
        />
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          translations={t}
        />
      </>
    );
  }

  return (
    <div className="App">
      <LanguageSwitcher
        currentLanguage={language}
        onLanguageChange={setLanguage}
        translations={t}
      />
      <div className="split-container">
        {/* Left Panel */}
        <div className="left-panel">
          {/* User Panel */}
          <UserPanel
            user={user}
            onLogout={handleLogout}
            onQuestionBankChange={handleBankChange}
            translations={t}
          />
          {/* Question Panel */}
          <div className="question-panel">
            {currentQuestion ? (
              <div>
                <div className={questionAnimationClass} style={{ marginBottom: '7px', fontSize: '1.15em' }}>
                  <b>{t.questionPrefix}</b> {currentQuestion.question}
                </div>
                <div className={`choices-row ${questionAnimationClass}`}>
                  {currentQuestion.options.map((option, i) => {
                    const label = ["A", "B", "C", "D"][i];
                    const worm = worms.find(w => w.label === label);
                    const color = worm ? worm.color : '#ffffff';

                    return (
                      <div
                        key={i}
                        style={{
                          background: `${color}20`,
                          border: `2px solid ${color}`,
                          borderRadius: '12px',
                          padding: '5px 7px',
                          margin: '3px',
                          fontWeight: 'bold',
                          color: color,
                          boxShadow: `0 0 6px ${color}`,
                        }}
                      >
                        <span style={{ color: color, fontSize: '1.1em' }}>{label}:</span>{' '}
                        <span style={{ color: color, fontSize: '1em' }}>{option}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '1.3em', marginBottom: '15px', fontWeight: 'bold', color: '#ffe082' }}>
                  {t.howToPlayTitle}
                </div>
                <div style={{ fontSize: '1.05em', color: '#b4eaff', lineHeight: '1.6' }}>
                  {t.howToPlayInstructions.map((instruction, i) => (
                    <React.Fragment key={i}>
                      {instruction}
                      {i < t.howToPlayInstructions.length - 1 && <><br /><br /></>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Next Level Button */}
          {showNextLevel && (
            <div className="next-level-btn" style={{ display: 'block' }}>
              <div className="next-level-message">
                {t.nextLevelCongrats}
                {' '}
                {t.nextLevelEligible}
                <button
                  onClick={() => window.location.href = '/comp705-02/'}
                  style={{
                    backgroundColor: '#fff200',
                    marginLeft: '16px',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 10px',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    color: '#222',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                  }}
                >
                  {t.nextLevelButton}
                </button>
              </div>
            </div>
          )}

          {/* Leaderboard */}
          <div id="mainLeaderboard">
            <div style={{
              fontSize: '1.5em',
              marginBottom: '12px',
              fontWeight: '700',
              color: '#ffe082',
              letterSpacing: '1px'
            }}>
              {t.leaderboardTitle}
            </div>
            <div style={{
              width: '100%',
              background: '#21293a',
              borderRadius: '18px',
              padding: '18px 16px 8px 16px',
              boxShadow: '0 6px 24px #1b2235b3',
            }}>
              <div id="innerLeaderboard" style={{
                width: '100%',
                maxHeight: '30vh',
                overflowY: 'auto',
                borderRadius: '11px',
              }}>
                <table style={{
                  width: '100%',
                  minWidth: '440px',
                  color: '#fff',
                  borderCollapse: 'separate',
                  borderSpacing: '0',
                  fontSize: '1.18em',
                }}>
                  <thead>
                    <tr style={{ background: '#2c3b55' }}>
                      <th style={{ color: '#ffe082', padding: '10px 6px 10px 0', textAlign: 'center', fontWeight: '700' }}>{t.leaderboardRank}</th>
                      <th style={{ color: '#81ff81', textAlign: 'center', fontWeight: '700' }}>{t.leaderboardName}</th>
                      <th style={{ color: '#60e8fe', textAlign: 'center', fontWeight: '700' }}>{t.leaderboardLevel}</th>
                      <th style={{ color: '#ffd580', textAlign: 'center', fontWeight: '700' }}>{t.leaderboardTime}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ color: '#aaa', padding: '24px 0', textAlign: 'center', fontSize: '1.13em' }}>
                          {t.leaderboardEmpty}
                        </td>
                      </tr>
                    ) : (
                      leaderboard.map((row, i) => {
                        const isUser = row.name === user.username;
                        const medal = ['🥇', '🥈', '🥉'];

                        return (
                          <tr
                            key={i}
                            style={{
                              background: isUser ? '#004d40' : (i % 2 === 0 ? '#23324a' : '#23233a'),
                              fontWeight: i < 3 ? '700' : 'normal',
                              border: isUser ? '2px solid #00ffc3' : 'none',
                            }}
                          >
                            <td style={{ color: '#ffe082', padding: '8px 6px 8px 0', textAlign: 'center' }}>
                              {i < 3 ? medal[i] : (i + 1)}
                            </td>
                            <td style={{ color: '#81ff81', fontWeight: '600', letterSpacing: '0.5px', textAlign: 'center' }}>
                              {row.name}
                            </td>
                            <td style={{ color: '#60e8fe', textAlign: 'center', fontSize: '1.12em' }}>
                              {row.level}
                            </td>
                            <td style={{ color: '#ffd580', textAlign: 'center', fontFamily: 'monospace' }}>
                              {row.time}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="right-panel">
          <div className="game-area">
            {/* Question Bank Selector */}
            <div style={{ marginBottom: '12px' }}>
              <QuestionBankSelector
                currentBank={currentBank}
                onBankChange={handleBankChange}
                translations={t}
              />
            </div>

            <div className="game-title">
              🧑‍💻 {t.gameTitle}{' '}
              <span style={{
                background: 'linear-gradient(90deg, #00c853, #64dd17)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 'bold',
              }}>
                {user.name}
              </span>
            </div>

            <div className="score" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <span>{t.gameLevel} {level} | {t.gameTime} {gameTime.toFixed(1)} s</span>
              {isPracticeMode && (
                <>
                  <span style={{
                    background: 'linear-gradient(135deg, #ff9800 0%, #f44336 100%)',
                    color: '#ffffff',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 6px rgba(255, 152, 0, 0.3)'
                  }}>
                    {t.practiceModeIndicator}
                  </span>
                  <button
                    onClick={handleExitPracticeMode}
                    style={{
                      background: 'linear-gradient(135deg, #00c853 0%, #64dd17 100%)',
                      color: '#ffffff',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(0, 200, 83, 0.3)',
                      transition: 'transform 0.2s ease'
                    }}
                    onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'}
                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    {t.exitPracticeMode}
                  </button>
                </>
              )}
            </div>

            <canvas
              ref={canvasRef}
              id="gameCanvas"
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
            />

            {showSplash && (
              <div className="splash">
                <div style={{ fontSize: '2.1rem', fontWeight: '600', marginBottom: '12px' }}>
                  {isGameOver ? `${t.splashPlayAgain} ${user.name}?` : `${t.splashReady} ${user.name}?`}
                </div>
                
                {/* Show the question and correct answer if player died from wrong answer */}
                {isGameOver && lastWrongQuestion && lastCorrectAnswer && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(255, 87, 34, 0.15) 0%, rgba(244, 67, 54, 0.15) 100%)',
                    border: '2px solid rgba(255, 87, 34, 0.5)',
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '20px',
                    boxShadow: '0 4px 20px rgba(255, 87, 34, 0.3)',
                  }}>
                    <div style={{
                      fontSize: '1.4rem',
                      fontWeight: '700',
                      marginBottom: '12px',
                      color: '#ff5722',
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}>
                      💀 You Got This Wrong:
                    </div>
                    <div style={{
                      fontSize: '1.1rem',
                      marginBottom: '15px',
                      color: '#fff',
                      lineHeight: '1.5',
                      background: 'rgba(0, 0, 0, 0.3)',
                      padding: '12px',
                      borderRadius: '8px',
                      borderLeft: '4px solid #ff5722'
                    }}>
                      <strong>Q:</strong> {lastWrongQuestion.question}
                    </div>
                    <div style={{
                      fontSize: '1.15rem',
                      fontWeight: '600',
                      padding: '12px',
                      background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.3) 0%, rgba(139, 195, 74, 0.3) 100%)',
                      borderRadius: '10px',
                      color: '#81ff81',
                      textShadow: '0 2px 4px rgba(0,0,0,0.4)',
                      border: '2px solid rgba(129, 255, 129, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <span style={{ fontSize: '1.5rem' }}>✅</span>
                      <span>
                        <strong>Correct Answer:</strong> {lastCorrectAnswer}
                        {lastWrongQuestion.options && lastWrongQuestion.options[['A', 'B', 'C', 'D'].indexOf(lastCorrectAnswer)] && 
                          ` - ${lastWrongQuestion.options[['A', 'B', 'C', 'D'].indexOf(lastCorrectAnswer)]}`}
                      </span>
                    </div>
                  </div>
                )}
                
                <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>
                  {t.splashStartPrompt}
                </div>
                <div style={{ fontSize: '1.05rem', marginBottom: '14px', color: '#ffe082' }}>
                  {t.splashQuestionsInfo} <span style={{ fontWeight: 'bold', color: '#81ff81' }}>
                    {questions.length}
                  </span> {t.splashQuestionsCount}
                  {' '}
                  {t.splashAim}
                </div>
                <div className="hint">
                  {t.splashHintCorrect}<br />
                  {t.splashHintWrong}<br /><br />
                  {t.splashHint50Percent}<br /><br />
                  {t.splashHintLeaderboard}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Practice Mode Popup */}
      {showPracticeModePopup && (
        <PracticeModePopup
          onAccept={handlePracticeModeAccept}
          onDecline={handlePracticeModeDecline}
          translations={t}
        />
      )}
    </div>
  );
}

export default App;