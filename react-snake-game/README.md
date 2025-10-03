# Snake Quiz Game - React Standalone Version

This is a **fully standalone** React implementation of the Snake Quiz Game. It requires **NO backend server** - everything runs in your browser!

## 🎮 Quick Start

```bash
cd react-snake-game
npm install
npm start
```

That's it! No PHP server, no database, no backend needed!

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
