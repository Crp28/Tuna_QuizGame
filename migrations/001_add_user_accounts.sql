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
ALTER TABLE `question_sets` 
  ADD COLUMN IF NOT EXISTS `name` varchar(200) DEFAULT NULL AFTER `folder`,
  ADD COLUMN IF NOT EXISTS `description` text DEFAULT NULL AFTER `name`,
  ADD COLUMN IF NOT EXISTS `created_by` int(11) DEFAULT NULL AFTER `description`,
  ADD COLUMN IF NOT EXISTS `created_at` timestamp NOT NULL DEFAULT current_timestamp() AFTER `created_by`,
  ADD COLUMN IF NOT EXISTS `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() AFTER `created_at`;

-- Add indexes if they don't exist
ALTER TABLE `question_sets`
  ADD INDEX IF NOT EXISTS `idx_folder` (`folder`),
  ADD INDEX IF NOT EXISTS `idx_created_by` (`created_by`);

-- Add foreign key constraint (optional, but good practice)
ALTER TABLE `question_sets`
  ADD CONSTRAINT IF NOT EXISTS `fk_question_sets_created_by`
  FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

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
ALTER TABLE `leaderboard`
  ADD COLUMN IF NOT EXISTS `user_id` int(11) DEFAULT NULL AFTER `id`;

-- Add indexes if they don't exist
ALTER TABLE `leaderboard`
  ADD INDEX IF NOT EXISTS `idx_user_id` (`user_id`),
  ADD INDEX IF NOT EXISTS `idx_folder` (`folder`);

-- Add foreign key for leaderboard user_id
ALTER TABLE `leaderboard`
  ADD CONSTRAINT IF NOT EXISTS `fk_leaderboard_user_id`
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
  ON DELETE SET NULL
  ON UPDATE CASCADE;
