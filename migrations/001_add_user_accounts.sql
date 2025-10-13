-- Migration: Add user account system and question bank support
-- Purpose: Enable user authentication and question bank management

-- Create users table for authentication
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL UNIQUE,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL UNIQUE,
  `password_hash` varchar(255) NOT NULL,
  `account_type` ENUM('student', 'admin') NOT NULL DEFAULT 'student',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  INDEX `idx_username` (`username`),
  INDEX `idx_email` (`email`),
  INDEX `idx_account_type` (`account_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Update question_sets table to support better question bank management
-- Add name and description fields for better UX
-- Note: MySQL 8.0 doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- We'll add columns only if they don't exist by checking information_schema

SET @dbname = DATABASE();

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'question_sets' AND COLUMN_NAME = 'name');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `question_sets` ADD COLUMN `name` varchar(200) DEFAULT NULL AFTER `folder`', 
  'SELECT "Column name already exists" AS msg');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'question_sets' AND COLUMN_NAME = 'description');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `question_sets` ADD COLUMN `description` text DEFAULT NULL AFTER `name`', 
  'SELECT "Column description already exists" AS msg');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'question_sets' AND COLUMN_NAME = 'created_by');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `question_sets` ADD COLUMN `created_by` int(11) DEFAULT NULL AFTER `description`', 
  'SELECT "Column created_by already exists" AS msg');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'question_sets' AND COLUMN_NAME = 'created_at');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `question_sets` ADD COLUMN `created_at` timestamp NOT NULL DEFAULT current_timestamp() AFTER `created_by`', 
  'SELECT "Column created_at already exists" AS msg');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'question_sets' AND COLUMN_NAME = 'updated_at');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `question_sets` ADD COLUMN `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() AFTER `created_at`', 
  'SELECT "Column updated_at already exists" AS msg');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes if they don't exist
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'question_sets' AND INDEX_NAME = 'idx_folder');
SET @sql = IF(@index_exists = 0, 
  'ALTER TABLE `question_sets` ADD INDEX `idx_folder` (`folder`)', 
  'SELECT "Index idx_folder already exists" AS msg');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'question_sets' AND INDEX_NAME = 'idx_created_by');
SET @sql = IF(@index_exists = 0, 
  'ALTER TABLE `question_sets` ADD INDEX `idx_created_by` (`created_by`)', 
  'SELECT "Index idx_created_by already exists" AS msg');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key constraint (optional, but good practice)
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'question_sets' AND CONSTRAINT_NAME = 'fk_question_sets_created_by');
SET @sql = IF(@fk_exists = 0, 
  'ALTER TABLE `question_sets` ADD CONSTRAINT `fk_question_sets_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE', 
  'SELECT "Foreign key fk_question_sets_created_by already exists" AS msg');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing question_sets with default names based on folder
UPDATE `question_sets` SET `name` = 'English Level 01' WHERE `folder` = 'english-01' AND `name` IS NULL;
UPDATE `question_sets` SET `name` = 'English Level 02' WHERE `folder` = 'english-02' AND `name` IS NULL;
UPDATE `question_sets` SET `name` = 'English Level 03' WHERE `folder` = 'english-03' AND `name` IS NULL;
UPDATE `question_sets` SET `name` = 'Software Engineering Fundamentals' WHERE `folder` = 'comp705-01' AND `name` IS NULL;
UPDATE `question_sets` SET `name` = 'Artificial Intelligence Basics' WHERE `folder` = 'comp705-02' AND `name` IS NULL;

-- Create sessions table for express-session
CREATE TABLE IF NOT EXISTS `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) unsigned NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Add user_id column to leaderboard if it doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'leaderboard' AND COLUMN_NAME = 'user_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `leaderboard` ADD COLUMN `user_id` int(11) DEFAULT NULL AFTER `id`', 
  'SELECT "Column user_id already exists" AS msg');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes if they don't exist
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'leaderboard' AND INDEX_NAME = 'idx_user_id');
SET @sql = IF(@index_exists = 0, 
  'ALTER TABLE `leaderboard` ADD INDEX `idx_user_id` (`user_id`)', 
  'SELECT "Index idx_user_id already exists" AS msg');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'leaderboard' AND INDEX_NAME = 'idx_folder');
SET @sql = IF(@index_exists = 0, 
  'ALTER TABLE `leaderboard` ADD INDEX `idx_folder` (`folder`)', 
  'SELECT "Index idx_folder already exists" AS msg');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key for leaderboard user_id
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'leaderboard' AND CONSTRAINT_NAME = 'fk_leaderboard_user_id');
SET @sql = IF(@fk_exists = 0, 
  'ALTER TABLE `leaderboard` ADD CONSTRAINT `fk_leaderboard_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE', 
  'SELECT "Foreign key fk_leaderboard_user_id already exists" AS msg');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
