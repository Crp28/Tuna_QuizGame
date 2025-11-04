const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');

/**
 * POST /api/assessments/start
 * Start a new assessment session
 * Body: { folder }
 * Returns: { itemId, question, options: [{ optionId, label }], seq }
 */
router.post('/start', requireAuth, async (req, res) => {
  try {
    const { folder } = req.body;
    
    // Validation
    if (!folder) {
      return res.status(400).json({ 
        success: false, 
        error: 'Folder is required' 
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
    
    // Parse questions
    const questions = JSON.parse(rows[0].questions_json);
    
    if (questions.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Question bank has no questions' 
      });
    }
    
    // Shuffle questions to create a queue
    const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);
    
    // Generate assessment items with shuffled options and opaque IDs
    const assessmentQueue = shuffledQuestions.map((q, qIdx) => {
      const itemId = crypto.randomUUID();
      
      // Map options to labels and shuffle
      const labels = ['A', 'B', 'C', 'D'];
      const optionsWithLabels = q.options.map((text, idx) => ({
        originalLabel: labels[idx],
        text,
        label: labels[idx]
      }));
      
      // Shuffle the options
      const shuffledOptions = [...optionsWithLabels].sort(() => Math.random() - 0.5);
      
      // Create opaque option IDs
      const options = shuffledOptions.map(opt => ({
        optionId: crypto.randomUUID(),
        label: opt.label,
        text: opt.text,
        originalLabel: opt.originalLabel
      }));
      
      // Find correct option ID based on original answer
      const correctOption = options.find(opt => opt.originalLabel === q.answer);
      
      return {
        itemId,
        question: q.question,
        options: options.map(opt => ({
          optionId: opt.optionId,
          label: opt.label,
          text: opt.text
        })),
        correctOptionId: correctOption.optionId
      };
    });
    
    // Store assessment state in session
    req.session.assessment = {
      folder,
      queue: assessmentQueue,
      index: 0,
      seq: 0,
      mapping: assessmentQueue.reduce((acc, item) => {
        acc[item.itemId] = item.correctOptionId;
        return acc;
      }, {})
    };
    
    // Return first item (without correct answer)
    const firstItem = assessmentQueue[0];
    res.json({
      itemId: firstItem.itemId,
      question: firstItem.question,
      options: firstItem.options,
      seq: 0
    });
    
  } catch (error) {
    console.error('Error starting assessment:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to start assessment' 
    });
  }
});

/**
 * POST /api/assessments/attempt
 * Submit an answer and get validation result
 * Body: { itemId, optionId, seq }
 * Returns: { correct: boolean, nextItem?: { itemId, question, options, seq } }
 */
router.post('/attempt', requireAuth, async (req, res) => {
  try {
    const { itemId, optionId, seq } = req.body;
    
    // Validation
    if (!itemId || !optionId || typeof seq !== 'number') {
      return res.status(400).json({ 
        success: false, 
        error: 'itemId, optionId, and seq are required' 
      });
    }
    
    // Check if assessment session exists
    if (!req.session.assessment) {
      return res.status(400).json({ 
        success: false, 
        error: 'No active assessment session. Please start a new assessment.' 
      });
    }
    
    const assessment = req.session.assessment;
    
    // Validate sequence number
    if (seq !== assessment.seq) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid sequence number. Session may be out of sync.' 
      });
    }
    
    // Validate itemId
    const currentItem = assessment.queue[assessment.index];
    if (!currentItem || currentItem.itemId !== itemId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid item ID. Expected different question.' 
      });
    }
    
    // Check correctness
    const correctOptionId = assessment.mapping[itemId];
    const isCorrect = optionId === correctOptionId;
    
    // Find the correct option details (label and text) for wrong answers
    let correctAnswerInfo = null;
    if (!isCorrect) {
      const correctOption = currentItem.options.find(opt => opt.optionId === correctOptionId);
      if (correctOption) {
        correctAnswerInfo = {
          label: correctOption.label,
          text: correctOption.text
        };
      }
    }
    
    // Advance to next question
    assessment.index++;
    assessment.seq++;
    
    // Prepare response
    const response = {
      correct: isCorrect
    };
    
    // Include correct answer info if wrong
    if (!isCorrect && correctAnswerInfo) {
      response.correctAnswer = correctAnswerInfo;
    }
    
    // If there's a next question, include it
    if (isCorrect && assessment.index < assessment.queue.length) {
      const nextItem = assessment.queue[assessment.index];
      response.nextItem = {
        itemId: nextItem.itemId,
        question: nextItem.question,
        options: nextItem.options,
        seq: assessment.seq
      };
    } else {
      // Assessment complete - clear session
      delete req.session.assessment;
    }
    
    res.json(response);
    
  } catch (error) {
    console.error('Error processing attempt:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process attempt' 
    });
  }
});

module.exports = router;
