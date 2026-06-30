CREATE DATABASE IF NOT EXISTS security_intel
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE security_intel;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(32) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(64) NOT NULL,
  avatar VARCHAR(512) NOT NULL DEFAULT '',
  level VARCHAR(64) NOT NULL,
  exp INT NOT NULL DEFAULT 0,
  max_exp INT NOT NULL DEFAULT 0,
  points INT NOT NULL DEFAULT 0,
  completed_tasks INT NOT NULL DEFAULT 0,
  role ENUM('admin', 'user') NOT NULL,
  region VARCHAR(64) NULL,
  created_at DATETIME NOT NULL,
  INDEX idx_users_role_points (role, points)
);

CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  type VARCHAR(64) NOT NULL,
  target VARCHAR(255) NOT NULL,
  reward DECIMAL(12, 2) NOT NULL DEFAULT 0,
  points INT NOT NULL DEFAULT 0,
  difficulty TINYINT NOT NULL,
  description TEXT NOT NULL,
  deadline VARCHAR(64) NOT NULL,
  status ENUM('published', 'accepted', 'completed') NOT NULL DEFAULT 'published',
  accepted_by VARCHAR(32) NULL,
  accepted_by_name VARCHAR(64) NULL,
  progress_count INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  completed_at DATETIME NULL,
  INDEX idx_tasks_status_created (status, created_at),
  INDEX idx_tasks_assignee (accepted_by),
  CONSTRAINT chk_tasks_difficulty CHECK (difficulty BETWEEN 1 AND 5)
);

CREATE TABLE IF NOT EXISTS progress_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  task_title VARCHAR(160) NOT NULL,
  developer VARCHAR(32) NOT NULL,
  developer_name VARCHAR(64) NOT NULL,
  stage VARCHAR(32) NOT NULL,
  report_text TEXT NOT NULL,
  submitted_at DATETIME NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  reviewed_at DATETIME NULL,
  INDEX idx_reports_task (task_id),
  INDEX idx_reports_status_time (status, submitted_at),
  CONSTRAINT fk_reports_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);
