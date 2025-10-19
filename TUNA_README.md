# TUNA.sql - Complete Database Setup

## Overview

**TUNA.sql** is a single, consolidated SQL file that replaces both:
- `SNAKE.sql` (original database dump)
- `migrations/001_add_user_accounts.sql` (user account migration)

This file provides a clean, fresh start for the Tuna Quiz Game database with all required tables, indexes, foreign keys, and question bank seed data.

## What's Included

### Database Schema

1. **`users` table** - User authentication and authorization
   - User accounts (students and admins)
   - Password hashing support
   - Timestamps for account tracking

2. **`sessions` table** - Express session storage
   - Session management for authenticated users
   - Compatible with express-session middleware

3. **`leaderboard` table** - Game scores and player statistics
   - Empty table (no seed data)
   - Ready to track player scores
   - Linked to users table via foreign key

4. **`question_sets` table** - Question banks
   - Complete schema with all columns from migration
   - Includes seed data for 5 question banks:
     - english-01 (English Level 01)
     - english-02 (English Level 02)
     - english-03 (English Level 03)
     - comp705-01 (Software Engineering Fundamentals)
     - comp705-02 (Artificial Intelligence Basics)

### What's NOT Included

- **No leaderboard data** - The leaderboard table is empty and ready for new game scores
- **No user data** - The users table is empty and ready for new user registrations

## Usage

### Fresh Installation

To set up a fresh TUNA database:

```bash
# Create the TUNA database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS TUNA;"

# Import the schema and seed data
mysql -u root -p TUNA < TUNA.sql
```

### Verify Installation

Check that all tables were created:

```bash
mysql -u root -p TUNA -e "SHOW TABLES;"
```

Expected output:
```
+------------------+
| Tables_in_TUNA   |
+------------------+
| leaderboard      |
| question_sets    |
| sessions         |
| users            |
+------------------+
```

Check question banks were loaded:

```bash
mysql -u root -p TUNA -e "SELECT id, folder, name FROM question_sets;"
```

Expected output:
```
+----+------------+--------------------------------------+
| id | folder     | name                                 |
+----+------------+--------------------------------------+
|  1 | english-01 | English Level 01                     |
|  4 | english-02 | English Level 02                     |
|  5 | english-03 | English Level 03                     |
|  8 | comp705-01 | Software Engineering Fundamentals    |
| 14 | comp705-02 | Artificial Intelligence Basics       |
+----+------------+--------------------------------------+
```

### Configuration

Update your backend configuration to use the TUNA database:

**backend/.env:**
```env
DB_NAME=TUNA
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
```

## Key Features

### Complete Schema
- All tables from SNAKE.sql
- All enhancements from migrations/001_add_user_accounts.sql
- Proper indexes for performance
- Foreign key constraints for data integrity

### Clean Start
- No legacy leaderboard data
- No test user accounts
- Ready for production deployment

### Compatible
- Works with existing backend code
- Compatible with MySQL 5.7+ and MariaDB 10.2+
- No code changes required in the application

## Database Structure

### users Table
```sql
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL UNIQUE,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL UNIQUE,
  `password_hash` varchar(255) NOT NULL,
  `account_type` ENUM('student', 'admin') NOT NULL DEFAULT 'student',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
)
```

### question_sets Table
```sql
CREATE TABLE IF NOT EXISTS `question_sets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `folder` varchar(100) NOT NULL UNIQUE,
  `name` varchar(200) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `questions_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`questions_json`)),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
)
```

### leaderboard Table
```sql
CREATE TABLE IF NOT EXISTS `leaderboard` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `username` varchar(100) NOT NULL,
  `full_name` varchar(200) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `level` int(11) NOT NULL,
  `time` float NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `folder` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
)
```

## Advantages Over SNAKE.sql + migrations

1. **Single File** - One command to set up everything
2. **Clean Data** - No legacy leaderboard entries
3. **Complete Schema** - All features from both files combined
4. **No Dependencies** - Doesn't depend on existing database state
5. **Idempotent** - Safe to run on empty database (uses IF NOT EXISTS)

## Migration from SNAKE Database

If you already have a SNAKE database and want to migrate:

### Option 1: Fresh Start (Recommended)
```bash
# Backup existing database
mysqldump -u root -p SNAKE > SNAKE_backup.sql

# Drop and recreate
mysql -u root -p -e "DROP DATABASE IF EXISTS SNAKE; CREATE DATABASE TUNA;"
mysql -u root -p TUNA < TUNA.sql

# Update backend configuration to use TUNA database
```

### Option 2: Keep SNAKE, Add to TUNA
```bash
# Create new TUNA database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS TUNA;"
mysql -u root -p TUNA < TUNA.sql

# Run both databases side by side (update configuration as needed)
```

## Troubleshooting

### Error: "Database 'TUNA' doesn't exist"
Create the database first:
```bash
mysql -u root -p -e "CREATE DATABASE TUNA;"
```

### Error: "Table already exists"
The script uses `IF NOT EXISTS`, so this shouldn't happen on a fresh database. If you see this, you may be running on an existing database.

### Error: "Cannot add foreign key constraint"
This happens if tables are created in the wrong order. TUNA.sql creates tables in the correct order:
1. users
2. sessions
3. leaderboard (references users)
4. question_sets (references users)

### JSON Validation Error
Ensure your MySQL/MariaDB version supports JSON validation:
- MySQL 5.7.8+
- MariaDB 10.2.7+

## Version History

- **v1.0** (2025-10-19)
  - Initial release
  - Combines SNAKE.sql and migrations/001_add_user_accounts.sql
  - Contains 5 question banks
  - No leaderboard data

## Related Files

- **SNAKE.sql** - Original database dump (deprecated, replaced by TUNA.sql)
- **migrations/001_add_user_accounts.sql** - User account migration (deprecated, merged into TUNA.sql)
- **backend/.env.example** - Backend configuration template

## Support

For issues or questions:
1. Check that MySQL/MariaDB is running
2. Verify database credentials
3. Review error messages in MySQL logs
4. Ensure sufficient privileges (CREATE, INSERT, ALTER)

## License

Same as the parent project (see LICENSE file in repository root)
