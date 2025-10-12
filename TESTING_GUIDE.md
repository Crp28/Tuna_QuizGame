# Testing Guide for User Account Features

This guide walks you through testing the new user account and question bank management features.

## Prerequisites

1. **Database Migration**: Run the migration first
```bash
mysql -u root -p SNAKE < migrations/001_add_user_accounts.sql
```

2. **Backend Running**: Start the Node.js backend
```bash
cd backend
npm start
```

3. **Frontend Running**: Start the React frontend
```bash
cd react-snake-game
npm start
```

## Test Scenarios

### 1. User Registration

#### Test Case: Register a Student Account
1. Open http://localhost:3000
2. You should see a login page with two tabs: "Login" and "Register"
3. Click the "Register" tab
4. Fill in the form:
   - Username: `testuser`
   - Full Name: `Test User`
   - Email: `test@example.com`
   - Password: `password123`
   - Confirm Password: `password123`
   - Account Type: Select "Student"
5. Click "Register"
6. **Expected**: You should be logged in and see the game interface

#### Test Case: Register an Admin Account
1. Click logout (if logged in)
2. Go to Register tab
3. Fill in the form:
   - Username: `admin`
   - Full Name: `Admin User`
   - Email: `admin@example.com`
   - Password: `admin123`
   - Confirm Password: `admin123`
   - Account Type: Select "Admin"
4. Click "Register"
5. **Expected**: You should be logged in and see the game interface with Admin Panel button

### 2. User Login

#### Test Case: Login with Correct Credentials
1. Logout if logged in
2. Go to Login tab
3. Enter:
   - Username: `testuser`
   - Password: `password123`
4. Click "Login"
5. **Expected**: You should be logged in

#### Test Case: Login with Wrong Password
1. Logout if logged in
2. Go to Login tab
3. Enter:
   - Username: `testuser`
   - Password: `wrongpassword`
4. Click "Login"
5. **Expected**: Error message "Invalid username or password"

### 3. User Panel

#### Test Case: View User Info
1. Login as any user
2. Look at the top of the game page
3. **Expected**: You should see:
   - User icon
   - Your full name
   - Account type badge (🎓 Student or 👑 Admin)
   - Logout button
   - Admin Panel button (only for admins)

#### Test Case: Logout
1. Login as any user
2. Click the "🚪 Logout" button
3. **Expected**: You should be redirected to the login page

### 4. Question Bank Selector

#### Test Case: View Question Banks
1. Login as any user
2. Look for the "📚 Select Question Bank" dropdown
3. Click on it
4. **Expected**: You should see a list of available question banks with:
   - Bank name
   - Folder ID
   - Question count

#### Test Case: Switch Question Banks
1. Login as any user
2. Note the current question bank shown
3. Click the question bank selector
4. Select a different bank
5. Press 'S' to start the game
6. **Expected**: 
   - Game resets (level 1, time 0)
   - Questions are from the selected bank
   - Bank name updates in the game title

### 5. Admin Panel - Create Question Bank

#### Test Case: Create a New Question Bank
1. Login as an admin user
2. Click the "⚙️ Admin Panel" button
3. You should see a modal with two tabs
4. Ensure "Create Bank" tab is selected
5. Fill in the form:
   - Folder ID: `test-bank-01`
   - Bank Name: `Test Question Bank`
   - Description: `This is a test bank`
6. Click "Create Question Bank"
7. **Expected**: 
   - Success message appears
   - Form clears
8. Close the admin panel
9. Open question bank selector
10. **Expected**: Your new bank appears in the list

#### Test Case: Create Bank with Duplicate Folder
1. Login as admin
2. Open Admin Panel
3. Try to create a bank with folder ID `comp705-01` (already exists)
4. **Expected**: Error message "Question bank with this folder already exists"

### 6. Admin Panel - Add Questions

#### Test Case: Add Questions to Existing Bank
1. Login as admin
2. Click "⚙️ Admin Panel"
3. Click "Add Questions" tab
4. Select a question bank from dropdown (e.g., your test bank)
5. Paste this JSON in the text area:
```json
[
  {
    "question": "What is 5 + 5?",
    "options": ["8", "9", "10", "11"],
    "answer": "C"
  },
  {
    "question": "What color is grass?",
    "options": ["Red", "Blue", "Green", "Yellow"],
    "answer": "C"
  }
]
```
6. Click "Add Questions"
7. **Expected**: Success message "Successfully added 2 questions!"

#### Test Case: Add Questions with Invalid JSON
1. Login as admin
2. Open Admin Panel → Add Questions tab
3. Select a bank
4. Enter invalid JSON: `{invalid json}`
5. Click "Add Questions"
6. **Expected**: Error message about JSON parsing

### 7. Game Integration

#### Test Case: User Name Display
1. Login as any user
2. Look at the game title area
3. **Expected**: You should see "🧑‍💻 Game - [Your Name] @ [Bank Name]"

#### Test Case: Leaderboard Integration
1. Login and play the game
2. Complete at least one level
3. Die or complete multiple levels
4. Check the leaderboard
5. **Expected**: Your username appears in the leaderboard

#### Test Case: Session Persistence
1. Login as any user
2. Refresh the page
3. **Expected**: You remain logged in
4. Close the tab
5. Open a new tab to http://localhost:3000
6. **Expected**: You remain logged in (session persists)

### 8. Authorization

#### Test Case: Student Cannot Access Admin Features
1. Login as a student account
2. **Expected**: No "⚙️ Admin Panel" button visible
3. Try to directly access the admin API:
```bash
curl -X POST http://localhost:5000/api/question-banks \
  -H "Content-Type: application/json" \
  -d '{"folder":"hack","name":"Hack"}'
```
4. **Expected**: 403 Forbidden or 401 Unauthorized response

#### Test Case: Unauthenticated Access
1. Logout (or use incognito window)
2. Try to access http://localhost:3000
3. **Expected**: Login page is shown
4. Try to access API directly:
```bash
curl http://localhost:5000/api/question-banks
```
5. **Expected**: 401 Unauthorized response

### 9. Error Handling

#### Test Case: Network Error
1. Stop the backend server
2. Try to login
3. **Expected**: Appropriate error message
4. Start the backend
5. **Expected**: Login works again

#### Test Case: Invalid Input Validation
1. Try to register with:
   - Username less than 3 characters
   - Invalid email format
   - Password less than 6 characters
   - Mismatched passwords
2. **Expected**: Appropriate error messages for each case

## Verification Checklist

After completing all tests, verify:

- [ ] Users can register and login
- [ ] Student accounts cannot access admin features
- [ ] Admin accounts can create question banks
- [ ] Admin accounts can add questions
- [ ] Users can select different question banks
- [ ] Game resets when switching banks
- [ ] User's name displays correctly
- [ ] Leaderboard shows correct user
- [ ] Logout works correctly
- [ ] Session persists across page refreshes
- [ ] All error cases are handled gracefully

## Database Verification

Check the database to verify data is stored correctly:

```sql
-- View all users
SELECT id, username, name, email, account_type, created_at FROM users;

-- View all question banks
SELECT id, folder, name, description, created_by, created_at FROM question_sets;

-- View sessions
SELECT session_id, expires FROM sessions;

-- View leaderboard with user info
SELECT l.*, u.name as user_name, u.account_type 
FROM leaderboard l 
LEFT JOIN users u ON l.user_id = u.id 
ORDER BY l.created_at DESC 
LIMIT 10;
```

## Clean Up Test Data

After testing, you can clean up test data:

```sql
-- Remove test users
DELETE FROM users WHERE username IN ('testuser', 'admin');

-- Remove test question banks
DELETE FROM question_sets WHERE folder = 'test-bank-01';

-- Clear sessions
DELETE FROM sessions;
```

## Troubleshooting

If something doesn't work:

1. **Check Backend Logs**: Look at the terminal running `npm start` in backend
2. **Check Frontend Console**: Open browser DevTools → Console tab
3. **Check Network Tab**: Look for failed API requests
4. **Verify Database**: Run SQL queries above to check data
5. **Restart Services**: Stop and restart both backend and frontend

## Known Limitations

Current implementation limitations:
- No password reset functionality
- No email verification
- No profile editing
- Sessions expire after 24 hours
- No rate limiting on login attempts

These can be added in future enhancements.
