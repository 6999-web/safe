import assert from 'node:assert/strict';
import test from 'node:test';
import { createApp } from '../src/app.js';

const jsonHeaders = { 'content-type': 'application/json' };

function createMemoryRepository() {
  let nextUserId = 2;
  let nextTaskId = 1;
  let nextReportId = 1;
  const users = [
    {
      id: 1,
      username: 'admin',
      passwordHash: 'hash:admin123',
      nickname: '系统管理员',
      avatar: '',
      level: '系统管理员',
      exp: 0,
      maxExp: 0,
      points: 0,
      completedTasks: 0,
      role: 'admin',
      region: null,
      createdAt: '2026-06-30 00:00:00',
    },
  ];
  const tasks = [];
  const reports = [];

  const now = () => '2026-06-30 12:00:00';
  const publicUser = user => {
    const { passwordHash: _passwordHash, ...rest } = user;
    return rest;
  };

  return {
    async findUserByUsername(username) {
      return users.find(user => user.username.toLowerCase() === username.toLowerCase()) ?? null;
    },
    async findUserById(id) {
      return users.find(user => user.id === Number(id)) ?? null;
    },
    async createUser(input) {
      const user = {
        id: nextUserId++,
        username: input.username,
        passwordHash: input.passwordHash,
        nickname: input.nickname,
        avatar: '',
        level: input.role === 'admin' ? '系统管理员' : 'Lv.1 新晋白帽',
        exp: 0,
        maxExp: input.role === 'admin' ? 0 : 500,
        points: 0,
        completedTasks: 0,
        role: input.role,
        region: input.role === 'user' ? '南宁' : null,
        createdAt: now(),
      };
      users.push(user);
      return publicUser(user);
    },
    async listUsers() {
      return users.map(publicUser);
    },
    async listTasks() {
      return tasks.map(task => ({ ...task }));
    },
    async createTask(input) {
      const task = {
        id: nextTaskId++,
        title: input.title,
        type: input.type,
        target: input.target,
        reward: input.reward,
        points: input.points,
        difficulty: input.difficulty,
        description: input.description,
        deadline: input.deadline,
        status: 'published',
        acceptedBy: null,
        acceptedByName: null,
        progressCount: 0,
        createdAt: now(),
        completedAt: null,
      };
      tasks.unshift(task);
      return { ...task };
    },
    async acceptTask(taskId, user) {
      const task = tasks.find(item => item.id === Number(taskId));
      if (!task) return null;
      if (task.status !== 'published') {
        const error = new Error('任务已被接收或已完成');
        error.statusCode = 409;
        throw error;
      }
      task.status = 'accepted';
      task.acceptedBy = user.username;
      task.acceptedByName = user.nickname;
      return { ...task };
    },
    async createReport(taskId, user, input) {
      const task = tasks.find(item => item.id === Number(taskId));
      if (!task) return null;
      if (task.acceptedBy !== user.username || task.status === 'completed') {
        const error = new Error('只能给自己进行中的任务提交表单');
        error.statusCode = 403;
        throw error;
      }
      const report = {
        id: nextReportId++,
        taskId: task.id,
        taskTitle: task.title,
        developer: user.username,
        developerName: user.nickname,
        stage: input.stage,
        reportText: input.reportText,
        submittedAt: now(),
        status: 'pending',
        reviewedAt: null,
      };
      reports.unshift(report);
      task.progressCount += 1;
      return { ...report };
    },
    async listReports() {
      return reports.map(report => ({ ...report }));
    },
    async reviewReport(reportId, status) {
      const report = reports.find(item => item.id === Number(reportId));
      if (!report) return null;
      report.status = status;
      report.reviewedAt = now();
      return { ...report };
    },
    async completeTask(taskId) {
      const task = tasks.find(item => item.id === Number(taskId));
      if (!task) return null;
      if (task.status === 'completed') return { ...task };
      task.status = 'completed';
      task.completedAt = now();
      const assignee = users.find(user => user.username === task.acceptedBy);
      if (assignee) {
        assignee.points += task.points;
        assignee.exp += task.points;
        assignee.completedTasks += 1;
      }
      return { ...task };
    },
    async getStats() {
      return {
        totals: {
          tasks: tasks.length,
          ongoing: tasks.filter(task => task.status === 'accepted').length,
          completed: tasks.filter(task => task.status === 'completed').length,
          pendingReports: reports.filter(report => report.status === 'pending').length,
          highRiskTasks: tasks.filter(task => task.difficulty >= 4).length,
          users: users.filter(user => user.role === 'user').length,
        },
        typeDistribution: [],
        trend: [],
        userWorkload: users
          .filter(user => user.role === 'user')
          .map(user => ({
            username: user.username,
            nickname: user.nickname,
            activeTasks: tasks.filter(task => task.acceptedBy === user.username && task.status === 'accepted').length,
            completedTasks: user.completedTasks,
          })),
      };
    },
  };
}

function createTestApp() {
  return createApp({
    repository: createMemoryRepository(),
    auth: {
      async hashPassword(password) {
        return `hash:${password}`;
      },
      async verifyPassword(password, hash) {
        return hash === `hash:${password}`;
      },
      signToken(user) {
        return `token:${user.id}`;
      },
      verifyToken(token) {
        if (!token?.startsWith('token:')) return null;
        return { sub: Number(token.slice(6)) };
      },
    },
  });
}

async function request(app, method, path, body, token) {
  const server = await new Promise(resolve => {
    const listener = app.listen(0, () => resolve(listener));
  });
  const address = server.address();
  try {
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
      method,
      headers: {
        ...jsonHeaders,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    return {
      status: response.status,
      body: text ? JSON.parse(text) : null,
    };
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

test('registers a user and logs in with the real password', async () => {
  const app = createTestApp();

  const registration = await request(app, 'POST', '/api/auth/register', {
    username: 'alice',
    nickname: 'Alice',
    password: 'secret123',
    role: 'user',
  });
  assert.equal(registration.status, 201);
  assert.equal(registration.body.user.username, 'alice');
  assert.equal(registration.body.user.role, 'user');

  const login = await request(app, 'POST', '/api/auth/login', {
    username: 'alice',
    password: 'secret123',
    role: 'user',
  });
  assert.equal(login.status, 200);
  assert.match(login.body.token, /^token:/);
});

test('allows admins to create tasks and blocks normal users', async () => {
  const app = createTestApp();
  const adminLogin = await request(app, 'POST', '/api/auth/login', {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
  });
  const userRegistration = await request(app, 'POST', '/api/auth/register', {
    username: 'bob',
    nickname: 'Bob',
    password: 'secret123',
    role: 'user',
  });

  const taskPayload = {
    title: '真实任务',
    type: '渗透测试',
    target: 'example.com',
    reward: 1000,
    points: 100,
    difficulty: 4,
    deadline: '7天',
    description: '提交真实进度表单',
  };

  const denied = await request(app, 'POST', '/api/tasks', taskPayload, userRegistration.body.token);
  assert.equal(denied.status, 403);

  const created = await request(app, 'POST', '/api/tasks', taskPayload, adminLogin.body.token);
  assert.equal(created.status, 201);
  assert.equal(created.body.task.status, 'published');
});

test('supports accepting a task and submitting multiple progress reports', async () => {
  const app = createTestApp();
  const adminLogin = await request(app, 'POST', '/api/auth/login', {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
  });
  const userRegistration = await request(app, 'POST', '/api/auth/register', {
    username: 'carol',
    nickname: 'Carol',
    password: 'secret123',
    role: 'user',
  });
  const created = await request(app, 'POST', '/api/tasks', {
    title: '多次提交任务',
    type: '安全审计',
    target: 'service.local',
    reward: 800,
    points: 80,
    difficulty: 3,
    deadline: '5天',
    description: '允许周期性进度提交',
  }, adminLogin.body.token);

  const accepted = await request(app, 'POST', `/api/tasks/${created.body.task.id}/accept`, undefined, userRegistration.body.token);
  assert.equal(accepted.status, 200);
  assert.equal(accepted.body.task.acceptedBy, 'carol');

  const firstReport = await request(app, 'POST', `/api/tasks/${created.body.task.id}/reports`, {
    stage: '信息收集',
    reportText: '完成资产梳理。',
  }, userRegistration.body.token);
  const secondReport = await request(app, 'POST', `/api/tasks/${created.body.task.id}/reports`, {
    stage: '漏洞发现',
    reportText: '发现一个越权入口。',
  }, userRegistration.body.token);

  assert.equal(firstReport.status, 201);
  assert.equal(secondReport.status, 201);
  assert.equal(secondReport.body.report.status, 'pending');

  const reports = await request(app, 'GET', '/api/reports', undefined, adminLogin.body.token);
  assert.equal(reports.body.reports.length, 2);
});

test('reviewing a report does not complete the task; completing a task awards points', async () => {
  const app = createTestApp();
  const adminLogin = await request(app, 'POST', '/api/auth/login', {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
  });
  const userRegistration = await request(app, 'POST', '/api/auth/register', {
    username: 'dave',
    nickname: 'Dave',
    password: 'secret123',
    role: 'user',
  });
  const created = await request(app, 'POST', '/api/tasks', {
    title: '结算任务',
    type: '漏洞挖掘',
    target: 'settlement.local',
    reward: 500,
    points: 50,
    difficulty: 2,
    deadline: '3天',
    description: '审核和完成分离',
  }, adminLogin.body.token);

  await request(app, 'POST', `/api/tasks/${created.body.task.id}/accept`, undefined, userRegistration.body.token);
  const report = await request(app, 'POST', `/api/tasks/${created.body.task.id}/reports`, {
    stage: '完成审计',
    reportText: '提交最终结果。',
  }, userRegistration.body.token);

  const reviewed = await request(app, 'PATCH', `/api/reports/${report.body.report.id}/review`, {
    status: 'approved',
  }, adminLogin.body.token);
  assert.equal(reviewed.status, 200);

  const tasksAfterReview = await request(app, 'GET', '/api/tasks', undefined, adminLogin.body.token);
  assert.equal(tasksAfterReview.body.tasks[0].status, 'accepted');

  const completed = await request(app, 'POST', `/api/tasks/${created.body.task.id}/complete`, undefined, adminLogin.body.token);
  assert.equal(completed.status, 200);
  assert.equal(completed.body.task.status, 'completed');

  const users = await request(app, 'GET', '/api/users', undefined, adminLogin.body.token);
  const dave = users.body.users.find(user => user.username === 'dave');
  assert.equal(dave.points, 50);
  assert.equal(dave.completedTasks, 1);
});
