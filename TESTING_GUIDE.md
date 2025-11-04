# Testing Guide for Server-Side Answer Verification

This document describes how to test the server-side answer verification feature.

## Overview

The game now verifies answers on the server-side instead of client-side, improving security by:
- Not sending the correct answer to the frontend
- Validating answers through a backend API call
- Making it impossible to cheat by inspecting or modifying client-side code

## Setup for Testing

1. **Start the backend server:**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your MySQL credentials
   npm run dev
   ```

2. **Start the frontend development server:**
   ```bash
   cd react-snake-game
   npm install
   npm start
   ```

3. **Access the game:**
   Open http://localhost:3000 in your browser

## Test Cases

### Test Case 1: Normal Mode - Correct Answer
**Steps:**
1. Start a new game (press 'S')
2. Navigate the tuna to eat a crab with the correct answer
3. Observe the game behavior

**Expected Results:**
- Snake grows by one segment
- Level increases by 1
- A new question appears
- Slow-motion effect is triggered
- Game continues running
- Score is saved to leaderboard

### Test Case 2: Normal Mode - Incorrect Answer
**Steps:**
1. Start a new game (press 'S')
2. Navigate the tuna to eat a crab with an incorrect answer
3. Observe the game behavior

**Expected Results:**
- Snake initially appears to grow (optimistic update)
- Within a few milliseconds, the game ends with explosion animation
- Final score is saved to leaderboard
- "Play Again" splash screen appears

### Test Case 3: Practice Mode - Correct Answer
**Steps:**
1. Enable practice mode
2. Start a new game
3. Eat a crab with the correct answer

**Expected Results:**
- Same as Test Case 1, but:
  - Score is NOT saved to leaderboard
  - Game runs slightly slower than normal mode

### Test Case 4: Practice Mode - Incorrect Answer
**Steps:**
1. Enable practice mode
2. Start a new game
3. Eat a crab with an incorrect answer

**Expected Results:**
- Same as Test Case 2, but:
  - Score is NOT saved to leaderboard

### Test Case 5: Network Error Handling
**Steps:**
1. Start a game
2. Stop the backend server while playing
3. Eat a crab

**Expected Results:**
- Game should end (fail-safe behavior)
- Console logs should show verification error
- Explosion animation should play

### Test Case 6: Security Verification
**Steps:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Start a game
4. Inspect the response from `/api/questions?folder=comp705-01`

**Expected Results:**
- Response should contain questions with `question` and `options` fields
- Response should NOT contain `answer` field
- Each question object should look like:
  ```json
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"]
  }
  ```

### Test Case 7: Verification API Request
**Steps:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Start a game
4. Eat a crab
5. Inspect the POST request to `/api/questions/verify`

**Expected Results:**
- Request should be sent to `/api/questions/verify`
- Request body should contain:
  ```json
  {
    "questionText": "The actual question text",
    "chosenAnswer": "A" (or B, C, D),
    "folder": "comp705-01"
  }
  ```
- Response should contain:
  ```json
  {
    "success": true,
    "correct": true/false
  }
  ```

## Performance Testing

### Test Case 8: Response Time
**Steps:**
1. Play multiple games
2. Monitor the Network tab in DevTools
3. Check the response time for verification requests

**Expected Results:**
- Verification requests should complete within 50-100ms on localhost
- Game should feel responsive (no noticeable lag)
- Snake continues moving during verification

## Regression Testing

### Test Case 9: Multiple Quick Turns
**Steps:**
1. Start a game
2. Make multiple quick turns in succession
3. Eat crabs while turning

**Expected Results:**
- All turns should be registered
- No unexpected game endings
- Verification works correctly even during complex movements

### Test Case 10: Rapid Level Progression
**Steps:**
1. Start a game
2. Quickly eat multiple correct answer crabs in succession

**Expected Results:**
- Each level progresses smoothly
- No race conditions or duplicate verifications
- Leaderboard updates correctly

## Browser Compatibility

Test the game in:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari

## Notes

- The game uses optimistic updates, so the snake grows immediately
- If the answer is incorrect, the game ends asynchronously (usually within 50-100ms)
- This creates a smooth gameplay experience while maintaining security
- In case of network errors, the game fails safely by ending the game

## Security Notes

The implementation successfully addresses the primary security issue: correct answers are no longer exposed to the frontend. However, CodeQL analysis identified two pre-existing security concerns that are outside the scope of this change:

1. **Rate Limiting**: The question endpoints don't have rate limiting, which could allow abuse through excessive requests. This is a pre-existing issue across the entire API.

2. **CSRF Protection**: The server doesn't implement CSRF protection for POST requests. This is a pre-existing architectural issue.

These issues existed before this change and should be addressed separately as part of a broader security review.

## Debugging Tips

If issues occur:

1. **Check backend logs:**
   - Look for errors in the console where `npm run dev` is running
   - Verify database connection is working

2. **Check browser console:**
   - Look for error messages related to fetch/API calls
   - Check for React errors or warnings

3. **Check Network tab:**
   - Verify API requests are being sent
   - Check request/response format
   - Look for 4xx or 5xx errors

4. **Verify database:**
   - Ensure questions have the `answer` field in the database
   - Check that the question text matches exactly (case-sensitive)
