# Visual Testing Checklist

This document provides a comprehensive visual testing checklist to verify that the React implementation matches the original version's appearance and behavior.

## Login Screen

### ✅ Layout
- [ ] Centered on screen
- [ ] Background gradient (dark blue-gray)
- [ ] Form container has rounded corners
- [ ] Form has semi-transparent background
- [ ] Snake emoji (🐍) at top

### ✅ Text Styling
- [ ] "Welcome!" in yellow (#ffe082)
- [ ] Instructions in green (#81ff81)
- [ ] Font sizes match original
- [ ] Text is centered

### ✅ Form Fields
- [ ] 4 input fields visible
- [ ] Placeholder text in each field:
  - Nickname or Username
  - First Name
  - Last Name
  - Email
- [ ] Fields have border and padding
- [ ] Fields are centered within form

### ✅ Button
- [ ] "Play Now" button at bottom
- [ ] Yellow/gold background (#ffc107)
- [ ] Full width of form
- [ ] Bold text
- [ ] Hover effect changes color

## Main Game Screen

### ✅ Split Layout
- [ ] Left panel ~40% width
- [ ] Right panel ~60% width
- [ ] Responsive on mobile (stacks vertically)
- [ ] Dark gradient background

### ✅ Game Title (Right Panel)
- [ ] "🧑‍💻 Snake Quiz Game for [username]"
- [ ] Username has green gradient
- [ ] "at block comp705-01" text
- [ ] Block name has purple/blue gradient
- [ ] Font size ~1.75rem
- [ ] Left-aligned

### ✅ Score Box
- [ ] Below title
- [ ] Shows "Level: X | Time: X.X s"
- [ ] Dark background with border-radius
- [ ] Yellow text (#ffe082)
- [ ] Padding and shadow

### ✅ Canvas
- [ ] 900x700 pixels
- [ ] Dark radial gradient background
- [ ] Blue border (#24243e)
- [ ] Rounded corners
- [ ] Glowing shadow effect
- [ ] Centered in right panel

## Question Panel (Left Panel)

### ✅ Container
- [ ] Dark blue background (#223a50)
- [ ] Rounded corners
- [ ] Padding inside
- [ ] Shadow effect
- [ ] Takes full width of left panel

### ✅ Question Text
- [ ] "Q:" prefix in bold
- [ ] Question text readable
- [ ] Font size ~1.15em
- [ ] White text
- [ ] Margin below question

### ✅ Answer Options
- [ ] 4 options labeled A, B, C, D
- [ ] Each option in separate box
- [ ] Box background matches worm color (semi-transparent)
- [ ] Box has colored border (matches worm)
- [ ] Label and text both in worm color
- [ ] Glowing shadow effect
- [ ] Rounded corners
- [ ] Vertical spacing between options

### ✅ Animations
- [ ] Question panel animates when changing
- [ ] One of: fade-in, zoom-in, slide-left, bounce-in
- [ ] Animation smooth (~0.4-0.5s duration)

## Leaderboard

### ✅ Header
- [ ] "🏆 Top Players Leaderboard" title
- [ ] Yellow text (#ffe082)
- [ ] Font size ~1.5em
- [ ] Centered or left-aligned

### ✅ Table Container
- [ ] Dark background (#21293a)
- [ ] Rounded corners
- [ ] Padding
- [ ] Shadow effect
- [ ] Max height with scroll if needed

### ✅ Table Header
- [ ] Sticky at top when scrolling
- [ ] Dark blue background (#2c3b55)
- [ ] 4 columns: #, Name, Level, Time (s)
- [ ] Colors:
  - # in yellow
  - Name in green
  - Level in cyan
  - Time in orange

### ✅ Table Rows
- [ ] Alternating row colors
- [ ] Top 3 rows show medals (🥇🥈🥉)
- [ ] Current user row highlighted (#004d40)
- [ ] Current user row has green border (#00ffc3)
- [ ] Current user row flashes on entry
- [ ] Hover effect on rows

## Canvas Elements

### ✅ Snake
- [ ] Made of rounded square segments
- [ ] Each segment ~24x24 pixels
- [ ] Gradient colors (cyan to blue)
- [ ] Head has stronger glow
- [ ] Segments have shadow effect
- [ ] Smooth movement

### ✅ Snake (Slow Motion)
- [ ] Rainbow glow effect when eating correct answer
- [ ] Pulsing shadow
- [ ] Colors cycle through spectrum
- [ ] Effect lasts ~2 seconds
- [ ] Game slows down

### ✅ Worms
- [ ] Circular shape
- [ ] Labels: A, B, C, D
- [ ] Each has unique random color
- [ ] Bright, saturated colors
- [ ] Wiggle animation (subtle movement)
- [ ] Strong shadow/glow effect
- [ ] White text with black outline
- [ ] Text centered in circle

### ✅ Worm Animation
- [ ] Worms wiggle continuously
- [ ] Movement is sinusoidal
- [ ] ~2-3 pixel amplitude
- [ ] Animation pauses when game not started

## Splash Screen

### ✅ Position
- [ ] Centered over canvas
- [ ] Semi-transparent overlay
- [ ] Rounded corners
- [ ] Shadow effect

### ✅ Content (Start Screen)
- [ ] "Ready to play, [username]?" in large font
- [ ] "Press S to start the game!" below
- [ ] Question count with emphasis
- [ ] "Let's aim for at least 50% correct!"
- [ ] Instructions hint at bottom
- [ ] All text centered

### ✅ Content (Game Over)
- [ ] "Play again, [username]?"
- [ ] Same instructions
- [ ] Same styling as start screen

## Next Level Button

### ✅ Appearance
- [ ] Appears after 50% completion
- [ ] Green gradient background
- [ ] Full width of left panel
- [ ] Rounded corners
- [ ] Shadow effect
- [ ] Above leaderboard

### ✅ Content
- [ ] 🎉 Congratulations message
- [ ] "50%" emphasized
- [ ] "✅ Next Level" button
- [ ] Button has yellow background
- [ ] Button has shadow on hover

## Footer

### ✅ Layout
- [ ] Fixed at bottom of screen
- [ ] Full viewport width
- [ ] Centered text
- [ ] Semi-transparent

### ✅ Content
- [ ] "Made by Minh Nguyen @ AUT"
- [ ] "AUT" in white with red shadow
- [ ] Pipe separator
- [ ] "Admin: Edit Question Bank" link
- [ ] Link in yellow with underline
- [ ] Link opens in new tab

## Responsive Behavior

### ✅ Desktop (>900px)
- [ ] Split layout side-by-side
- [ ] Canvas at full size
- [ ] All elements visible

### ✅ Tablet (600-900px)
- [ ] Layout starts to compress
- [ ] Left panel may narrow
- [ ] Canvas scales down slightly

### ✅ Mobile (<600px)
- [ ] Vertical stack layout
- [ ] Left panel on top
- [ ] Right panel below
- [ ] Canvas scales to screen width
- [ ] All functionality works

## Interaction Testing

### ✅ Keyboard Controls
- [ ] S key starts game
- [ ] Arrow Up moves snake up
- [ ] Arrow Down moves snake down
- [ ] Arrow Left moves snake left
- [ ] Arrow Right moves snake right
- [ ] W key moves snake up
- [ ] A key moves snake left
- [ ] S key moves snake down (during game)
- [ ] D key moves snake right

### ✅ Game States
- [ ] Initial state shows splash screen
- [ ] Game state hides splash, enables controls
- [ ] Game over state shows splash again
- [ ] Questions update after eating correct worm
- [ ] Leaderboard updates in real-time

### ✅ Visual Feedback
- [ ] Cursor is default (not pointer) everywhere
- [ ] Text is not selectable
- [ ] No text highlighting on click
- [ ] Smooth transitions
- [ ] No layout shifts

## Color Palette Verification

Verify these exact colors are used:

| Element | Color | Hex/HSL |
|---------|-------|---------|
| Background gradient | Dark blue-gray | #283e51 to #485563 |
| Question panel | Dark blue | #223a50 |
| Username gradient | Green | #00c853 to #64dd17 |
| Block name gradient | Purple/blue | #ff4081, #7c4dff, #40c4ff |
| Score text | Yellow | #ffe082 |
| Leaderboard title | Yellow | #ffe082 |
| Leaderboard name | Green | #81ff81 |
| Leaderboard level | Cyan | #60e8fe |
| Leaderboard time | Orange | #ffd580 |
| User highlight | Dark green | #004d40 |
| User border | Bright cyan | #00ffc3 |
| Canvas border | Dark blue | #24243e |
| Snake head shadow | Yellow | #ffe082 |
| Snake body shadow | Cyan | #26ffd5 |

## Animation Timing

Verify animation durations:

| Animation | Duration | Easing |
|-----------|----------|--------|
| Question fade/zoom | 0.4s | ease-out |
| Splash screen pop-in | 0.6s | cubic-bezier |
| Slow motion glow | 2.0s | continuous |
| Row hover | 0.2s | default |
| Button hover | 0.2s | default |

## Accessibility

### ✅ Basic Checks
- [ ] All text is readable
- [ ] Contrast ratios are sufficient
- [ ] Form inputs are labeled
- [ ] Keyboard navigation works
- [ ] No flashing content >3 times/second

## Browser Compatibility

Test in these browsers:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## Performance

### ✅ Metrics
- [ ] 60 FPS gameplay
- [ ] No dropped frames
- [ ] Smooth animations
- [ ] Fast question loading (<500ms)
- [ ] Fast leaderboard loading (<500ms)
- [ ] No memory leaks during extended play

## Final Verification

### ✅ Side-by-Side Comparison
- [ ] Open original version in one tab
- [ ] Open React version in another tab
- [ ] Compare visually
- [ ] Take screenshots if needed
- [ ] Verify pixel-perfect match

### ✅ User Experience
- [ ] Game feels identical to play
- [ ] No noticeable differences
- [ ] All features work as expected
- [ ] No bugs or glitches
- [ ] Performance is smooth

## Notes

Use browser DevTools to:
- Inspect element styles
- Check computed colors
- Measure element dimensions
- Test responsive breakpoints
- Monitor console for errors
- Check network requests
- Profile performance

---

**Status**: ✅ All items checked = Ready for deployment
