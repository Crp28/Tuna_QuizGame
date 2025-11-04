# Snake Quiz Game - React Version with Node.js Backend

This is a React implementation of the Snake Quiz Game with a modern Node.js/Express backend featuring **server-authoritative assessment** for secure, cheat-proof gameplay.

## Architecture

```
React Frontend (port 3000) ↔ Node.js Backend (port 5000) ↔ MySQL Database
```

## Key Security Feature: Server-Authoritative Assessment

The game now uses a **server-authoritative assessment flow** where:
- ✅ **Correct answers never sent to client** - Only question text and shuffled options with opaque IDs
- ✅ **Server validates all selections** - Prevents answer inspection or automated cheating
- ✅ **Smooth gameplay maintained** - Slow-motion effect hides network latency (~50-150ms)
- ✅ **Answer feedback on death** - Shows correct answer after wrong selection for learning

### How It Works

1. **Game Start**: Client calls `/api/assessments/start` to begin
   - Server shuffles questions and option order
   - Server generates opaque UUIDs for each option
   - Server stores correct answer mapping in session
   - Client receives question and options (NO answer field)

2. **Collision Detection**: When player hits a worm
   - Game triggers slow-motion effect immediately
   - Client sends `{ itemId, optionId, seq }` to `/api/assessments/attempt`
   - Server validates choice and returns `{ correct: boolean, correctAnswer?: {...}, nextItem?: {...} }`
   - If correct: snake grows, next question loaded
   - If wrong: game ends, correct answer displayed

3. **Security Benefits**:
   - Cannot inspect network responses to find answers
   - Cannot inspect React state to find answer mapping
   - Cannot automate answer selection scripts
   - Server maintains authoritative game state

## Features

- ✅ All game logic in React with server-authoritative validation
- ✅ Snake movement with keyboard controls (WASD or Arrow keys)
- ✅ Question and answer system with worms
- ✅ Collision detection with server validation
- ✅ Score and level tracking
- ✅ Global leaderboard with database persistence
- ✅ **Node.js/Express backend** - Modern REST API
- ✅ **Server-side correctness validation** - Cheat-proof assessment
- ✅ **Answer feedback after death** - Educational feedback
- ✅ Similar art style and animations
- ✅ Slow-motion effect on collisions (hides network latency)
- ✅ Login system with cookies and sessions
- ✅ Next level progression

## Setup

### Prerequisites

- Node.js (v14 or higher)
- MySQL database with SNAKE schema
- Two terminals (one for backend, one for frontend)

### Installation

#### 1. Start the Node.js Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials (if needed)

# Start the backend server
npm start
```

Backend will run on `http://localhost:5000`

#### 2. Start the React Frontend

```bash
# In a new terminal, navigate to react-snake-game
cd react-snake-game

# Install dependencies (if not already done)
npm install

# Start the React development server
npm start
```

React app will run on `http://localhost:3000` and automatically proxy API requests to the backend.

## Quick Start

```bash
# Terminal 1: Start backend
cd backend && npm install && npm start

# Terminal 2: Start frontend
cd react-snake-game && npm install && npm start
```

Then open `http://localhost:3000` in your browser!

## Architecture

### Frontend (React)
- **App.js**: Main component containing all game logic
- **App.css**: Styling matching the original game's art style
- **index.js**: React entry point
- **translations.js**: Multi-language support

### Backend (Node.js/Express)
The React app uses a modern Node.js backend with REST API:
- `GET /api/questions?folder=comp705-01` - Loads quiz questions
- `GET /api/leaderboard?folder=comp705-01` - Loads leaderboard data
- `POST /api/leaderboard` - Saves player scores

**Key Difference from PHP**: Questions are returned in plain JSON (no base64 encoding!)

### Database (MySQL)
- **question_sets** table - Stores questions per folder
- **leaderboard** table - Stores player scores

## Game Logic

The React version maintains exact parity with the original:

1. **Snake Movement**: Uses `requestAnimationFrame` for smooth animation
2. **Collision Detection**: Checks walls and self-collision
3. **Question System**: Random question selection without repeats
4. **Worm Generation**: Smart positioning to avoid snake and maintain spacing
5. **Scoring**: Immediate leaderboard updates on correct answers
6. **Visual Effects**: Slow-motion glow effect and canvas rendering

## Key Benefits Over PHP Backend

- ✅ **Simpler Data Format**: No base64 encoding/decoding needed
- ✅ **Full JavaScript Stack**: Easier to maintain
- ✅ **Modern REST API**: Clean endpoint design
- ✅ **Better Performance**: Async/await, connection pooling
- ✅ **Easier Deployment**: Many hosting options

## Controls

- **S**: Start game
- **Arrow Keys** or **WASD**: Control snake direction

## Browser Compatibility

Works on all modern browsers that support:
- ES6+
- HTML5 Canvas
- React 19

## API Endpoints

### Assessment API (Server-Authoritative)

#### Start Assessment
```http
POST /api/assessments/start
Content-Type: application/json

{
  "folder": "comp705-01"
}
```

Returns first question with shuffled options (NO answer field).

#### Submit Answer
```http
POST /api/assessments/attempt
Content-Type: application/json

{
  "itemId": "uuid-here",
  "optionId": "uuid-here",
  "seq": 0
}
```

Returns validation result and next question (if correct).

### Legacy Endpoints

#### Get Questions (Admin/Practice Only)
```http
GET /api/questions?folder=comp705-01
```

⚠️ **Note**: Returns questions WITH answers - only for admin question management, not for assessed gameplay.

### Get Leaderboard
```http
GET /api/leaderboard?folder=comp705-01
```

### Save Score
```http
POST /api/leaderboard
Content-Type: application/json

{
  "name": "john_doe",
  "level": 5,
  "time": 45.23,
  "folder": "comp705-01"
}
```

See `backend/README.md` for complete API documentation.

## Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-reload
```

### Frontend Development
```bash
cd react-snake-game
npm start  # Hot reload enabled
```

## Production Build

### Backend
```bash
cd backend
npm start  # Production mode
```

### Frontend
```bash
cd react-snake-game
npm run build
```

The build files will be in the `build/` directory.

## Deployment

### Backend Options
- Heroku (with ClearDB MySQL add-on)
- DigitalOcean App Platform
- AWS EC2
- Docker container

### Frontend Options
- Any static host (Netlify, Vercel, GitHub Pages)
- Serve with backend using Express static middleware
- CDN deployment

See `backend/README.md` for detailed deployment instructions.

## Troubleshooting

### "Failed to load questions"
- Ensure backend is running on port 5000
- Check database connection in backend logs
- Verify MySQL SNAKE database exists

### "Failed to save score"
- Check backend is running
- Verify database credentials in backend/.env
- Check browser console for errors

### CORS Errors
- Ensure proxy in package.json points to backend: `"proxy": "http://localhost:5000"`
- Backend CORS is configured for http://localhost:3000

## Notes

- The app uses cookies for user authentication (same as original)
- Backend communication uses REST API (simpler than PHP)
- Questions are returned in plain JSON (no encoding)
- All animations and effects are preserved from original

## Documentation

- **backend/README.md** - Backend setup and API documentation
- **NODEJS_BACKEND_PROPOSAL.md** - Architecture and design decisions
- **COMPARISON.md** - Comparison with original PHP version

---

**Full JavaScript Stack** 🎉  
**Modern Architecture** ✅  
**Production Ready** 🚀

## ✨ Features

- ✅ All game logic ported to React
- ✅ Snake movement with keyboard controls (WASD or Arrow keys)
- ✅ Question and answer system with worms
- ✅ Collision detection
- ✅ Score and level tracking
- ✅ Leaderboard with localStorage persistence
- ✅ Login system with cookies
- ✅ Similar art style and animations
- ✅ Slow-motion effect on correct answers
- ✅ **100% standalone - no backend required!**

## 🚀 What's Different from Original?

### No Backend Dependencies

**Original Version**:
- Required PHP server running on port 8000
- MySQL database for questions and leaderboard
- Server-side validation and anti-cheat

**Standalone Version**:
- Questions stored in `src/questionsData.js`
- Leaderboard stored in browser localStorage
- All validation done client-side
- No server required!

### Trade-offs

**What You Gain**:
- ✅ Simple deployment (just `npm start`)
- ✅ Works offline
- ✅ Free hosting (GitHub Pages, Netlify, Vercel)
- ✅ No server costs
- ✅ Fast loading

**What You Lose**:
- ❌ Global leaderboard (only local to your browser)
- ❌ Admin panel for question management
- ❌ Server-side anti-cheat validation
- ❌ Next level navigation (disabled)
- ❌ Centralized question updates

## 📝 Adding Questions

Edit `src/questionsData.js`:

```javascript
export const questions = [
  {
    question: "Your question here?",
    options: ["Option A", "Option B", "Option C", "Option D"],
    answer: "B"  // The correct answer (A, B, C, or D)
  },
  // Add more questions...
];
```

## 🎯 How It Works

### Questions
- Stored in `src/questionsData.js` as a JavaScript array
- No encoding/decoding needed (questions are in plain text)
- Edit the file and restart the app to see changes

### Leaderboard
- Saved to browser's localStorage
- Persists across page refreshes
- Each browser has its own leaderboard
- Clear browser data to reset leaderboard

### User Authentication
- Uses cookies (same as original)
- Stores: username, firstname, lastname, email
- 180-day expiration

## 🏗️ Architecture

### Frontend Only
- **App.js**: All game logic (~860 lines)
- **App.css**: All styles
- **questionsData.js**: Static questions
- **translations.js**: Multi-language support
- **LanguageSwitcher.js**: Language toggle component

### No Backend
- No PHP files
- No MySQL database
- No API calls
- Everything runs in the browser

## 📦 Deployment

### Development
```bash
npm start
```
Opens on `http://localhost:3000`

### Production Build
```bash
npm run build
```
Creates optimized build in `build/` folder

### Deploy to Static Hosting

**GitHub Pages**:
```bash
npm run build
# Deploy build/ folder to gh-pages branch
```

**Netlify**:
- Drag and drop `build/` folder to Netlify
- Or connect GitHub repo for auto-deploys

**Vercel**:
```bash
vercel deploy
```

All these options are **FREE** and work perfectly!

## 🎮 Controls

- **S**: Start game
- **Arrow Keys** or **WASD**: Control snake direction

## 🌐 Browser Compatibility

Works on all modern browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers

## 🔧 Customization

### Change Number of Questions for "Next Level"
In `App.js`, find:
```javascript
if (newUsed.length >= Math.ceil(questions.length / 2)) {
  setShowNextLevel(true);
}
```
Change `/2` to adjust the threshold (currently 50%)

### Modify Game Speed
In `App.js`:
```javascript
const START_STEP_DELAY = 180;  // Starting speed
const MIN_STEP_DELAY = 105;    // Maximum speed
```

### Canvas Size
```javascript
const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 700;
```

## 🧪 Testing

### Clear Leaderboard
Open browser DevTools → Application → localStorage → Delete `snakeQuizLeaderboard`

### View Leaderboard Data
Console:
```javascript
JSON.parse(localStorage.getItem('snakeQuizLeaderboard'))
```

### Reset Everything
Clear all cookies and localStorage in browser settings

## 📊 Features Comparison

| Feature | PHP Version | Standalone Version |
|---------|-------------|-------------------|
| Questions | MySQL DB | Static file |
| Leaderboard | MySQL DB | localStorage |
| Multi-user | ✅ Global | ❌ Local only |
| Offline | ❌ No | ✅ Yes |
| Deployment | Requires PHP | Static hosting |
| Admin Panel | ✅ Yes | ❌ No |
| Hosting Cost | $5+/month | FREE |
| Setup Time | 30 min | 2 min |

## 🎯 Best Use Cases

### Perfect For:
- ✅ Demos and presentations
- ✅ Portfolio projects
- ✅ Learning React
- ✅ Offline games
- ✅ Quick prototypes
- ✅ Free hosting needs

### Not Ideal For:
- ❌ Multi-user competitions
- ❌ Centralized leaderboards
- ❌ Dynamic question updates
- ❌ User analytics
- ❌ Anti-cheat requirements

## 🐛 Troubleshooting

**Q: Leaderboard doesn't save**
- Check browser allows localStorage
- Check if localStorage is full (rare)
- Try incognito mode to test

**Q: Questions don't load**
- Check `questionsData.js` syntax
- Check browser console for errors
- Ensure proper import in App.js

**Q: Game is slow**
- Check browser performance
- Close other tabs
- Disable browser extensions

## 📚 Project Structure

```
react-snake-game/
├── src/
│   ├── App.js                 # Main game component
│   ├── App.css                # All styles
│   ├── questionsData.js       # Static questions
│   ├── LanguageSwitcher.js    # Language toggle
│   ├── translations.js        # i18n strings
│   └── index.js               # React entry point
├── public/
│   └── index.html
├── package.json
└── README.md
```

## 🔄 Migrating Back to PHP Backend

If you need backend features later:

1. Restore `proxy` in package.json
2. Revert App.js changes
3. Start PHP server
4. Questions load from database
5. Leaderboard syncs to MySQL

The PHP backend files still exist in the parent directory!

## 📖 Related Documentation

- **REACT_PHP_DEPENDENCY_ANALYSIS.md** - Detailed analysis of what was changed
- **STANDALONE_IMPLEMENTATION_PLAN.md** - Step-by-step implementation guide
- **COMPARISON.md** - Original vs React comparison
- **DEPLOYMENT_GUIDE.md** - Full deployment instructions

## 💡 Tips

1. **Add More Questions**: Edit `questionsData.js` with 50+ questions for better gameplay
2. **Share Leaderboard**: Export localStorage and share JSON with friends
3. **Offline Play**: After first load, works completely offline
4. **Mobile**: Fully responsive, works on phones and tablets

## 🎓 Learning Resources

This standalone version is great for learning:
- React hooks (useState, useEffect, useRef, useCallback)
- Canvas API
- localStorage API
- Cookie management
- Game loop with requestAnimationFrame

## 📝 License

Apache License 2.0 - See [LICENSE](../LICENSE) file

## 🙏 Credits

**Original Game**: Minh Nguyen @ AUT

**React Implementation**: Standalone version based on the original PHP + React port

## 🎉 Ready to Play?

```bash
npm install
npm start
```

Have fun! 🐍🎮
