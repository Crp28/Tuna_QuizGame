const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * GET /api/questions
 * Query params: folder (optional, default: comp705-01)
 * Returns: Array of questions without base64 encoding
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
    
    // Parse and return questions (no base64 encoding - simpler!)
    const questions = JSON.parse(rows[0].questions_json);
    res.json(questions);
    
  } catch (error) {
    console.error('Error loading questions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load questions' 
    });
  }
});

module.exports = router;
