const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Simple in-memory rate limiting for answer checking (per IP)
const answerCheckRateLimit = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_CHECKS_PER_WINDOW = 100; // 100 checks per minute per IP

function checkRateLimit(ip) {
  const now = Date.now();
  const userLimit = answerCheckRateLimit.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
  
  // Reset if window expired
  if (now > userLimit.resetTime) {
    userLimit.count = 0;
    userLimit.resetTime = now + RATE_LIMIT_WINDOW;
  }
  
  userLimit.count++;
  answerCheckRateLimit.set(ip, userLimit);
  
  return userLimit.count <= MAX_CHECKS_PER_WINDOW;
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, limit] of answerCheckRateLimit.entries()) {
    if (now > limit.resetTime + RATE_LIMIT_WINDOW) {
      answerCheckRateLimit.delete(ip);
    }
  }
}, 300000);

/**
 * GET /api/questions
 * Query params: folder (optional, default: comp705-01)
 * Returns: Array of questions without correct answers (for security)
 */
router.get('/', async (req, res) => {
  try {
    const folder = req.query.folder || 'comp705-01';
    
    // Fetch questions from database
    const [rows] = await db.query(
      'SELECT questions_json FROM question_sets WHERE folder = ?',
      [folder]
    );
    
    // Return empty array if no questions found
    if (rows.length === 0 || !rows[0].questions_json) {
      return res.json([]);
    }
    
    // Parse questions and remove correct answers for security
    const questions = JSON.parse(rows[0].questions_json);
    const questionsWithoutAnswers = questions.map(q => ({
      question: q.question,
      options: q.options
      // Note: 'answer' field is intentionally omitted for security
    }));
    
    res.json(questionsWithoutAnswers);
    
  } catch (error) {
    console.error('Error loading questions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load questions' 
    });
  }
});

/**
 * POST /api/questions/check-answer
 * Body: { folder, questionIndex, selectedAnswer }
 * Returns: { correct: boolean, correctAnswer: string }
 */
router.post('/check-answer', async (req, res) => {
  try {
    // Rate limiting check
    const clientIp = req.ip || req.connection.remoteAddress;
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please try again later.'
      });
    }
    
    const { folder, questionIndex, selectedAnswer } = req.body;
    
    // Validate input
    if (!folder || questionIndex === undefined || !selectedAnswer) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: folder, questionIndex, selectedAnswer' 
      });
    }
    
    // Fetch questions from database
    const [rows] = await db.query(
      'SELECT questions_json FROM question_sets WHERE folder = ?',
      [folder]
    );
    
    if (rows.length === 0 || !rows[0].questions_json) {
      return res.status(404).json({ 
        success: false, 
        error: 'Question bank not found' 
      });
    }
    
    const questions = JSON.parse(rows[0].questions_json);
    
    // Validate question index
    if (questionIndex < 0 || questionIndex >= questions.length) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid question index' 
      });
    }
    
    const question = questions[questionIndex];
    const isCorrect = question.answer === selectedAnswer;
    
    res.json({ 
      success: true,
      correct: isCorrect,
      correctAnswer: question.answer
    });
    
  } catch (error) {
    console.error('Error checking answer:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check answer' 
    });
  }
});

module.exports = router;
