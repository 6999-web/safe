import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { createPoolFromEnv } from './src/mysqlRepository.js';
import { toSqlDateTime } from './src/time.js';

const pool = createPoolFromEnv();
const username = process.env.SEED_ADMIN_USER || 'admin';
const password = process.env.SEED_ADMIN_PASSWORD || 'admin123';

try {
  const [rows] = await pool.execute('SELECT id FROM users WHERE username = ?', [username]);
  if (rows.length === 0) {
    const passwordHash = await bcrypt.hash(password, 10);
    await pool.execute(
      `INSERT INTO users
        (username, password_hash, nickname, avatar, level, exp, max_exp, points, completed_tasks, role, region, created_at)
       VALUES (?, ?, ?, '', '系统管理员', 0, 0, 0, 0, 'admin', NULL, ?)`,
      [username, passwordHash, '系统管理员', toSqlDateTime()],
    );
    console.log(`Seeded admin account: ${username} / ${password}`);
  } else {
    console.log(`Admin account already exists: ${username}`);
  }
} finally {
  await pool.end();
}
