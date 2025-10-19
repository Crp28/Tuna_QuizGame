const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * GET /api/leaderboard
 * Query params: folder (optional, default: comp705-01)
 * Returns: Array of leaderboard entries sorted by level (desc) and time (asc)
 */
router.get('/', async (req, res) => {
  try {
    const folder = req.query.folder || 'comp705-01';
    const cutoff = '2025-08-25 15:17:00';
    
    // Fetch all rows for this folder
    const [rows] = await db.query(
      `SELECT id, username AS name, level, time, created_at 
       FROM leaderboard 
       WHERE folder = ?`,
      [folder]
    );
    
    // Group rows by username
    const userRows = {};
    rows.forEach(row => {
      if (!userRows[row.name]) {
        userRows[row.name] = [];
      }
      userRows[row.name].push(row);
    });
    
    const best = [];
    
    // Process each user's entries
    for (const [name, entries] of Object.entries(userRows)) {
      let bestEntry = null;
      const levels = new Set();
      let earliest = null;
      
      // Find best entry and track levels
      entries.forEach(row => {
        const level = parseInt(row.level);
        const time = parseFloat(row.time);
        levels.add(level);
        
        const createdAt = new Date(row.created_at).getTime();
        if (earliest === null || createdAt < earliest) {
          earliest = createdAt;
        }
        
        if (bestEntry === null) {
          bestEntry = row;
        } else {
          const bestLevel = parseInt(bestEntry.level);
          const bestTime = parseFloat(bestEntry.time);
          if (level > bestLevel || (level === bestLevel && time < bestTime)) {
            bestEntry = row;
          }
        }
      });
      
      let ok = true;
      
      // Validate continuous progression if entry is after cutoff
      const bestCreatedAt = new Date(bestEntry.created_at);
      const cutoffDate = new Date(cutoff);
      if (bestCreatedAt >= cutoffDate) {
        const bestLevel = parseInt(bestEntry.level);
        for (let i = 1; i <= bestLevel; i++) {
          if (!levels.has(i)) {
            ok = false;
            break;
          }
        }
      }
      
      if (ok) {
        best.push({
          name: bestEntry.name,
          level: parseInt(bestEntry.level),
          time: parseFloat(bestEntry.time).toFixed(2)
        });
      } else {
        // Delete invalid entry
        await db.query(
          'DELETE FROM leaderboard WHERE folder = ? AND username = ? AND level = ?',
          [folder, name, parseInt(bestEntry.level)]
        );
      }
    }
    
    // Sort by level (desc) then time (asc)
    best.sort((a, b) => {
      if (a.level !== b.level) return b.level - a.level;
      return parseFloat(a.time) - parseFloat(b.time);
    });
    
    res.json(best);
    
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load leaderboard' 
    });
  }
});

/**
 * POST /api/leaderboard
 * Body: { name, level, time, folder? }
 * Returns: { success: true }
 */
router.post('/', async (req, res) => {
  try {
    const { name, level, time, folder = 'comp705-01' } = req.body;
    
    // Validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid name' 
      });
    }
    
    const levelNum = parseInt(level);
    const timeNum = parseFloat(time);
    
    if (isNaN(levelNum) || levelNum < 1 || levelNum > 999) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid level (must be 1-999)' 
      });
    }
    
    if (isNaN(timeNum) || timeNum <= 0 || timeNum > 3600) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid time (must be 0-3600)' 
      });
    }
    
    // Get user info from session (if available)
    const userId = req.session?.userId || null;
    const username = req.session?.username || name;
    const fullName = req.session?.name || '';
    const email = req.session?.email || '';
    const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
    
    // Insert into database
    await db.query(
      `INSERT INTO leaderboard 
       (user_id, username, full_name, email, level, time, ip_address, folder)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, username, fullName, email, levelNum, timeNum, ipAddress, folder]
    );
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Error saving score:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save score' 
    });
  }
});

module.exports = router;
