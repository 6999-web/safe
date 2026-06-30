import express from 'express';
import cors from 'cors';
import { createAuth } from './auth.js';

const VALID_ROLES = new Set(['admin', 'user']);
const VALID_REPORT_STAGES = new Set(['信息收集', '漏洞发现', '成功提权', '完成审计']);
const VALID_REPORT_REVIEW_STATUS = new Set(['approved', 'rejected']);

function sanitizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function asyncRoute(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

function publicUser(user) {
  if (!user) return null;
  const { passwordHash: _passwordHash, password_hash: _password_hash, ...rest } = user;
  return rest;
}

export function createApp({ repository, auth = createAuth() }) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  async function authenticate(req, res, next) {
    const header = req.get('authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    const payload = token ? auth.verifyToken(token) : null;
    if (!payload?.sub) {
      res.status(401).json({ error: '请先登录' });
      return;
    }
    const user = await repository.findUserById(payload.sub);
    if (!user) {
      res.status(401).json({ error: '登录状态已失效' });
      return;
    }
    req.user = publicUser(user);
    next();
  }

  function requireRole(role) {
    return (req, res, next) => {
      if (req.user?.role !== role) {
        res.status(403).json({ error: '没有权限执行该操作' });
        return;
      }
      next();
    };
  }

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/auth/register', asyncRoute(async (req, res) => {
    const username = sanitizeText(req.body.username);
    const nickname = sanitizeText(req.body.nickname);
    const password = String(req.body.password ?? '');
    const role = sanitizeText(req.body.role) || 'user';

    if (!/^[a-zA-Z0-9_]{3,32}$/.test(username)) {
      res.status(400).json({ error: '账号只能包含 3-32 位英文、数字或下划线' });
      return;
    }
    if (!nickname) {
      res.status(400).json({ error: '请输入昵称' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: '密码至少 6 位' });
      return;
    }
    if (!VALID_ROLES.has(role) || role !== 'user') {
      res.status(400).json({ error: '注册仅开放普通用户账号，管理员请使用 seed 创建' });
      return;
    }
    const existing = await repository.findUserByUsername(username);
    if (existing) {
      res.status(409).json({ error: '该账号已存在' });
      return;
    }

    const passwordHash = await auth.hashPassword(password);
    const user = await repository.createUser({ username, nickname, passwordHash, role });
    const token = auth.signToken(user);
    res.status(201).json({ user, token });
  }));

  app.post('/api/auth/login', asyncRoute(async (req, res) => {
    const username = sanitizeText(req.body.username);
    const password = String(req.body.password ?? '');
    const role = sanitizeText(req.body.role);
    const user = await repository.findUserByUsername(username);

    if (!user || (role && user.role !== role) || !(await auth.verifyPassword(password, user.passwordHash))) {
      res.status(401).json({ error: '账号、密码或角色不正确' });
      return;
    }

    res.json({ user: publicUser(user), token: auth.signToken(user) });
  }));

  app.get('/api/me', authenticate, (req, res) => {
    res.json({ user: req.user });
  });

  app.get('/api/users', authenticate, requireRole('admin'), asyncRoute(async (_req, res) => {
    const users = await repository.listUsers();
    res.json({ users });
  }));

  app.get('/api/tasks', authenticate, asyncRoute(async (_req, res) => {
    const tasks = await repository.listTasks();
    res.json({ tasks });
  }));

  app.post('/api/tasks', authenticate, requireRole('admin'), asyncRoute(async (req, res) => {
    const reward = Number(req.body.reward);
    const points = req.body.points === undefined ? Math.round(reward / 10) : Number(req.body.points);
    const difficulty = Number(req.body.difficulty);
    const task = {
      title: sanitizeText(req.body.title),
      type: sanitizeText(req.body.type),
      target: sanitizeText(req.body.target),
      reward,
      points,
      difficulty,
      deadline: sanitizeText(req.body.deadline),
      description: sanitizeText(req.body.description),
    };

    if (!task.title || !task.type || !task.target || !task.deadline || !task.description) {
      res.status(400).json({ error: '请完整填写任务信息' });
      return;
    }
    if (!Number.isFinite(reward) || reward < 0 || !Number.isFinite(points) || points < 0) {
      res.status(400).json({ error: '奖励和积分必须是非负数字' });
      return;
    }
    if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) {
      res.status(400).json({ error: '难度必须为 1-5' });
      return;
    }

    const created = await repository.createTask(task);
    res.status(201).json({ task: created });
  }));

  app.post('/api/tasks/:taskId/accept', authenticate, requireRole('user'), asyncRoute(async (req, res) => {
    const task = await repository.acceptTask(req.params.taskId, req.user);
    if (!task) {
      res.status(404).json({ error: '任务不存在' });
      return;
    }
    res.json({ task });
  }));

  app.post('/api/tasks/:taskId/reports', authenticate, requireRole('user'), asyncRoute(async (req, res) => {
    const stage = sanitizeText(req.body.stage);
    const reportText = sanitizeText(req.body.reportText);
    if (!VALID_REPORT_STAGES.has(stage)) {
      res.status(400).json({ error: '请选择有效阶段' });
      return;
    }
    if (!reportText) {
      res.status(400).json({ error: '请填写表单内容' });
      return;
    }
    const report = await repository.createReport(req.params.taskId, req.user, { stage, reportText });
    if (!report) {
      res.status(404).json({ error: '任务不存在' });
      return;
    }
    res.status(201).json({ report });
  }));

  app.get('/api/reports', authenticate, asyncRoute(async (req, res) => {
    const reports = await repository.listReports(req.user);
    res.json({ reports });
  }));

  app.patch('/api/reports/:reportId/review', authenticate, requireRole('admin'), asyncRoute(async (req, res) => {
    const status = sanitizeText(req.body.status);
    if (!VALID_REPORT_REVIEW_STATUS.has(status)) {
      res.status(400).json({ error: '审核状态不正确' });
      return;
    }
    const report = await repository.reviewReport(req.params.reportId, status);
    if (!report) {
      res.status(404).json({ error: '表单不存在' });
      return;
    }
    res.json({ report });
  }));

  app.post('/api/tasks/:taskId/complete', authenticate, requireRole('admin'), asyncRoute(async (req, res) => {
    const task = await repository.completeTask(req.params.taskId);
    if (!task) {
      res.status(404).json({ error: '任务不存在' });
      return;
    }
    res.json({ task });
  }));

  app.get('/api/stats', authenticate, requireRole('admin'), asyncRoute(async (_req, res) => {
    const stats = await repository.getStats();
    res.json({ stats });
  }));

  app.use((error, _req, res, _next) => {
    const statusCode = error.statusCode || 500;
    if (statusCode >= 500) {
      console.error(error);
    }
    res.status(statusCode).json({ error: error.message || '服务器错误' });
  });

  return app;
}
