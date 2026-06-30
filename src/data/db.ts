import { Task, User, ProgressReport, SecurityAlert, Announcement } from '../types';

const TASKS_KEY = 'sec_intel_tasks';
const USERS_KEY = 'sec_intel_users';
const REPORTS_KEY = 'sec_intel_reports';

export const initialUsers: User[] = [
  {
    username: 'xiaoming',
    nickname: '白帽子小明',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80',
    level: 'Lv.4 白帽战士',
    exp: 1250,
    maxExp: 2000,
    points: 1250,
    completedTasks: 23,
    rank: 3,
    role: 'user',
    region: '广州'
  },
  {
    username: 'xiaowang',
    nickname: '黑客小王',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&h=100&q=80',
    level: 'Lv.6 核心极客',
    exp: 2600,
    maxExp: 4000,
    points: 2560,
    completedTasks: 42,
    rank: 1,
    role: 'user',
    region: '北京'
  },
  {
    username: 'researcher',
    nickname: '安全研究员',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80',
    level: 'Lv.5 漏洞猎手',
    exp: 1900,
    maxExp: 3000,
    points: 1890,
    completedTasks: 31,
    rank: 2,
    role: 'user',
    region: '上海'
  },
  {
    username: 'tester',
    nickname: '渗透测试员',
    avatar: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=100&h=100&q=80',
    level: 'Lv.3 脚本小子',
    exp: 980,
    maxExp: 1500,
    points: 980,
    completedTasks: 15,
    rank: 4,
    role: 'user',
    region: '成都'
  },
  {
    username: 'newbie',
    nickname: '安全小白',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80',
    level: 'Lv.2 初学者',
    exp: 750,
    maxExp: 1000,
    points: 750,
    completedTasks: 8,
    rank: 5,
    role: 'user',
    region: '武汉'
  },
  {
    username: 'admin',
    nickname: '警官 张明',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&h=100&q=80',
    level: '系统管理员',
    exp: 0,
    maxExp: 0,
    points: 0,
    completedTasks: 0,
    rank: 0,
    role: 'admin'
  }
];

export const initialTasks: Task[] = [
  {
    id: 'task-1',
    title: '某政府单位官网安全审计',
    type: '安全审计',
    target: 'www.gxzf.gov.cn',
    reward: 3000,
    points: 300,
    difficulty: 4,
    description: '对政府官网进行全面安全审计，包含漏洞扫描、接口安全检测、敏感泄露排查等。需要提供完整的漏洞报告。',
    deadline: '6天 12小时',
    status: 'published',
    progressCount: 0,
    createdAt: '2026-06-29 10:00:00'
  },
  {
    id: 'task-2',
    title: '电商平台Web应用安全检测',
    type: '漏洞扫描',
    target: 'shop.gxmall.com',
    reward: 2000,
    points: 200,
    difficulty: 3,
    description: '对电商平台进行Web安全检测，重点关注SQL注入、XSS、逻辑越权等高危漏洞，输出整改建议。',
    deadline: '5天 8小时',
    status: 'published',
    progressCount: 0,
    createdAt: '2026-06-30 08:30:00'
  },
  {
    id: 'task-3',
    title: '金融系统渗透测试',
    type: '渗透测试',
    target: 'finance.gxbank.com',
    reward: 5000,
    points: 500,
    difficulty: 5,
    description: '对金融核心系统进行深度渗透测试，需提供漏洞危害证明，但严禁破坏性渗透，需输出详细的修补方案。',
    deadline: '10天 18小时',
    status: 'published',
    progressCount: 0,
    createdAt: '2026-06-28 14:00:00'
  },
  {
    id: 'task-4',
    title: '企业网络内网渗透',
    type: '渗透测试',
    target: 'int.gxtech.com',
    reward: 800,
    points: 80,
    difficulty: 2,
    description: '对企业办公网内网进行边界突破和横向移动探测，验证域控安全性，需提供渗透路径拓扑图。',
    deadline: '3天 6小时',
    status: 'published',
    progressCount: 0,
    createdAt: '2026-06-30 11:00:00'
  },
  {
    id: 'task-5',
    title: '某市教育局网站安全审计',
    type: '安全审计',
    target: 'edu.gx.gov.cn',
    reward: 2500,
    points: 250,
    difficulty: 4,
    description: '对教育局网站进行安全审计，检测是否存在弱口令、未授权访问等漏洞。',
    deadline: '7天 15小时',
    status: 'published',
    progressCount: 0,
    createdAt: '2026-06-30 12:00:00'
  },
  {
    id: 'task-6',
    title: '在线政务服务平台安全检测',
    type: '漏洞挖掘',
    target: 'service.gx.gov.cn',
    reward: 1800,
    points: 180,
    difficulty: 3,
    description: '对在线政务平台的API接口进行安全性测试，发现数据泄露或越权问题。',
    deadline: '4天 9小时',
    status: 'published',
    progressCount: 0,
    createdAt: '2026-06-30 09:00:00'
  },
  {
    id: 'task-7',
    title: '移动APP安全检测',
    type: '应急响应',
    target: '某政务APP',
    reward: 1500,
    points: 150,
    difficulty: 3,
    description: '对政务APP客户端进行反编译分析、本地数据存储加密性检测及传输层安全审计。',
    deadline: '6天 11小时',
    status: 'published',
    progressCount: 0,
    createdAt: '2026-06-30 07:00:00'
  },
  {
    id: 'task-8',
    title: '数据库安全配置检查',
    type: '安全加固',
    target: 'db.gxcompany.com',
    reward: 600,
    points: 60,
    difficulty: 1,
    description: '检查核心数据库的配置，包括账户权限审计、网络准入白名单、备份机制验证。',
    deadline: '2天 8小时',
    status: 'completed',
    acceptedBy: 'tester',
    acceptedByName: '渗透测试员',
    progressCount: 1,
    createdAt: '2026-06-25 10:00:00'
  },
  {
    id: 'task-9',
    title: '网络设备安全基线检查',
    type: '安全加固',
    target: '192.168.1.0/24',
    reward: 800,
    points: 80,
    difficulty: 2,
    description: '对局域网内交换机、路由器的安全基线进行扫描，检测弱口令和漏洞。',
    deadline: '3天 14小时',
    status: 'accepted',
    acceptedBy: 'xiaoming',
    acceptedByName: '白帽子小明',
    progressCount: 0,
    createdAt: '2026-06-30 14:00:00'
  }
];

export const initialReports: ProgressReport[] = [
  {
    id: 'report-1',
    taskId: 'task-8',
    taskTitle: '数据库安全配置检查',
    developer: 'tester',
    developerName: '渗透测试员',
    stage: '完成审计',
    reportText: '已对该数据库的端口访问限制和权限做了整体审计。发现 root 账户允许远程登录且无IP白名单限制，已给出加固方案并配置完成。',
    submittedAt: '2026-06-26 15:30:00',
    status: 'approved'
  }
];

export const securityAlerts: SecurityAlert[] = [
  { id: '1', time: '05-14 10:24', type: 'danger', message: '发现针对政府网站的批量扫描任务' },
  { id: '2', time: '05-14 09:15', type: 'danger', message: '某单位系统存在0day漏洞利用' },
  { id: '3', time: '05-14 08:47', type: 'warning', message: '社区用户提交可疑情报' },
  { id: '4', time: '05-13 22:21', type: 'warning', message: '发现异常登录行为' },
  { id: '5', time: '05-13 18:22', type: 'info', message: '系统配置变更提醒' }
];

export const announcements: Announcement[] = [
  { id: '1', title: '关于加强数据安全管理的通知', date: '2024-05-10' },
  { id: '2', title: '系统维护公告', date: '2024-05-08' },
  { id: '3', title: '新功能上线通知', date: '2024-05-05' },
  { id: '4', title: '关于奖励发放的说明', date: '2024-05-01' }
];

// Database operations helpers
export const db = {
  getTasks: (): Task[] => {
    const data = localStorage.getItem(TASKS_KEY);
    if (!data) {
      localStorage.setItem(TASKS_KEY, JSON.stringify(initialTasks));
      return initialTasks;
    }
    return JSON.parse(data);
  },

  saveTasks: (tasks: Task[]) => {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  },

  getUsers: (): User[] => {
    const data = localStorage.getItem(USERS_KEY);
    if (!data) {
      localStorage.setItem(USERS_KEY, JSON.stringify(initialUsers));
      return initialUsers;
    }
    return JSON.parse(data);
  },

  saveUsers: (users: User[]) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  getReports: (): ProgressReport[] => {
    const data = localStorage.getItem(REPORTS_KEY);
    if (!data) {
      localStorage.setItem(REPORTS_KEY, JSON.stringify(initialReports));
      return initialReports;
    }
    return JSON.parse(data);
  },

  saveReports: (reports: ProgressReport[]) => {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  },

  resetDb: () => {
    localStorage.setItem(TASKS_KEY, JSON.stringify(initialTasks));
    localStorage.setItem(USERS_KEY, JSON.stringify(initialUsers));
    localStorage.setItem(REPORTS_KEY, JSON.stringify(initialReports));
  }
};
