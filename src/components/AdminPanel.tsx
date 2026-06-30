import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  FileCheck,
  LayoutDashboard,
  ListChecks,
  LogOut,
  PlusCircle,
  RefreshCw,
  Send,
  Users,
} from 'lucide-react';
import { api } from '../api';
import { AdminStats, ProgressReport, Task, User } from '../types';

interface AdminPanelProps {
  user: User;
  onLogout: () => void;
}

type AdminView = 'dashboard' | 'publish' | 'tasks' | 'reports' | 'users';

const emptyStats: AdminStats = {
  totals: { tasks: 0, ongoing: 0, completed: 0, pendingReports: 0, highRiskTasks: 0, users: 0 },
  typeDistribution: [],
  trend: [],
  userWorkload: [],
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ user, onLogout }) => {
  const [view, setView] = useState<AdminView>('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reports, setReports] = useState<ProgressReport[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats>(emptyStats);
  const [activeReport, setActiveReport] = useState<ProgressReport | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    type: '渗透测试',
    target: '',
    reward: '1000',
    difficulty: 3,
    deadline: '7天',
    description: '',
  });

  const showNotice = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(''), 3500);
  };

  const loadData = useCallback(async () => {
    setError('');
    try {
      const [taskRes, reportRes, userRes, statsRes] = await Promise.all([
        api.tasks(),
        api.reports(),
        api.users(),
        api.stats(),
      ]);
      setTasks(taskRes.tasks);
      setReports(reportRes.reports);
      setUsers(userRes.users);
      setStats(statsRes.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = window.setInterval(loadData, 5000);
    return () => window.clearInterval(interval);
  }, [loadData]);

  const pendingReports = reports.filter(report => report.status === 'pending');
  const completionRate = stats.totals.tasks === 0
    ? 0
    : Math.round((stats.totals.completed / stats.totals.tasks) * 1000) / 10;

  const maxTrendValue = useMemo(() => {
    const values = stats.trend.flatMap(item => [item.published, item.completed]);
    return Math.max(1, ...values);
  }, [stats.trend]);

  const handlePublishTask = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    const reward = Number(form.reward);
    try {
      await api.createTask({
        title: form.title,
        type: form.type,
        target: form.target,
        reward,
        points: Math.round(reward / 10),
        difficulty: form.difficulty,
        deadline: form.deadline,
        description: form.description,
      });
      setForm({
        title: '',
        type: '渗透测试',
        target: '',
        reward: '1000',
        difficulty: 3,
        deadline: '7天',
        description: '',
      });
      setView('tasks');
      showNotice('任务发布成功，使用者端已可接收');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '任务发布失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewReport = async (reportId: number, status: 'approved' | 'rejected') => {
    setLoading(true);
    setError('');
    try {
      await api.reviewReport(reportId, status);
      setActiveReport(null);
      showNotice(status === 'approved' ? '表单已审核通过' : '表单已退回');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '审核失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: number) => {
    setLoading(true);
    setError('');
    try {
      await api.completeTask(taskId);
      showNotice('任务已确认完成，积分已结算');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '确认完成失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.shell}>
      {notice && <div style={styles.toast}>{notice}</div>}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>安全情报社区</h1>
          <p style={styles.subtitle}>管理端真实数据工作台</p>
        </div>
        <div style={styles.headerRight}>
          <button onClick={loadData} style={styles.iconButton} title="刷新真实数据">
            <RefreshCw size={16} />
          </button>
          <div style={styles.userBox}>
            <strong>{user.nickname}</strong>
            <span>{user.role === 'admin' ? '管理员' : '使用者'}</span>
          </div>
          <button onClick={onLogout} style={styles.logoutButton}>
            <LogOut size={16} /> 退出
          </button>
        </div>
      </header>

      <div style={styles.body}>
        <aside style={styles.sidebar}>
          <NavItem active={view === 'dashboard'} icon={<LayoutDashboard size={18} />} label="数据大屏" onClick={() => setView('dashboard')} />
          <NavItem active={view === 'publish'} icon={<PlusCircle size={18} />} label="任务发布" onClick={() => setView('publish')} />
          <NavItem active={view === 'tasks'} icon={<ListChecks size={18} />} label="任务列表" onClick={() => setView('tasks')} />
          <NavItem active={view === 'reports'} icon={<ClipboardCheck size={18} />} label={`表单审核${pendingReports.length ? ` (${pendingReports.length})` : ''}`} onClick={() => setView('reports')} />
          <NavItem active={view === 'users'} icon={<Users size={18} />} label="用户列表" onClick={() => setView('users')} />
        </aside>

        <main style={styles.main}>
          {error && <div style={styles.error}>{error}</div>}

          {view === 'dashboard' && (
            <div style={styles.stack}>
              <section style={styles.metricsGrid}>
                <Metric label="任务总数" value={stats.totals.tasks} />
                <Metric label="进行中" value={stats.totals.ongoing} />
                <Metric label="已完成" value={stats.totals.completed} />
                <Metric label="待审核表单" value={stats.totals.pendingReports} warn={stats.totals.pendingReports > 0} />
                <Metric label="高危任务" value={stats.totals.highRiskTasks} danger={stats.totals.highRiskTasks > 0} />
                <Metric label="使用者" value={stats.totals.users} />
              </section>

              <section style={styles.gridTwo}>
                <Panel title="近 7 日真实趋势">
                  {stats.trend.length === 0 ? (
                    <EmptyText text="暂无任务趋势数据" />
                  ) : (
                    <div style={styles.trendBars}>
                      {stats.trend.map(item => (
                        <div key={item.date} style={styles.trendItem}>
                          <div style={styles.barPair}>
                            <span style={{ ...styles.bar, height: `${(item.published / maxTrendValue) * 120}px`, background: '#00ffd5' }} />
                            <span style={{ ...styles.bar, height: `${(item.completed / maxTrendValue) * 120}px`, background: '#0088ff' }} />
                          </div>
                          <span style={styles.trendDate}>{item.date}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>

                <Panel title="任务类型分布">
                  {stats.typeDistribution.length === 0 ? (
                    <EmptyText text="暂无任务类型数据" />
                  ) : (
                    <div style={styles.list}>
                      {stats.typeDistribution.map(item => (
                        <div key={item.type} style={styles.listRow}>
                          <span>{item.type}</span>
                          <strong>{item.count}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>
              </section>

              <section style={styles.gridTwo}>
                <Panel title={`整体完成率 ${completionRate}%`}>
                  <div style={styles.progressTrack}>
                    <span style={{ ...styles.progressFill, width: `${completionRate}%` }} />
                  </div>
                  <p style={styles.muted}>完成率只由数据库中的任务状态计算。</p>
                </Panel>

                <Panel title="每个人当前在做什么">
                  {stats.userWorkload.length === 0 ? (
                    <EmptyText text="暂无注册使用者" />
                  ) : (
                    <div style={styles.list}>
                      {stats.userWorkload.map(item => (
                        <div key={item.username} style={styles.workloadRow}>
                          <div>
                            <strong>{item.nickname}</strong>
                            <p style={styles.muted}>{item.currentTasks.length ? item.currentTasks.join('、') : '当前没有进行中的任务'}</p>
                          </div>
                          <span style={styles.badge}>{item.activeTasks} 个进行中</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>
              </section>
            </div>
          )}

          {view === 'publish' && (
            <Panel title="发布真实任务">
              <form onSubmit={handlePublishTask} style={styles.form}>
                <div style={styles.formGrid}>
                  <Field label="任务标题" value={form.title} onChange={value => setForm({ ...form, title: value })} />
                  <Field label="任务类型" value={form.type} onChange={value => setForm({ ...form, type: value })} />
                  <Field label="目标系统" value={form.target} onChange={value => setForm({ ...form, target: value })} />
                  <Field label="奖励金额" type="number" value={form.reward} onChange={value => setForm({ ...form, reward: value })} />
                  <Field label="截止周期" value={form.deadline} onChange={value => setForm({ ...form, deadline: value })} />
                  <label style={styles.field}>
                    <span>难度</span>
                    <select
                      value={form.difficulty}
                      onChange={event => setForm({ ...form, difficulty: Number(event.target.value) })}
                      style={styles.input}
                    >
                      {[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value} 星</option>)}
                    </select>
                  </label>
                </div>
                <label style={styles.field}>
                  <span>任务说明</span>
                  <textarea
                    value={form.description}
                    onChange={event => setForm({ ...form, description: event.target.value })}
                    style={{ ...styles.input, minHeight: 120, resize: 'vertical' }}
                    required
                  />
                </label>
                <button type="submit" style={styles.primaryButton} disabled={loading}>
                  <Send size={16} /> 发布任务
                </button>
              </form>
            </Panel>
          )}

          {view === 'tasks' && (
            <Panel title="任务列表 / 监控">
              <TaskTable tasks={tasks} reports={reports} onOpenReport={setActiveReport} onComplete={handleCompleteTask} />
            </Panel>
          )}

          {view === 'reports' && (
            <Panel title="表单审核">
              <ReportTable reports={reports} onOpen={setActiveReport} />
            </Panel>
          )}

          {view === 'users' && (
            <Panel title="用户列表">
              <UserTable users={users.filter(item => item.role === 'user')} />
            </Panel>
          )}
        </main>
      </div>

      {activeReport && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <h3 style={styles.modalTitle}><FileCheck size={18} /> 进度表单详情</h3>
              <button style={styles.plainButton} onClick={() => setActiveReport(null)}>关闭</button>
            </div>
            <div className="modal-body">
              <div style={styles.detailGrid}>
                <Detail label="任务" value={activeReport.taskTitle} />
                <Detail label="提交人" value={`${activeReport.developerName} (@${activeReport.developer})`} />
                <Detail label="阶段" value={activeReport.stage} />
                <Detail label="提交时间" value={activeReport.submittedAt} />
                <Detail label="状态" value={reportStatusLabel(activeReport.status)} />
              </div>
              <div style={styles.reportBody}>{activeReport.reportText}</div>
            </div>
            <div className="modal-footer">
              {activeReport.status === 'pending' && (
                <>
                  <button style={styles.rejectButton} onClick={() => handleReviewReport(activeReport.id, 'rejected')} disabled={loading}>退回</button>
                  <button style={styles.primaryButton} onClick={() => handleReviewReport(activeReport.id, 'approved')} disabled={loading}>
                    <CheckCircle2 size={16} /> 审核通过
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function NavItem({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ ...styles.navItem, ...(active ? styles.navActive : {}) }}>
      {icon}<span>{label}</span>
    </button>
  );
}

function Metric({ label, value, warn, danger }: { label: string; value: number; warn?: boolean; danger?: boolean }) {
  return (
    <div className="glass-panel" style={styles.metric}>
      <span style={styles.metricLabel}>{label}</span>
      <strong style={{ ...styles.metricValue, color: danger ? '#ff4a5a' : warn ? '#ffaa00' : '#ffffff' }}>{value}</strong>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass-panel" style={styles.panel}>
      <h2 style={styles.panelTitle}>{title}</h2>
      {children}
    </section>
  );
}

function EmptyText({ text }: { text: string }) {
  return <div style={styles.empty}>{text}</div>;
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label style={styles.field}>
      <span>{label}</span>
      <input type={type} value={value} onChange={event => onChange(event.target.value)} style={styles.input} required />
    </label>
  );
}

function TaskTable({ tasks, reports, onOpenReport, onComplete }: {
  tasks: Task[];
  reports: ProgressReport[];
  onOpenReport: (report: ProgressReport) => void;
  onComplete: (taskId: number) => void;
}) {
  if (tasks.length === 0) return <EmptyText text="暂无任务，请先由管理端发布任务" />;
  return (
    <div style={styles.tableWrap}>
      <table className="sec-table">
        <thead>
          <tr><th>任务</th><th>类型</th><th>目标</th><th>状态</th><th>负责人</th><th>表单</th><th>操作</th></tr>
        </thead>
        <tbody>
          {tasks.map(task => {
            const taskReports = reports.filter(report => report.taskId === task.id);
            const latestPending = taskReports.find(report => report.status === 'pending');
            return (
              <tr key={task.id}>
                <td><strong>{task.title}</strong><div style={styles.muted}>{task.createdAt}</div></td>
                <td>{task.type}</td>
                <td>{task.target}</td>
                <td><span className={`badge ${task.status === 'completed' ? 'badge-success' : task.status === 'accepted' ? 'badge-warning' : 'badge-info'}`}>{taskStatusLabel(task.status)}</span></td>
                <td>{task.acceptedByName || '未接单'}</td>
                <td>{taskReports.length} 条</td>
                <td style={styles.actionsCell}>
                  {latestPending && <button style={styles.smallButton} onClick={() => onOpenReport(latestPending)}>审核表单</button>}
                  {task.status === 'accepted' && <button style={styles.smallButton} onClick={() => onComplete(task.id)}>确认完成</button>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ReportTable({ reports, onOpen }: { reports: ProgressReport[]; onOpen: (report: ProgressReport) => void }) {
  if (reports.length === 0) return <EmptyText text="暂无使用者提交的进度表单" />;
  return (
    <div style={styles.tableWrap}>
      <table className="sec-table">
        <thead>
          <tr><th>任务</th><th>提交人</th><th>阶段</th><th>时间</th><th>状态</th><th>操作</th></tr>
        </thead>
        <tbody>
          {reports.map(report => (
            <tr key={report.id}>
              <td>{report.taskTitle}</td>
              <td>{report.developerName}</td>
              <td>{report.stage}</td>
              <td>{report.submittedAt}</td>
              <td><span className={`badge ${report.status === 'approved' ? 'badge-success' : report.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>{reportStatusLabel(report.status)}</span></td>
              <td><button style={styles.smallButton} onClick={() => onOpen(report)}>查看</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UserTable({ users }: { users: User[] }) {
  if (users.length === 0) return <EmptyText text="暂无注册使用者" />;
  return (
    <div style={styles.tableWrap}>
      <table className="sec-table">
        <thead>
          <tr><th>用户</th><th>等级</th><th>积分</th><th>经验</th><th>完成任务</th><th>地区</th></tr>
        </thead>
        <tbody>
          {users.map(item => (
            <tr key={item.username}>
              <td><strong>{item.nickname}</strong><div style={styles.muted}>@{item.username}</div></td>
              <td>{item.level}</td>
              <td>{item.points}</td>
              <td>{item.exp}/{item.maxExp}</td>
              <td>{item.completedTasks}</td>
              <td>{item.region || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.detail}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function taskStatusLabel(status: Task['status']) {
  return status === 'published' ? '已发布' : status === 'accepted' ? '进行中' : '已完成';
}

function reportStatusLabel(status: ProgressReport['status']) {
  return status === 'pending' ? '待审核' : status === 'approved' ? '已通过' : '已退回';
}

const styles: { [key: string]: React.CSSProperties } = {
  shell: { minHeight: '100vh', background: '#02060f', color: '#e2f1ff' },
  toast: { position: 'fixed', top: 18, left: '50%', transform: 'translateX(-50%)', zIndex: 2000, background: '#061122', border: '1px solid #00ffd5', color: '#e2f1ff', padding: '10px 18px', borderRadius: 8 },
  header: { height: 66, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,149,255,0.18)', background: 'rgba(4,12,24,0.92)' },
  title: { fontSize: 18, margin: 0, color: '#fff' },
  subtitle: { margin: '4px 0 0', color: '#8ab4f8', fontSize: 12 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 14 },
  iconButton: { width: 34, height: 34, borderRadius: 6, border: '1px solid rgba(0,149,255,0.25)', background: '#061122', color: '#8ab4f8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  userBox: { display: 'flex', flexDirection: 'column', gap: 2, fontSize: 12, color: '#8ab4f8' },
  logoutButton: { display: 'inline-flex', alignItems: 'center', gap: 6, border: 0, background: 'transparent', color: '#8ab4f8', cursor: 'pointer' },
  body: { display: 'flex', minHeight: 'calc(100vh - 66px)' },
  sidebar: { width: 210, padding: '16px 10px', background: '#040d1c', borderRight: '1px solid rgba(0,149,255,0.16)', display: 'flex', flexDirection: 'column', gap: 6 },
  navItem: { display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '11px 12px', borderRadius: 6, border: 0, background: 'transparent', color: '#8ab4f8', cursor: 'pointer', fontSize: 13, textAlign: 'left' },
  navActive: { color: '#fff', background: '#0055cc', boxShadow: '0 4px 10px rgba(0,85,204,0.28)' },
  main: { flex: 1, padding: 24, overflow: 'auto' },
  stack: { display: 'flex', flexDirection: 'column', gap: 20 },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(6, minmax(120px, 1fr))', gap: 14 },
  metric: { padding: 16, minHeight: 94, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  metricLabel: { color: '#8ab4f8', fontSize: 12 },
  metricValue: { fontSize: 28 },
  gridTwo: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  panel: { padding: 20 },
  panelTitle: { fontSize: 15, color: '#fff', margin: '0 0 16px', borderLeft: '3px solid #00ffd5', paddingLeft: 10 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 7, color: '#8ab4f8', fontSize: 13 },
  input: { width: '100%', border: '1px solid rgba(0,149,255,0.25)', background: '#030a16', color: '#fff', borderRadius: 6, padding: '10px 12px', fontSize: 14 },
  primaryButton: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: 0, borderRadius: 6, background: '#00ffd5', color: '#030a16', padding: '10px 16px', fontWeight: 700, cursor: 'pointer' },
  rejectButton: { border: '1px solid rgba(255,74,90,0.35)', borderRadius: 6, background: '#1a0b12', color: '#ff4a5a', padding: '10px 16px', fontWeight: 700, cursor: 'pointer' },
  plainButton: { border: 0, background: 'transparent', color: '#8ab4f8', cursor: 'pointer' },
  smallButton: { border: '1px solid rgba(0,149,255,0.25)', borderRadius: 5, background: 'rgba(0,136,255,0.12)', color: '#8ab4f8', padding: '6px 10px', cursor: 'pointer', whiteSpace: 'nowrap' },
  actionsCell: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  tableWrap: { overflowX: 'auto' },
  error: { marginBottom: 14, padding: '10px 12px', border: '1px solid rgba(255,74,90,0.35)', background: 'rgba(255,74,90,0.08)', color: '#ff8a96', borderRadius: 6 },
  empty: { padding: 30, textAlign: 'center', color: '#4b6b94', fontSize: 13 },
  muted: { color: '#4b6b94', fontSize: 12, margin: '4px 0 0' },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  listRow: { display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,149,255,0.08)', paddingBottom: 8 },
  workloadRow: { display: 'flex', justifyContent: 'space-between', gap: 16, borderBottom: '1px solid rgba(0,149,255,0.08)', paddingBottom: 10 },
  badge: { color: '#00ffd5', fontSize: 12, whiteSpace: 'nowrap' },
  progressTrack: { height: 10, borderRadius: 999, background: '#061122', overflow: 'hidden', border: '1px solid rgba(0,149,255,0.16)' },
  progressFill: { display: 'block', height: '100%', background: 'linear-gradient(90deg, #0088ff, #00ffd5)' },
  trendBars: { height: 170, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: 10 },
  trendItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 },
  barPair: { height: 126, display: 'flex', alignItems: 'flex-end', gap: 4 },
  bar: { display: 'block', width: 10, minHeight: 2, borderRadius: '3px 3px 0 0' },
  trendDate: { color: '#4b6b94', fontSize: 11 },
  modalTitle: { color: '#fff', display: 'flex', alignItems: 'center', gap: 8, fontSize: 16 },
  detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 },
  detail: { display: 'flex', flexDirection: 'column', gap: 4, padding: 12, borderRadius: 6, background: '#040d1a', border: '1px solid rgba(0,149,255,0.12)' },
  reportBody: { whiteSpace: 'pre-wrap', lineHeight: 1.6, padding: 16, borderRadius: 6, background: '#030a16', border: '1px solid rgba(0,149,255,0.15)' },
};
