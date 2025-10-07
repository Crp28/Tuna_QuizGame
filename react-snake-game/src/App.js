import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import translations from './translations';
import LanguageSwitcher from './LanguageSwitcher';

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

const getCookie = (name) => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
};

const setCookie = (name, value, days = 180) => {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${date.toUTCString()}; path=/`;
};

const randomBrightColor = () => {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 85%, 65%)`;
};

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
    color: randomBrightColor()
  }));
};

function App() {
  // Language state
  const [language, setLanguage] = useState('en');
  const t = translations[language];

  // Login state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    firstname: '',
    lastname: '',
    email: ''
  });

  // Game state
  const [questions, setQuestions] = useState([
    {
      question: "What is the capital of New Zealand?",
      options: ["Auckland", "Wellington", "Christchurch", "Hamilton"],
      answer: "B"
    },
    {
      question: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      answer: "B"
    },
    {
      question: "What color is the sky?",
      options: ["Red", "Blue", "Green", "Yellow"],
      answer: "B"
    }
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

  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const lastStepTimeRef = useRef(0);
  const slowGlowPhaseRef = useRef(0);
  const slowGlowAlphaRef = useRef(0);
  const tunaImagesRef = useRef({});

  // Preload tuna images
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
  }, []);

  // Check login status on mount
  useEffect(() => {
    const savedUsername = getCookie('username');
    const firstname = getCookie('firstname');
    const lastname = getCookie('lastname');
    const email = getCookie('email');

    if (savedUsername && firstname && lastname && email) {
      setUsername(savedUsername);
      setIsLoggedIn(true);
    }
  }, []);

  // Load questions and leaderboard
  useEffect(() => {
    if (!isLoggedIn) return;

    const loadQuestions = async () => {
      try {
        // Call Node.js backend API (no base64 decoding needed!)
        const response = await fetch('/api/questions?folder=comp705-01');
        const data = await response.json();
        if (data && Array.isArray(data) && data.length > 0) {
          setQuestions(data);
        }
        setQuestionsLoaded(true);
      } catch (error) {
        console.error('Failed to load questions:', error);
        // Keep default questions - don't overwrite
        setQuestionsLoaded(true);
      }
    };

    const loadLeaderboard = async () => {
      try {
        // Call Node.js backend API
        const response = await fetch('/api/leaderboard?folder=comp705-01');
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
  }, [isLoggedIn]);

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

    // Draw worms
    worms.forEach((worm, i) => {
      ctx.save();

      const t = Date.now() / 600 + i;
      const dx = awaitingInitialMove ? 0 : Math.sin(t) * 2;
      const dy = awaitingInitialMove ? 0 : Math.cos(t + 0.4) * 2;

      const cx = worm.x + GRID_SIZE / 2 + dx;
      const cy = worm.y + GRID_SIZE / 2 + dy;

      ctx.shadowColor = worm.color;
      ctx.shadowBlur = 28;

      ctx.beginPath();
      ctx.arc(cx, cy, GRID_SIZE / 1.85, 0, 2 * Math.PI);
      ctx.fillStyle = worm.color;
      ctx.fill();

      ctx.shadowColor = "#fff";
      ctx.shadowBlur = 22;
      ctx.globalAlpha = 0.92;
      ctx.font = `bold ${Math.floor(GRID_SIZE * 1.0)}px Segoe UI, Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.lineWidth = 3;
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

    const finalEntry = {
      name: username,
      level: level,
      time: startTime ? ((Date.now() - startTime) / 1000).toFixed(2) : 0,
      folder: 'comp705-01'
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

    setShowSplash(true);
  }, [username, level, startTime]);

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

          // Update leaderboard
          const newEntry = {
            name: username,
            level: level + 1,
            time: startTime ? ((Date.now() - startTime) / 1000).toFixed(2) : 0,
            folder: 'comp705-01'
          };

          setLeaderboard(prev => {
            const existingIndex = prev.findIndex(e => e.name === username);
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

          // Check for next level
          if (newUsed.length >= Math.ceil(questions.length / 2)) {
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

      const stepDelay = isSlow ? 340 : Math.max(MIN_STEP_DELAY, START_STEP_DELAY - 2 * level);

      const fadeSpeed = 0.09;
      if (isSlow) {
        slowGlowPhaseRef.current += 0.09;
        slowGlowAlphaRef.current += fadeSpeed * (1 - slowGlowAlphaRef.current);
      } else {
        slowGlowAlphaRef.current += fadeSpeed * (0 - slowGlowAlphaRef.current);
        slowGlowPhaseRef.current = 0;
      }

      if (awaitingInitialMove && (nextDir.x === 0 && nextDir.y === 0)) {
        return;
      } else if (awaitingInitialMove) {
        setDirection(nextDir);
        setAwaitingInitialMove(false);
      }

      while (now - lastStepTimeRef.current >= stepDelay) {
        if (!moveSnake()) return;
        if (checkCollision()) {
          endGame();
          return;
        }
        // Update direction after the snake moves
        setDirection(nextDir);
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
  }, [isGameRunning, snake, nextDir, worms, awaitingInitialMove, isSlow, level, questions, usedQuestions, username, startTime, drawGame, endGame]);

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
    setIsGameOver(false);
    setLevel(1);
    setUsedQuestions([]);
    setStartTime(Date.now());
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

      if ((key === 'arrowup' || key === 'w') && direction.y === 0) {
        setNextDir({ x: 0, y: -GRID_SIZE });
      } else if ((key === 'arrowdown' || key === 's') && direction.y === 0) {
        setNextDir({ x: 0, y: GRID_SIZE });
      } else if ((key === 'arrowleft' || key === 'a') && direction.x === 0) {
        setNextDir({ x: -GRID_SIZE, y: 0 });
      } else if ((key === 'arrowright' || key === 'd') && direction.x === 0) {
        setNextDir({ x: GRID_SIZE, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isGameRunning, direction, questionsLoaded, leaderboardLoaded, startGame]);

  const handleLogin = (e) => {
    e.preventDefault();

    // Save cookies
    setCookie('username', formData.username);
    setCookie('firstname', formData.firstname);
    setCookie('lastname', formData.lastname);
    setCookie('email', formData.email);
    setCookie('full_name', `${formData.firstname} ${formData.lastname}`);

    setUsername(formData.username);
    setIsLoggedIn(true);
  };

  // Render login form if not logged in
  if (!isLoggedIn) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <LanguageSwitcher
          currentLanguage={language}
          onLanguageChange={setLanguage}
          translations={t}
        />
        <form className="login-form" onSubmit={handleLogin}>
          <div style={{ fontSize: '2.5rem', marginBottom: '10px', textAlign: 'center' }}>🐍</div>
          <h2 style={{ color: '#ffe082', textAlign: 'center', marginBottom: '10px' }}>{t.loginWelcome}</h2>
          <div style={{
            color: '#81ff81',
            fontSize: '1.1rem',
            fontWeight: '600',
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            {t.loginEnterDetails}
          </div>
          <input
            type="text"
            placeholder={t.loginUsername}
            maxLength="30"
            required
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
          <input
            type="text"
            placeholder={t.loginFirstName}
            maxLength="30"
            required
            value={formData.firstname}
            onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
          />
          <input
            type="text"
            placeholder={t.loginLastName}
            maxLength="30"
            required
            value={formData.lastname}
            onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
          />
          <input
            type="email"
            placeholder={t.loginEmail}
            maxLength="80"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <button type="submit">{t.loginPlayButton}</button>
        </form>
      </div>
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
              <div style={{
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
                        const isUser = row.name === username;
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
            <div className="game-title">
              🧑‍💻 {t.gameTitle}{' '}
              <span style={{
                background: 'linear-gradient(90deg, #00c853, #64dd17)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 'bold',
              }}>
                {username}
              </span>{' '}
              {t.gameAtBlock}{' '}
              <span style={{
                background: 'linear-gradient(90deg, #ff4081, #7c4dff, #40c4ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 'bold',
              }}>
                comp705-01
              </span>
            </div>

            <div className="score">
              {t.gameLevel} {level} | {t.gameTime} {gameTime.toFixed(1)} s
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
                  {isGameOver ? `${t.splashPlayAgain} ${username}?` : `${t.splashReady} ${username}?`}
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

      <div className="footer-bar">
        <span>
          {t.footerMadeBy} <span style={{ color: '#fff', textShadow: '0 0 4px #ea0029cc' }}>AUT</span>
        </span>
        {' | '}
        <a
          href="/comp705-01/admin.php"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#ffe082', textDecoration: 'underline', fontWeight: 'bold' }}
        >
          {t.footerAdmin}
        </a>
      </div>
    </div>
  );
}

export default App;
