# Manual Testing Guide for Bug Fixes

This document describes how to manually test the two bug fixes implemented.

## Prerequisites

1. Backend server running on port 5000
2. Frontend running on port 3000
3. Valid user account to login
4. Chrome/Firefox with DevTools

## Setup

```bash
# Terminal 1: Start backend
cd backend
npm install
npm start

# Terminal 2: Start frontend
cd react-snake-game
npm install
npm start
```

## Test 1: Duplicate Collision Detection Fix

### Purpose
Verify that the answer correctness check works correctly every time, not intermittently.

### Steps

1. Open http://localhost:3000 in browser
2. Login with valid credentials
3. Open DevTools → Network tab
4. Filter requests to show only XHR/Fetch
5. Press 'S' to start game
6. Observe the `/api/assessments/start` request - note the response:
   - Should contain `itemId`, `question`, `options` array, `seq: 0`
   - Each option has `optionId`, `label`, `text`
7. Play the game and intentionally hit a worm (any worm)
8. **CRITICAL**: Observe the Network tab immediately when collision occurs:
   - Should see exactly ONE `/api/assessments/attempt` request
   - Request payload should contain `itemId`, `optionId`, `seq`
   - If correct: Response has `correct: true` and `nextItem`
   - If wrong: Response has `correct: false` and `correctAnswer`
9. Repeat steps 5-8 multiple times (at least 10 times)

### Expected Results

- ✅ Only ONE `/api/assessments/attempt` request per collision
- ✅ No duplicate requests with same `seq` number
- ✅ Correct answers are always recognized as correct
- ✅ Wrong answers show correct answer in splash screen
- ✅ Game continues smoothly after correct answer
- ✅ Game ends immediately after wrong answer

### Signs of Bug (Before Fix)

- ❌ Multiple `/api/assessments/attempt` requests for same collision
- ❌ Second request fails with 400 error (seq mismatch)
- ❌ Correct answer sometimes treated as wrong (game dies)

## Test 2: Initial Input Suicide Bug Fix

### Purpose
Verify that the snake cannot commit suicide by pressing multiple direction keys rapidly before it starts moving.

### Steps

1. Open http://localhost:3000 in browser
2. Login with valid credentials
3. Press 'S' to start game
4. **IMMEDIATELY** after pressing 'S', rapidly press:
   - **Test A**: Press 'S' (or DOWN arrow), then immediately 'A' (or LEFT arrow)
   - Wait 2 seconds to see if snake moves correctly
5. If snake is still alive, restart game and try:
   - **Test B**: Press 'S' (or DOWN arrow), then immediately 'D' (or RIGHT arrow)
   - Wait 2 seconds
6. If snake is still alive, restart game and try:
   - **Test C**: Press 'A' (or LEFT arrow), then immediately 'S' (or DOWN arrow)
   - Wait 2 seconds
7. Repeat each test 5 times to ensure consistency

### Expected Results

- ✅ Snake accepts ONLY the first input (S, A, or any valid direction)
- ✅ Second input is ignored
- ✅ Snake starts moving in the direction of the FIRST input only
- ✅ No self-collision at start position
- ✅ After first move completes, normal input handling resumes

### Signs of Bug (Before Fix)

- ❌ Pressing S then A causes snake to move LEFT into its own body
- ❌ Pressing A then S causes snake to move DOWN into its own body  
- ❌ Pressing S then D causes snake to move RIGHT (but this might work since snake starts pointing right)
- ❌ Instant death at start position due to self-collision

## Test 3: Network Request Validation

### Purpose
Verify that the option IDs sent to server match the worms displayed on screen.

### Steps

1. Start game and observe first question
2. In DevTools Console, run:
   ```javascript
   // Get current assessment session and worms
   const state = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.values().next().value.currentFiber;
   // Navigate to find App component state
   console.log('Assessment Session:', state);
   ```
3. Alternatively, inspect network requests manually:
   - Note the `options` array from `/api/assessments/start` response
   - Each option has: `optionId`, `label` (A/B/C/D), `text`
4. When hitting a worm, observe the `/api/assessments/attempt` request:
   - The `optionId` in request should match one of the options from step 3
   - The label displayed on the worm should match the label of that option

### Expected Results

- ✅ OptionId sent to server matches the worm that was hit
- ✅ Label displayed on worm matches the option with that optionId
- ✅ Server correctly validates the answer based on optionId

## Test 4: Stress Test (Rapid Collisions)

### Purpose
Verify the game handles rapid collisions without errors.

### Steps

1. Start game
2. Immediately move snake into worms as quickly as possible
3. Try to hit multiple worms in quick succession (level up quickly)
4. Observe Network tab for any errors
5. Continue for at least 5 levels

### Expected Results

- ✅ No 400 errors in Network tab
- ✅ No "Invalid sequence number" errors
- ✅ Game progresses smoothly through levels
- ✅ Each collision is properly validated

## Success Criteria

All tests must pass with no errors:
- [ ] Test 1: No duplicate collision requests
- [ ] Test 2: No initial suicide bug
- [ ] Test 3: Correct option IDs sent to server
- [ ] Test 4: No errors during rapid play

## Troubleshooting

If tests fail:

1. Check browser console for JavaScript errors
2. Check backend console for server errors
3. Verify database has valid questions in `question_sets` table
4. Clear browser cookies and try again (session might be stale)
5. Restart both backend and frontend servers
