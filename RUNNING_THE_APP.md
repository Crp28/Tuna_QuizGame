# Running the Complete Application

This guide explains how to run the Tuna Quiz Game with the Node.js backend and React frontend.

## Overview

The application consists of two parts:
1. **Backend** (Node.js/Express on port 5000) - API server connected to MySQL
2. **Frontend** (React on port 3000) - Game UI that calls backend APIs

## Quick Start

### Terminal 1: Start Backend

```bash
cd backend
npm install
cp .env.example .env
npm start
```

You should see:
```
=================================
🚀 Tuna Quiz Backend Server
=================================
📡 Server running on port 5000
🌍 Environment: development
🔗 API: http://localhost:5000
🔗 Health: http://localhost:5000/api/health
=================================
✅ Database connection successful
```

### Terminal 2: Start Frontend

```bash
cd react-snake-game
npm install
npm start
```

React will automatically open `http://localhost:3000` in your browser.

## Step-by-Step Setup

### 1. Prerequisites

Ensure you have installed:
- **Node.js** v14 or higher (`node --version`)
- **npm** (`npm --version`)
- **MySQL** with SNAKE database (`mysql -u root -p`)

### 2. Database Setup

If you haven't already, create and populate the database:

```bash
mysql -u root -p < SNAKE.sql
```

Verify the database exists:
```bash
mysql -u root -p
mysql> SHOW DATABASES;
mysql> USE SNAKE;
mysql> SHOW TABLES;
mysql> SELECT * FROM question_sets LIMIT 1;
```

### 3. Backend Configuration

Navigate to backend directory:
```bash
cd backend
```

Install dependencies:
```bash
npm install
```

Create environment file:
```bash
cp .env.example .env
```

Edit `.env` if your database credentials are different:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=6HhBrKSXFA3tqjg
DB_NAME=SNAKE
PORT=5000
CORS_ORIGIN=http://localhost:3000
```

### 4. Start Backend Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Test the backend:
```bash
curl http://localhost:5000/api/health
curl http://localhost:5000/api/questions?folder=comp705-01
curl http://localhost:5000/api/leaderboard?folder=comp705-01
```

### 5. Frontend Setup

In a **new terminal**, navigate to frontend:
```bash
cd react-snake-game
```

Install dependencies:
```bash
npm install
```

### 6. Start Frontend Server

Development mode:
```bash
npm start
```

The React app will automatically:
- Open in your browser at `http://localhost:3000`
- Proxy API requests to backend at `http://localhost:5000`

## Verifying Everything Works

### 1. Check Backend is Running

Open `http://localhost:5000/api/health` in your browser.

You should see:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 2. Check Frontend is Running

Open `http://localhost:3000` in your browser.

You should see:
- Login form with snake emoji 🐍
- "Welcome!" message
- Input fields for username, first name, last name, email

### 3. Test the Game

1. Fill in the login form and click "Play Now"
2. Press **S** to start the game
3. Use **arrow keys** or **WASD** to move the snake
4. Answer questions by eating the correct worm

### 4. Check Backend Logs

In the backend terminal, you should see API requests:
```
GET /api/questions
GET /api/leaderboard
POST /api/leaderboard
```

## Troubleshooting

### Backend Issues

**Error: "Database connection failed"**
- Check MySQL is running: `mysql -u ecms_nz -p`
- Verify credentials in `backend/.env`
- Ensure SNAKE database exists

**Error: "Port 5000 already in use"**
- Change PORT in `backend/.env` to 5001
- Update proxy in `react-snake-game/package.json` to `http://localhost:5001`

**Error: "Cannot find module"**
- Run `npm install` in backend directory

### Frontend Issues

**Error: "Failed to load questions"**
- Ensure backend is running on port 5000
- Check backend console for errors
- Verify proxy in `package.json`: `"proxy": "http://localhost:5000"`

**Error: "Port 3000 already in use"**
- React will ask if you want to use port 3001
- Press **Y** to continue

**Error: "Cannot find module"**
- Run `npm install` in react-snake-game directory

### Network Issues

**CORS Error in browser console**
- Check CORS_ORIGIN in `backend/.env` matches React URL
- Default should be `http://localhost:3000`

**API calls return 404**
- Verify backend is running
- Check proxy in `react-snake-game/package.json`
- Look for backend errors in terminal

## Development Workflow

### Making Backend Changes

1. Edit files in `backend/src/`
2. If using `npm run dev`, changes auto-reload
3. If using `npm start`, restart manually with Ctrl+C then `npm start`

### Making Frontend Changes

1. Edit files in `react-snake-game/src/`
2. React automatically reloads in browser
3. No need to restart the server

### Database Changes

1. Update tables in MySQL
2. No need to restart backend (queries are dynamic)
3. Refresh frontend to see new data

## Production Build

### Backend

```bash
cd backend
npm start
```

Set `NODE_ENV=production` in `.env` for production mode.

### Frontend

```bash
cd react-snake-game
npm run build
```

Serve the `build/` directory with your backend or any static file server.

## Stopping the Servers

### Backend
Press **Ctrl+C** in the backend terminal

### Frontend
Press **Ctrl+C** in the frontend terminal

## Architecture Diagram

```
┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
│   Browser       │          │   Node.js       │          │   MySQL         │
│   (port 3000)   │◄────────►│   Backend       │◄────────►│   Database      │
│                 │          │   (port 5000)   │          │   (SNAKE)       │
│   React App     │   HTTP   │   Express API   │   SQL    │   Tables:       │
│   - Game UI     │   REST   │   - /api/*      │   Queries│   - questions   │
│   - Canvas      │   JSON   │   - CORS        │          │   - leaderboard │
│   - Login       │          │   - Validation  │          │                 │
└─────────────────┘          └─────────────────┘          └─────────────────┘
```

## Ports Used

- **3000** - React development server (frontend)
- **5000** - Node.js backend server (API)
- **3306** - MySQL database (default)

## Environment Variables

### Backend (.env)
```env
DB_HOST=localhost
DB_USER=ecms_nz
DB_PASSWORD=6HhBrKSXFA3tqjg
DB_NAME=SNAKE
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### Frontend
No environment variables needed. Proxy is configured in `package.json`.

## Next Steps

1. ✅ Start both servers (backend and frontend)
2. ✅ Test the game works correctly
3. ✅ Add more questions via admin panel
4. ✅ Deploy to production (see deployment guides)

## Need Help?

- Backend API docs: `backend/README.md`
- Frontend docs: `react-snake-game/README.md`
- Check terminal logs for errors
- Test endpoints with curl or Postman

---

**Both servers must be running for the game to work!**

Happy coding! 🎮🐍
