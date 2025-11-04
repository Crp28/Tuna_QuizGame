# Manual Testing Summary - Answer Correctness Fix

## Quick Reference for Manual Testing

This document provides a quick guide for manually testing the fix for the answer correctness issue.

## What Was Fixed

**Problem**: Correct answers sometimes caused game over due to mismatched optionIds
**Cause**: Race condition where a useEffect regenerated worms with random IDs during assessed mode
**Solution**: Skip worm regeneration when `assessmentSession` is active

## Quick Test Steps

### 1. Setup (One-time)
```bash
# Start MySQL
sudo service mysql start

# Import database (if not already done)
mysql -u ecms_nz -p6HhBrKSXFA3tqjg SNAKE < TUNA.sql

# Install dependencies
cd backend && npm install
cd ../react-snake-game && npm install
```

### 2. Run Application
```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
cd react-snake-game
npm start
```

### 3. Test in Browser
1. Open browser console (F12)
2. Login/register
3. Press 'S' to start game
4. Watch console for logs:
   - "Initial worms generated at game start" - shows optionIds
   - "Submitting answer" - shows what was submitted
   - "New worms generated after correct answer" - shows new question's worms

### 4. Verify Fix
✅ **What should happen**:
- Eating correct answer advances to next question
- Console logs show consistent optionIds
- No worm regeneration during active questions
- Can answer 5+ questions without false failures

❌ **What should NOT happen**:
- Correct answers causing game over
- Multiple "Initial worms generated" for same question
- OptionalId mismatches in console

## Key Console Logs to Watch

```javascript
// When game starts:
Initial worms generated at game start: [
  {label: "A", optionId: "uuid-1"},
  {label: "B", optionId: "uuid-2"},
  {label: "C", optionId: "uuid-3"},
  {label: "D", optionId: "uuid-4"}
]

// When you eat a worm:
Submitting answer: {
  itemId: "...",
  optionId: "uuid-1",  // Should match the worm you ate!
  label: "A",
  seq: 0
}

// After correct answer:
New worms generated after correct answer: [
  {label: "A", optionId: "new-uuid-1"},  // NEW IDs for next question
  ...
]
```

## Success Criteria

- [ ] Game starts without errors
- [ ] Can see all console logs mentioned above
- [ ] Eating correct answer advances to next question
- [ ] OptionalIds remain consistent for each question
- [ ] Can complete at least 5 questions successfully
- [ ] Wrong answers still correctly end the game

## If You Find Issues

1. Copy all console output
2. Note exact steps taken
3. Screenshot the issue if possible
4. Report with details about:
   - Which question number
   - What answer was selected
   - What the console showed

## Files Changed

- `react-snake-game/src/App.js`:
  - Lines 337-356: Added assessmentSession check in useEffect
  - Lines ~902-908: Added debug logging for submissions
  - Lines ~970-971: Added debug logging for new worms
  - Lines ~1181-1182: Added debug logging for initial worms

## Expected Build Output

```bash
npm run build
# Should complete with:
# "Compiled successfully"
# "The build folder is ready to be deployed"
```

## Notes

- Console logs are for debugging and can be removed after verification
- The fix is minimal - only adds 5 lines to prevent the race condition
- No changes to backend or game logic, just prevents unwanted worm regeneration
