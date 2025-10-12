# User Account Feature Documentation

This document describes the user account and question bank management features added to the Tuna Quiz Game.

## Overview

The application now includes:
- **User Authentication**: Register and login with username/password
- **Two Account Types**: Student and Admin accounts
- **Session Management**: Secure session-based authentication
- **Question Bank Management**: Admins can create and manage question banks
- **Question Bank Selection**: Users can choose which question bank to use

## Features

### 1. User Registration and Login

#### Registration
Users can create an account by providing:
- **Username**: 3-50 characters, alphanumeric and underscores only
- **Full Name**: User's display name
- **Email**: Valid email address
- **Password**: Minimum 6 characters
- **Account Type**: Student or Admin

#### Login
Users can log in with:
- **Username**
- **Password**

The system uses secure session-based authentication with:
- bcrypt password hashing (salt rounds: 10)
- HTTP-only cookies
- 24-hour session duration

### 2. User Panel

After logging in, users see a User Panel displaying:
- User's name
- Account type (Student 🎓 or Admin 👑)
- Logout button
- Admin Panel button (admins only)

### 3. Question Bank Selector

Users can:
- View all available question banks
- See question count for each bank
- Switch between question banks
- Game resets when changing banks

### 4. Admin Panel (Admins Only)

Admins have access to two features:

#### Create Question Bank
- **Folder ID**: Unique identifier (e.g., "comp705-03")
- **Bank Name**: Human-readable name (e.g., "Database Systems")
- **Description**: Optional description

#### Add Questions to Bank
- Select an existing question bank
- Add questions in JSON format
- Questions must follow the schema:
  ```json
  [
    {
      "question": "What is 2 + 2?",
      "options": ["3", "4", "5", "6"],
      "answer": "B"
    }
  ]
  ```

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "johndoe",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "accountType": "student"
}
```

**Response (Success):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "johndoe",
    "name": "John Doe",
    "email": "john@example.com",
    "accountType": "student"
  }
}
```

#### POST /api/auth/login
Authenticate a user.

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "securepassword"
}
```

**Response (Success):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "johndoe",
    "name": "John Doe",
    "email": "john@example.com",
    "accountType": "student"
  }
}
```

#### POST /api/auth/logout
Clear user session.

**Response:**
```json
{
  "success": true
}
```

#### GET /api/auth/me
Get current authenticated user.

**Response (Success):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "johndoe",
    "name": "John Doe",
    "email": "john@example.com",
    "accountType": "student"
  }
}
```

### Question Bank Endpoints

All question bank endpoints require authentication.

#### GET /api/question-banks
List all question banks.

**Response:**
```json
[
  {
    "id": 1,
    "folder": "comp705-01",
    "name": "Software Engineering Fundamentals",
    "description": "Basic software engineering concepts",
    "question_count": 60,
    "created_by": 1,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

#### GET /api/question-banks/:folder
Get a specific question bank with questions.

**Response:**
```json
{
  "id": 1,
  "folder": "comp705-01",
  "name": "Software Engineering Fundamentals",
  "description": "Basic software engineering concepts",
  "questions": [
    {
      "question": "What is software engineering?",
      "options": ["...", "...", "...", "..."],
      "answer": "A"
    }
  ],
  "created_by": 1,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

#### POST /api/question-banks (Admin Only)
Create a new question bank.

**Request Body:**
```json
{
  "folder": "comp705-03",
  "name": "Database Systems",
  "description": "Introduction to databases",
  "questions": []
}
```

**Response:**
```json
{
  "success": true,
  "questionBank": {
    "id": 3,
    "folder": "comp705-03",
    "name": "Database Systems",
    "description": "Introduction to databases",
    "questions": [],
    "created_by": 1
  }
}
```

#### POST /api/question-banks/:folder/questions (Admin Only)
Add questions to a question bank.

**Request Body:**
```json
{
  "questions": [
    {
      "question": "What is a primary key?",
      "options": ["...", "...", "...", "..."],
      "answer": "B"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "addedCount": 1,
  "totalCount": 61
}
```

## Database Schema

### users Table
```sql
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL UNIQUE,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL UNIQUE,
  `password_hash` varchar(255) NOT NULL,
  `account_type` ENUM('student', 'admin') NOT NULL DEFAULT 'student',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
);
```

### sessions Table
```sql
CREATE TABLE `sessions` (
  `session_id` varchar(128) NOT NULL,
  `expires` int(11) unsigned NOT NULL,
  `data` mediumtext,
  PRIMARY KEY (`session_id`)
);
```

### Updated question_sets Table
Added columns:
- `name` varchar(200) - Human-readable name
- `description` text - Optional description
- `created_by` int(11) - Foreign key to users table
- `created_at` timestamp
- `updated_at` timestamp

### Updated leaderboard Table
Added columns:
- `user_id` int(11) - Foreign key to users table

## Security Considerations

1. **Password Hashing**: Uses bcrypt with 10 salt rounds
2. **Session Security**: HTTP-only cookies, secure flag in production
3. **Authentication**: Session-based with MySQL store
4. **Authorization**: Admin endpoints check account_type
5. **Input Validation**: All inputs validated on backend
6. **SQL Injection**: Protected by prepared statements
7. **XSS**: Protected by React's built-in escaping

## Frontend Components

### LoginPage
- Tabbed interface for login/register
- Form validation
- Error handling
- Styled with gradient backgrounds

### UserPanel
- Displays user info
- Logout button
- Admin panel toggle (admins only)

### AdminPanel
- Modal overlay
- Create question bank form
- Add questions form with JSON input
- Tabbed interface

### QuestionBankSelector
- Dropdown selector
- Shows bank name and question count
- Updates game when changed

## Environment Variables

Add to `backend/.env`:

```env
# Session Configuration
SESSION_SECRET=change-this-to-a-random-secret-in-production
```

## Testing

### Manual Testing Checklist

#### Authentication
- [ ] Register a new student account
- [ ] Register a new admin account
- [ ] Login with correct credentials
- [ ] Login fails with wrong password
- [ ] Session persists across page refreshes
- [ ] Logout clears session

#### Question Banks
- [ ] Student can view question banks
- [ ] Student can switch between banks
- [ ] Game resets when switching banks
- [ ] Admin can create new bank
- [ ] Admin can add questions to bank
- [ ] Admin panel is not visible to students

#### Game Integration
- [ ] User name displays correctly
- [ ] Question bank name displays correctly
- [ ] Leaderboard shows correct user
- [ ] Scores save to correct bank

## Troubleshooting

### Common Issues

1. **"Authentication required" error**
   - Make sure you're logged in
   - Check session cookie exists
   - Verify backend is running

2. **"Admin access required" error**
   - User must have accountType='admin'
   - Check database users table

3. **Questions not loading**
   - Verify question bank exists
   - Check questions_json format
   - Look at browser console for errors

4. **Session not persisting**
   - Check SESSION_SECRET is set
   - Verify sessions table exists
   - Check cookie settings in browser

## Future Enhancements

Potential features to add:
- Password reset functionality
- Email verification
- User profile editing
- Question bank sharing
- Question bank permissions
- Question versioning
- Bulk question import/export
- Question categories and tags
- User statistics dashboard
