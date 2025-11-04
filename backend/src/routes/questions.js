const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * Middleware to check if user is authenticated
 */
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication required' 
    });
  }
  next();
};

/**
 * GET /api/questions
 * Query params: folder (optional, default: comp705-01)
 * Returns: Array of questions WITHOUT answer field (security improvement)
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
    
    // Parse questions and remove answer field for security
    const questions = JSON.parse(rows[0].questions_json);
    const questionsWithoutAnswers = questions.map(q => ({
      question: q.question,
      options: q.options
      // Deliberately exclude 'answer' field
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
 * POST /api/questions/verify
 * Body: { questionText, chosenAnswer, folder }
 * Returns: { correct: boolean }
 * Verifies if the chosen answer is correct by checking against the database
 */
router.post('/verify', requireAuth, async (req, res) => {
  try {
    const { questionText, chosenAnswer, folder } = req.body;
    
    // Validate input
    if (!questionText || !chosenAnswer || !folder) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }
    
    // Validate chosenAnswer is A, B, C, or D
    if (!['A', 'B', 'C', 'D'].includes(chosenAnswer)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid answer format' 
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
    
    // Parse questions and find the matching question
    const questions = JSON.parse(rows[0].questions_json);
    const question = questions.find(q => q.question === questionText);
    
    if (!question) {
      return res.status(404).json({ 
        success: false, 
        error: 'Question not found' 
      });
    }
    
    // Check if the answer is correct
    const isCorrect = question.answer === chosenAnswer;
    
    res.json({ 
      success: true,
      correct: isCorrect 
    });
    
  } catch (error) {
    console.error('Error verifying answer:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to verify answer' 
    });
  }
});

module.exports = router;
