# Practice Mode Feature

## Overview
The Practice Mode feature automatically detects when players are struggling with the game and offers them a slower, more forgiving version. This helps players build confidence and improve their skills without the pressure of leaderboard competition.

## How It Works

### Automatic Detection
The system tracks player performance across multiple games and uses a heuristic algorithm to detect struggling patterns:

1. **Performance Tracking**: The game monitors:
   - Game duration (time alive)
   - Snake length at death
   - Time without player input (idle time)
   - Level achieved

2. **Struggling Indicators**: A game is flagged if it shows 2+ of these patterns:
   - Very short duration (< 10 seconds) - dying very early
   - Short snake (< 5 segments) combined with medium duration - hitting self when still short
   - Long idle time (> 3 seconds) before death - not controlling the snake
   - Low level (≤ 1) with decent duration - not progressing

3. **Trigger Threshold**: After 3 games, if 2+ games show struggling patterns, the practice mode popup appears

### Practice Mode Popup
When triggered, players see a friendly popup explaining:
- The system noticed they're having challenges
- Practice mode offers a slower snake speed
- Scores won't be recorded on leaderboard
- Levels won't unlock, but they can practice

Players can:
- Accept and try practice mode
- Decline and continue in normal mode

### Practice Mode Features

#### Slower Speed
- Base snake speed is increased by 80ms per move
- Gives players more time to react
- Makes planning moves easier

#### No Leaderboard Recording
- Scores aren't saved to database
- Players can practice without worrying about their record
- Encourages experimentation and learning

#### No Level Unlocking
- Completing 50% of questions doesn't trigger level unlock
- Keeps practice separate from progression
- Players must use normal mode to advance

#### Visual Indicator
- Orange/red banner displays "🎯 PRACTICE MODE"
- Clearly shows current mode
- Reminds players their progress isn't recorded

## User Experience

### For Struggling Players
1. Play a few games, struggle with controls or timing
2. See helpful popup offering practice mode
3. Try practice mode with slower speed
4. Build confidence and muscle memory
5. Switch back to normal mode when ready

### For Experienced Players
- Popup won't appear if playing well
- Can ignore popup if accidentally triggered
- No impact on normal gameplay

## Technical Details

### Algorithm Parameters

The detection algorithm can be tuned by adjusting:
- `duration < 10` - threshold for "very short" games
- `snakeLength < 5` - threshold for "short" snake
- `timeSinceLastMove > 3` - threshold for "long idle"
- `level <= 1` - threshold for "low level"
- `strugglingIndicators >= 2` - indicators per game
- `strugglingCount >= 2` - games needed (out of 3)

### Performance History
- Last 5 games are tracked
- Older games are automatically removed
- Reset on logout or page refresh

### Practice Mode Speed Calculation
```javascript
// Normal mode: 180ms - (level * 2)ms
// Practice mode: 180ms - (level * 2)ms + 80ms
const baseDelay = isSlow ? 340 : Math.max(MIN_STEP_DELAY, START_STEP_DELAY - 2 * level);
const stepDelay = isPracticeMode ? baseDelay + 80 : baseDelay;
```

## Configuration

Administrators can modify detection sensitivity by editing `App.js`:

```javascript
const detectStrugglingPlayer = (recentGames) => {
  // Adjust these thresholds based on player feedback:
  const shortGameThreshold = 10;  // seconds
  const shortSnakeThreshold = 5;  // segments
  const idleTimeThreshold = 3;    // seconds
  const lowLevelThreshold = 1;    // level number
  
  // Adjust sensitivity:
  const indicatorsNeeded = 2;     // per game
  const gamesNeeded = 2;          // out of 3
  
  // ... rest of function
};
```

## Educational Value

Practice mode helps players:
- **Learn Controls**: More time to understand movement mechanics
- **Build Confidence**: Practice without pressure
- **Develop Strategy**: Time to think about positioning
- **Reduce Frustration**: Less punishing for mistakes
- **Gradual Progression**: Natural transition to normal mode

## Accessibility

This feature improves accessibility for:
- Players with slower reaction times
- Players new to snake-style games
- Players with motor skill challenges
- Younger players learning the game

## Analytics

Administrators might want to track:
- How often practice mode is triggered
- How long players stay in practice mode
- Conversion rate to normal mode
- Improvement in normal mode after practice

## Future Enhancements

Potential improvements:
- Adjustable practice speed levels
- Practice mode tutorials
- Statistics dashboard for practice sessions
- Gradual speed increase in practice mode
- Achievement system for practice milestones

## Limitations

Current limitations:
- Practice mode state resets on page refresh
- No persistence of practice mode preference
- Same questions as normal mode
- No separate practice leaderboard

## FAQ

**Q: Will I see the popup every time I struggle?**  
A: No, it only appears once after detecting a pattern. You must decline and struggle again for it to reappear.

**Q: Can I switch back to normal mode?**  
A: Yes, practice mode only affects the current session. Start a new game to return to normal.

**Q: Does practice mode use different questions?**  
A: No, it uses the same question bank but doesn't record your progress.

**Q: Can I choose practice mode without struggling?**  
A: Currently, practice mode is only offered via the automatic detection system.

**Q: Is my struggle data saved?**  
A: No, performance history is only stored locally and isn't sent to the server.
