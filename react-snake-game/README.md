# Snake Quiz Game - React Version

This is a React implementation of the Snake Quiz Game, fully porting all game logic from the original vanilla JavaScript version.

## Features

- ✅ All game logic ported to React
- ✅ Snake movement with keyboard controls (WASD or Arrow keys)
- ✅ Question and answer system with worms
- ✅ Collision detection
- ✅ Score and level tracking
- ✅ Leaderboard integration
- ✅ Backend communication with PHP APIs
- ✅ Similar art style and animations
- ✅ Slow-motion effect on correct answers
- ✅ Login system with cookies
- ✅ Next level progression

## Setup

### Prerequisites

- Node.js (v14 or higher)
- PHP server for backend APIs
- MySQL database

### Installation

1. Navigate to the react-snake-game directory:
```bash
cd react-snake-game
```

2. Install dependencies:
```bash
npm install
```

### Running the Application

#### Development Mode

1. Start the PHP backend server (from the repository root):
```bash
php -S localhost:8000
```

2. In a new terminal, start the React development server:
```bash
cd react-snake-game
npm start
```

The React app will run on `http://localhost:3000` and proxy API requests to the PHP server on `http://localhost:8000`.

#### Production Build

To create a production build:
```bash
npm run build
```

The build files will be in the `build/` directory. You can serve these static files with any web server alongside the PHP backend.

## Architecture

### Frontend (React)
- **App.js**: Main component containing all game logic
- **App.css**: Styling matching the original game's art style
- **index.js**: React entry point

### Backend (PHP)
The React app uses the existing PHP backend:
- `/comp705-01/load_questions.php` - Loads quiz questions
- `/comp705-01/load_leaderboard.php` - Loads leaderboard data
- `/comp705-01/save_leaderboard.php` - Saves player scores

## Game Logic

The React version maintains exact parity with the original:

1. **Snake Movement**: Uses `requestAnimationFrame` for smooth animation
2. **Collision Detection**: Checks walls and self-collision
3. **Question System**: Random question selection without repeats
4. **Worm Generation**: Smart positioning to avoid snake and maintain spacing
5. **Scoring**: Immediate leaderboard updates on correct answers
6. **Visual Effects**: Slow-motion glow effect and canvas rendering

## Key Differences from Original

- Uses React hooks (`useState`, `useEffect`, `useRef`) instead of global variables
- Component-based architecture instead of procedural code
- Functional programming patterns
- Same backend APIs (no changes required to PHP files)

## Controls

- **S**: Start game
- **Arrow Keys** or **WASD**: Control snake direction
- **ESC**: Close game over dialog (when implemented)

## Browser Compatibility

Works on all modern browsers that support:
- ES6+
- HTML5 Canvas
- React 19

## Notes

- The app uses cookies for user authentication (same as original)
- Backend communication requires a running PHP server
- Canvas rendering maintains pixel-perfect accuracy with original
- All animations and effects are preserved
