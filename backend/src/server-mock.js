const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 5000;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parsing middleware
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Mock questions data
const mockQuestions = [
  {
    question: "What is React?",
    options: ["A JavaScript library", "A programming language", "A database", "An operating system"],
    answer: "A"
  },
  {
    question: "What is a Maori Tuna?",
    options: ["A type of tree", "A freshwater eel", "A musical instrument", "A traditional dance"],
    answer: "B"
  },
  {
    question: "What does HTML stand for?",
    options: ["Hyper Text Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlinks and Text Markup Language"],
    answer: "A"
  },
  {
    question: "Which hook is used for side effects in React?",
    options: ["useState", "useEffect", "useContext", "useReducer"],
    answer: "B"
  },
  {
    question: "What color are most eels?",
    options: ["Bright red", "Brown or grey", "Neon green", "Pure white"],
    answer: "B"
  }
];

// Mock leaderboard data
let mockLeaderboard = [
  { name: "Alice", level: 5, time: "45.23", folder: "comp705-01" },
  { name: "Bob", level: 4, time: "38.50", folder: "comp705-01" },
  { name: "Charlie", level: 3, time: "52.10", folder: "comp705-01" }
];

// API Routes
app.get('/api/questions', (req, res) => {
  console.log('📚 Serving mock questions');
  res.json(mockQuestions);
});

app.get('/api/leaderboard', (req, res) => {
  console.log('🏆 Serving mock leaderboard');
  res.json(mockLeaderboard);
});

app.post('/api/leaderboard', (req, res) => {
  console.log('💾 Saving score:', req.body);
  const entry = req.body;
  
  // Update or add entry
  const existingIndex = mockLeaderboard.findIndex(e => e.name === entry.name);
  if (existingIndex !== -1) {
    mockLeaderboard[existingIndex] = entry;
  } else {
    mockLeaderboard.push(entry);
  }
  
  // Sort by level desc, then time asc
  mockLeaderboard.sort((a, b) => {
    if (b.level !== a.level) return b.level - a.level;
    return parseFloat(a.time) - parseFloat(b.time);
  });
  
  res.json({ success: true, message: 'Score saved' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    mode: 'mock'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Tuna Quiz Game Backend API (Mock Mode)',
    version: '1.0.0-mock',
    endpoints: {
      health: '/api/health',
      questions: '/api/questions?folder=comp705-01',
      leaderboard: {
        get: '/api/leaderboard?folder=comp705-01',
        post: '/api/leaderboard'
      }
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Endpoint not found' 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false,
    error: 'Internal server error' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log('=================================');
  console.log('🐟 Tuna Quiz Backend Server (Mock)');
  console.log('=================================');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Mode: MOCK (no database)`);
  console.log(`🔗 API: http://localhost:${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
  console.log('=================================');
});
