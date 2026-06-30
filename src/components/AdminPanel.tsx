import React, { useState, useEffect } from 'react';
import { 
  Bell, Mail, LayoutDashboard, PlusCircle, List, FileText, CheckSquare, 
  Users, UserCheck, ShieldAlert, Database, Settings, History, 
  Plus, Send, FileCheck
} from 'lucide-react';
import { db, securityAlerts } from '../data/db';
import { Task, User, ProgressReport } from '../types';

interface AdminPanelProps {
  user: User;
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ user, onLogout }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reports, setReports] = useState<ProgressReport[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showNotification, setShowNotification] = useState<string>('');
  
  // Navigation
  const [adminView, setAdminView] = useState<'dashboard' | 'publish'>('dashboard');

  // Review Modal State
  const [activeReviewReport, setActiveReviewReport] = useState<ProgressReport | null>(null);

  // Publish Task Form State
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('渗透测试');
  const [newTarget, setNewTarget] = useState('');
  const [newReward, setNewReward] = useState('');
  const [newDifficulty, setNewDifficulty] = useState(3);
  const [newDeadline, setNewDeadline] = useState('7天 12小时');
  const [newDescription, setNewDescription] = useState('');

  // Load database
  const loadData = () => {
    setTasks(db.getTasks());
    setReports(db.getReports());
    setUsers(db.getUsers());
  };

  useEffect(() => {
    loadData();
    // Storage listener
    const handleStorageChange = () => {
      loadData();
    };
    window.addEventListener('storage', handleStorageChange);
    
    // Poll every 3 seconds for real-time changes
    const interval = setInterval(loadData, 3000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const triggerNotice = (msg: string) => {
    setShowNotification(msg);
    setTimeout(() => {
      setShowNotification('');
    }, 4000);
  };

  // Publish task action
  const handlePublishTask = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: newTitle,
      type: newType,
      target: newTarget,
      reward: parseFloat(newReward) || 1000,
      points: Math.round((parseFloat(newReward) || 1000) / 10),
      difficulty: newDifficulty,
      description: newDescription || `${newType}任务，目标系统: ${newTarget}。请对系统进行全面安全测试并输出报告。`,
      deadline: newDeadline,
      status: 'published',
      progressCount: 0,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    const updatedTasks = [newTask, ...tasks];
    db.saveTasks(updatedTasks);
    setTasks(updatedTasks);

    // Reset Form
    setNewTitle('');
    setNewTarget('');
    setNewReward('');
    setNewDifficulty(3);
    setNewDescription('');
    
    setAdminView('dashboard');
    triggerNotice(`任务《${newTask.title}》发布成功！使用者端已可即时接收。`);
  };

  // Approve report action
  const handleApproveReport = (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    // 1. Mark report as approved
    const updatedReports = reports.map(r => {
      if (r.id === reportId) {
        return { ...r, status: 'approved' as const };
      }
      return r;
    });
    db.saveReports(updatedReports);
    setReports(updatedReports);

    // 2. Mark task as completed
    const associatedTask = tasks.find(t => t.id === report.taskId);
    const updatedTasks = tasks.map(t => {
      if (t.id === report.taskId) {
        return { ...t, status: 'completed' as const };
      }
      return t;
    });
    db.saveTasks(updatedTasks);
    setTasks(updatedTasks);

    // 3. Award points & exp to the developer user
    if (associatedTask) {
      const dbUsers = db.getUsers();
      const updatedUsers = dbUsers.map(u => {
        if (u.username === report.developer) {
          const newPoints = u.points + associatedTask.points;
          const newExp = u.exp + associatedTask.points;
          let levelStr = u.level;
          let maxExp = u.maxExp;

          // Simple level up calculation (threshold increments)
          if (newExp >= u.maxExp && u.maxExp > 0) {
            const currentLv = parseInt(u.level.match(/\d+/)?.join('') || '1');
            const nextLv = currentLv + 1;
            maxExp = Math.round(u.maxExp * 1.5);
            levelStr = `Lv.${nextLv} 核心极客`;
          }

          return {
            ...u,
            points: newPoints,
            exp: newExp,
            maxExp: maxExp,
            level: levelStr,
            completedTasks: u.completedTasks + 1
          };
        }
        return u;
      });
      db.saveUsers(updatedUsers);
      setUsers(updatedUsers);
    }

    setActiveReviewReport(null);
    triggerNotice(`审核通过！已向 [${report.developerName}] 发放 ${associatedTask?.points || 0} 积分。`);
  };

  // Reject report (send back to accepted status so they can resubmit)
  const handleRejectReport = (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    // Delete or mark report as rejected (we'll just remove the report and set status back to accepted)
    const updatedReports = reports.filter(r => r.id !== reportId);
    db.saveReports(updatedReports);
    setReports(updatedReports);

    const updatedTasks = tasks.map(t => {
      if (t.id === report.taskId) {
        return { ...t, status: 'accepted' as const };
      }
      return t;
    });
    db.saveTasks(updatedTasks);
    setTasks(updatedTasks);

    setActiveReviewReport(null);
    triggerNotice('已退回该渗透报告，任务状态变更为“进行中”，等待白帽子重新修改提交。');
  };

  // Metrics
  const totalTasksCount = tasks.length + 1260; // offset for high-fidelity look
  const ongoingTasksCount = tasks.filter(t => t.status === 'accepted' || t.status === 'submitted').length + 338;
  const completedTasksCount = tasks.filter(t => t.status === 'completed').length + 895;
  const pendingReports = reports.filter(r => r.status === 'pending');
  const highRiskIntelCount = tasks.filter(t => t.difficulty >= 4).length + 19;

  // Completion Rate
  const completionPercentage = Math.round((completedTasksCount / totalTasksCount) * 1000) / 10;

  return (
    <div style={styles.adminDashboard}>
      {/* Toast alert */}
      {showNotification && (
        <div style={styles.toast}>
          <div style={styles.toastContent}>
            <span>🛡️ 系统提示: {showNotification}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logoBadge}>🛡️</div>
          <div>
            <h1 style={styles.logoTitle}>安全情报社区</h1>
            <p style={styles.logoSubtitle}>管理端平台</p>
          </div>
        </div>

        <div style={styles.headerMiddle}>
          科技赋能警务 · 数据驱动安全
        </div>

        <div style={styles.headerRight}>
          <div style={styles.iconBadgeBtn}>
            <Bell size={18} />
            {pendingReports.length > 0 && <span style={styles.iconDot}>{pendingReports.length}</span>}
          </div>
          <div style={styles.iconBadgeBtn}>
            <Mail size={18} />
          </div>
          
          <div style={styles.userProfile}>
            <img src={user.avatar} alt="管理员头像" style={styles.userAvatar} />
            <div style={styles.userInfo}>
              <span style={styles.userName}>{user.nickname}</span>
              <span style={styles.userLevel}>网络安全支队</span>
            </div>
          </div>
          <button onClick={onLogout} style={styles.logoutBtn} title="退出登录">
            <LogOutIcon />
          </button>
        </div>
      </header>

      {/* Workspace Grid */}
      <div style={styles.workspaceBody}>
        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <div 
            onClick={() => setAdminView('dashboard')}
            style={{ ...styles.sidebarItem, ...(adminView === 'dashboard' ? styles.sidebarItemActive : {}) }}
          >
            <LayoutDashboard size={18} />
            <span>首页概览</span>
          </div>

          <div style={styles.sidebarHeading}>任务管理</div>
          <div 
            onClick={() => setAdminView('publish')}
            style={{ ...styles.sidebarItem, ...(adminView === 'publish' ? styles.sidebarItemActive : {}) }}
          >
            <PlusCircle size={18} />
            <span>任务发布</span>
          </div>
          <div style={styles.sidebarItem} onClick={() => setAdminView('dashboard')}>
            <List size={18} />
            <span>任务列表</span>
          </div>
          <div style={styles.sidebarItem}>
            <FileText size={18} />
            <span>任务模板</span>
          </div>
          <div style={styles.sidebarItem}>
            <CheckSquare size={18} />
            <span>任务审核</span>
          </div>

          <div style={styles.sidebarHeading}>情报管理</div>
          <div style={{ ...styles.sidebarItem, display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Database size={18} />
              <span>情报审核</span>
            </div>
            {pendingReports.length > 0 && (
              <span style={styles.pendingBadge}>{pendingReports.length}</span>
            )}
          </div>
          <div style={styles.sidebarItem}>
            <ShieldAlert size={18} />
            <span>情报分类</span>
          </div>

          <div style={styles.sidebarHeading}>用户管理</div>
          <div style={styles.sidebarItem}>
            <Users size={18} />
            <span>用户列表</span>
          </div>
          <div style={styles.sidebarItem}>
            <UserCheck size={18} />
            <span>用户审核</span>
          </div>

          <div style={styles.sidebarHeading}>系统设置</div>
          <div style={styles.sidebarItem}>
            <Settings size={18} />
            <span>系统设置</span>
          </div>
          <div style={styles.sidebarItem}>
            <History size={18} />
            <span>操作日志</span>
          </div>
        </aside>

        {/* Main Panel Content Area */}
        <main style={styles.mainContent}>
          {adminView === 'dashboard' ? (
            /* ============ DASHBOARD VIEW ============ */
            <div style={styles.dashboardLayout}>
              
              {/* Metrics cards row */}
              <div style={styles.metricsRow}>
                <div className="glass-panel" style={styles.metricCard}>
                  <div style={styles.metHeader}>
                    <span style={styles.metLabel}>任务总数</span>
                    <span style={styles.metTrendUp}>↑ 12.5%</span>
                  </div>
                  <div style={styles.metVal}>{totalTasksCount.toLocaleString()}</div>
                  <div style={styles.metSubText}>较昨日 +14</div>
                </div>

                <div className="glass-panel" style={styles.metricCard}>
                  <div style={styles.metHeader}>
                    <span style={styles.metLabel}>进行中任务</span>
                    <span style={styles.metTrendUp}>↑ 8.3%</span>
                  </div>
                  <div style={styles.metVal}>{ongoingTasksCount}</div>
                  <div style={styles.metSubText}>较昨日 +6</div>
                </div>

                <div className="glass-panel" style={styles.metricCard}>
                  <div style={styles.metHeader}>
                    <span style={styles.metLabel}>已完成任务</span>
                    <span style={styles.metTrendUp}>↑ 15.7%</span>
                  </div>
                  <div style={styles.metVal}>{completedTasksCount}</div>
                  <div style={styles.metSubText}>较昨日 +12</div>
                </div>

                <div className="glass-panel" style={styles.metricCard}>
                  <div style={styles.metHeader}>
                    <span style={styles.metLabel}>社区用户</span>
                    <span style={styles.metTrendUp}>↑ 6.4%</span>
                  </div>
                  <div style={styles.metVal}>{users.filter(u => u.role === 'user').length + 2148}</div>
                  <div style={styles.metSubText}>当前活跃比 86%</div>
                </div>

                <div className="glass-panel" style={styles.metricCard}>
                  <div style={styles.metHeader}>
                    <span style={styles.metLabel}>待审核情报</span>
                    <span style={{
                      ...styles.metTrendDown,
                      color: pendingReports.length > 0 ? '#ffaa00' : '#4b6b94'
                    }}>
                      {pendingReports.length > 0 ? '需处理' : '无待办'}
                    </span>
                  </div>
                  <div style={{
                    ...styles.metVal,
                    color: pendingReports.length > 0 ? '#00ffd5' : 'white'
                  }}>
                    {pendingReports.length}
                  </div>
                  <div style={styles.metSubText}>来自白帽子提交</div>
                </div>

                <div className="glass-panel" style={styles.metricCard}>
                  <div style={styles.metHeader}>
                    <span style={styles.metLabel}>高危情报</span>
                    <span style={styles.metTrendUp}>↑ 9.8%</span>
                  </div>
                  <div style={{ ...styles.metVal, color: '#ff4a5a' }}>{highRiskIntelCount}</div>
                  <div style={styles.metSubText}>需紧急修复漏洞</div>
                </div>
              </div>

              {/* Row 2: Charts (Trend & Donut) & System Todo */}
              <div style={styles.row2Grid}>
                {/* SVG Line Chart (Trend) */}
                <div className="glass-panel" style={styles.chartPanel}>
                  <h4 style={styles.chartTitle}>任务趋势统计</h4>
                  <div style={styles.chartContainer}>
                    <svg viewBox="0 0 500 200" style={styles.svgChart}>
                      {/* Grid Lines */}
                      <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(0,149,255,0.06)" />
                      <line x1="40" y1="60" x2="480" y2="60" stroke="rgba(0,149,255,0.06)" />
                      <line x1="40" y1="100" x2="480" y2="100" stroke="rgba(0,149,255,0.06)" />
                      <line x1="40" y1="140" x2="480" y2="140" stroke="rgba(0,149,255,0.06)" />
                      <line x1="40" y1="170" x2="480" y2="170" stroke="rgba(0,149,255,0.15)" strokeWidth="1.5" />

                      {/* X Axis Labels */}
                      <text x="40" y="185" fill="#4b6b94" fontSize="10">06-25</text>
                      <text x="128" y="185" fill="#4b6b94" fontSize="10">06-26</text>
                      <text x="216" y="185" fill="#4b6b94" fontSize="10">06-27</text>
                      <text x="304" y="185" fill="#4b6b94" fontSize="10">06-28</text>
                      <text x="392" y="185" fill="#4b6b94" fontSize="10">06-29</text>
                      <text x="480" y="185" fill="#4b6b94" fontSize="10">今日</text>

                      {/* Y Axis Labels */}
                      <text x="15" y="24" fill="#4b6b94" fontSize="10">500</text>
                      <text x="15" y="104" fill="#4b6b94" fontSize="10">250</text>
                      <text x="25" y="174" fill="#4b6b94" fontSize="10">0</text>

                      {/* Trend Line: Published Tasks */}
                      <path 
                        d="M 40 130 L 128 110 L 216 115 L 304 95 L 392 78 L 480 65" 
                        fill="none" 
                        stroke="#00ffd5" 
                        strokeWidth="2.5" 
                        strokeLinecap="round"
                        filter="drop-shadow(0 2px 5px rgba(0, 255, 213, 0.4))"
                      />
                      {/* Trend Line: Completed Tasks */}
                      <path 
                        d="M 40 160 L 128 152 L 216 140 L 304 145 L 392 125 L 480 110" 
                        fill="none" 
                        stroke="#0088ff" 
                        strokeWidth="2" 
                        strokeLinecap="round"
                        filter="drop-shadow(0 2px 4px rgba(0, 136, 255, 0.3))"
                      />

                      {/* Dots on paths */}
                      <circle cx="480" cy="65" r="4" fill="#00ffd5" />
                      <circle cx="480" cy="110" r="4" fill="#0088ff" />
                    </svg>
                    <div style={styles.chartLegend}>
                      <span style={{ color: '#00ffd5', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#00ffd5', borderRadius: '50%' }}></span>
                        发布任务量
                      </span>
                      <span style={{ color: '#0088ff', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#0088ff', borderRadius: '50%' }}></span>
                        已完成任务
                      </span>
                    </div>
                  </div>
                </div>

                {/* SVG Donut Chart (Distribution) */}
                <div className="glass-panel" style={styles.chartPanel}>
                  <h4 style={styles.chartTitle}>任务类型分布</h4>
                  <div style={styles.distributionContainer}>
                    <div style={{ width: '130px', height: '130px', position: 'relative' }}>
                      <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                        <circle cx="18" cy="18" r="15.91" fill="none" stroke="rgba(0,149,255,0.05)" strokeWidth="3" />
                        
                        {/* Segment 1: 漏洞扫描 (35.6%) -> dash: 35.6 64.4 */}
                        <circle cx="18" cy="18" r="15.91" fill="none" stroke="#00ffd5" strokeWidth="3" 
                          strokeDasharray="35.6 64.4" strokeDashoffset="0" />
                        
                        {/* Segment 2: 渗透测试 (28.3%) -> offset: 35.6, dash: 28.3 71.7 */}
                        <circle cx="18" cy="18" r="15.91" fill="none" stroke="#0088ff" strokeWidth="3" 
                          strokeDasharray="28.3 71.7" strokeDashoffset="-35.6" />
                        
                        {/* Segment 3: 应急响应 (15.8%) -> offset: 63.9, dash: 15.8 84.2 */}
                        <circle cx="18" cy="18" r="15.91" fill="none" stroke="#ffaa00" strokeWidth="3" 
                          strokeDasharray="15.8 84.2" strokeDashoffset="-63.9" />

                        {/* Segment 4: 其他 (20.3%) -> offset: 79.7, dash: 20.3 79.7 */}
                        <circle cx="18" cy="18" r="15.91" fill="none" stroke="#6366f1" strokeWidth="3" 
                          strokeDasharray="20.3 79.7" strokeDashoffset="-79.7" />
                      </svg>
                      {/* Donut Center */}
                      <div style={styles.donutCenter}>
                        <div style={styles.donutCenterVal}>{totalTasksCount}</div>
                        <div style={styles.donutCenterLbl}>总任务数</div>
                      </div>
                    </div>

                    <div style={styles.donutLegend}>
                      <div style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#00ffd5' }}></span> 漏洞扫描 35.6%</div>
                      <div style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#0088ff' }}></span> 渗透测试 28.3%</div>
                      <div style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#ffaa00' }}></span> 应急响应 15.8%</div>
                      <div style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#6366f1' }}></span> 其他类型 20.3%</div>
                    </div>
                  </div>
                </div>

                {/* System Todo Card */}
                <div className="glass-panel" style={styles.chartPanel}>
                  <h4 style={styles.chartTitle}>系统待办</h4>
                  <div style={styles.todoList}>
                    {pendingReports.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#4b6b94', padding: '30px 10px', fontSize: '13px' }}>
                        🎉 暂无待审核的情报报告，系统运行顺畅！
                      </div>
                    ) : (
                      pendingReports.map(rep => (
                        <div 
                          key={rep.id} 
                          onClick={() => setActiveReviewReport(rep)}
                          style={styles.todoItem}
                        >
                          <div style={styles.todoLeft}>
                            <span style={styles.todoWarnIcon}>🛡️</span>
                            <div>
                              <div style={styles.todoTitle}>收到 [{rep.developerName}] 的渗透报告</div>
                              <div style={styles.todoSubtitle}>任务: {rep.taskTitle}</div>
                            </div>
                          </div>
                          <span style={styles.todoBtn}>立即审核</span>
                        </div>
                      ))
                    )}

                    <div style={styles.systemStatusLine}>
                      <span>待确认结算款项</span>
                      <span style={{ color: '#ffaa00', fontWeight: 'bold' }}>23 笔</span>
                    </div>
                    <div style={styles.systemStatusLine}>
                      <span>待审核任务发布申诉</span>
                      <span style={{ color: '#4b6b94' }}>0 笔</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Latest Tasks Table & Security Alerts */}
              <div style={styles.row3Grid}>
                {/* Latest Tasks Table */}
                <div className="glass-panel" style={styles.tablePanel}>
                  <div style={styles.tablePanelHeader}>
                    <h4 style={styles.tablePanelTitle}>最新任务监控</h4>
                    <span onClick={() => setAdminView('publish')} style={styles.tablePanelAddLink}>
                      <Plus size={14} /> 发布任务
                    </span>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table className="sec-table">
                      <thead>
                        <tr>
                          <th>任务标题</th>
                          <th>任务类型</th>
                          <th>目标</th>
                          <th>奖励</th>
                          <th>难度</th>
                          <th>截止时间</th>
                          <th>状态</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks.slice(0, 5).map(t => {
                          let statusLabel = null;
                          if (t.status === 'published') {
                            statusLabel = <span className="badge badge-info">已发布</span>;
                          } else if (t.status === 'accepted') {
                            statusLabel = <span className="badge badge-warning">进行中</span>;
                          } else if (t.status === 'submitted') {
                            statusLabel = <span className="badge badge-warning" style={{ color: '#ffea00', borderColor: '#ffea00' }}>待审核</span>;
                          } else if (t.status === 'completed') {
                            statusLabel = <span className="badge badge-success">已完成</span>;
                          }

                          return (
                            <tr key={t.id}>
                              <td style={{ fontWeight: '600' }}>{t.title}</td>
                              <td>{t.type}</td>
                              <td style={{ color: '#00ffd5', fontSize: '13px' }}>{t.target}</td>
                              <td style={{ color: '#ffaa00', fontWeight: 'bold' }}>¥{t.reward}</td>
                              <td>{'★'.repeat(t.difficulty) + '☆'.repeat(5 - t.difficulty)}</td>
                              <td style={{ color: '#a0aec0', fontSize: '12px' }}>{t.deadline}</td>
                              <td>{statusLabel}</td>
                              <td>
                                <button 
                                  onClick={() => {
                                    // If task has a pending report, open review, otherwise show details
                                    const relatedReport = reports.find(r => r.taskId === t.id && r.status === 'pending');
                                    if (relatedReport) {
                                      setActiveReviewReport(relatedReport);
                                    } else {
                                      triggerNotice(`该任务目标: ${t.target}，目前状态为: ${t.status === 'published' ? '发布中(无人接单)' : t.status === 'accepted' ? `被 [${t.acceptedByName}] 接受进行中` : '已完成'}`);
                                    }
                                  }}
                                  style={styles.reviewBtn}
                                >
                                  查看
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Security Alerts (安全预警) */}
                <div className="glass-panel" style={styles.alertsPanel}>
                  <h4 style={styles.chartTitle}>安全预警</h4>
                  <div style={styles.alertsList}>
                    {securityAlerts.map(alert => (
                      <div key={alert.id} style={styles.alertItem}>
                        <div style={styles.alertMeta}>
                          <span style={{
                            ...styles.alertBadge,
                            ...(alert.type === 'danger' ? styles.alertDanger : styles.alertWarning)
                          }}>
                            {alert.type === 'danger' ? '高危' : '中危'}
                          </span>
                          <span style={styles.alertTime}>{alert.time}</span>
                        </div>
                        <p style={styles.alertMsg}>{alert.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 4: China map & Completion rate */}
              <div style={styles.row4Grid}>
                {/* SVG China Map mock representing Active Users regions */}
                <div className="glass-panel" style={styles.mapPanel}>
                  <h4 style={styles.chartTitle}>用户活跃度分布</h4>
                  <div style={styles.mapContainer}>
                    {/* Simplified SVG Map Silhouette of China */}
                    <svg viewBox="0 0 400 300" style={styles.svgMap}>
                      {/* Outline map silhouette */}
                      <path 
                        d="M 190 60 Q 210 70 230 50 Q 250 40 260 70 Q 280 60 290 80 Q 300 90 320 80 Q 330 90 340 120 Q 350 130 360 160 Q 370 170 350 200 Q 360 220 340 230 Q 320 220 310 240 Q 290 230 280 250 Q 260 240 250 260 Q 240 270 230 290 Q 220 280 210 270 Q 200 280 180 260 Q 170 270 160 260 Q 150 250 140 260 Q 120 240 100 230 Q 80 220 70 190 Q 60 180 80 160 Q 70 150 90 140 Q 80 120 100 110 Q 120 100 130 80 Q 150 70 170 80 Z" 
                        fill="#051226" 
                        stroke="rgba(0,149,255,0.25)" 
                        strokeWidth="1.5"
                      />
                      
                      {/* Map Nodes (Pulsing blue dots) */}
                      {/* Beijing (250, 100) */}
                      <circle cx="250" cy="100" r="4" fill="#00ffd5" />
                      <circle cx="250" cy="100" r="10" fill="none" stroke="#00ffd5" strokeWidth="1" className="pulsing-beacon" opacity="0.6" />
                      <text x="258" y="102" fill="white" fontSize="9">北京 (326)</text>

                      {/* Shanghai (290, 170) */}
                      <circle cx="290" cy="170" r="4" fill="#00ffd5" />
                      <circle cx="290" cy="170" r="10" fill="none" stroke="#00ffd5" strokeWidth="1" className="pulsing-beacon" opacity="0.6" />
                      <text x="298" y="172" fill="white" fontSize="9">上海 (278)</text>

                      {/* Guangzhou (245, 235) */}
                      <circle cx="245" cy="235" r="4" fill="#00ffd5" />
                      <circle cx="245" cy="235" r="10" fill="none" stroke="#00ffd5" strokeWidth="1" className="pulsing-beacon" opacity="0.6" />
                      <text x="253" y="237" fill="white" fontSize="9">广州 (214)</text>

                      {/* Wuhan (235, 175) */}
                      <circle cx="235" cy="175" r="4" fill="#00ffd5" />
                      <circle cx="235" cy="175" r="10" fill="none" stroke="#00ffd5" strokeWidth="1" className="pulsing-beacon" opacity="0.6" />
                      <text x="210" y="165" fill="white" fontSize="9">武汉 (156)</text>

                      {/* Chengdu (170, 185) */}
                      <circle cx="170" cy="185" r="4" fill="#00ffd5" />
                      <circle cx="170" cy="185" r="10" fill="none" stroke="#00ffd5" strokeWidth="1" className="pulsing-beacon" opacity="0.6" />
                      <text x="140" y="195" fill="white" fontSize="9">成都 (198)</text>
                    </svg>
                  </div>
                </div>

                {/* SVG Radial Gauge (Completion rate) */}
                <div className="glass-panel" style={styles.gaugePanel}>
                  <h4 style={styles.chartTitle}>任务完成率</h4>
                  <div style={styles.gaugeContainer}>
                    <div style={{ width: '130px', height: '130px', position: 'relative' }}>
                      <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                        <circle cx="18" cy="18" r="15.91" fill="none" stroke="rgba(0,149,255,0.05)" strokeWidth="2.5" />
                        
                        {/* Gauge fill based on dynamic percentage */}
                        <circle cx="18" cy="18" r="15.91" fill="none" stroke="#00ffd5" strokeWidth="2.5" 
                          strokeDasharray={`${completionPercentage} ${100 - completionPercentage}`} 
                          strokeDashoffset="0"
                          strokeLinecap="round"
                          filter="drop-shadow(0 0 6px rgba(0,255,213,0.4))"
                        />
                      </svg>
                      <div style={styles.gaugeCenter}>
                        <div style={styles.gaugeCenterVal}>{completionPercentage}%</div>
                        <div style={styles.gaugeCenterLbl}>整体完成率</div>
                      </div>
                    </div>

                    <div style={styles.gaugeStats}>
                      <div style={styles.gaugeStatLine}>
                        <span style={styles.gaugeStatDotGreen}></span>
                        <span style={styles.gaugeStatLabel}>已完成任务</span>
                        <span style={styles.gaugeStatValue}>{completedTasksCount} 个</span>
                      </div>
                      <div style={styles.gaugeStatLine}>
                        <span style={styles.gaugeStatDotBlue}></span>
                        <span style={styles.gaugeStatLabel}>未完成任务</span>
                        <span style={styles.gaugeStatValue}>{totalTasksCount - completedTasksCount} 个</span>
                      </div>
                      <div style={styles.gaugeStatLine}>
                        <span style={styles.gaugeStatDotRed}></span>
                        <span style={styles.gaugeStatLabel}>超时任务</span>
                        <span style={styles.gaugeStatValue}>45 个</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Announcements listing card */}
                <div className="glass-panel" style={styles.chartPanel}>
                  <h4 style={styles.chartTitle}>平台公告</h4>
                  <div style={styles.announceContent}>
                    <div style={styles.annPrimaryCard}>
                      <h5 style={styles.annPrimaryTitle}>关于加强数据安全管理的通知</h5>
                      <p style={styles.annPrimaryDesc}>为进一步加强平台数据防护，对渗透日志和报告的传输采取更严格审计措施...</p>
                      <span style={styles.annPrimaryDate}>2026-06-30</span>
                    </div>

                    <ul style={styles.annList}>
                      <li style={styles.annListItem}>
                        <span style={styles.annListTitle}>系统维护与架构升级公告</span>
                        <span style={styles.annListDate}>06-28</span>
                      </li>
                      <li style={styles.annListItem}>
                        <span style={styles.annListTitle}>安全情报开放共享二期上线通知</span>
                        <span style={styles.annListDate}>06-25</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            /* ============ PUBLISH TASK FORM VIEW ============ */
            <div className="glass-panel" style={styles.publishFormPanel}>
              <div style={styles.publishHeader}>
                <h3 style={styles.publishTitle}>发布新增渗透任务</h3>
                <p style={styles.publishSub}>在这里填写待渗透检测的系统目标，发布后白帽子即可在任务大厅中接单测试。</p>
              </div>

              <form onSubmit={handlePublishTask} style={styles.publishForm}>
                <div style={styles.formRow}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">任务名称/标题</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="例如: 某市水利局后台安全审计"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ width: '220px' }}>
                    <label className="form-label">任务类型</label>
                    <select 
                      className="form-control"
                      value={newType}
                      onChange={e => setNewType(e.target.value)}
                      style={{ background: '#030a16', border: '1px solid rgba(0,136,255,0.2)', color: 'white' }}
                    >
                      <option value="渗透测试">渗透测试</option>
                      <option value="安全审计">安全审计</option>
                      <option value="漏洞扫描">漏洞扫描</option>
                      <option value="应急响应">应急响应</option>
                      <option value="安全加固">安全加固</option>
                    </select>
                  </div>
                </div>

                <div style={styles.formRow}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">渗透检测目标系统 (URL/IP)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="例如: https://admin.water.gx.gov.cn 或 10.12.35.4"
                      value={newTarget}
                      onChange={e => setNewTarget(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ width: '220px' }}>
                    <label className="form-label">奖励金额 (RMB)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="RMB 金额, 如: 4000"
                      value={newReward}
                      onChange={e => setNewReward(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={styles.formRow}>
                  <div className="form-group" style={{ width: '220px' }}>
                    <label className="form-label">难度等级 (1-5 星)</label>
                    <select 
                      className="form-control"
                      value={newDifficulty}
                      onChange={e => setNewDifficulty(parseInt(e.target.value))}
                      style={{ background: '#030a16', border: '1px solid rgba(0,136,255,0.2)', color: 'white' }}
                    >
                      <option value="1">★☆☆☆☆ (入门)</option>
                      <option value="2">★★☆☆☆ (初级)</option>
                      <option value="3">★★★☆☆ (中级)</option>
                      <option value="4">★★★★☆ (高级)</option>
                      <option value="5">★★★★★ (专家级)</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">截止时间限制</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="例如: 7天 12小时"
                      value={newDeadline}
                      onChange={e => setNewDeadline(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">渗透要求及系统描述</label>
                  <textarea 
                    rows={6} 
                    className="form-control"
                    placeholder="请在这里写明系统具体功能模块、测试规范、注意事项以及禁止进行何种攻击动作。白帽子接单后将按照此要求提交进度报告。"
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={styles.publishFormFooter}>
                  <button 
                    type="button" 
                    onClick={() => setAdminView('dashboard')}
                    style={styles.formCancelBtn}
                  >
                    返回控制台
                  </button>
                  <button 
                    type="submit" 
                    style={styles.formSubmitBtn}
                  >
                    确认发布任务 <Send size={14} />
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Review Modal */}
      {activeReviewReport && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', borderColor: '#ffaa00' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid rgba(255,170,0,0.2)' }}>
              <h3 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck size={18} style={{ color: '#ffaa00' }} />
                审核渗透进度报告
              </h3>
              <button 
                onClick={() => setActiveReviewReport(null)} 
                style={styles.closeModalBtn}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div style={styles.reviewModalMetaGrid}>
                <div style={styles.metaBlock}>
                  <span style={styles.metaLbl}>任务标题</span>
                  <span style={styles.metaValText}>{activeReviewReport.taskTitle}</span>
                </div>
                <div style={styles.metaBlock}>
                  <span style={styles.metaLbl}>提交人员</span>
                  <span style={{ ...styles.metaValText, color: '#00ffd5' }}>
                    {activeReviewReport.developerName} (@{activeReviewReport.developer})
                  </span>
                </div>
                <div style={styles.metaBlock}>
                  <span style={styles.metaLbl}>所处渗透阶段</span>
                  <span style={{ ...styles.metaValText, color: '#ffaa00', fontWeight: 'bold' }}>
                    {activeReviewReport.stage}
                  </span>
                </div>
                <div style={styles.metaBlock}>
                  <span style={styles.metaLbl}>提交时间</span>
                  <span style={styles.metaValText}>{activeReviewReport.submittedAt}</span>
                </div>
              </div>

              <div style={styles.reviewContentBlock}>
                <h4 style={styles.reviewHeading}>渗透详情报告内容</h4>
                <div style={styles.reportTextContent}>
                  {activeReviewReport.reportText}
                </div>
              </div>

              <div style={{ ...styles.footerWarning, color: '#8ab4f8', marginTop: '16px', background: 'rgba(0,149,255,0.05)', padding: '10px', borderRadius: '4px' }}>
                💡 <b>管理员提示:</b> 审核通过后，该任务将被标记为“已完成”，并且系统会自动将该任务的全部奖励积分划归至白帽子的账号中。
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid rgba(255,170,0,0.1)' }}>
              <button 
                type="button" 
                onClick={() => handleRejectReport(activeReviewReport.id)} 
                style={styles.btnReject}
              >
                退回整改
              </button>
              <button 
                type="button" 
                onClick={() => handleApproveReport(activeReviewReport.id)} 
                style={styles.btnApprove}
              >
                审核通过 (打款发积分)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// SVG icon to keep code dependency light
const LogOutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

const styles: { [key: string]: React.CSSProperties } = {
  adminDashboard: {
    backgroundColor: '#02060f',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    width: '100vw',
    color: '#e2f1ff',
  },
  toast: {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 2000,
    animation: 'toast-in 0.3s ease-out',
  },
  toastContent: {
    backgroundColor: 'rgba(6, 17, 34, 0.95)',
    border: '1px solid #00ffd5',
    boxShadow: '0 0 15px rgba(0, 255, 213, 0.4)',
    color: '#e2f1ff',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 24px',
    backgroundColor: 'rgba(4, 12, 24, 0.9)',
    borderBottom: '1px solid rgba(0, 149, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoBadge: {
    fontSize: '26px',
  },
  logoTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#ffffff',
  },
  logoSubtitle: {
    fontSize: '11px',
    color: '#8ab4f8',
    marginTop: '1px',
    letterSpacing: '1px',
  },
  headerMiddle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#00ffd5',
    letterSpacing: '2px',
    textShadow: '0 0 10px rgba(0,255,213,0.3)',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  iconBadgeBtn: {
    position: 'relative',
    color: '#8ab4f8',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '50%',
    transition: 'all 0.2s',
  },
  iconDot: {
    position: 'absolute',
    top: '-2px',
    right: '-2px',
    backgroundColor: '#ff4a5a',
    color: 'white',
    borderRadius: '50%',
    fontSize: '9px',
    fontWeight: 'bold',
    width: '14px',
    height: '14px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    paddingLeft: '16px',
    borderLeft: '1px solid rgba(0, 149, 255, 0.15)',
  },
  userAvatar: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    border: '2px solid #ff4a5a',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  userName: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#ffffff',
  },
  userLevel: {
    fontSize: '10px',
    color: '#8ab4f8',
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    color: '#4b6b94',
    cursor: 'pointer',
    padding: '6px',
    display: 'flex',
    alignItems: 'center',
    transition: 'color 0.2s',
  },
  workspaceBody: {
    display: 'flex',
    flex: 1,
    width: '100vw',
  },
  sidebar: {
    width: '200px',
    backgroundColor: '#040d1c',
    borderRight: '1px solid rgba(0, 149, 255, 0.15)',
    padding: '16px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    overflowY: 'auto',
  },
  sidebarItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '6px',
    color: '#8ab4f8',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  sidebarItemActive: {
    color: '#ffffff',
    backgroundColor: '#0055cc',
    boxShadow: '0 4px 10px rgba(0,85,204,0.3)',
  },
  sidebarHeading: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#4b6b94',
    letterSpacing: '1px',
    padding: '16px 12px 6px 12px',
    textTransform: 'uppercase',
  },
  pendingBadge: {
    backgroundColor: '#ffaa00',
    color: '#030a16',
    borderRadius: '10px',
    padding: '1px 6px',
    fontSize: '10px',
    fontWeight: 'bold',
  },
  mainContent: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto',
    backgroundColor: '#02060f',
  },
  dashboardLayout: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  metricsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: '16px',
  },
  metricCard: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '100px',
  },
  metHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metLabel: {
    fontSize: '12px',
    color: '#8ab4f8',
  },
  metTrendUp: {
    fontSize: '11px',
    color: '#00ffd5',
    fontWeight: 'bold',
  },
  metTrendDown: {
    fontSize: '11px',
    color: '#ff4a5a',
    fontWeight: 'bold',
  },
  metVal: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#ffffff',
    margin: '10px 0 4px 0',
    fontFamily: "'Outfit', sans-serif",
  },
  metSubText: {
    fontSize: '11px',
    color: '#4b6b94',
  },
  row2Grid: {
    display: 'grid',
    gridTemplateColumns: '5fr 3.5fr 3.5fr',
    gap: '20px',
  },
  chartPanel: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  chartTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff',
    borderLeft: '3px solid #00ffd5',
    paddingLeft: '8px',
    marginBottom: '16px',
  },
  chartContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  svgChart: {
    width: '100%',
    height: '140px',
  },
  chartLegend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginTop: '6px',
  },
  distributionContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    flex: 1,
  },
  donutCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutCenterVal: {
    fontSize: '16px',
    fontWeight: '800',
    color: 'white',
  },
  donutCenterLbl: {
    fontSize: '9px',
    color: '#4b6b94',
    marginTop: '2px',
  },
  donutLegend: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  legendItem: {
    fontSize: '11px',
    color: '#8ab4f8',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  legendDot: {
    display: 'inline-block',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
  },
  todoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    flex: 1,
    justifyContent: 'center',
  },
  todoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: 'rgba(0,136,255,0.04)',
    border: '1px solid rgba(0,136,255,0.1)',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  todoLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  todoWarnIcon: {
    fontSize: '18px',
  },
  todoTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'white',
  },
  todoSubtitle: {
    fontSize: '10px',
    color: '#4b6b94',
    marginTop: '2px',
  },
  todoBtn: {
    fontSize: '10px',
    color: '#ffaa00',
    border: '1px solid #ffaa00',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: '600',
  },
  systemStatusLine: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#8ab4f8',
    borderTop: '1px solid rgba(0,149,255,0.06)',
    paddingTop: '8px',
    marginTop: '6px',
  },
  row3Grid: {
    display: 'grid',
    gridTemplateColumns: '8fr 4fr',
    gap: '20px',
  },
  tablePanel: {
    padding: '20px',
  },
  tablePanelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  tablePanelTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff',
    borderLeft: '3px solid #00ffd5',
    paddingLeft: '8px',
  },
  tablePanelAddLink: {
    fontSize: '12px',
    color: '#00ffd5',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontWeight: '600',
  },
  reviewBtn: {
    backgroundColor: 'rgba(0,136,255,0.1)',
    color: '#0088ff',
    border: '1px solid rgba(0,136,255,0.2)',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  alertsPanel: {
    padding: '20px',
  },
  alertsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  alertItem: {
    borderBottom: '1px solid rgba(0,149,255,0.05)',
    paddingBottom: '10px',
  },
  alertMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  alertBadge: {
    fontSize: '9px',
    padding: '1px 4px',
    borderRadius: '2px',
    fontWeight: 'bold',
  },
  alertDanger: {
    backgroundColor: 'rgba(255,74,90,0.15)',
    color: '#ff4a5a',
  },
  alertWarning: {
    backgroundColor: 'rgba(255,170,0,0.15)',
    color: '#ffaa00',
  },
  alertTime: {
    fontSize: '11px',
    color: '#4b6b94',
  },
  alertMsg: {
    fontSize: '12px',
    color: '#8ab4f8',
    lineHeight: '1.4',
  },
  row4Grid: {
    display: 'grid',
    gridTemplateColumns: '4fr 4fr 4fr',
    gap: '20px',
  },
  mapPanel: {
    padding: '20px',
    minHeight: '220px',
  },
  mapContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '180px',
  },
  svgMap: {
    width: '100%',
    height: '100%',
  },
  gaugePanel: {
    padding: '20px',
  },
  gaugeContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: '150px',
  },
  gaugeCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gaugeCenterVal: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#00ffd5',
    textShadow: '0 0 10px rgba(0,255,213,0.3)',
  },
  gaugeCenterLbl: {
    fontSize: '9px',
    color: '#4b6b94',
    marginTop: '2px',
  },
  gaugeStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  gaugeStatLine: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '11px',
    color: '#8ab4f8',
    gap: '6px',
  },
  gaugeStatDotGreen: { width: '6px', height: '6px', backgroundColor: '#00ffd5', borderRadius: '50%' },
  gaugeStatDotBlue: { width: '6px', height: '6px', backgroundColor: '#0088ff', borderRadius: '50%' },
  gaugeStatDotRed: { width: '6px', height: '6px', backgroundColor: '#ff4a5a', borderRadius: '50%' },
  gaugeStatLabel: {
    width: '70px',
  },
  gaugeStatValue: {
    color: 'white',
    fontWeight: '600',
  },
  announceContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    height: '150px',
    justifyContent: 'center',
  },
  annPrimaryCard: {
    background: 'rgba(0,136,255,0.06)',
    border: '1px solid rgba(0,136,255,0.15)',
    borderRadius: '6px',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  annPrimaryTitle: {
    fontSize: '12px',
    color: 'white',
    fontWeight: '600',
  },
  annPrimaryDesc: {
    fontSize: '11px',
    color: '#8ab4f8',
    lineHeight: '1.3',
  },
  annPrimaryDate: {
    fontSize: '10px',
    color: '#4b6b94',
    alignSelf: 'flex-end',
  },
  annList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  annListItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: '#8ab4f8',
  },
  annListTitle: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flex: 1,
    paddingRight: '10px',
  },
  annListDate: {
    color: '#4b6b94',
  },

  /* Publish Form Styling */
  publishFormPanel: {
    padding: '30px',
    maxWidth: '850px',
    margin: '20px auto 0 auto',
    boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
  },
  publishHeader: {
    borderBottom: '1px solid rgba(0,149,255,0.15)',
    paddingBottom: '16px',
    marginBottom: '24px',
  },
  publishTitle: {
    fontSize: '18px',
    color: 'white',
    fontWeight: '700',
    borderLeft: '4px solid #00ffd5',
    paddingLeft: '12px',
  },
  publishSub: {
    fontSize: '13px',
    color: '#8ab4f8',
    marginTop: '6px',
  },
  publishForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formRow: {
    display: 'flex',
    gap: '20px',
  },
  publishFormFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '14px',
    borderTop: '1px solid rgba(0,149,255,0.1)',
    paddingTop: '20px',
    marginTop: '10px',
  },
  formCancelBtn: {
    backgroundColor: 'rgba(255,74,90,0.05)',
    color: '#ff4a5a',
    border: '1px solid rgba(255,74,90,0.25)',
    padding: '10px 20px',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  formSubmitBtn: {
    backgroundColor: '#00ffd5',
    color: '#030a16',
    border: 'none',
    padding: '10px 24px',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
    boxShadow: '0 4px 15px rgba(0,255,213,0.3)',
  },

  /* Review Modal Specifics */
  reviewModalMetaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    background: '#040d1a',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid rgba(0,149,255,0.1)',
    marginBottom: '20px',
  },
  metaBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  metaLbl: {
    fontSize: '11px',
    color: '#4b6b94',
  },
  metaValText: {
    fontSize: '13px',
    color: 'white',
    fontWeight: '600',
  },
  reviewContentBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  reviewHeading: {
    fontSize: '13px',
    color: '#8ab4f8',
    fontWeight: '600',
  },
  reportTextContent: {
    backgroundColor: '#030a16',
    border: '1px solid rgba(0,149,255,0.15)',
    borderRadius: '6px',
    padding: '16px',
    color: '#e2f1ff',
    fontSize: '13px',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap',
    minHeight: '150px',
    maxHeight: '280px',
    overflowY: 'auto',
  },
  btnReject: {
    backgroundColor: '#1a0b12',
    color: '#ff4a5a',
    border: '1px solid rgba(255,74,90,0.3)',
    padding: '8px 16px',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  btnApprove: {
    backgroundColor: '#00ffd5',
    color: '#030a16',
    border: 'none',
    padding: '8px 20px',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 0 10px rgba(0,255,213,0.3)',
  },
  closeModalBtn: {
    background: 'none',
    border: 'none',
    color: '#4b6b94',
    cursor: 'pointer',
    fontSize: '16px',
  },
};

// Inject CSS styles for map nodes pulsation
if (typeof document !== 'undefined') {
  const adminStyle = document.createElement('style');
  adminStyle.innerText = `
    .pulsing-beacon {
      animation: beacon-pulse 2s infinite ease-out;
      transform-origin: center;
    }
    @keyframes beacon-pulse {
      0% { r: 6; opacity: 0.8; stroke-width: 1px; }
      50% { r: 14; opacity: 0.3; stroke-width: 1.5px; }
      100% { r: 22; opacity: 0; stroke-width: 0.5px; }
    }
    .todoItem:hover {
      background: rgba(0, 136, 255, 0.08) !important;
      border-color: var(--color-primary) !important;
    }
    .sidebarItem:not(.sidebarItemActive):hover {
      background: rgba(0, 136, 255, 0.06);
      color: white;
    }
    .reviewBtn:hover {
      background-color: #0088ff !important;
      color: white !important;
    }
  `;
  document.head.appendChild(adminStyle);
}
