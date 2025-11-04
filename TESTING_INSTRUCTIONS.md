# Testing Instructions for Answer Correctness Fix

## Overview
This document provides instructions for testing the fix for the issue where correct answers were sometimes judged as incorrect due to a race condition in worm regeneration.

**Note**: Console logging has been added to help verify the fix works correctly. These logs can be removed once the fix is confirmed to be working as expected in production.

## The Bug That Was Fixed
**Issue**: When playing the game in assessed mode, sometimes selecting the correct answer would still cause the player to die (game over).

**Root Cause**: A `useEffect` hook that monitored `currentQuestion` was regenerating worms with random `optionId`s whenever a new question was set. This created a race condition where:
1. Player eats correct worm with optionId "abc123"
2. Server validation starts for "abc123"
3. New question is set, triggering useEffect
4. useEffect regenerates ALL worms with NEW random optionIds
5. If the snake was still moving and ate another worm, it would send a different optionId
6. Server would reject it as incorrect

**Fix**: Added a check in the useEffect to skip worm regeneration when in assessed mode (`assessmentSession` exists), ensuring worms are only managed by the assessment flow.

## Prerequisites for Testing

1. **MySQL Database Setup**
   ```bash
   # Start MySQL
   sudo service mysql start
   
   # Create database and user
   sudo mysql -u root -p
   CREATE DATABASE IF NOT EXISTS SNAKE;
   CREATE USER IF NOT EXISTS 'ecms_nz'@'localhost' IDENTIFIED BY '6HhBrKSXFA3tqjg';
   GRANT ALL PRIVILEGES ON SNAKE.* TO 'ecms_nz'@'localhost';
   FLUSH PRIVILEGES;
   exit;
   
   # Import schema and data
   mysql -u ecms_nz -p6HhBrKSXFA3tqjg SNAKE < TUNA.sql
   ```

2. **Install Dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../react-snake-game
   npm install
   ```

## Running the Application

1. **Start Backend Server** (Terminal 1)
   ```bash
   cd backend
   npm start
   ```
   Should see: "✅ Database connection successful" and "Server running on port 3001"

2. **Start Frontend** (Terminal 2)
   ```bash
   cd react-snake-game
   npm start
   ```
   Browser should open automatically at http://localhost:3000

## Testing Procedure

### 1. Enable Browser Console for Debugging
- Open browser Developer Tools (F12 or Ctrl+Shift+I)
- Go to Console tab
- Keep it open during testing

### 2. Login/Register
- Create a test user account or login with existing credentials
- The game should load with the splash screen

### 3. Start Assessment Mode Game
- Press 'S' to start the game
- **IMPORTANT**: Open browser console to monitor logs

### 4. Observe Console Logs
You should see logs like:
```
Initial worms generated at game start: [
  {label: "A", optionId: "550e8400-e29b-41d4-a716-446655440000"},
  {label: "B", optionId: "550e8400-e29b-41d4-a716-446655440001"},
  {label: "C", optionId: "550e8400-e29b-41d4-a716-446655440002"},
  {label: "D", optionId: "550e8400-e29b-41d4-a716-446655440003"}
]
```

### 5. Play and Eat Correct Answer
- Navigate the tuna to eat the correct answer worm
- **Watch the console** for:
  ```
  Submitting answer: {itemId: "...", optionId: "...", label: "A", seq: 0}
  ```
- If correct, you should see:
  ```
  New worms generated after correct answer: [
    {label: "A", optionId: "..."},
    ...
  ]
  ```

### 6. Verify No Race Condition
**Critical Test**: The optionIds should:
- ✅ Match between what you submit and what the server expects
- ✅ NOT change after a correct answer (except for the new question's worms)
- ✅ Remain consistent even if you move quickly after eating a worm

### 7. Test Multiple Questions
- Answer at least 5-10 questions correctly
- Each time, verify in console that:
  1. The submitted optionId corresponds to the worm you ate
  2. New worms are generated with new optionIds for the next question
  3. Old worms are NOT regenerated with different IDs

### 8. Test Edge Cases

#### Test A: Quick Movement After Eating
1. Eat a correct answer
2. Immediately move toward another worm position
3. Verify the game doesn't die if you're moving quickly
4. Check console logs to ensure optionIds didn't change mid-flight

#### Test B: Slow-Mo Effect
1. When you eat a correct answer, the game enters slow-motion
2. During slow-mo, observe that worms don't flicker or regenerate
3. Verify smooth transition to next question

#### Test C: Wrong Answer
1. Intentionally eat a wrong answer
2. Verify game ends appropriately
3. Check that correct answer is shown

## Expected Results

### ✅ Success Criteria
1. **No False Negatives**: Eating correct answers should ALWAYS advance to next question
2. **Consistent IDs**: Console logs show stable optionIds throughout each question
3. **No Regeneration**: The useEffect should NOT fire during assessed mode (no practice mode worm generation logs)
4. **Smooth Gameplay**: No flickering or jumping of worms

### ❌ Failure Indicators
1. Console shows worms being regenerated with `generateWormsForQuestion` during assessed mode
2. Correct answers sometimes cause game over
3. Console logs show optionId mismatches between submission and worm
4. Multiple "Initial worms generated" messages for same question

## Debugging Commands

If issues are found, use these to investigate:

```javascript
// In browser console, inspect current worm state:
// (Only works if you set breakpoint or expose to window)

// Check if assessment session exists:
console.log('Assessment session active:', !!assessmentSession);

// Check current worms:
console.log('Current worms:', wormsRef.current);
```

## Verification Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts and connects to backend
- [ ] Can login/register successfully
- [ ] Game starts in assessed mode
- [ ] Console shows "Initial worms generated at game start"
- [ ] Can eat correct answer and advance to next question
- [ ] Console shows "Submitting answer" with correct optionId
- [ ] Console shows "New worms generated after correct answer"
- [ ] No worm regeneration during active questions
- [ ] Can complete at least 5 questions without false negatives
- [ ] Wrong answers correctly end the game
- [ ] No console errors during gameplay

## Known Issues (Unrelated to This Fix)
- npm audit may show vulnerabilities in dependencies (not related to this fix)
- Game requires focus on canvas for keyboard input

## Post-Testing Cleanup
Once the fix has been verified to work correctly in production:
1. The debug console.log statements can be removed from `App.js` (lines ~902-908, ~970-971, ~1181-1182)
2. Or replace with a configurable logging system if needed for ongoing debugging

## Reporting Issues
If you encounter problems during testing:
1. Copy all console logs from the session
2. Note the exact sequence of actions taken
3. Specify which question number the issue occurred on
4. Include any error messages from browser or server console
