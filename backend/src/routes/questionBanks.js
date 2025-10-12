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
 * Middleware to check if user is admin
 */
const requireAdmin = (req, res, next) => {
  if (!req.session.userId || req.session.accountType !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      error: 'Admin access required' 
    });
  }
  next();
};

/**
 * GET /api/question-banks
 * List all question banks
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const [banks] = await db.query(
      `SELECT id, folder, name, description, created_by, created_at, updated_at,
              (SELECT COUNT(*) FROM JSON_TABLE(
                questions_json, 
                '$[*]' COLUMNS(q JSON PATH '$')
              ) AS jt) as question_count
       FROM question_sets
       ORDER BY folder`
    );
    
    res.json(banks);
    
  } catch (error) {
    console.error('Error fetching question banks:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch question banks' 
    });
  }
});

/**
 * GET /api/question-banks/:folder
 * Get a specific question bank by folder
 */
router.get('/:folder', requireAuth, async (req, res) => {
  try {
    const { folder } = req.params;
    
    const [banks] = await db.query(
      `SELECT id, folder, name, description, questions_json, created_by, created_at, updated_at
       FROM question_sets
       WHERE folder = ?`,
      [folder]
    );
    
    if (banks.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Question bank not found' 
      });
    }
    
    // Parse questions JSON
    const bank = banks[0];
    bank.questions = JSON.parse(bank.questions_json);
    delete bank.questions_json;
    
    res.json(bank);
    
  } catch (error) {
    console.error('Error fetching question bank:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch question bank' 
    });
  }
});

/**
 * POST /api/question-banks
 * Create a new question bank (admin only)
 * Body: { folder, name, description, questions }
 */
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { folder, name, description, questions = [] } = req.body;
    
    // Validation
    if (!folder || !name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Folder and name are required' 
      });
    }
    
    // Validate folder format (alphanumeric, hyphens, 3-100 chars)
    if (!/^[a-zA-Z0-9-]{3,100}$/.test(folder)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Folder must be 3-100 characters and contain only letters, numbers, and hyphens' 
      });
    }
    
    // Check if folder already exists
    const [existing] = await db.query(
      'SELECT id FROM question_sets WHERE folder = ?',
      [folder]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({ 
        success: false, 
        error: 'Question bank with this folder already exists' 
      });
    }
    
    // Validate questions if provided
    if (!Array.isArray(questions)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Questions must be an array' 
      });
    }
    
    // Insert new question bank
    const [result] = await db.query(
      `INSERT INTO question_sets (folder, name, description, questions_json, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [folder, name, description || null, JSON.stringify(questions), req.session.userId]
    );
    
    res.json({ 
      success: true,
      questionBank: {
        id: result.insertId,
        folder,
        name,
        description,
        questions,
        created_by: req.session.userId
      }
    });
    
  } catch (error) {
    console.error('Error creating question bank:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create question bank' 
    });
  }
});

/**
 * PUT /api/question-banks/:folder
 * Update a question bank (admin only)
 * Body: { name, description }
 */
router.put('/:folder', requireAdmin, async (req, res) => {
  try {
    const { folder } = req.params;
    const { name, description } = req.body;
    
    // Validation
    if (!name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name is required' 
      });
    }
    
    // Check if question bank exists
    const [existing] = await db.query(
      'SELECT id FROM question_sets WHERE folder = ?',
      [folder]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Question bank not found' 
      });
    }
    
    // Update question bank
    await db.query(
      `UPDATE question_sets 
       SET name = ?, description = ?
       WHERE folder = ?`,
      [name, description || null, folder]
    );
    
    res.json({ 
      success: true,
      questionBank: {
        folder,
        name,
        description
      }
    });
    
  } catch (error) {
    console.error('Error updating question bank:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update question bank' 
    });
  }
});

/**
 * POST /api/question-banks/:folder/questions
 * Add questions to a question bank (admin only)
 * Body: { questions: [{question, options, answer}, ...] }
 */
router.post('/:folder/questions', requireAdmin, async (req, res) => {
  try {
    const { folder } = req.params;
    const { questions } = req.body;
    
    // Validation
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Questions array is required and must not be empty' 
      });
    }
    
    // Validate each question
    for (const q of questions) {
      if (!q.question || !q.options || !q.answer) {
        return res.status(400).json({ 
          success: false, 
          error: 'Each question must have question, options, and answer fields' 
        });
      }
      
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        return res.status(400).json({ 
          success: false, 
          error: 'Each question must have exactly 4 options' 
        });
      }
      
      if (!['A', 'B', 'C', 'D'].includes(q.answer)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Answer must be A, B, C, or D' 
        });
      }
    }
    
    // Get existing questions
    const [banks] = await db.query(
      'SELECT questions_json FROM question_sets WHERE folder = ?',
      [folder]
    );
    
    if (banks.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Question bank not found' 
      });
    }
    
    // Merge with new questions
    const existingQuestions = JSON.parse(banks[0].questions_json);
    const mergedQuestions = [...existingQuestions, ...questions];
    
    // Update question bank
    await db.query(
      'UPDATE question_sets SET questions_json = ? WHERE folder = ?',
      [JSON.stringify(mergedQuestions), folder]
    );
    
    res.json({ 
      success: true,
      addedCount: questions.length,
      totalCount: mergedQuestions.length
    });
    
  } catch (error) {
    console.error('Error adding questions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add questions' 
    });
  }
});

/**
 * DELETE /api/question-banks/:folder
 * Delete a question bank (admin only)
 */
router.delete('/:folder', requireAdmin, async (req, res) => {
  try {
    const { folder } = req.params;
    
    // Check if question bank exists
    const [existing] = await db.query(
      'SELECT id FROM question_sets WHERE folder = ?',
      [folder]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Question bank not found' 
      });
    }
    
    // Delete question bank
    await db.query('DELETE FROM question_sets WHERE folder = ?', [folder]);
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Error deleting question bank:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete question bank' 
    });
  }
});

module.exports = router;
