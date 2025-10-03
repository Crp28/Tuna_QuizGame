# React Version Dependency Analysis on PHP Files

## Executive Summary

**Question**: Does the React version depend on any of the original PHP files?

**Answer**: **YES** - The React version has **CRITICAL dependencies** on PHP backend files.

**Question**: Will the game be fully functional without running the PHP server?

**Answer**: **NO** - The React version **CANNOT function standalone** without the PHP backend.

---

## Detailed Dependency Mapping

### 1. Questions Loading Dependency

**React Code Location**: `react-snake-game/src/App.js` (Lines 166-179)

```javascript
const loadQuestions = async () => {
  try {
    const response = await fetch('/comp705-01/load_questions.php');
    const data = await response.json();
    const decodedQuestions = data.map(q => ({
      question: decode(q.question),
      options: q.options.map(decode),
      answer: decode(q.answer)
    }));
    setQuestions(decodedQuestions);
    setQuestionsLoaded(true);
  } catch (error) {
    console.error('Failed to load questions:', error);
  }
};
```

**PHP File**: `comp705-01/load_questions.php`

**What it does**:
- Connects to MySQL database using credentials from `db-config.php`
- Queries `question_sets` table to get questions for the current folder (comp705-01)
- Retrieves JSON array of questions from `questions_json` column
- Base64 encodes questions, options, and answers for security
- Returns encoded JSON array to React frontend

**Data Flow**:
```
React App → PHP → MySQL Database → PHP (encode) → React App (decode)
```

**Why React Needs This**:
- Questions are stored in a MySQL database
- React has no direct database access (security best practice)
- Questions are dynamically loaded per folder/level
- Base64 encoding provides basic obfuscation

---

### 2. Leaderboard Loading Dependency

**React Code Location**: `react-snake-game/src/App.js` (Lines 182-191)

```javascript
const loadLeaderboard = async () => {
  try {
    const response = await fetch('/comp705-01/load_leaderboard.php');
    const data = await response.json();
    setLeaderboard(data);
    setLeaderboardLoaded(true);
  } catch (error) {
    console.error('Failed to load leaderboard:', error);
  }
};
```

**PHP File**: `comp705-01/load_leaderboard.php`

**What it does**:
- Connects to MySQL database
- Queries `leaderboard` table for entries in the current folder
- Implements complex validation logic:
  - Groups entries by username
  - Finds best score per user
  - Validates continuous level progression (anti-cheat)
  - Enforces cutoff date rules (2025-08-25 15:17:00)
  - Deletes invalid entries
- Sorts results by level (descending) then time (ascending)
- Returns filtered and sorted JSON array

**Data Flow**:
```
React App → PHP → MySQL (read/validate/delete) → PHP (sort) → React App
```

**Complex Logic Included**:
1. **Anti-cheat validation**: Users must have completed all levels 1 to N to claim level N
2. **Cutoff enforcement**: Entries after cutoff date must show continuous progression
3. **Data cleanup**: Invalid entries are automatically deleted from database
4. **Best score selection**: Only shows user's best attempt

**Why React Needs This**:
- Leaderboard data is in MySQL database
- Complex validation and anti-cheat logic on server-side
- Database modifications (deleting invalid entries)
- Sorting and filtering logic

---

### 3. Score Saving Dependency

**React Code Location**: `react-snake-game/src/App.js` (Lines 319-323 and 370-374)

```javascript
fetch('/comp705-01/save_leaderboard.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify([finalEntry])
});
```

**PHP File**: `comp705-01/save_leaderboard.php`

**What it does**:
- **Security validation**:
  - Checks if request method is POST
  - Validates User-Agent (blocks scripts/curl)
  - Validates JSON payload structure
- **Authentication validation**:
  - Reads cookies: username, firstname, lastname, email, full_name
  - Ensures all required cookies are present
  - Verifies submitted username matches cookie username
- **Data validation**:
  - Checks level is between 1-999
  - Checks time is between 0-3600 seconds
- **Database operations**:
  - Connects to MySQL
  - Extracts folder from URL path
  - Inserts validated entry into `leaderboard` table
  - Includes IP address logging
- Returns JSON response with success/error status

**Data Flow**:
```
React App → PHP (validate auth + data) → MySQL (insert) → PHP → React App
```

**Security Features**:
1. User-Agent validation (prevents automated attacks)
2. Cookie-based authentication
3. Username matching validation
4. Data sanity checks (level, time ranges)
5. IP address logging for audit trail

**Why React Needs This**:
- Database write operations require server-side handling
- Security validation must be server-side (can't trust client)
- Cookie validation and IP logging for audit
- Protection against cheating and automated attacks

---

### 4. External Navigation Dependencies

**React Code Location**: `react-snake-game/src/App.js`

#### Admin Panel Link (Line 847)
```javascript
<a href="/comp705-01/admin.php" target="_blank">
  {t.footerAdmin}
</a>
```

**Purpose**: Links to administrative interface for managing questions

#### Next Level Link (Line 675)
```javascript
<button onClick={() => window.location.href = '/comp705-02/'}>
  {t.nextLevelButton}
</button>
```

**Purpose**: Navigates to next level (comp705-02) which is a separate PHP application

**Note**: These are external navigation links, not API dependencies. The React app doesn't need these to function, but they provide important administrative and progression features.

---

## Database Structure Used

Based on the PHP files, the React app depends on these database tables:

### 1. `question_sets` Table
```sql
Columns:
- folder (VARCHAR) - Identifies the question set (e.g., 'comp705-01')
- questions_json (TEXT) - JSON array of questions
```

**Sample Data Structure**:
```json
[
  {
    "question": "What is React?",
    "options": ["A library", "A framework", "A language", "A database"],
    "answer": "A"
  }
]
```

### 2. `leaderboard` Table
```sql
Columns:
- id (INT, AUTO_INCREMENT)
- username (VARCHAR)
- full_name (VARCHAR)
- email (VARCHAR)
- level (INT)
- time (DECIMAL)
- ip_address (VARCHAR)
- folder (VARCHAR)
- created_at (TIMESTAMP)
```

---

## Can Dependencies Be Removed?

### Analysis: YES, but with significant effort

To make the React app fully standalone, you would need to:

### Option 1: Client-Side Data (Simple, Limited)

**What to do**:
1. Create a JSON file with all questions
2. Store leaderboard in localStorage
3. Remove database functionality

**Implementation**:
```javascript
// questions.json
export const questions = [
  {
    question: "What is React?",
    options: ["A library", "A framework", "A language", "A database"],
    answer: "A"
  },
  // ... more questions
];

// In App.js
import { questions as staticQuestions } from './questions';
// Use staticQuestions instead of fetching
```

**Advantages**:
- ✅ No server required
- ✅ Simple deployment (static hosting)
- ✅ Fast initial load

**Disadvantages**:
- ❌ Questions exposed in client code (can be viewed in source)
- ❌ No centralized leaderboard (only local)
- ❌ No anti-cheat validation
- ❌ No administrative interface
- ❌ Can't update questions without redeploying
- ❌ No audit trail (IP logging)

**Lost Features**:
- Global leaderboard
- Admin panel
- Question management
- Anti-cheat protection
- User tracking
- Level progression validation

---

### Option 2: Node.js Backend (Complex, Full Featured)

**What to do**:
1. Create Node.js/Express backend
2. Port all PHP logic to JavaScript
3. Use PostgreSQL/MongoDB instead of MySQL
4. Implement all validation and security logic

**Implementation Structure**:
```
react-snake-game/
├── client/              # React frontend
│   └── src/
│       └── App.js
└── server/              # Node.js backend
    ├── routes/
    │   ├── questions.js
    │   ├── leaderboard.js
    │   └── auth.js
    ├── models/
    │   ├── Question.js
    │   └── Leaderboard.js
    ├── middleware/
    │   ├── auth.js
    │   └── validation.js
    └── server.js
```

**Advantages**:
- ✅ Full JavaScript stack
- ✅ All features preserved
- ✅ Better scalability
- ✅ Modern tooling

**Disadvantages**:
- ❌ Significant development time
- ❌ Need to port ~300 lines of PHP logic
- ❌ Database migration required
- ❌ More complex deployment
- ❌ Need to maintain two versions (PHP + Node)

**Estimated Effort**: 8-16 hours of development

---

### Option 3: Serverless Functions (Modern, Scalable)

**What to do**:
1. Use AWS Lambda, Vercel Functions, or Netlify Functions
2. Port PHP logic to serverless functions
3. Use cloud database (AWS RDS, MongoDB Atlas)
4. Deploy React as static site

**Advantages**:
- ✅ Modern architecture
- ✅ Automatic scaling
- ✅ Pay-per-use pricing
- ✅ No server management

**Disadvantages**:
- ❌ Vendor lock-in
- ❌ Cold start latency
- ❌ More complex local development
- ❌ Learning curve for serverless

**Estimated Effort**: 6-12 hours of development

---

## Recommendation

### For Production Use: **Keep PHP Backend**

**Reasons**:
1. ✅ **Already working** - PHP backend is tested and production-ready
2. ✅ **Zero migration effort** - No need to rewrite logic
3. ✅ **All features preserved** - Anti-cheat, admin panel, audit trail
4. ✅ **Security validated** - Server-side validation already implemented
5. ✅ **Easy deployment** - PHP hosting is ubiquitous and cheap

### For Learning/Demo: **Use Client-Side Data**

**Reasons**:
1. ✅ **Simple deployment** - Can deploy to GitHub Pages, Netlify, etc.
2. ✅ **No backend required** - Perfect for static hosting
3. ✅ **Quick setup** - Just create questions.json
4. ⚠️ **Limited functionality** - Accept loss of global leaderboard

---

## Proposed Implementation: Client-Side Standalone Version

If you want to create a standalone React version, here's a minimal implementation plan:

### Step 1: Create Static Questions Data

**File**: `react-snake-game/src/questionsData.js`
```javascript
export const questions = [
  {
    question: "What is the capital of France?",
    options: ["London", "Paris", "Berlin", "Madrid"],
    answer: "B"
  },
  // Add 20-30 questions here
];
```

### Step 2: Modify App.js to Use Static Data

Replace:
```javascript
const response = await fetch('/comp705-01/load_questions.php');
```

With:
```javascript
import { questions as staticQuestions } from './questionsData';
// In useEffect:
setQuestions(staticQuestions);
setQuestionsLoaded(true);
```

### Step 3: Implement localStorage Leaderboard

Replace:
```javascript
const response = await fetch('/comp705-01/load_leaderboard.php');
```

With:
```javascript
const stored = localStorage.getItem('leaderboard');
const data = stored ? JSON.parse(stored) : [];
setLeaderboard(data);
```

Replace:
```javascript
fetch('/comp705-01/save_leaderboard.php', {...})
```

With:
```javascript
localStorage.setItem('leaderboard', JSON.stringify(updatedLeaderboard));
```

### Step 4: Remove External Links

Remove or disable:
- Admin panel link (no backend to manage)
- Next level navigation (no comp705-02)

### Step 5: Update Documentation

Document that this is a standalone demo version with:
- Local questions only
- Local leaderboard (not shared)
- No admin features
- No anti-cheat validation

---

## File-by-File Dependency Summary

| React File | PHP Dependencies | Purpose |
|------------|------------------|---------|
| `App.js` | `load_questions.php` | Load questions from database |
| `App.js` | `load_leaderboard.php` | Load and validate leaderboard |
| `App.js` | `save_leaderboard.php` | Save scores with validation |
| `App.js` | `admin.php` (link only) | Question management interface |
| `App.js` | `/comp705-02/` (link only) | Next level navigation |

**Total Critical Dependencies**: 3 PHP files (load_questions, load_leaderboard, save_leaderboard)

**Total Lines of PHP Code**: ~170 lines

**Complexity**: Medium-High (database operations, validation, anti-cheat logic)

---

## Conclusion

### Current State:
- React version is **NOT standalone**
- Requires PHP backend and MySQL database
- All three API endpoints are **critical** for functionality

### Path Forward:
1. **Keep PHP Backend** (Recommended) - Production-ready, fully featured
2. **Client-Side Version** - Good for demos, limited functionality
3. **Node.js Backend** - Modern stack, significant development effort
4. **Serverless Functions** - Scalable, complex setup

The choice depends on your requirements:
- **Need global leaderboard?** → Keep PHP or port to Node.js
- **Demo only?** → Go client-side with localStorage
- **Modern stack?** → Port to Node.js or serverless
- **Production now?** → Keep PHP backend (already works)

---

**Document Version**: 1.0  
**Created**: 2024  
**Branch**: react-tuna  
**Status**: Analysis Complete
