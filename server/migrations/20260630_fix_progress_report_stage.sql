USE security_intel;

ALTER TABLE progress_reports
  MODIFY stage VARCHAR(32) NOT NULL;
