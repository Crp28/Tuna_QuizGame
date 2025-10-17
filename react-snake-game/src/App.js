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

const getRandomQuestion = (questions, usedQuestions) => {
  if (!questions || questions.length === 0) {
    console.error('No questions available');
    return { question: null, usedQuestions: [] };
  }
  if (usedQuestions.length >= questions.length) {
    usedQuestions = [];
  }
  let idx;
  do {
    idx = Math.floor(Math.random() * questions.length);
  } while (usedQuestions.includes(idx));
  usedQuestions.push(idx);
  return { question: questions[idx], usedQuestions };
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
    isCorrect: label === question.answer,
    color: getColor()
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

  // Game state
  const [questions, setQuestions] = useState([
    {
      question: "Questions will show after game start.",
      options: ["", "", "", ""],
    },
  ]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [questionsLoaded, setQuestionsLoaded] = useState(true);
  const [leaderboardLoaded, setLeaderboardLoaded] = useState(true);
  const [snake, setSnake] = useState([
    { x: GRID_SIZE * 4, y: GRID_SIZE * 8 },
    { x: GRID_SIZE * 3, y: GRID_SIZE * 8 },
    { x: GRID_SIZE * 2, y: GRID_SIZE * 8 }
  ]);
  const [direction, setDirection] = useState({ x: 0, y: 0 });
  const [nextDir, setNextDir] = useState({ x: 0, y: 0 });
  const inputQueueRef = useRef([]);
  const [worms, setWorms] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [usedQuestions, setUsedQuestions] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [gameTime, setGameTime] = useState(0);
  const [awaitingInitialMove, setAwaitingInitialMove] = useState(true);
  const [isSlow, setIsSlow] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showNextLevel, setShowNextLevel] = useState(false);
  const [questionAnimationClass, setQuestionAnimationClass] = useState('fade-in');

  // Practice mode state
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [showPracticeModePopup, setShowPracticeModePopup] = useState(false);
  const [practiceModeDisabled, setPracticeModeDisabled] = useState(false);
  const [performanceHistory, setPerformanceHistory] = useState([]);
  const [currentGameStart, setCurrentGameStart] = useState(null);
  const [lastMoveTime, setLastMoveTime] = useState(null);

  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const lastStepTimeRef = useRef(0);
  const slowGlowPhaseRef = useRef(0);
  const slowGlowAlphaRef = useRef(0);
  const tunaImagesRef = useRef({});
  const bgImageRef = useRef(null);
  const directionRef = useRef({ x: 0, y: 0 });

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
        // Call Node.js backend API with selected bank
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
        window.alert('Failed to load questions.')
        // Keep default questions - don't overwrite
        setQuestionsLoaded(true);
      }
    };

    const loadLeaderboard = async () => {
      try {
        // Call Node.js backend API with selected bank
        const response = await fetch(`/api/leaderboard?folder=${currentBank}`, {
          credentials: 'include'
        });
        const data = await response.json();
        setLeaderboard(Array.isArray(data) ? data : []);
        setLeaderboardLoaded(true);
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
        // Use empty array for testing
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
      const { question, usedQuestions: newUsed } = getRandomQuestion(questions, usedQuestions);
      setCurrentQuestion(question);
      setUsedQuestions(newUsed);
      const newWorms = generateWormsForQuestion(question, snake);
      setWorms(newWorms);

      // Set animation class when question changes
      const animations = ["fade-in", "zoom-in", "slide-left", "bounce-in"];
      setQuestionAnimationClass(animations[Math.floor(Math.random() * animations.length)]);
    }
  }, [questions, currentQuestion, usedQuestions, snake]);

  // Helper function to get the appropriate tuna image for a snake segment
  const getTunaImage = useCallback((segment, idx, snake) => {
    const prev = idx > 0 ? snake[idx - 1] : null;
    const next = idx < snake.length - 1 ? snake[idx + 1] : null;

    // Calculate direction vectors
    const dirFromPrev = prev ? {
      x: segment.x - prev.x,
      y: segment.y - prev.y
    } : null;

    const dirToNext = next ? {
      x: next.x - segment.x,
      y: next.y - segment.y
    } : null;

    // Head (first segment) - faces the direction of movement
    if (idx === 0) {
      // The head faces opposite to where the next segment is
      if (dirToNext) {
        if (dirToNext.x > 0) return 'head_left';
        if (dirToNext.x < 0) return 'head_right';
        if (dirToNext.y > 0) return 'head_up';
        if (dirToNext.y < 0) return 'head_down';
      }
      // Fallback based on current direction of movement
      if (direction.x > 0) return 'head_right';
      if (direction.x < 0) return 'head_left';
      if (direction.y > 0) return 'head_down';
      if (direction.y < 0) return 'head_up';
      return 'head_right';
    }

    // Tail (last segment) - points in the direction it came from
    if (idx === snake.length - 1) {
      if (dirFromPrev) {
        // Tail points opposite to where it came from
        if (dirFromPrev.x > 0) return 'tail_horizontal_left';
        if (dirFromPrev.x < 0) return 'tail_horizontal_right';
        if (dirFromPrev.y > 0) return 'tail_vertical_up';
        if (dirFromPrev.y < 0) return 'tail_vertical_down';
      }
      return 'tail_horizontal_right';
    }

    // Body segments - check if turning or straight
    if (dirFromPrev && dirToNext) {
      // Check if this is a turning segment
      const isTurning = dirFromPrev.x !== dirToNext.x && dirFromPrev.y !== dirToNext.y;

      if (isTurning) {
        // For turning pieces, we need to check the actual direction flow
        // dirFromPrev tells us where we came from, dirToNext tells us where we're going

        // Coming from left, turning up
        if (dirFromPrev.x > 0 && dirToNext.y < 0) return 'turning_body_up_left';
        // Coming from left, turning down  
        if (dirFromPrev.x > 0 && dirToNext.y > 0) return 'turning_body_down_left';
        // Coming from right, turning up
        if (dirFromPrev.x < 0 && dirToNext.y < 0) return 'turning_body_up_right';
        // Coming from right, turning down
        if (dirFromPrev.x < 0 && dirToNext.y > 0) return 'turning_body_down_right';
        // Coming from up, turning left
        if (dirFromPrev.y > 0 && dirToNext.x < 0) return 'turning_body_up_left';
        // Coming from up, turning right
        if (dirFromPrev.y > 0 && dirToNext.x > 0) return 'turning_body_up_right';
        // Coming from down, turning left
        if (dirFromPrev.y < 0 && dirToNext.x < 0) return 'turning_body_down_left';
        // Coming from down, turning right
        if (dirFromPrev.y < 0 && dirToNext.x > 0) return 'turning_body_down_right';
      } else {
        // Straight body segment - faces the direction the body is oriented
        if (dirFromPrev.x !== 0) {
          // Horizontal - body faces the direction opposite to where it came from
          return dirFromPrev.x > 0 ? 'straight_body_horizontal_left' : 'straight_body_horizontal_right';
        } else {
          // Vertical - body faces the direction opposite to where it came from
          return dirFromPrev.y > 0 ? 'straight_body_vertical_up' : 'straight_body_vertical_down';
        }
      }
    }

    return 'straight_body_horizontal_right';
  }, [direction]);

  // Draw game
  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background image if loaded
    if (bgImageRef.current && bgImageRef.current.complete) {
      ctx.drawImage(bgImageRef.current, 0, 0, canvas.width, canvas.height);
    }

    // Draw very light grid lines
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'; // Very light, barely visible
    ctx.lineWidth = 0.5;

    // Draw vertical lines
    for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    ctx.restore();

    // Draw worms
    worms.forEach((worm, i) => {
      ctx.save();

      const t = Date.now() / 600 + i;
      const dx = awaitingInitialMove ? 0 : Math.sin(t) * 2;
      const dy = awaitingInitialMove ? 0 : Math.cos(t + 0.4) * 2;

      const cx = worm.x + GRID_SIZE / 2 + dx;
      const cy = worm.y + GRID_SIZE / 2 + dy;

      // Get the worms image
      const wormsImg = tunaImagesRef.current['worms'];

      if (wormsImg && wormsImg.complete) {
        // Apply glow effect using the worm's color
        ctx.shadowColor = worm.color;
        ctx.shadowBlur = 35; // Increased glow

        // Make the crab larger
        const crabSize = GRID_SIZE * 1.5; // 50% larger than grid size
        const offsetX = (GRID_SIZE - crabSize) / 2; // positioning offset
        const offsetY = (GRID_SIZE - crabSize) / 2;

        // Create a colored version of the worms image
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = crabSize;
        tempCanvas.height = crabSize;

        // Draw the original image at larger size
        tempCtx.drawImage(wormsImg, 0, 0, crabSize, crabSize);

        // Get image data and apply color tint
        const imageData = tempCtx.getImageData(0, 0, crabSize, crabSize);
        const data = imageData.data;

        // Parse the worm color (HSL format)
        const colorMatch = worm.color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (colorMatch) {
          const [, h, s, l] = colorMatch.map(Number);

          // Convert HSL to RGB
          const hslToRgb = (h, s, l) => {
            h /= 360;
            s /= 100;
            l /= 100;
            const a = s * Math.min(l, 1 - l);
            const f = n => {
              const k = (n + h * 12) % 12;
              return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            };
            return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
          };

          const [r, g, b] = hslToRgb(h, s, l);

          // Apply color tint to non-transparent pixels
          for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 0) { // If pixel is not transparent
              // Blend the original color with the worm color
              const alpha = 0.7; // Adjust this to control color intensity
              data[i] = data[i] * (1 - alpha) + r * alpha;     // Red
              data[i + 1] = data[i + 1] * (1 - alpha) + g * alpha; // Green
              data[i + 2] = data[i + 2] * (1 - alpha) + b * alpha; // Blue
            }
          }

          tempCtx.putImageData(imageData, 0, 0);
        }

        // Draw the colored image at larger size
        ctx.drawImage(tempCanvas, worm.x + dx + offsetX, worm.y + dy + offsetY);
      } else {
        // Fallback to original circle drawing if image not loaded
        ctx.shadowColor = worm.color;
        ctx.shadowBlur = 28;

        ctx.beginPath();
        ctx.arc(cx, cy, GRID_SIZE / 1.85, 0, 2 * Math.PI);
        ctx.fillStyle = worm.color;
        ctx.fill();
      }

      // Draw the label on top (same for both image and fallback)
      ctx.shadowColor = "#fff";
      ctx.shadowBlur = 25;
      ctx.globalAlpha = 0.95;
      ctx.font = `bold ${Math.floor(GRID_SIZE * 0.45)}px Segoe UI, Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.lineWidth = 4; // Thicker outline
      ctx.strokeStyle = "#ffffff";
      ctx.strokeText(worm.label, cx, cy + 1);

      ctx.fillStyle = "#111";
      ctx.fillText(worm.label, cx, cy + 1);

      ctx.globalAlpha = 1;
      ctx.restore();
    });

    // Draw snake
    snake.forEach((segment, idx) => {
      ctx.save();

      // Get the appropriate tuna image
      const imageName = getTunaImage(segment, idx, snake);
      const img = tunaImagesRef.current[imageName];

      if (img && img.complete) {
        // Apply glow effect if in slow mode
        if (slowGlowAlphaRef.current > 0.03) {
          const hue = (slowGlowPhaseRef.current * 36 + idx * 23) % 360;
          const pulse = 0.8 + 0.25 * Math.sin(slowGlowPhaseRef.current + idx * 0.6);
          ctx.shadowColor = `hsl(${hue}, 98%, 75%)`;
          ctx.shadowBlur = 40 * pulse * slowGlowAlphaRef.current;
        } else {
          ctx.shadowColor = idx === 0 ? "#ffe082" : "#26ffd5";
          ctx.shadowBlur = idx === 0 ? 6 : 3;
        }

        // Draw the tuna image
        ctx.drawImage(img, segment.x, segment.y, GRID_SIZE, GRID_SIZE);
      } else {
        // Fallback to original drawing if image not loaded
        if (slowGlowAlphaRef.current > 0.03) {
          const hue = (slowGlowPhaseRef.current * 36 + idx * 23) % 360;
          const pulse = 0.8 + 0.25 * Math.sin(slowGlowPhaseRef.current + idx * 0.6);
          ctx.shadowColor = `hsl(${hue}, 98%, 75%)`;
          ctx.shadowBlur = 40 * pulse * slowGlowAlphaRef.current;
        } else {
          ctx.shadowColor = idx === 0 ? "#ffe082" : "#26ffd5";
          ctx.shadowBlur = idx === 0 ? 6 : 3;
        }

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
  }, [snake, worms, awaitingInitialMove, getTunaImage]);

  // Update game time
  useEffect(() => {
    if (isGameRunning && startTime) {
      const interval = setInterval(() => {
        setGameTime((Date.now() - startTime) / 1000);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isGameRunning, startTime]);

  // End game callback
  const endGame = useCallback(() => {
    setIsGameRunning(false);
    setIsGameOver(true);

    // Track performance for practice mode detection
    if (!isPracticeMode && currentGameStart) {
      const gameEndTime = Date.now();
      const gameDuration = (gameEndTime - currentGameStart) / 1000; // in seconds
      const snakeLength = snake.length;
      const timeSinceLastMove = lastMoveTime ? (gameEndTime - lastMoveTime) / 1000 : 0;
      
      const performance = {
        duration: gameDuration,
        level: level,
        snakeLength: snakeLength,
        timeSinceLastMove: timeSinceLastMove,
        timestamp: gameEndTime
      };
      
      // Add to performance history (keep last 5 games)
      setPerformanceHistory(prev => {
        const updated = [...prev, performance];
        if (updated.length > 5) {
          updated.shift();
        }
        return updated;
      });
      
      // Check if player is struggling (after at least 3 games) and popup not disabled
      if (performanceHistory.length >= 2 && !practiceModeDisabled) {
        const recentGames = [...performanceHistory, performance].slice(-3);
        const isStruggling = detectStrugglingPlayer(recentGames);
        
        if (isStruggling) {
          setShowPracticeModePopup(true);
        }
      }
    }

    // Only save score if not in practice mode
    if (!isPracticeMode) {
      const finalEntry = {
        name: user.username,
        level: level,
        time: startTime ? ((Date.now() - startTime) / 1000).toFixed(2) : 0,
        folder: currentBank
      };

      setLeaderboard(prev => {
        const updated = [...prev, finalEntry];
        updated.sort((a, b) => b.level - a.level || a.time - b.time);

        // Save to Node.js backend
        fetch('/api/leaderboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalEntry)
        }).catch(err => console.error('Failed to save score:', err));

        return updated;
      });
    }

    setShowSplash(true);
  }, [user, level, startTime, currentBank, isPracticeMode, snake.length, currentGameStart, lastMoveTime, performanceHistory, practiceModeDisabled]);

  /**
   * Detect if a player is struggling based on their recent performance
   * Uses a simple heuristic-based algorithm:
   * - Short game durations (< 10 seconds)
   * - Short snake length (< 5)
   * - Long time without moving (> 3 seconds before death)
   * - Low level achievement
   * Returns true if 2+ out of 3 recent games show struggling patterns
   */
  const detectStrugglingPlayer = (recentGames) => {
    let strugglingCount = 0;
    
    for (const game of recentGames) {
      let strugglingIndicators = 0;
      
      // Indicator 1: Very short game duration (died very early)
      if (game.duration < 10) {
        strugglingIndicators++;
      }
      
      // Indicator 2: Short snake (hit self when snake was still relatively short)
      if (game.snakeLength < 5 && game.duration > 3) {
        strugglingIndicators++;
      }
      
      // Indicator 3: Long time without moving (not controlling the tuna)
      if (game.timeSinceLastMove > 3) {
        strugglingIndicators++;
      }
      
      // Indicator 4: Low level achievement
      if (game.level <= 1 && game.duration > 5) {
        strugglingIndicators++;
      }
      
      // If this game shows 2+ struggling indicators, count it
      if (strugglingIndicators >= 2) {
        strugglingCount++;
      }
    }
    
    // Return true if 2+ out of the last 3 games show struggling
    return strugglingCount >= 2;
  };

  // Game loop
  useEffect(() => {
    if (!isGameRunning) return;

    const moveSnake = () => {
      if (nextDir.x === 0 && nextDir.y === 0) return true;

      const head = {
        x: snake[0].x + nextDir.x,
        y: snake[0].y + nextDir.y
      };

      const newSnake = [head, ...snake];

      const eatenIdx = worms.findIndex(w => w.x === head.x && w.y === head.y);
      if (eatenIdx !== -1) {
        const worm = worms[eatenIdx];
        if (worm.isCorrect) {
          setLevel(l => l + 1);

          // Only update leaderboard if not in practice mode
          if (!isPracticeMode) {
            const newEntry = {
              name: user.username,
              level: level + 1,
              time: startTime ? ((Date.now() - startTime) / 1000).toFixed(2) : 0,
              folder: currentBank
            };

            setLeaderboard(prev => {
              const existingIndex = prev.findIndex(e => e.name === user.username);
              let updated;
              if (existingIndex !== -1) {
                updated = [...prev];
                updated[existingIndex] = newEntry;
              } else {
                updated = [...prev, newEntry];
              }
              updated.sort((a, b) => b.level - a.level || a.time - b.time);

              // Save to Node.js backend
              fetch('/api/leaderboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEntry)
              }).catch(err => console.error('Failed to save score:', err));

              return updated;
            });
          }

          // Next question
          const { question, usedQuestions: newUsed } = getRandomQuestion(questions, usedQuestions);
          setCurrentQuestion(question);
          setUsedQuestions(newUsed);
          const newWorms = generateWormsForQuestion(question, newSnake);
          setWorms(newWorms);
          setSnake(newSnake);

          // Set animation class when question changes
          const animations = ["fade-in", "zoom-in", "slide-left", "bounce-in"];
          setQuestionAnimationClass(animations[Math.floor(Math.random() * animations.length)]);

          // Slow motion effect
          setIsSlow(true);
          setTimeout(() => setIsSlow(false), 2000);

          // Check for next level (only if not in practice mode)
          if (!isPracticeMode && newUsed.length >= Math.ceil(questions.length / 2)) {
            setShowNextLevel(true);
          }

          return true;
        } else {
          endGame();
          return false;
        }
      } else {
        newSnake.pop();
        setSnake(newSnake);
      }
      return true;
    };

    const checkCollision = () => {
      const head = snake[0];
      if (nextDir.x === 0 && nextDir.y === 0) return false;
      if (head.x < 0 || head.x >= CANVAS_WIDTH || head.y < 0 || head.y >= CANVAS_HEIGHT)
        return true;
      for (let i = 1; i < snake.length; i++)
        if (snake[i].x === head.x && snake[i].y === head.y)
          return true;
      return false;
    };

    // Game logic timer - runs even when tab is hidden
    const gameLogicLoop = () => {
      const now = Date.now();
      if (!lastStepTimeRef.current) lastStepTimeRef.current = now;

      // Practice mode has much slower speed (additional +80ms to base delay)
      const baseDelay = isSlow ? 340 : Math.max(MIN_STEP_DELAY, START_STEP_DELAY - 2 * level);
      const stepDelay = isPracticeMode ? baseDelay + 80 : baseDelay;

      const fadeSpeed = 0.09;
      if (isSlow) {
        slowGlowPhaseRef.current += 0.09;
        slowGlowAlphaRef.current += fadeSpeed * (1 - slowGlowAlphaRef.current);
      } else {
        slowGlowAlphaRef.current += fadeSpeed * (0 - slowGlowAlphaRef.current);
        slowGlowPhaseRef.current = 0;
      }

      if (awaitingInitialMove && (nextDir.x === 0 && nextDir.y === 0) && inputQueueRef.current.length === 0) {
        return;
      } else if (awaitingInitialMove) {
        // Consume from queue if available, otherwise use nextDir
        if (inputQueueRef.current.length > 0) {
          const queuedDir = inputQueueRef.current.shift();
          setNextDir(queuedDir);
          setDirection(queuedDir);
          directionRef.current = queuedDir;
        } else {
          setDirection(nextDir);
          directionRef.current = nextDir;
        }
        setAwaitingInitialMove(false);
        setLastMoveTime(now); // Track first move
      }

      while (now - lastStepTimeRef.current >= stepDelay) {
        // Process input queue before moving - apply direction immediately
        if (inputQueueRef.current.length > 0) {
          const queuedDir = inputQueueRef.current.shift();
          setNextDir(queuedDir);
          directionRef.current = queuedDir;
        }
        
        if (!moveSnake()) return;
        if (checkCollision()) {
          endGame();
          return;
        }
        // Update direction after the snake moves
        setDirection(nextDir);
        directionRef.current = nextDir;
        lastStepTimeRef.current += stepDelay;
      }
    };

    // Drawing loop - uses requestAnimationFrame for smooth rendering
    const drawLoop = () => {
      drawGame();
      gameLoopRef.current = requestAnimationFrame(drawLoop);
    };

    // Start both loops
    const logicIntervalId = setInterval(gameLogicLoop, 16); // ~60fps for logic
    gameLoopRef.current = requestAnimationFrame(drawLoop);

    return () => {
      clearInterval(logicIntervalId);
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [isGameRunning, snake, nextDir, worms, awaitingInitialMove, isSlow, level, questions, usedQuestions, user, startTime, drawGame, endGame, currentBank, isPracticeMode]);

  const startGame = useCallback(() => {
    if (!questions || questions.length === 0) {
      console.error('No questions available');
      return;
    }

    setSnake([
      { x: GRID_SIZE * 4, y: GRID_SIZE * 8 },
      { x: GRID_SIZE * 3, y: GRID_SIZE * 8 },
      { x: GRID_SIZE * 2, y: GRID_SIZE * 8 }
    ]);
    setDirection({ x: 0, y: 0 });
    setNextDir({ x: 0, y: 0 });
    inputQueueRef.current = []; // Reset input queue
    setIsGameOver(false);
    setLevel(1);
    setUsedQuestions([]);
    setStartTime(Date.now());
    setCurrentGameStart(Date.now());
    setLastMoveTime(null);
    lastStepTimeRef.current = 0;
    setAwaitingInitialMove(true);
    setShowSplash(false);
    setShowNextLevel(false);

    const { question, usedQuestions: newUsed } = getRandomQuestion(questions, []);
    if (!question) {
      console.error('Could not get a valid question');
      return;
    }

    setCurrentQuestion(question);
    setUsedQuestions(newUsed);
    const initialSnake = [
      { x: GRID_SIZE * 4, y: GRID_SIZE * 8 },
      { x: GRID_SIZE * 3, y: GRID_SIZE * 8 },
      { x: GRID_SIZE * 2, y: GRID_SIZE * 8 }
    ];
    const newWorms = generateWormsForQuestion(question, initialSnake);
    setWorms(newWorms);

    // Set animation class when question changes
    const animations = ["fade-in", "zoom-in", "slide-left", "bounce-in"];
    setQuestionAnimationClass(animations[Math.floor(Math.random() * animations.length)]);

    setIsGameRunning(true);
  }, [questions]);

  const handlePracticeModeAccept = (dontShowAgain) => {
    setIsPracticeMode(true);
    setShowPracticeModePopup(false);
    if (dontShowAgain) {
      setPracticeModeDisabled(true);
    }
    // Don't auto-start the game, let user press S
  };

  const handlePracticeModeDecline = (dontShowAgain) => {
    setShowPracticeModePopup(false);
    if (dontShowAgain) {
      setPracticeModeDisabled(true);
    }
    // Continue in normal mode
  };

  const handleExitPracticeMode = () => {
    setIsPracticeMode(false);
    // Don't restart game, just switch mode
  };

  // Handle keyboard input
  useEffect(() => {
    const handleKey = (e) => {
      if (!isGameRunning) {
        if (e.key.toLowerCase() === 's' && questionsLoaded && leaderboardLoaded) {
          startGame();
        }
        return;
      }

      const key = e.key.toLowerCase();
      let newDir = null;

      // Determine the new direction based on key press
      if (key === 'arrowup' || key === 'w') {
        newDir = { x: 0, y: -GRID_SIZE };
      } else if (key === 'arrowdown' || key === 's') {
        newDir = { x: 0, y: GRID_SIZE };
      } else if (key === 'arrowleft' || key === 'a') {
        newDir = { x: -GRID_SIZE, y: 0 };
      } else if (key === 'arrowright' || key === 'd') {
        newDir = { x: GRID_SIZE, y: 0 };
      }

      if (newDir) {
        setLastMoveTime(Date.now());
        
        // Get the effective current direction - either from queue or current direction
        const queue = inputQueueRef.current;
        const effectiveDir = queue.length > 0 ? queue[queue.length - 1] : directionRef.current;
        
        // Check if this is the initial move (no direction set yet)
        const isInitialMove = effectiveDir.x === 0 && effectiveDir.y === 0;
        
        // Check if new direction is perpendicular to effective direction (valid move)
        // Not opposite means: if moving horizontally, can only go vertical, and vice versa
        const isValidMove = isInitialMove || 
                           (effectiveDir.x !== 0 && newDir.x === 0) || 
                           (effectiveDir.y !== 0 && newDir.y === 0);
        
        // Also check it's not the same direction already queued
        const isSame = (effectiveDir.x === newDir.x && effectiveDir.y === newDir.y);
        
        if (isValidMove && !isSame) {
          // Clear queue and add new direction to ensure responsiveness
          inputQueueRef.current = [newDir];
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
    // Reset game state
    setLevel(1);
    setIsGameRunning(false);
    setIsGameOver(false);
    setShowSplash(true);
  };

  const handleBankChange = (bank) => {
    if (bank && bank.folder) {
      setCurrentBank(bank.folder);
      // Reset game when changing banks
      setLevel(1);
      setIsGameRunning(false);
      setIsGameOver(false);
      setShowSplash(true);
      setUsedQuestions([]);
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
