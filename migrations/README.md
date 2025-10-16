# Database Migrations

This directory contains SQL migration files for the Tuna Quiz Game database.

## Running Migrations

### Step 1: Apply the migration

Run the migration SQL file to add user accounts and question bank features:

```bash
mysql -u root -p SNAKE < migrations/001_add_user_accounts.sql
```

Replace `root` with your MySQL username and `SNAKE` with your database name if different.

**Note:** This migration is compatible with MySQL 8.0+ and uses dynamic SQL with prepared statements to check for existing columns/indexes before adding them. This ensures the migration can be run multiple times safely.

### Step 2: Verify the migration

Check that the new tables were created:

```bash
mysql -u root -p SNAKE -e "SHOW TABLES;"
```

You should see:
- `users` - User account information
- `sessions` - Session data for authentication
- Updated `leaderboard` table with `user_id` column
- Updated `question_sets` table with `name`, `description`, and `created_by` columns

## Migration Details

### 001_add_user_accounts.sql

This migration adds:

1. **users table**: Stores user account information
   - `id`: Primary key
   - `username`: Unique username (3-50 characters)
   - `name`: User's full name
   - `email`: Unique email address
   - `password_hash`: Bcrypt hashed password
   - `account_type`: Either 'student' or 'admin'
   - `created_at`, `updated_at`: Timestamps

2. **sessions table**: Stores express-session data
   - `session_id`: Session identifier
   - `expires`: Expiration timestamp
   - `data`: Session data

3. **leaderboard updates**:
   - Adds `user_id` column (foreign key to users)
   - Adds indexes for better query performance

4. **question_sets updates**:
   - Adds `name` column for human-readable bank names
   - Adds `description` column for bank descriptions
   - Adds `created_by` column (foreign key to users)
   - Adds timestamps
   - Updates existing banks with default names

## Rolling Back

If you need to roll back this migration:

```sql
-- Remove foreign keys
ALTER TABLE leaderboard DROP FOREIGN KEY fk_leaderboard_user_id;
ALTER TABLE question_sets DROP FOREIGN KEY fk_question_sets_created_by;

-- Remove columns from existing tables
ALTER TABLE leaderboard DROP COLUMN user_id;
ALTER TABLE question_sets DROP COLUMN name, DROP COLUMN description, DROP COLUMN created_by, DROP COLUMN created_at, DROP COLUMN updated_at;

-- Drop new tables
DROP TABLE sessions;
DROP TABLE users;
```

## Creating an Admin User

After running the migration, you can create an admin user through the registration form in the application, or directly in the database:

```sql
-- Note: Replace 'your-password-hash' with an actual bcrypt hash
-- You can generate one using: node -e "console.log(require('bcrypt').hashSync('your-password', 10))"

INSERT INTO users (username, name, email, password_hash, account_type)
VALUES ('admin', 'Admin User', 'admin@example.com', 'your-password-hash', 'admin');
```

## Troubleshooting

### Error: "You have an error in your SQL syntax" with "IF NOT EXISTS"

**Problem:** MySQL 8.0 (and earlier versions) don't support `IF NOT EXISTS` clause in `ALTER TABLE` statements for adding columns or indexes. This syntax is only available in MariaDB.

**Solution:** The migration has been updated to use dynamic SQL with prepared statements that check `INFORMATION_SCHEMA` tables before adding columns/indexes. This approach is compatible with MySQL 8.0+.

If you still encounter this error, ensure you're using the latest version of the migration file from this repository.

### Error: "Table already exists"

The migration uses `IF NOT EXISTS` for table creation and dynamic checks for column/index additions, so it's safe to run multiple times. If you encounter this error for tables, it means the tables were already created successfully.

### Error: "Column already exists"

The migration uses `INFORMATION_SCHEMA` checks to verify if columns exist before adding them. If you see a message like "Column name already exists", this is informational and the migration is working correctly - it's skipping that column because it already exists.

### Error: "Cannot add foreign key constraint"

This can happen if:
1. The referenced table doesn't exist yet (ensure `users` table is created first)
2. The referenced column doesn't exist
3. Data type mismatch between foreign key and referenced column

The migration is designed to run in the correct order, so this shouldn't occur if the migration is run from start to finish without interruption.
