# Tuna Quiz Game (React)

An interactive gamified assessment that builds on the classic Snake game. You play as a Māori Tuna (eel) and answer multiple‑choice questions by steering the tuna to eat the crab labelled with the correct answer. It’s designed to make assessment more engaging than traditional multiple‑choice quizzes, while heavily enhancing the anti-cheat aspect by using a quick-paced, highly interactive game that essentially prevents students from searching for answers.

This repository contains:
- React frontend (the game)
- Node.js/Express backend

---

## How the Game Works

- Goal: Answer each question by eating the crab with the correct option (A, B, C, or D).
- Display: The current question appears on screen, and answers appear as labelled worms on the board.
- Progress: Eating the crab with the correct answer increases your score and length; the next question appears and the game gradually gets faster.
- Game Over:
  - Hitting a wall or your own tail ends the run.
  - Eating a crab with the wrong answer also ends the run.
- Leaderboard: Your best run (level/time) can be saved to the leaderboard. It shows top performers for each question bank.

### Controls
- S — Start the game
- Arrow Keys or WASD — Turn the tuna


Accessibility tip: The game is keyboard‑first; ensure the game canvas is focused (click it once) if keys don’t respond.

---

## Requirements for running the app

- A computer with a web browser (Chrome, Firefox, Edge, or Safari).
- Node.js (LTS version) — This lets you run JavaScript outside the browser.
  - Download from: https://nodejs.org
  - npm (the Node Package Manager) is included when you install Node.js.
- MySQL Community Server — The database used to store questions and leaderboard scores.
  - Download from: https://dev.mysql.com/downloads/mysql/
- Optional: Git (https://git-scm.com) to clone this repository, or you can download the ZIP from GitHub.

---

## Project Structure (Quick Tour)

```
Tuna_QuizGame/
├── react-snake-game/       # React frontend (the game)
├── backend/                # Node.js backend (recommended)
├── TUNA.sql                # Database schema
```

---

## Quick Start

Follow these steps in order. Commands shown work in macOS, Linux, and any terminal in Windows. When you see “mysql -u root -p”, you’ll be asked for your MySQL password.

### 1) Set up the database

Open a terminal/shell and go to the project folder:
```bash
cd Tuna_QuizGame
```

Create the database and tables using the provided SQL file:
```bash
mysql -u root -p < TUNA.sql
```

Notes:
- Replace root with your MySQL username if different.

### 2) Start the backend (Node.js/Express)

The backend provides API endpoints the game uses to load questions and save scores.

```bash
cd backend
npm install
cp .env.example .env
```

Edit the new .env file and set your MySQL login details:
```
DB_HOST=localhost 
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=SNAKE
PORT=5000
CORS_ORIGIN=http://localhost:3000 (or the base url you will be hosting the frontend)
```

Start the backend:
```bash
# Development mode (auto-restart on file changes)
npm run dev

# Or production mode
npm start
```

You should see it running at:
- Backend: http://localhost:5000

### 3) Start the frontend (React game)

Open a new terminal window/tab:
```bash
cd Tuna_QuizGame/react-snake-game
npm install
npm start
```

This will open:
- Game: http://localhost:3000

You’re ready to play!

---

## Building the App for Production

When you’re ready to create an optimized build of the React game for deployment:

```bash
cd Tuna_QuizGame/react-snake-game
npm run build
```

What this does:
- Creates a production‑optimized version of the game in react-snake-game/build.
- Minifies and bundles the code so it loads quickly for users.

How to serve the build locally for a quick test:
```bash
# Option A: Use 'serve' (one-time install)
npm install -g serve
serve -s build -l 3000

# Option B: npx (no global install)
npx serve -s build -l 3000
```

Keep the backend running (port 5000) so the built app can call the APIs.

Deployment options:
- Any static file host (Netlify, GitHub Pages, etc.) for the frontend build, plus your backend (Node.js) on a server/VPS/Platform-as-a-Service.
- See backend/README.md for containerization and hosting tips (Docker, Heroku, AWS, etc.).

## Credits and License

- Original Game: Professor Minh Nguyen @ AUT
- License: Apache 2.0 (see LICENSE)