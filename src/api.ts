import { AdminStats, ProgressReport, ReportStage, ReportStatus, Task, User, UserRole } from './types';

const TOKEN_KEY = 'sec_intel_auth_token';
const USER_KEY = 'sec_intel_session_user';

interface AuthResponse {
  user: User;
  token: string;
}

type RequestOptions = RequestInit & { token?: string | null };

function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = options.token ?? getStoredToken();
  const headers = new Headers(options.headers);
  if (!headers.has('content-type') && options.body) {
    headers.set('content-type', 'application/json');
  }
  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  }

  const response = await fetch(path, { ...options, headers });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(payload?.error || '请求失败');
  }
  return payload as T;
}

export const sessionStore = {
  save(user: User, token: string) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(TOKEN_KEY, token);
  },
  load(): { user: User; token: string } | null {
    const rawUser = localStorage.getItem(USER_KEY);
    const token = localStorage.getItem(TOKEN_KEY);
    if (!rawUser || !token) return null;
    return { user: JSON.parse(rawUser) as User, token };
  },
  updateUser(user: User) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      this.save(user, token);
    }
  },
  clear() {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  },
};

export const api = {
  login(input: { username: string; password: string; role: UserRole }) {
    return request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
      token: null,
    });
  },
  register(input: { username: string; nickname: string; password: string; role: UserRole }) {
    return request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
      token: null,
    });
  },
  me() {
    return request<{ user: User }>('/api/me');
  },
  users() {
    return request<{ users: User[] }>('/api/users');
  },
  tasks() {
    return request<{ tasks: Task[] }>('/api/tasks');
  },
  createTask(input: {
    title: string;
    type: string;
    target: string;
    reward: number;
    points: number;
    difficulty: number;
    description: string;
    deadline: string;
  }) {
    return request<{ task: Task }>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  acceptTask(taskId: number) {
    return request<{ task: Task }>(`/api/tasks/${taskId}/accept`, { method: 'POST' });
  },
  completeTask(taskId: number) {
    return request<{ task: Task }>(`/api/tasks/${taskId}/complete`, { method: 'POST' });
  },
  reports() {
    return request<{ reports: ProgressReport[] }>('/api/reports');
  },
  createReport(taskId: number, input: { stage: ReportStage; reportText: string }) {
    return request<{ report: ProgressReport }>(`/api/tasks/${taskId}/reports`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  reviewReport(reportId: number, status: ReportStatus) {
    return request<{ report: ProgressReport }>(`/api/reports/${reportId}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
  stats() {
    return request<{ stats: AdminStats }>('/api/stats');
  },
};
