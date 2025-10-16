const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/database');

/**
 * POST /api/auth/register
 * Create a new user account
 * Body: { username, name, email, password, accountType }
 */
router.post('/register', async (req, res) => {
  try {
    const { username, name, email, password, accountType = 'student' } = req.body;
    
    // Validation
    if (!username || !name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'All fields are required' 
      });
    }
    
    // Validate username format (alphanumeric, 3-50 chars)
    if (!/^[a-zA-Z0-9_]{3,50}$/.test(username)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username must be 3-50 characters and contain only letters, numbers, and underscores' 
      });
    }
    
    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email format' 
      });
    }
    
    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password must be at least 6 characters' 
      });
    }
    
    // Validate account type
    if (!['student', 'admin'].includes(accountType)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Account type must be either student or admin' 
      });
    }
    
    // Check if username or email already exists
    const [existing] = await db.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({ 
        success: false, 
        error: 'Username or email already exists' 
      });
    }
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Insert new user
    const [result] = await db.query(
      `INSERT INTO users (username, name, email, password_hash, account_type)
       VALUES (?, ?, ?, ?, ?)`,
      [username, name, email, passwordHash, accountType]
    );
    
    // Create session
    req.session.userId = result.insertId;
    req.session.username = username;
    req.session.name = name;
    req.session.email = email;
    req.session.accountType = accountType;
    
    res.json({ 
      success: true,
      user: {
        id: result.insertId,
        username,
        name,
        email,
        accountType
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to register user' 
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and create session
 * Body: { username, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validation
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username and password are required' 
      });
    }
    
    // Find user by username
    const [users] = await db.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid username or password' 
      });
    }
    
    const user = users[0];
    
    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid username or password' 
      });
    }
    
    // Create session
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.name = user.name;
    req.session.email = user.email;
    req.session.accountType = user.account_type;
    
    res.json({ 
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        accountType: user.account_type
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to login' 
    });
  }
});

/**
 * POST /api/auth/logout
 * Clear user session
 */
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to logout' 
      });
    }
    
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

/**
 * GET /api/auth/me
 * Get current logged-in user
 */
router.get('/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ 
      success: false, 
      error: 'Not authenticated' 
    });
  }
  
  res.json({ 
    success: true,
    user: {
      id: req.session.userId,
      username: req.session.username,
      name: req.session.name,
      email: req.session.email,
      accountType: req.session.accountType
    }
  });
});

module.exports = router;
