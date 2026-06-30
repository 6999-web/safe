export type UserRole = 'admin' | 'user';

export interface User {
  id: number;
  username: string;
  nickname: string;
  avatar: string;
  level: string;
  exp: number;
  maxExp: number;
  points: number;
  completedTasks: number;
  rank?: number;
  role: UserRole;
  region?: string | null;
  createdAt?: string;
}

export type TaskStatus = 'published' | 'accepted' | 'completed';

export interface Task {
  id: number;
  title: string;
  type: string;
  target: string;
  reward: number;
  points: number;
  difficulty: number;
  description: string;
  deadline: string;
  status: TaskStatus;
  acceptedBy?: string | null;
  acceptedByName?: string | null;
  progressCount: number;
  createdAt: string;
  completedAt?: string | null;
}

export type ReportStage = '信息收集' | '漏洞发现' | '成功提权' | '完成审计';
export type ReportStatus = 'pending' | 'approved' | 'rejected';

export interface ProgressReport {
  id: number;
  taskId: number;
  taskTitle: string;
  developer: string;
  developerName: string;
  stage: ReportStage;
  reportText: string;
  submittedAt: string;
  status: ReportStatus;
  reviewedAt?: string | null;
}

export interface AdminStats {
  totals: {
    tasks: number;
    ongoing: number;
    completed: number;
    pendingReports: number;
    highRiskTasks: number;
    users: number;
  };
  typeDistribution: Array<{ type: string; count: number }>;
  trend: Array<{ date: string; published: number; completed: number }>;
  userWorkload: Array<{
    username: string;
    nickname: string;
    points: number;
    completedTasks: number;
    activeTasks: number;
    currentTasks: string[];
  }>;
}
