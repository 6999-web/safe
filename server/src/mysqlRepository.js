import mysql from 'mysql2/promise';
import { toDateKey, toSqlDateTime } from './time.js';

function rowToUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    nickname: row.nickname,
    avatar: row.avatar,
    level: row.level,
    exp: row.exp,
    maxExp: row.max_exp,
    points: row.points,
    completedTasks: row.completed_tasks,
    role: row.role,
    region: row.region,
    createdAt: row.created_at,
  };
}

function rowToTask(row) {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    target: row.target,
    reward: Number(row.reward),
    points: row.points,
    difficulty: row.difficulty,
    description: row.description,
    deadline: row.deadline,
    status: row.status,
    acceptedBy: row.accepted_by,
    acceptedByName: row.accepted_by_name,
    progressCount: row.progress_count,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

function rowToReport(row) {
  return {
    id: row.id,
    taskId: row.task_id,
    taskTitle: row.task_title,
    developer: row.developer,
    developerName: row.developer_name,
    stage: row.stage,
    reportText: row.report_text,
    submittedAt: row.submitted_at,
    status: row.status,
    reviewedAt: row.reviewed_at,
  };
}

export function createPoolFromEnv() {
  return mysql.createPool({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'root',
    database: process.env.MYSQL_DATABASE || 'security_intel',
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
  });
}

export function createMySqlRepository(pool) {
  async function fetchTaskById(taskId, connection = pool) {
    const [rows] = await connection.execute('SELECT * FROM tasks WHERE id = ?', [taskId]);
    return rows[0] ? rowToTask(rows[0]) : null;
  }

  return {
    async findUserByUsername(username) {
      const [rows] = await pool.execute('SELECT * FROM users WHERE LOWER(username) = LOWER(?)', [username]);
      return rowToUser(rows[0]);
    },

    async findUserById(id) {
      const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
      return rowToUser(rows[0]);
    },

    async createUser(input) {
      const nickname = input.nickname;
      const isAdmin = input.role === 'admin';
      const [result] = await pool.execute(
        `INSERT INTO users
          (username, password_hash, nickname, avatar, level, exp, max_exp, points, completed_tasks, role, region, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          input.username,
          input.passwordHash,
          nickname,
          '',
          isAdmin ? '系统管理员' : 'Lv.1 新晋白帽',
          0,
          isAdmin ? 0 : 500,
          0,
          0,
          input.role,
          isAdmin ? null : '南宁',
          toSqlDateTime(),
        ],
      );
      const user = await this.findUserById(result.insertId);
      const { passwordHash: _passwordHash, ...publicData } = user;
      return publicData;
    },

    async listUsers() {
      const [rows] = await pool.execute(
        `SELECT id, username, nickname, avatar, level, exp, max_exp, points,
                completed_tasks, role, region, created_at
         FROM users
         ORDER BY role ASC, points DESC, created_at ASC`,
      );
      return rows.map(rowToUser).map(({ passwordHash: _passwordHash, ...user }) => user);
    },

    async listTasks() {
      const [rows] = await pool.execute('SELECT * FROM tasks ORDER BY created_at DESC, id DESC');
      return rows.map(rowToTask);
    },

    async createTask(input) {
      const [result] = await pool.execute(
        `INSERT INTO tasks
          (title, type, target, reward, points, difficulty, description, deadline, status, progress_count, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published', 0, ?)`,
        [
          input.title,
          input.type,
          input.target,
          input.reward,
          input.points,
          input.difficulty,
          input.description,
          input.deadline,
          toSqlDateTime(),
        ],
      );
      return fetchTaskById(result.insertId);
    },

    async acceptTask(taskId, user) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const task = await fetchTaskById(taskId, connection);
        if (!task) {
          await connection.rollback();
          return null;
        }
        if (task.status !== 'published') {
          const error = new Error('任务已被接收或已完成');
          error.statusCode = 409;
          throw error;
        }
        await connection.execute(
          `UPDATE tasks
           SET status = 'accepted', accepted_by = ?, accepted_by_name = ?
           WHERE id = ? AND status = 'published'`,
          [user.username, user.nickname, taskId],
        );
        await connection.commit();
        return fetchTaskById(taskId);
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    },

    async createReport(taskId, user, input) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const task = await fetchTaskById(taskId, connection);
        if (!task) {
          await connection.rollback();
          return null;
        }
        if (task.acceptedBy !== user.username || task.status === 'completed') {
          const error = new Error('只能给自己进行中的任务提交表单');
          error.statusCode = 403;
          throw error;
        }
        const [result] = await connection.execute(
          `INSERT INTO progress_reports
            (task_id, task_title, developer, developer_name, stage, report_text, submitted_at, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
          [
            task.id,
            task.title,
            user.username,
            user.nickname,
            input.stage,
            input.reportText,
            toSqlDateTime(),
          ],
        );
        await connection.execute(
          'UPDATE tasks SET progress_count = progress_count + 1 WHERE id = ?',
          [task.id],
        );
        await connection.commit();
        const [rows] = await pool.execute('SELECT * FROM progress_reports WHERE id = ?', [result.insertId]);
        return rowToReport(rows[0]);
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    },

    async listReports(user) {
      const params = [];
      let where = '';
      if (user?.role === 'user') {
        where = 'WHERE developer = ?';
        params.push(user.username);
      }
      const [rows] = await pool.execute(
        `SELECT * FROM progress_reports ${where} ORDER BY submitted_at DESC, id DESC`,
        params,
      );
      return rows.map(rowToReport);
    },

    async reviewReport(reportId, status) {
      await pool.execute(
        'UPDATE progress_reports SET status = ?, reviewed_at = ? WHERE id = ?',
        [status, toSqlDateTime(), reportId],
      );
      const [rows] = await pool.execute('SELECT * FROM progress_reports WHERE id = ?', [reportId]);
      return rows[0] ? rowToReport(rows[0]) : null;
    },

    async completeTask(taskId) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const task = await fetchTaskById(taskId, connection);
        if (!task) {
          await connection.rollback();
          return null;
        }
        if (task.status !== 'completed') {
          await connection.execute(
            "UPDATE tasks SET status = 'completed', completed_at = ? WHERE id = ?",
            [toSqlDateTime(), taskId],
          );
          if (task.acceptedBy) {
            await connection.execute(
              `UPDATE users
               SET points = points + ?, exp = exp + ?, completed_tasks = completed_tasks + 1
               WHERE username = ?`,
              [task.points, task.points, task.acceptedBy],
            );
          }
        }
        await connection.commit();
        return fetchTaskById(taskId);
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    },

    async getStats() {
      const [tasks] = await pool.execute('SELECT * FROM tasks');
      const [reports] = await pool.execute('SELECT * FROM progress_reports');
      const [users] = await pool.execute(
        `SELECT username, nickname, points, completed_tasks, role, region
         FROM users
         WHERE role = 'user'
         ORDER BY points DESC, created_at ASC`,
      );

      const taskRows = tasks.map(rowToTask);
      const reportRows = reports.map(rowToReport);
      const userRows = users.map(rowToUser);
      const typeCounts = new Map();
      const trendMap = new Map();
      const today = new Date();
      for (let offset = 6; offset >= 0; offset -= 1) {
        const day = new Date(today);
        day.setDate(today.getDate() - offset);
        trendMap.set(day.toISOString().substring(0, 10), { date: day.toISOString().substring(5, 10), published: 0, completed: 0 });
      }
      for (const task of taskRows) {
        typeCounts.set(task.type, (typeCounts.get(task.type) || 0) + 1);
        const createdKey = toDateKey(task.createdAt);
        if (trendMap.has(createdKey)) trendMap.get(createdKey).published += 1;
        if (task.completedAt) {
          const completedKey = toDateKey(task.completedAt);
          if (trendMap.has(completedKey)) trendMap.get(completedKey).completed += 1;
        }
      }

      return {
        totals: {
          tasks: taskRows.length,
          ongoing: taskRows.filter(task => task.status === 'accepted').length,
          completed: taskRows.filter(task => task.status === 'completed').length,
          pendingReports: reportRows.filter(report => report.status === 'pending').length,
          highRiskTasks: taskRows.filter(task => task.difficulty >= 4).length,
          users: userRows.length,
        },
        typeDistribution: [...typeCounts.entries()].map(([type, count]) => ({ type, count })),
        trend: [...trendMap.values()],
        userWorkload: userRows.map(user => ({
          username: user.username,
          nickname: user.nickname,
          points: user.points,
          completedTasks: user.completedTasks,
          activeTasks: taskRows.filter(task => task.acceptedBy === user.username && task.status === 'accepted').length,
          currentTasks: taskRows
            .filter(task => task.acceptedBy === user.username && task.status === 'accepted')
            .map(task => task.title),
        })),
      };
    },
  };
}
