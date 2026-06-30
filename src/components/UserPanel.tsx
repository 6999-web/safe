import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bell,
  LogOut,
  Mail,
  RefreshCw,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { api, sessionStore } from '../api';
import { ProgressReport, ReportStage, Task, User } from '../types';

interface UserPanelProps {
  user: User;
  onLogout: () => void;
}

type ActiveTab = 'all' | 'available' | 'mine';

const reportStages: ReportStage[] = ['信息收集', '漏洞发现', '成功提权', '完成审计'];
const riskOptions = ['全部', '高危', '中危', '低危'];

export const UserPanel: React.FC<UserPanelProps> = ({ user, onLogout }) => {
  const [currentUser, setCurrentUser] = useState<User>(user);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reports, setReports] = useState<ProgressReport[]>([]);
  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('all');
  const [selectedType, setSelectedType] = useState('全部');
  const [selectedRisk, setSelectedRisk] = useState('全部');
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [stage, setStage] = useState<ReportStage>('信息收集');
  const [reportText, setReportText] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const showNotice = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(''), 3500);
  };

  const loadData = useCallback(async () => {
    setError('');
    try {
      const [meRes, taskRes, reportRes] = await Promise.all([
        api.me(),
        api.tasks(),
        api.reports(),
      ]);
      setCurrentUser(meRes.user);
      sessionStore.updateUser(meRes.user);
      setTasks(taskRes.tasks);
      setReports(reportRes.reports);
      setLeaderboard(
        [...taskRes.tasks]
          .filter(task => task.acceptedBy)
          .reduce<User[]>((acc, task) => {
            if (!task.acceptedBy || !task.acceptedByName) return acc;
            if (acc.some(item => item.username === task.acceptedBy)) return acc;
            acc.push({
              id: task.id,
              username: task.acceptedBy,
              nickname: task.acceptedByName,
              avatar: '',
              level: '',
              exp: 0,
              maxExp: 0,
              points: 0,
              completedTasks: 0,
              role: 'user',
            });
            return acc;
          }, []),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = window.setInterval(loadData, 5000);
    return () => window.clearInterval(interval);
  }, [loadData]);

  const taskTypes = useMemo(() => ['全部', ...Array.from(new Set(tasks.map(task => task.type)))], [tasks]);
  const myReports = reports.filter(report => report.developer === currentUser.username);

  const rankedUsers = useMemo(() => {
    const selfIncluded = leaderboard.some(item => item.username === currentUser.username)
      ? leaderboard
      : [currentUser, ...leaderboard];
    return selfIncluded
      .map(item => item.username === currentUser.username ? currentUser : item)
      .sort((a, b) => b.points - a.points || b.completedTasks - a.completedTasks)
      .slice(0, 5);
  }, [leaderboard, currentUser]);

  const filteredTasks = tasks.filter(task => {
    if (activeTab === 'available' && task.status !== 'published') return false;
    if (activeTab === 'mine' && task.acceptedBy !== currentUser.username) return false;
    if (selectedType !== '全部' && task.type !== selectedType) return false;
    if (selectedRisk === '高危' && task.difficulty < 4) return false;
    if (selectedRisk === '中危' && task.difficulty !== 3) return false;
    if (selectedRisk === '低危' && task.difficulty > 2) return false;
    return true;
  });

  const handleAccept = async (taskId: number) => {
    setLoading(true);
    setError('');
    try {
      await api.acceptTask(taskId);
      showNotice('任务接收成功，可以定期提交进度表单');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '接单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeTask) return;
    setLoading(true);
    setError('');
    try {
      await api.createReport(activeTask.id, { stage, reportText });
      setActiveTask(null);
      setStage('信息收集');
      setReportText('');
      showNotice('进度表单提交成功，管理端已可查看');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.shell}>
      {notice && <div style={styles.toast}>{notice}</div>}
      <header style={styles.header}>
        <div style={styles.brand}>
          <div style={styles.brandSeal}><ShieldCheck size={25} /></div>
          <div>
            <h1 style={styles.title}>安全情报社区</h1>
            <p style={styles.subtitle}>共建安全 · 共治共享</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <button onClick={loadData} style={styles.iconButton} title="刷新真实数据"><RefreshCw size={16} /></button>
          <button style={styles.iconButton} title="通知"><Bell size={16} /></button>
          <button style={styles.iconButton} title="消息"><Mail size={16} /></button>
          <div style={styles.userBox}>
            <strong>{currentUser.nickname}</strong>
            <span>{currentUser.level}</span>
          </div>
          <button onClick={onLogout} style={styles.logoutButton}><LogOut size={16} /> 退出</button>
        </div>
      </header>

      <main style={styles.main}>
        {error && <div style={styles.error}>{error}</div>}

        <section style={styles.pageGrid}>
          <div style={styles.contentStack}>
            <Panel title="任务大厅">
              <div style={styles.hallLayout}>
                <aside style={styles.filterPanel}>
                  <FilterGroup title="任务类型" options={taskTypes} value={selectedType} onChange={setSelectedType} />
                  <FilterGroup title="风险等级" options={riskOptions} value={selectedRisk} onChange={setSelectedRisk} />
                  <button style={styles.filterButton} onClick={() => { setSelectedType('全部'); setSelectedRisk('全部'); }}>筛选</button>
                </aside>
                <div style={styles.taskTablePanel}>
                  <div style={styles.tabs}>
                    <Tab active={activeTab === 'all'} label="全部任务" onClick={() => setActiveTab('all')} />
                    <Tab active={activeTab === 'available'} label="未接单" onClick={() => setActiveTab('available')} />
                    <Tab active={activeTab === 'mine'} label="进行中" onClick={() => setActiveTab('mine')} />
                  </div>
                  <TaskTable
                    tasks={filteredTasks}
                    currentUser={currentUser}
                    loading={loading}
                    onAccept={handleAccept}
                    onReport={setActiveTask}
                  />
                </div>
              </div>
            </Panel>

            <Panel title="我的进度表单">
              <ReportTable reports={myReports} />
            </Panel>
          </div>

          <aside style={styles.rightStack}>
            <Panel title="安全公告">
              <SideList items={[
                ['关于加强平台任务审核的通知', '2024-05-14'],
                ['平台积分规则调整说明', '2024-05-10'],
                ['五一劳动节活动获奖名单公布', '2024-05-01'],
              ]} />
            </Panel>
            <Panel title="安全资讯">
              <NewsList />
            </Panel>
            <Panel title="排行榜">
              {rankedUsers.length === 0 ? (
                <EmptyText text="暂无排行数据" />
              ) : (
                <div style={styles.leaderboard}>
                  {rankedUsers.map((item, index) => (
                    <div key={item.username} style={styles.rankRow}>
                      <span style={styles.rankNum}>{index + 1}</span>
                      <span style={item.username === currentUser.username ? styles.selfName : undefined}>{item.nickname}</span>
                      <strong>{item.points} 积分</strong>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </aside>
        </section>
      </main>

      {activeTask && (
        <div className="modal-overlay">
          <div className="modal-content">
            <form onSubmit={handleSubmitReport}>
              <div className="modal-header">
                <h3 style={styles.modalTitle}>提交进度表单</h3>
                <button type="button" style={styles.plainButton} onClick={() => setActiveTask(null)}>关闭</button>
              </div>
              <div className="modal-body">
                <p style={styles.modalTaskTitle}>{activeTask.title}</p>
                <label style={styles.field}>
                  <span>当前阶段</span>
                  <select value={stage} onChange={event => setStage(event.target.value as ReportStage)} style={styles.input}>
                    {reportStages.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <label style={styles.field}>
                  <span>进度内容</span>
                  <textarea
                    value={reportText}
                    onChange={event => setReportText(event.target.value)}
                    style={{ ...styles.input, minHeight: 150, resize: 'vertical' }}
                    placeholder="请填写本次真实进展、发现、风险说明或阶段成果。"
                    required
                  />
                </label>
              </div>
              <div className="modal-footer">
                <button type="submit" style={styles.primaryButton} disabled={loading}>
                  <Send size={16} /> 提交表单
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass-panel" style={styles.panel}>
      <div style={styles.panelHeader}>
        <h2 style={styles.panelTitle}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function FilterGroup({ title, options, value, onChange }: { title: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <div style={styles.filterGroup}>
      <h3 style={styles.filterTitle}>{title}</h3>
      {options.map(option => (
        <button
          key={option}
          style={{ ...styles.filterOption, ...(value === option ? styles.filterOptionActive : {}) }}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function Tab({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return <button onClick={onClick} style={{ ...styles.tab, ...(active ? styles.tabActive : {}) }}>{label}</button>;
}

function TaskTable({ tasks, currentUser, loading, onAccept, onReport }: {
  tasks: Task[];
  currentUser: User;
  loading: boolean;
  onAccept: (taskId: number) => void;
  onReport: (task: Task) => void;
}) {
  if (tasks.length === 0) return <EmptyText text="暂无任务，请等待管理端发布真实任务" />;

  return (
    <div style={styles.tableWrap}>
      <table className="sec-table">
        <thead>
          <tr><th>任务信息</th><th>风险等级</th><th>奖励</th><th>剩余时间</th><th>参与人数</th><th>操作</th></tr>
        </thead>
        <tbody>
          {tasks.map(task => {
            const isMine = task.acceptedBy === currentUser.username;
            return (
              <tr key={task.id}>
                <td>
                  <strong>{task.title}</strong>
                  <div style={styles.muted}>目标：{task.target}</div>
                </td>
                <td><span className={task.difficulty >= 4 ? 'badge badge-danger' : task.difficulty === 3 ? 'badge badge-warning' : 'badge badge-success'}>{riskLabel(task.difficulty)}</span></td>
                <td><strong style={{ color: '#ffaa00' }}>¥ {task.reward}</strong><div style={styles.muted}>积分 {task.points}</div></td>
                <td>{task.deadline}</td>
                <td>{task.acceptedBy ? '1/1' : '0/1'}</td>
                <td>
                  {task.status === 'published' && <button style={styles.primarySmallButton} disabled={loading} onClick={() => onAccept(task.id)}>立即接单</button>}
                  {task.status === 'accepted' && isMine && <button style={styles.smallButton} disabled={loading} onClick={() => onReport(task)}>提交进度</button>}
                  {task.status === 'accepted' && !isMine && <span style={styles.muted}>处理中</span>}
                  {task.status === 'completed' && <span style={styles.completed}>已完成</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ReportTable({ reports }: { reports: ProgressReport[] }) {
  if (reports.length === 0) return <EmptyText text="暂无已提交的进度表单" />;
  return (
    <div style={styles.tableWrap}>
      <table className="sec-table">
        <thead>
          <tr><th>任务</th><th>阶段</th><th>提交时间</th><th>状态</th></tr>
        </thead>
        <tbody>
          {reports.map(report => (
            <tr key={report.id}>
              <td>{report.taskTitle}</td>
              <td>{report.stage}</td>
              <td>{report.submittedAt}</td>
              <td><span className={`badge ${report.status === 'approved' ? 'badge-success' : report.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>{reportStatusLabel(report.status)}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SideList({ items }: { items: Array<[string, string]> }) {
  return (
    <div style={styles.sideList}>
      {items.map(([title, time]) => (
        <div key={title} style={styles.sideListRow}>
          <span>{title}</span>
          <em>{time}</em>
        </div>
      ))}
    </div>
  );
}

function NewsList() {
  const news = [
    ['2024年网络安全威胁报告发布', '1256'],
    ['Apache Log4j漏洞分析与防护', '892'],
    ['实战：SQL注入漏洞挖掘技巧', '645'],
  ];
  return (
    <div style={styles.newsList}>
      {news.map(([title, count], index) => (
        <div key={title} style={styles.newsRow}>
          <div style={styles.newsThumb}>{index + 1}</div>
          <div>
            <strong>{title}</strong>
            <p style={styles.muted}>浏览 {count}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyText({ text }: { text: string }) {
  return <div style={styles.empty}>{text}</div>;
}

function riskLabel(difficulty: number) {
  if (difficulty >= 4) return '高危';
  if (difficulty === 3) return '中危';
  return '低危';
}

function reportStatusLabel(status: ProgressReport['status']) {
  return status === 'pending' ? '待审核' : status === 'approved' ? '已通过' : '已退回';
}

const styles: { [key: string]: React.CSSProperties } = {
  shell: { minHeight: '100vh', background: '#020814', color: '#e2f1ff' },
  toast: { position: 'fixed', top: 18, left: '50%', transform: 'translateX(-50%)', zIndex: 2000, background: '#061122', border: '1px solid #00ffd5', color: '#e2f1ff', padding: '10px 18px', borderRadius: 8 },
  header: { height: 72, padding: '0 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 22, borderBottom: '1px solid rgba(0,149,255,0.16)', background: 'rgba(2,8,20,0.96)' },
  brand: { display: 'flex', alignItems: 'center', gap: 12 },
  brandSeal: { width: 46, height: 46, borderRadius: '50%', border: '1px solid rgba(140,190,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dceeff', boxShadow: '0 0 20px rgba(0,136,255,0.25)' },
  title: { fontSize: 20, margin: 0, color: '#fff' },
  subtitle: { margin: '3px 0 0', color: '#c9dfff', fontSize: 12, fontWeight: 700 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 10 },
  iconButton: { width: 34, height: 34, borderRadius: 6, border: '1px solid rgba(0,149,255,0.2)', background: '#061122', color: '#b6ceee', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  userBox: { display: 'flex', flexDirection: 'column', gap: 2, fontSize: 12, color: '#8ab4f8', marginLeft: 6 },
  logoutButton: { display: 'inline-flex', alignItems: 'center', gap: 6, border: 0, background: 'transparent', color: '#8ab4f8', cursor: 'pointer' },
  main: { maxWidth: 1480, margin: '0 auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 18 },
  pageGrid: { display: 'grid', gridTemplateColumns: '1fr 292px', gap: 16 },
  contentStack: { display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 },
  rightStack: { display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 },
  panel: { padding: 18, borderRadius: 8 },
  panelHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  panelTitle: { fontSize: 18, color: '#fff', margin: 0 },
  hallLayout: { display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 },
  filterPanel: { borderRadius: 7, background: 'rgba(4,13,28,0.72)', border: '1px solid rgba(0,149,255,0.12)', padding: 14 },
  filterGroup: { marginBottom: 18 },
  filterTitle: { color: '#fff', fontSize: 13, margin: '0 0 9px' },
  filterOption: { display: 'block', width: '100%', border: 0, borderRadius: 4, background: 'transparent', color: '#91a9c8', padding: '7px 8px', textAlign: 'left', cursor: 'pointer' },
  filterOptionActive: { background: 'rgba(0,102,220,0.35)', color: '#fff' },
  filterButton: { width: '100%', border: 0, borderRadius: 5, background: '#0b63e5', color: '#fff', padding: '10px 0', cursor: 'pointer' },
  taskTablePanel: { minWidth: 0 },
  tabs: { display: 'flex', gap: 22, borderBottom: '1px solid rgba(0,149,255,0.1)', marginBottom: 6 },
  tab: { border: 0, background: 'transparent', color: '#8ab4f8', padding: '0 0 13px', cursor: 'pointer', fontSize: 14 },
  tabActive: { color: '#fff', borderBottom: '2px solid #00aaff' },
  primarySmallButton: { border: 0, borderRadius: 5, background: 'linear-gradient(135deg, #126bff, #0a43c8)', color: '#fff', padding: '7px 12px', cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap' },
  smallButton: { border: '1px solid rgba(0,149,255,0.25)', borderRadius: 5, background: 'rgba(0,136,255,0.12)', color: '#8ab4f8', padding: '7px 10px', cursor: 'pointer', whiteSpace: 'nowrap' },
  completed: { color: '#00ffd5', fontSize: 12 },
  tableWrap: { overflowX: 'auto' },
  error: { padding: '10px 12px', border: '1px solid rgba(255,74,90,0.35)', background: 'rgba(255,74,90,0.08)', color: '#ff8a96', borderRadius: 6 },
  empty: { padding: 30, textAlign: 'center', color: '#4b6b94', fontSize: 13 },
  muted: { color: '#6d85a6', fontSize: 12, margin: '4px 0 0' },
  sideList: { display: 'flex', flexDirection: 'column', gap: 16 },
  sideListRow: { display: 'flex', justifyContent: 'space-between', gap: 12, color: '#c8d7ee', fontSize: 13 },
  newsList: { display: 'flex', flexDirection: 'column', gap: 12 },
  newsRow: { display: 'grid', gridTemplateColumns: '48px 1fr', gap: 10, alignItems: 'center' },
  newsThumb: { width: 48, height: 42, borderRadius: 5, border: '1px solid rgba(0,149,255,0.25)', background: 'linear-gradient(135deg, #123c78, #0b1429)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#39c9ff', fontWeight: 800 },
  leaderboard: { display: 'flex', flexDirection: 'column', gap: 12 },
  rankRow: { display: 'grid', gridTemplateColumns: '26px 1fr auto', gap: 10, alignItems: 'center', color: '#d8e8ff' },
  rankNum: { width: 22, height: 22, borderRadius: '50%', background: '#15304f', color: '#a9d4ff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 },
  selfName: { color: '#00ffd5', fontWeight: 700 },
  modalTitle: { color: '#fff', fontSize: 16 },
  modalTaskTitle: { color: '#00ffd5', marginBottom: 16, fontWeight: 700 },
  field: { display: 'flex', flexDirection: 'column', gap: 7, color: '#8ab4f8', fontSize: 13, marginBottom: 14 },
  input: { border: '1px solid rgba(0,149,255,0.25)', background: '#030a16', color: '#fff', borderRadius: 6, padding: '10px 12px', fontSize: 14 },
  plainButton: { border: 0, background: 'transparent', color: '#8ab4f8', cursor: 'pointer' },
  primaryButton: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: 0, borderRadius: 6, background: '#00ffd5', color: '#030a16', padding: '10px 16px', fontWeight: 700, cursor: 'pointer' },
};
