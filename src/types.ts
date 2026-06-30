export type UserRole = 'admin' | 'user';

export interface User {
  username: string;
  nickname: string;
  avatar: string;
  level: string;
  exp: number;
  maxExp: number;
  points: number;
  completedTasks: number;
  rank: number;
  role: UserRole;
  region?: string;
}

export type TaskStatus = 'published' | 'accepted' | 'submitted' | 'completed';

export interface Task {
  id: string;
  title: string;
  type: string;
  target: string;
  reward: number;
  points: number;
  difficulty: number; // 1 to 5 stars
  description: string;
  deadline: string;
  status: TaskStatus;
  acceptedBy?: string; // username
  acceptedByName?: string; // nickname
  progressCount: number;
  createdAt: string;
}

export interface ProgressReport {
  id: string;
  taskId: string;
  taskTitle: string;
  developer: string; // username
  developerName: string; // nickname
  stage: '信息收集' | '漏洞发现' | '成功提权' | '完成审计';
  reportText: string;
  submittedAt: string;
  status: 'pending' | 'approved';
}

export interface SecurityAlert {
  id: string;
  time: string;
  type: 'danger' | 'warning' | 'info';
  message: string;
}

export interface Announcement {
  id: string;
  title: string;
  date: string;
}
