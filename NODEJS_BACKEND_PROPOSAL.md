# Node.js Backend Proposal - Best of Both Worlds

## Overview

This proposal addresses the user's concern about the trade-offs of the standalone version. Instead of removing the database entirely, we can create a modern Node.js/Express backend that:

✅ **Keeps all database benefits** (centralized questions, global leaderboard, user management)  
✅ **Simplifies communication** (direct REST API, no PHP complexity)  
✅ **Maintains security** (server-side validation, authentication)  
✅ **Modern stack** (Full JavaScript/TypeScript, easier to maintain)

---

## Architecture

```
React Frontend (port 3000)
    ↓ REST API calls
Node.js/Express Backend (port 5000)
    ↓ SQL queries
MySQL/PostgreSQL Database
```

**Key Benefits:**
- Single language (JavaScript/TypeScript) for full stack
- Modern tooling and development experience
- Easy deployment (Docker, Heroku, AWS, etc.)
- Better performance than PHP
- Simpler debugging and maintenance

---

## Proposed Backend Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # Database connection config
│   ├── models/
│   │   ├── Question.js          # Question model
│   │   └── Leaderboard.js       # Leaderboard model
│   ├── routes/
│   │   ├── questions.js         # GET /api/questions
│   │   ├── leaderboard.js       # GET/POST /api/leaderboard
│   │   └── auth.js              # Authentication routes (optional)
│   ├── middleware/
│   │   ├── auth.js              # Cookie/JWT authentication
│   │   └── validation.js        # Request validation
│   ├── utils/
│   │   └── logger.js            # Logging utility
│   └── server.js                # Express app entry point
├── package.json
├── .env.example
└── README.md
```

---

## API Endpoints

### 1. Get Questions
```
GET /api/questions?folder=comp705-01
Response: [
  {
    "question": "What is React?",
    "options": ["A library", "A framework", "A language", "A database"],
    "answer": "A"
  }
]
```

### 2. Get Leaderboard
```
GET /api/leaderboard?folder=comp705-01
Response: [
  { "name": "john_doe", "level": 15, "time": "125.43" },
  { "name": "jane_smith", "level": 14, "time": "98.27" }
]
```

### 3. Save Score
```
POST /api/leaderboard
Body: {
  "name": "john_doe",
  "level": 5,
  "time": "45.23",
  "folder": "comp705-01"
}
Response: { "success": true }
```

---

## Technology Stack Options

### Option 1: Express + MySQL (Direct PHP Replacement)
**Pros:**
- Drop-in replacement for existing PHP backend
- Use existing MySQL database and schema
- Familiar for teams knowing PHP/MySQL
- Lightweight and fast

**Cons:**
- Still requires MySQL setup
- SQL queries can be complex

**Packages:**
```json
{
  "express": "^4.18.2",
  "mysql2": "^3.6.0",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "helmet": "^7.0.0"
}
```

---

### Option 2: Express + Sequelize ORM + MySQL/PostgreSQL
**Pros:**
- ORM simplifies database operations
- Database-agnostic (can switch from MySQL to PostgreSQL)
- Built-in validation and migrations
- TypeScript support

**Cons:**
- Slightly more complex setup
- Small performance overhead

**Packages:**
```json
{
  "express": "^4.18.2",
  "sequelize": "^6.32.1",
  "mysql2": "^3.6.0",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "helmet": "^7.0.0"
}
```

---

### Option 3: Express + Prisma ORM + PostgreSQL (Modern Stack)
**Pros:**
- Most modern approach with excellent TypeScript support
- Auto-generated types and migrations
- Great developer experience
- Built-in query builder

**Cons:**
- Requires PostgreSQL (would need database migration)
- Steeper learning curve

**Packages:**
```json
{
  "express": "^4.18.2",
  "@prisma/client": "^5.3.1",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "helmet": "^7.0.0"
}
```

---

## Recommended Solution: Option 1 (Express + MySQL)

**Why?**
- Minimal migration effort (use existing MySQL database)
- Direct replacement for PHP endpoints
- Simple and straightforward
- Fast to implement

---

## Implementation Plan

### Phase 1: Setup (30 minutes)
1. Create `backend/` directory
2. Initialize Node.js project
3. Install dependencies
4. Setup database connection
5. Create basic Express server

### Phase 2: API Endpoints (1-2 hours)
1. Implement `/api/questions` endpoint
2. Implement `/api/leaderboard` GET endpoint
3. Implement `/api/leaderboard` POST endpoint
4. Add validation and error handling

### Phase 3: Security & Features (1 hour)
1. Add CORS configuration
2. Implement cookie authentication
3. Add request validation
4. Add logging

### Phase 4: Frontend Integration (30 minutes)
1. Update React app to use new API endpoints
2. Change from `/comp705-01/load_questions.php` to `/api/questions`
3. Update proxy in package.json to point to Node.js server
4. Test all functionality

### Phase 5: Deployment (30 minutes)
1. Create Dockerfile (optional)
2. Setup environment variables
3. Deploy to cloud (Heroku, AWS, DigitalOcean)

**Total Time: 3-4 hours**

---

## Sample Code

### server.js
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const questionsRouter = require('./routes/questions');
const leaderboardRouter = require('./routes/leaderboard');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/questions', questionsRouter);
app.use('/api/leaderboard', leaderboardRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### config/database.js
```javascript
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'ecms_nz',
  password: process.env.DB_PASSWORD || '6HhBrKSXFA3tqjg',
  database: process.env.DB_NAME || 'SNAKE',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
```

### routes/questions.js
```javascript
const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const folder = req.query.folder || 'comp705-01';
    
    const [rows] = await db.query(
      'SELECT questions_json FROM question_sets WHERE folder = ?',
      [folder]
    );
    
    if (rows.length === 0) {
      return res.json([]);
    }
    
    const questions = JSON.parse(rows[0].questions_json);
    res.json(questions);
  } catch (error) {
    console.error('Error loading questions:', error);
    res.status(500).json({ error: 'Failed to load questions' });
  }
});

module.exports = router;
```

### routes/leaderboard.js
```javascript
const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET leaderboard
router.get('/', async (req, res) => {
  try {
    const folder = req.query.folder || 'comp705-01';
    
    const [rows] = await db.query(
      `SELECT username AS name, level, time, created_at
       FROM leaderboard 
       WHERE folder = ?
       ORDER BY level DESC, time ASC`,
      [folder]
    );
    
    // Apply validation logic (simplified from PHP)
    const leaderboard = rows.map(row => ({
      name: row.name,
      level: parseInt(row.level),
      time: parseFloat(row.time)
    }));
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    res.status(500).json({ error: 'Failed to load leaderboard' });
  }
});

// POST new score
router.post('/', async (req, res) => {
  try {
    const { name, level, time, folder = 'comp705-01' } = req.body;
    
    // Validation
    if (!name || level < 1 || level > 999 || time <= 0 || time > 3600) {
      return res.status(400).json({ error: 'Invalid data' });
    }
    
    // Get user info from cookies (simplified)
    const username = req.cookies?.username || name;
    const fullName = req.cookies?.full_name || '';
    const email = req.cookies?.email || '';
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    await db.query(
      `INSERT INTO leaderboard 
       (username, full_name, email, level, time, ip_address, folder)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, fullName, email, level, time, ipAddress, folder]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving score:', error);
    res.status(500).json({ error: 'Failed to save score' });
  }
});

module.exports = router;
```

---

## React Frontend Changes

### Update package.json proxy
```json
{
  "proxy": "http://localhost:5000"
}
```

### Update App.js API calls
```javascript
// Load questions
const response = await fetch('/api/questions?folder=comp705-01');
const questions = await response.json();

// Load leaderboard
const response = await fetch('/api/leaderboard?folder=comp705-01');
const leaderboard = await response.json();

// Save score
await fetch('/api/leaderboard', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, level, time, folder: 'comp705-01' })
});
```

**No base64 decoding needed!** Questions are returned in plain JSON.

---

## Deployment Options

### 1. Heroku (Easiest)
```bash
heroku create tuna-quiz-backend
heroku addons:create cleardb:ignite
git push heroku main
```

### 2. DigitalOcean App Platform
- Deploy from GitHub
- Auto-scaling
- $5/month for basic tier

### 3. AWS EC2
- Full control
- Can use existing database
- Requires server management

### 4. Docker + Any Cloud
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "src/server.js"]
```

---

## Comparison: PHP vs Node.js Backend

| Feature | PHP Backend | Node.js Backend |
|---------|------------|-----------------|
| **Language** | PHP | JavaScript |
| **Performance** | Good | Excellent (async) |
| **Development** | Traditional | Modern tooling |
| **Deployment** | PHP hosting | Any Node host |
| **Cost** | $5-20/mo | $0-10/mo |
| **Full Stack** | PHP + JS | JavaScript only |
| **TypeScript** | ❌ No | ✅ Easy |
| **API Design** | Traditional | REST/GraphQL |
| **Testing** | PHPUnit | Jest/Mocha |
| **Package Mgmt** | Composer | npm/yarn |

---

## Benefits Over Standalone Version

✅ **Centralized Data Management**
- Questions stored in database
- Easy to update via admin panel
- Global leaderboard across all users

✅ **Security**
- Server-side validation
- Authentication
- IP logging and audit trail
- Anti-cheat validation

✅ **Scalability**
- Handle multiple users
- Database transactions
- Query optimization

✅ **Maintainability**
- Single language (JavaScript)
- Modern development practices
- Easy to add features

---

## Benefits Over PHP Backend

✅ **Simpler Architecture**
- REST API design
- No base64 encoding needed
- Cleaner code structure

✅ **Better Developer Experience**
- Modern tooling
- Hot reload in development
- Better debugging

✅ **Performance**
- Async I/O
- Better for real-time features
- Lower memory usage

✅ **Deployment**
- More hosting options
- Easier containerization
- Better CI/CD support

---

## Migration Path from Current State

### If you want to proceed with Node.js backend:

**Option A: Keep Database Schema**
1. Create Node.js backend using existing MySQL database
2. Update React frontend to use new API endpoints
3. Test thoroughly
4. Deprecate PHP files
5. Deploy Node.js backend

**Time:** 4-6 hours

**Option B: Fresh Start with Better Schema**
1. Design improved database schema
2. Create Node.js backend with new schema
3. Migrate data from old database
4. Update React frontend
5. Deploy

**Time:** 8-12 hours

---

## Recommendation

I recommend **Option A with Express + MySQL** because:

1. ✅ **Minimal Migration** - Use existing database
2. ✅ **Quick Implementation** - 4-6 hours total
3. ✅ **All Benefits** - Keep database features, gain modern stack
4. ✅ **No Trade-offs** - Best of both worlds
5. ✅ **Easy Maintenance** - Full JavaScript stack

---

## Next Steps

If you approve this approach, I can:

1. Create the Node.js backend structure
2. Implement all three API endpoints
3. Add authentication and validation
4. Update React frontend to use new APIs
5. Test the complete integration
6. Update documentation

**Estimated time: 4-6 hours of implementation**

---

Would you like me to proceed with implementing the Node.js backend? Or do you have any questions or prefer a different approach?
