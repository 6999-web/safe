CREATE TABLE user_level (
  id BIGSERIAL PRIMARY KEY, level_no INT NOT NULL UNIQUE, name VARCHAR(40) NOT NULL,
  min_score INT NOT NULL, max_score INT NOT NULL
);
CREATE TABLE app_user (
  id BIGSERIAL PRIMARY KEY, username VARCHAR(50) NOT NULL UNIQUE, password_hash VARCHAR(100) NOT NULL,
  nickname VARCHAR(60) NOT NULL, email VARCHAR(120), avatar_url VARCHAR(255), bio VARCHAR(500),
  skills VARCHAR(500), role VARCHAR(20) NOT NULL, score INT NOT NULL DEFAULT 0,
  level_id BIGINT REFERENCES user_level(id), status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE company (
  id BIGSERIAL PRIMARY KEY, admin_user_id BIGINT NOT NULL UNIQUE REFERENCES app_user(id),
  name VARCHAR(120) NOT NULL, credit_code VARCHAR(40) UNIQUE, description VARCHAR(1000),
  logo_url VARCHAR(255), status VARCHAR(20) NOT NULL DEFAULT 'PENDING', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE security_task (
  id BIGSERIAL PRIMARY KEY, task_no VARCHAR(32) NOT NULL UNIQUE, company_id BIGINT NOT NULL REFERENCES company(id),
  title VARCHAR(160) NOT NULL, type VARCHAR(30) NOT NULL, description TEXT NOT NULL, target_assets TEXT NOT NULL,
  start_date DATE NOT NULL, end_date DATE NOT NULL, reward_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  difficulty VARCHAR(20) NOT NULL, min_severity VARCHAR(20) NOT NULL, member_limit INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE task_member (
  id BIGSERIAL PRIMARY KEY, task_id BIGINT NOT NULL REFERENCES security_task(id), user_id BIGINT NOT NULL REFERENCES app_user(id),
  apply_message VARCHAR(500), status VARCHAR(20) NOT NULL DEFAULT 'APPLIED', joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);
CREATE TABLE daily_report (
  id BIGSERIAL PRIMARY KEY, task_member_id BIGINT NOT NULL REFERENCES task_member(id), report_date DATE NOT NULL,
  work_content TEXT NOT NULL, test_target VARCHAR(500) NOT NULL, findings TEXT, risk_analysis TEXT,
  next_plan TEXT NOT NULL, attachment_url VARCHAR(255), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(task_member_id, report_date)
);
CREATE TABLE vulnerability_report (
  id BIGSERIAL PRIMARY KEY, report_no VARCHAR(32) NOT NULL UNIQUE, task_id BIGINT NOT NULL REFERENCES security_task(id),
  submitter_id BIGINT NOT NULL REFERENCES app_user(id), title VARCHAR(200) NOT NULL, vulnerability_type VARCHAR(80) NOT NULL,
  affected_asset VARCHAR(500) NOT NULL, description TEXT NOT NULL, reproduction_steps TEXT NOT NULL,
  poc_attachment_url VARCHAR(255), severity VARCHAR(20) NOT NULL, cvss_score NUMERIC(3,1),
  status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED', review_comment VARCHAR(1000),
  reviewed_by BIGINT REFERENCES app_user(id), reviewed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE score_record (
  id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES app_user(id), delta INT NOT NULL,
  source_type VARCHAR(30) NOT NULL, source_id BIGINT NOT NULL, description VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(user_id, source_type, source_id)
);
CREATE TABLE forum_post (
  id BIGSERIAL PRIMARY KEY, author_id BIGINT NOT NULL REFERENCES app_user(id), category VARCHAR(40) NOT NULL,
  title VARCHAR(200) NOT NULL, content TEXT NOT NULL, view_count INT NOT NULL DEFAULT 0,
  like_count INT NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE forum_comment (
  id BIGSERIAL PRIMARY KEY, post_id BIGINT NOT NULL REFERENCES forum_post(id) ON DELETE CASCADE,
  author_id BIGINT NOT NULL REFERENCES app_user(id), content VARCHAR(2000) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_task_status ON security_task(status);
CREATE INDEX idx_vuln_task_status ON vulnerability_report(task_id, status);
CREATE INDEX idx_score_user ON score_record(user_id, created_at DESC);
CREATE INDEX idx_post_created ON forum_post(created_at DESC);
INSERT INTO user_level(level_no,name,min_score,max_score) VALUES
 (1,'新手白帽',0,99),(2,'初级研究员',100,499),(3,'高级研究员',500,1499),(4,'专家白帽',1500,3999),(5,'安全大神',4000,2147483647);

