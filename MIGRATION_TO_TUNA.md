# Migration Guide: SNAKE.sql to TUNA.sql

## Overview

**TUNA.sql** is the new unified database setup file that replaces both `SNAKE.sql` and `migrations/001_add_user_accounts.sql`. This guide helps you migrate from the old setup to the new one.

## Why Migrate?

### Benefits of TUNA.sql

1. **Single File Setup** - One command instead of two
2. **Clean Start** - No legacy leaderboard data to manage
3. **Complete Schema** - All features combined from both files
4. **Better Organization** - Clear separation between schema and data
5. **No Dependencies** - Works on fresh database without existing state

### What Changed?

| Aspect | SNAKE.sql + migrations | TUNA.sql |
|--------|----------------------|----------|
| Number of files | 2 files | 1 file |
| Leaderboard data | 12,000+ entries | Empty (fresh start) |
| User accounts | None | Empty (ready for use) |
| Question banks | 5 banks | Same 5 banks |
| Database name | SNAKE | TUNA (configurable) |
| Setup complexity | Run two files | Run one file |

## Migration Options

### Option 1: Fresh Start (Recommended)

Best for: New installations, development environments, or when you don't need existing leaderboard data.

```bash
# 1. Backup existing database (if needed)
mysqldump -u root -p SNAKE > SNAKE_backup.sql

# 2. Create new TUNA database
mysql -u root -p -e "CREATE DATABASE TUNA;"

# 3. Import TUNA.sql
mysql -u root -p TUNA < TUNA.sql

# 4. Update backend configuration
# Edit backend/.env and change:
DB_NAME=TUNA
```

### Option 2: Keep Existing SNAKE, Create New TUNA

Best for: Testing TUNA.sql while keeping existing SNAKE database running.

```bash
# 1. Create TUNA database alongside SNAKE
mysql -u root -p -e "CREATE DATABASE TUNA;"

# 2. Import TUNA.sql
mysql -u root -p TUNA < TUNA.sql

# 3. Test with TUNA database by updating backend/.env:
DB_NAME=TUNA

# 4. Keep SNAKE database for reference/backup
```

### Option 3: Migrate Data from SNAKE to TUNA

Best for: Production systems where you need to preserve leaderboard data.

```bash
# 1. Create TUNA database
mysql -u root -p -e "CREATE DATABASE TUNA;"

# 2. Import TUNA.sql (schema + question banks)
mysql -u root -p TUNA < TUNA.sql

# 3. Migrate leaderboard data from SNAKE to TUNA
mysql -u root -p << 'EOF'
INSERT INTO TUNA.leaderboard 
  (username, full_name, email, level, time, ip_address, folder, created_at)
SELECT 
  username, full_name, email, level, time, ip_address, folder, created_at
FROM SNAKE.leaderboard;
EOF

# 4. Update backend configuration
# Edit backend/.env and change:
DB_NAME=TUNA
```

## Step-by-Step Instructions

### For New Users

If you're setting up for the first time:

```bash
# 1. Navigate to repository root
cd /path/to/Tuna_QuizGame

# 2. Create database
mysql -u root -p -e "CREATE DATABASE TUNA;"

# 3. Import TUNA.sql
mysql -u root -p TUNA < TUNA.sql

# 4. Configure backend
cd backend
cp .env.example .env
# Edit .env and set DB_NAME=TUNA

# 5. Start backend
npm install
npm start

# 6. Start frontend (in new terminal)
cd ../react-snake-game
npm install
npm start
```

### For Existing Users

If you're already using SNAKE.sql:

```bash
# 1. Backup current database
mysqldump -u root -p SNAKE > SNAKE_backup_$(date +%Y%m%d).sql

# 2. Decide which migration option to use (see above)
# Option 1: Fresh Start (loses leaderboard data)
# Option 3: Migrate Data (preserves leaderboard data)

# 3. Follow the steps for your chosen option

# 4. Test the application
# - Register a new user
# - Play a game
# - Check leaderboard
# - Verify question banks load correctly

# 5. Once verified, optionally drop old SNAKE database
mysql -u root -p -e "DROP DATABASE SNAKE;"
```

## Configuration Changes

### Backend Configuration

Update `backend/.env`:

```env
# Old configuration
DB_NAME=SNAKE

# New configuration
DB_NAME=TUNA

# Other settings remain the same
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
```

### No Code Changes Required

The application code doesn't need any changes. TUNA.sql provides the same tables and structure that the backend expects.

## Verification Checklist

After migration, verify everything works:

- [ ] Backend connects to TUNA database successfully
- [ ] Frontend loads and shows login page
- [ ] User registration works
- [ ] User login works
- [ ] Question banks load (all 5 banks)
- [ ] Game plays correctly
- [ ] Leaderboard saves scores
- [ ] Admin panel accessible (if migrated user data)

### Verification Commands

```bash
# Check database exists
mysql -u root -p -e "SHOW DATABASES LIKE 'TUNA';"

# Check tables
mysql -u root -p TUNA -e "SHOW TABLES;"

# Check question banks
mysql -u root -p TUNA -e "SELECT id, folder, name FROM question_sets;"

# Check table row counts
mysql -u root -p TUNA -e "
SELECT 'users' as tbl, COUNT(*) as count FROM users
UNION SELECT 'sessions', COUNT(*) FROM sessions
UNION SELECT 'leaderboard', COUNT(*) FROM leaderboard
UNION SELECT 'question_sets', COUNT(*) FROM question_sets;
"
```

Expected output for fresh installation:
```
+---------------+-------+
| tbl           | count |
+---------------+-------+
| users         |     0 |
| sessions      |     0 |
| leaderboard   |     0 |
| question_sets |     5 |
+---------------+-------+
```

## Rollback Procedure

If you need to rollback to SNAKE.sql:

```bash
# 1. Stop the backend server (Ctrl+C)

# 2. Restore from backup
mysql -u root -p -e "DROP DATABASE IF EXISTS SNAKE; CREATE DATABASE SNAKE;"
mysql -u root -p SNAKE < SNAKE_backup.sql

# 3. Update backend/.env
DB_NAME=SNAKE

# 4. Restart backend
cd backend
npm start
```

## Common Issues

### Issue: "Table already exists"

**Cause**: Running TUNA.sql on a database that already has tables.

**Solution**: 
```bash
# Drop and recreate database
mysql -u root -p -e "DROP DATABASE TUNA; CREATE DATABASE TUNA;"
mysql -u root -p TUNA < TUNA.sql
```

### Issue: "Database connection failed"

**Cause**: Backend still configured for SNAKE database.

**Solution**: Update `backend/.env` to use `DB_NAME=TUNA`

### Issue: "Cannot add foreign key constraint"

**Cause**: Trying to manually create tables in wrong order.

**Solution**: Use TUNA.sql which creates tables in correct order.

### Issue: "Lost my leaderboard data"

**Cause**: Used Option 1 (Fresh Start) instead of Option 3 (Migrate Data).

**Solution**: 
- If you have backup: Restore and use Option 3
- If no backup: Start fresh with new leaderboard

## FAQ

**Q: Can I rename TUNA to something else?**  
A: Yes! You can create the database with any name. Just update `DB_NAME` in `backend/.env`.

```bash
mysql -u root -p -e "CREATE DATABASE MyQuizGame;"
mysql -u root -p MyQuizGame < TUNA.sql
# Then set DB_NAME=MyQuizGame in backend/.env
```

**Q: Do I need to update my code?**  
A: No. The table structures are identical to SNAKE.sql + migrations.

**Q: Will my old database stop working?**  
A: No. SNAKE database will continue to work until you drop it.

**Q: Can I run both databases at the same time?**  
A: Yes. You can have both SNAKE and TUNA databases. Just configure your backend to use whichever one you want.

**Q: What happens to my user accounts?**  
A: TUNA.sql creates an empty users table. You'll need to:
- Migrate user data from SNAKE (if it exists)
- Or have users register new accounts

**Q: Is TUNA.sql backwards compatible?**  
A: Yes. It provides all features from SNAKE.sql plus user account features.

## Documentation Updates

After migrating, you may want to update references in:

- `README.md` - Update database setup instructions
- `RUNNING_THE_APP.md` - Update database configuration steps
- `backend/.env.example` - Update DB_NAME default value

Example updates:

```markdown
# Old
mysql -u root -p < SNAKE.sql

# New
mysql -u root -p -e "CREATE DATABASE TUNA;"
mysql -u root -p TUNA < TUNA.sql
```

## Summary

TUNA.sql is the recommended way to set up the database going forward. It:
- Combines SNAKE.sql and migrations into one file
- Provides a clean starting point
- Includes all modern features (user accounts, sessions)
- Is easier to maintain and document

For new installations, always use TUNA.sql. For existing installations, choose the migration option that best fits your needs.

## Support

If you encounter issues during migration:

1. Check this guide's troubleshooting section
2. Verify MySQL version compatibility (5.7+ or MariaDB 10.2+)
3. Review error messages in MySQL logs
4. Restore from backup and try again
5. Consult TUNA_README.md for detailed usage information
