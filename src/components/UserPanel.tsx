import React, { useState, useEffect } from 'react';
import { 
  Bell, Mail, ClipboardList, Gift, Wrench, Star, 
  ChevronRight, LogOut, Send
} from 'lucide-react';
import { db, announcements } from '../data/db';
import { Task, User, ProgressReport } from '../types';

interface UserPanelProps {
  user: User;
  onLogout: () => void;
}

export const UserPanel: React.FC<UserPanelProps> = ({ user, onLogout }) => {
  const [currentUser, setCurrentUser] = useState<User>(user);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reports, setReports] = useState<ProgressReport[]>([]);
  
  // Navigation & filters
  const [activeTab, setActiveTab] = useState<'all' | 'unaccepted' | 'ongoing'>('all');
  const [selectedType, setSelectedType] = useState<string>('全部');
  const [selectedLevel, setSelectedLevel] = useState<string>('全部');
  const [minReward, setMinReward] = useState<string>('');
  const [maxReward, setMaxReward] = useState<string>('');
  
  // Modals
  const [activeReportTask, setActiveReportTask] = useState<Task | null>(null);
  const [reportStage, setReportStage] = useState<'信息收集' | '漏洞发现' | '成功提权' | '完成审计'>('信息收集');
  const [reportText, setReportText] = useState('');
  const [showNotification, setShowNotification] = useState<string>('');

  // Load database
  const loadData = () => {
    setTasks(db.getTasks());
    setReports(db.getReports());
    // Refresh user info
    const users = db.getUsers();
    const updatedUser = users.find(u => u.username === currentUser.username);
    if (updatedUser) {
      setCurrentUser(updatedUser);
    }
  };

  useEffect(() => {
    loadData();
    
    // Set up a listener for storage events to support multi-window synchronization!
    const handleStorageChange = () => {
      loadData();
    };
    window.addEventListener('storage', handleStorageChange);
    
    // Also poll every 3 seconds to ensure real-time interaction on the same page/window
    const interval = setInterval(loadData, 3000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Accept task action
  const handleAcceptTask = (taskId: string) => {
    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: 'accepted' as const,
          acceptedBy: currentUser.username,
          acceptedByName: currentUser.nickname
        };
      }
      return t;
    });
    
    db.saveTasks(updatedTasks);
    setTasks(updatedTasks);
    triggerNotice('任务接受成功！请前往“进行中”任务查看并提交渗透报告。');
  };

  // Submit progress report
  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReportTask) return;

    const newReport: ProgressReport = {
      id: `report-${Date.now()}`,
      taskId: activeReportTask.id,
      taskTitle: activeReportTask.title,
      developer: currentUser.username,
      developerName: currentUser.nickname,
      stage: reportStage,
      reportText: reportText,
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'pending'
    };

    const updatedReports = [newReport, ...reports];
    db.saveReports(updatedReports);
    setReports(updatedReports);

    // Update task status
    const updatedTasks = tasks.map(t => {
      if (t.id === activeReportTask.id) {
        return {
          ...t,
          status: 'submitted' as const,
          progressCount: t.progressCount + 1
        };
      }
      return t;
    });
    db.saveTasks(updatedTasks);
    setTasks(updatedTasks);

    // Reset modal
    setActiveReportTask(null);
    setReportText('');
    setReportStage('信息收集');
    triggerNotice('报告提交成功！等待管理员进行审核评分。');
  };

  const triggerNotice = (msg: string) => {
    setShowNotification(msg);
    setTimeout(() => {
      setShowNotification('');
    }, 4000);
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    // Basic views (All, Unaccepted, Ongoing/Mine)
    if (activeTab === 'unaccepted' && t.status !== 'published') return false;
    if (activeTab === 'ongoing' && (t.acceptedBy !== currentUser.username || t.status === 'completed')) return false;

    // Filter by type
    if (selectedType !== '全部' && t.type !== selectedType) return false;

    // Filter by risk level (difficulty maps to stars: 4-5 high, 3 medium, 1-2 low)
    if (selectedLevel !== '全部') {
      if (selectedLevel === '高危' && t.difficulty < 4) return false;
      if (selectedLevel === '中危' && t.difficulty !== 3) return false;
      if (selectedLevel === '低危' && t.difficulty > 2) return false;
    }

    // Filter by reward range
    if (minReward && t.reward < parseFloat(minReward)) return false;
    if (maxReward && t.reward > parseFloat(maxReward)) return false;

    return true;
  });

  // Dynamic ranking based on users in DB
  const sortedLeaderboard = db.getUsers()
    .filter(u => u.role === 'user')
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);

  // Recommended tasks (take 4 published tasks)
  const recommendedTasks = tasks.filter(t => t.status === 'published').slice(0, 4);

  return (
    <div style={styles.userDashboard}>
      {/* Real-time notification toast */}
      {showNotification && (
        <div style={styles.toast}>
          <div style={styles.toastContent}>
            <span>🛡️ 系统提示: {showNotification}</span>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logoBadge}>🛡️</div>
          <div>
            <h1 style={styles.logoTitle}>安全情报社区</h1>
            <p style={styles.logoSubtitle}>共建安全 · 共治共享</p>
          </div>
        </div>

        <nav style={styles.navMenu}>
          <span style={{ ...styles.navLink, ...styles.navLinkActive }}>首页</span>
          <span style={styles.navLink}>任务大厅</span>
          <span style={styles.navLink}>漏洞情报</span>
          <span style={styles.navLink}>知识库</span>
          <span style={styles.navLink}>社区</span>
          <span style={styles.navLink}>排行榜</span>
          <span style={styles.navLink}>活动中心</span>
        </nav>

        <div style={styles.headerRight}>
          <div style={styles.iconBadgeBtn}>
            <Bell size={18} />
            <span style={styles.iconDot}></span>
          </div>
          <div style={styles.iconBadgeBtn}>
            <Mail size={18} />
            <span style={styles.iconDot}></span>
          </div>
          
          <div style={styles.userProfile}>
            <img src={currentUser.avatar} alt="头像" style={styles.userAvatar} />
            <div style={styles.userInfo}>
              <span style={styles.userName}>{currentUser.nickname}</span>
              <span style={styles.userLevel}>{currentUser.level}</span>
            </div>
          </div>
          
          <button onClick={onLogout} style={styles.logoutBtn} title="退出登录">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Layout Grid */}
      <div style={styles.mainGrid}>
        
        {/* Left Columns (8 cols out of 12) */}
        <div style={styles.leftCol}>
          
          {/* Hero Banner + Quick Dashboard row */}
          <div style={styles.heroRow}>
            {/* Banner block */}
            <div style={styles.heroBanner}>
              <div style={styles.bannerText}>
                <h2 style={styles.bannerTitle}>共建网络安全 共享安全情报</h2>
                <p style={styles.bannerSub}>发现漏洞 · 提交情报 · 获取奖励 · 提升技能</p>
                <button style={styles.bannerBtn}>
                  了解更多 <ChevronRight size={14} />
                </button>
              </div>
              <div style={styles.bannerGlowShield}>
                <div className="pulsing-shield" style={styles.shieldVisual}>🔒</div>
              </div>
            </div>

            {/* User Profile Metrics card */}
            <div className="glass-panel" style={styles.userCard}>
              <div style={styles.userCardHeader}>
                <img src={currentUser.avatar} alt="Avatar" style={styles.cardAvatar} />
                <div style={styles.cardMeta}>
                  <h4 style={styles.cardName}>{currentUser.nickname}</h4>
                  <span style={styles.cardLevel}>{currentUser.level}</span>
                  <div style={styles.expBarWrapper}>
                    <div style={{ ...styles.expBarFill, width: `${(currentUser.exp / currentUser.maxExp) * 100}%` }}></div>
                    <span style={styles.expText}>{currentUser.exp} / {currentUser.maxExp}</span>
                  </div>
                </div>
              </div>

              <div style={styles.cardMetrics}>
                <div style={styles.metricItem}>
                  <span style={styles.metricVal}>{currentUser.points}</span>
                  <span style={styles.metricLabel}>可用积分</span>
                </div>
                <div style={styles.metricItem}>
                  <span style={styles.metricVal}>{currentUser.completedTasks}</span>
                  <span style={styles.metricLabel}>已完成任务</span>
                </div>
                <div style={styles.metricItem}>
                  <span style={styles.metricVal}>{currentUser.rank}</span>
                  <span style={styles.metricLabel}>排名</span>
                </div>
              </div>

              <div style={styles.quickGrid}>
                <div className="quick-action" style={styles.quickAction}>
                  <ClipboardList size={18} style={styles.quickIcon} />
                  <span>任务记录</span>
                </div>
                <div className="quick-action" style={styles.quickAction}>
                  <Star size={18} style={styles.quickIcon} />
                  <span>我的收藏</span>
                </div>
                <div className="quick-action" style={styles.quickAction}>
                  <Gift size={18} style={styles.quickIcon} />
                  <span>积分商城</span>
                </div>
                <div className="quick-action" style={styles.quickAction}>
                  <Wrench size={18} style={styles.quickIcon} />
                  <span>安全工具</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Tasks (推荐任务) */}
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>推荐任务</h3>
              <span style={styles.moreLink}>查看更多 &gt;</span>
            </div>
            
            <div style={styles.recommendedGrid}>
              {recommendedTasks.length === 0 ? (
                <div className="glass-panel" style={styles.noTasks}>
                  暂无空闲的推荐任务，请在下方大厅查看其他状态任务。
                </div>
              ) : (
                recommendedTasks.map(t => (
                  <div className="glass-panel" key={t.id} style={styles.recommendCard}>
                    <div style={styles.recCardHeader}>
                      <span style={{
                        ...styles.recBadge,
                        ...(t.difficulty >= 4 ? styles.badgeDanger : styles.badgeWarning)
                      }}>
                        {t.difficulty >= 4 ? '高危' : '中危'}
                      </span>
                      <h4 style={styles.recCardTitle} title={t.title}>{t.title}</h4>
                      <Star size={16} style={styles.favStar} />
                    </div>
                    
                    <span style={styles.targetLabel}>目标: {t.target}</span>
                    <p style={styles.recDesc}>{t.description.substring(0, 32)}...</p>
                    
                    <div style={styles.recRewards}>
                      <span style={styles.rewardVal}>¥ {t.reward}</span>
                      <span style={styles.pointsVal}>积分 {t.points}</span>
                    </div>

                    <div style={styles.recFooter}>
                      <span style={styles.recTime}>剩 {t.deadline}</span>
                      <button 
                        onClick={() => handleAcceptTask(t.id)} 
                        style={styles.recBtn}
                      >
                        立即接单
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Task Hall (任务大厅) */}
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>任务大厅</h3>
            </div>

            <div style={styles.hallContainer}>
              {/* Sidebar Filters */}
              <div className="glass-panel" style={styles.filterSidebar}>
                <div style={styles.filterGroup}>
                  <h4 style={styles.filterHeading}>任务类型</h4>
                  {['全部', '安全审计', '渗透测试', '漏洞挖掘', '应急响应', '安全加固'].map(type => (
                    <div 
                      key={type} 
                      onClick={() => setSelectedType(type)}
                      style={{
                        ...styles.filterItem,
                        ...(selectedType === type ? styles.filterItemActive : {})
                      }}
                    >
                      {type}
                    </div>
                  ))}
                </div>

                <div style={styles.filterGroup}>
                  <h4 style={styles.filterHeading}>风险等级</h4>
                  {['全部', '高危', '中危', '低危'].map(lvl => (
                    <div 
                      key={lvl} 
                      onClick={() => setSelectedLevel(lvl)}
                      style={{
                        ...styles.filterItem,
                        ...(selectedLevel === lvl ? styles.filterItemActive : {})
                      }}
                    >
                      {lvl}
                    </div>
                  ))}
                </div>

                <div style={styles.filterGroup}>
                  <h4 style={styles.filterHeading}>奖励范围</h4>
                  <div style={styles.rewardInputs}>
                    <input 
                      type="number" 
                      placeholder="最小值" 
                      value={minReward} 
                      onChange={e => setMinReward(e.target.value)}
                      style={styles.filterInput}
                    />
                    <span style={{ color: '#4b6b94' }}>-</span>
                    <input 
                      type="number" 
                      placeholder="最大值" 
                      value={maxReward} 
                      onChange={e => setMaxReward(e.target.value)}
                      style={styles.filterInput}
                    />
                  </div>
                  <button 
                    onClick={() => { setMinReward(''); setMaxReward(''); setSelectedType('全部'); setSelectedLevel('全部'); }}
                    style={styles.resetFiltersBtn}
                  >
                    重置筛选
                  </button>
                </div>
              </div>

              {/* Main Task List Table */}
              <div className="glass-panel" style={styles.taskTableWrapper}>
                {/* Tabs */}
                <div style={styles.tableTabs}>
                  <div style={styles.tabsLeft}>
                    <button 
                      onClick={() => setActiveTab('all')}
                      style={{ ...styles.tableTab, ...(activeTab === 'all' ? styles.tableTabActive : {}) }}
                    >
                      全部任务
                    </button>
                    <button 
                      onClick={() => setActiveTab('unaccepted')}
                      style={{ ...styles.tableTab, ...(activeTab === 'unaccepted' ? styles.tableTabActive : {}) }}
                    >
                      未接单
                    </button>
                    <button 
                      onClick={() => setActiveTab('ongoing')}
                      style={{ ...styles.tableTab, ...(activeTab === 'ongoing' ? styles.tableTabActive : {}) }}
                    >
                      进行中
                    </button>
                  </div>
                  <span style={styles.sortDropdown}>最新发布 ▾</span>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table className="sec-table">
                    <thead>
                      <tr>
                        <th>任务信息</th>
                        <th>风险等级</th>
                        <th>奖励</th>
                        <th>剩余时间</th>
                        <th>参与状态</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#4b6b94' }}>
                            没有找到符合筛选条件的任务
                          </td>
                        </tr>
                      ) : (
                        filteredTasks.map(t => {
                          let actionButton = null;
                          let statusLabel = '0/3';
                          
                          if (t.status === 'published') {
                            actionButton = (
                              <button 
                                onClick={() => handleAcceptTask(t.id)} 
                                style={styles.tableBtnAccept}
                              >
                                立即接单
                              </button>
                            );
                            statusLabel = '0/3';
                          } else if (t.status === 'accepted') {
                            if (t.acceptedBy === currentUser.username) {
                              actionButton = (
                                <button 
                                  onClick={() => setActiveReportTask(t)} 
                                  style={styles.tableBtnReport}
                                >
                                  提交进度
                                </button>
                              );
                              statusLabel = '已接单 (我)';
                            } else {
                              actionButton = <span style={styles.statusDisabled}>他人已接</span>;
                              statusLabel = `1/3 (${t.acceptedByName})`;
                            }
                          } else if (t.status === 'submitted') {
                            if (t.acceptedBy === currentUser.username) {
                              actionButton = <span style={styles.statusPending}>审核中</span>;
                              statusLabel = '已提交报告';
                            } else {
                              actionButton = <span style={styles.statusDisabled}>他人已接</span>;
                              statusLabel = `1/3 (${t.acceptedByName})`;
                            }
                          } else if (t.status === 'completed') {
                            actionButton = <span style={styles.statusCompleted}>已完成</span>;
                            statusLabel = `已完成 (${t.acceptedByName})`;
                          }

                          return (
                            <tr key={t.id}>
                              <td>
                                <div style={styles.taskCellName}>{t.title}</div>
                                <div style={styles.taskCellTarget}>目标: {t.target}</div>
                              </td>
                              <td>
                                <span className={
                                  t.difficulty >= 4 
                                    ? 'badge badge-danger' 
                                    : t.difficulty === 3 
                                      ? 'badge badge-warning' 
                                      : 'badge badge-success'
                                }>
                                  {t.difficulty >= 4 ? '高危' : t.difficulty === 3 ? '中危' : '低危'}
                                </span>
                              </td>
                              <td>
                                <div style={styles.tableRewardText}>¥ {t.reward}</div>
                                <div style={styles.tablePointsText}>积分 {t.points}</div>
                              </td>
                              <td style={{ color: '#a0aec0', fontSize: '13px' }}>{t.deadline}</td>
                              <td style={{ color: '#8ab4f8', fontSize: '13px' }}>{statusLabel}</td>
                              <td>{actionButton}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Columns (4 cols out of 12) */}
        <div style={styles.rightCol}>
          
          {/* Security announcements */}
          <div className="glass-panel" style={styles.rightCardPanel}>
            <div style={styles.rightCardHeader}>
              <h4 style={styles.rightCardTitle}>安全公告</h4>
              <span style={styles.rightCardMore}>查看更多 &gt;</span>
            </div>
            <div style={styles.announceList}>
              {announcements.map(ann => (
                <div key={ann.id} style={styles.announceItem}>
                  <span style={styles.announceDot}></span>
                  <span style={styles.announceText} title={ann.title}>{ann.title}</span>
                  <span style={styles.announceDate}>{ann.date.substring(5)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Security news */}
          <div className="glass-panel" style={styles.rightCardPanel}>
            <div style={styles.rightCardHeader}>
              <h4 style={styles.rightCardTitle}>安全资讯</h4>
              <span style={styles.rightCardMore}>查看更多 &gt;</span>
            </div>
            <div style={styles.newsList}>
              <div style={styles.newsItem}>
                <div style={styles.newsThumbWrapper}>
                  <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=100&h=60&q=80" alt="News" style={styles.newsThumb} />
                </div>
                <div style={styles.newsMeta}>
                  <h5 style={styles.newsTitle}>2026年网络安全威胁报告发布</h5>
                  <span style={styles.newsInfo}>👁️ 1256  •  2小时前</span>
                </div>
              </div>
              <div style={styles.newsItem}>
                <div style={styles.newsThumbWrapper}>
                  <img src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=100&h=60&q=80" alt="News" style={styles.newsThumb} />
                </div>
                <div style={styles.newsMeta}>
                  <h5 style={styles.newsTitle}>Apache Log4j最新漏洞分析与防护</h5>
                  <span style={styles.newsInfo}>👁️ 892  •  5小时前</span>
                </div>
              </div>
              <div style={styles.newsItem}>
                <div style={styles.newsThumbWrapper}>
                  <img src="https://images.unsplash.com/photo-1510511459019-5dda7724fd87?auto=format&fit=crop&w=100&h=60&q=80" alt="News" style={styles.newsThumb} />
                </div>
                <div style={styles.newsMeta}>
                  <h5 style={styles.newsTitle}>实战：SQL注入漏洞深度挖掘与防范</h5>
                  <span style={styles.newsInfo}>👁️ 645  •  1天前</span>
                </div>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="glass-panel" style={styles.rightCardPanel}>
            <div style={styles.rightCardHeader}>
              <h4 style={styles.rightCardTitle}>排行榜</h4>
              <span style={styles.rightCardMore}>查看更多 &gt;</span>
            </div>
            
            {/* Leaderboard Tabs */}
            <div style={styles.leaderboardTabs}>
              <span style={{ ...styles.leaderboardTab, ...styles.leaderboardTabActive }}>本周榜</span>
              <span style={styles.leaderboardTab}>本月榜</span>
              <span style={styles.leaderboardTab}>总榜</span>
            </div>

            {/* Leaderboard List */}
            <div style={styles.leaderboardList}>
              {sortedLeaderboard.map((item, idx) => (
                <div key={item.username} style={styles.leaderboardItem}>
                  <div style={styles.leaderLeft}>
                    <span style={{
                      ...styles.rankNum,
                      ...(idx === 0 ? styles.rank1 : idx === 1 ? styles.rank2 : idx === 2 ? styles.rank3 : {})
                    }}>
                      {idx + 1}
                    </span>
                    <img src={item.avatar} alt="Avatar" style={styles.leaderAvatar} />
                    <span style={{
                      ...styles.leaderName,
                      ...(item.username === currentUser.username ? styles.leaderSelf : {})
                    }}>
                      {item.nickname}
                    </span>
                  </div>
                  <span style={styles.leaderPoints}>{item.points} 积分</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Features Row */}
      <footer style={styles.footer}>
        <div style={styles.footerFeatures}>
          <div style={styles.featureBox}>
            <div style={styles.featureIcon}>🛡️</div>
            <div>
              <h5 style={styles.featureTitle}>安全可靠</h5>
              <p style={styles.featureDesc}>多重审计与技术加密机制</p>
            </div>
          </div>
          <div style={styles.featureBox}>
            <div style={styles.featureIcon}>💰</div>
            <div>
              <h5 style={styles.featureTitle}>奖励丰厚</h5>
              <p style={styles.featureDesc}>现金大奖与社区高额积分</p>
            </div>
          </div>
          <div style={styles.featureBox}>
            <div style={styles.featureIcon}>💬</div>
            <div>
              <h5 style={styles.featureTitle}>技术交流</h5>
              <p style={styles.featureDesc}>与业内白帽大神分享知识</p>
            </div>
          </div>
          <div style={styles.featureBox}>
            <div style={styles.featureIcon}>📈</div>
            <div>
              <h5 style={styles.featureTitle}>共同成长</h5>
              <p style={styles.featureDesc}>不断挑战实战并提升技能</p>
            </div>
          </div>
        </div>

        <div style={styles.copyright}>
          <p>© 2026 安全情报社区 | 桂ICP备20260001号-1 | 桂公网安备 45010302000123号</p>
        </div>
      </footer>

      {/* Submit Report Modal */}
      {activeReportTask && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={18} style={{ color: '#00ffd5' }} />
                提交渗透进度报告
              </h3>
              <button 
                onClick={() => setActiveReportTask(null)} 
                style={styles.closeModalBtn}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmitReport}>
              <div className="modal-body">
                <div style={{ marginBottom: '16px', background: '#0a1d35', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #0088ff' }}>
                  <div style={{ fontSize: '12px', color: '#8ab4f8' }}>当前接单任务</div>
                  <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'white', marginTop: '4px' }}>{activeReportTask.title}</div>
                  <div style={{ fontSize: '13px', color: '#4b6b94', marginTop: '2px' }}>测试目标: {activeReportTask.target}</div>
                </div>

                <div className="form-group">
                  <label className="form-label">渗透测试所处阶段</label>
                  <select 
                    value={reportStage} 
                    onChange={e => setReportStage(e.target.value as any)}
                    className="form-control"
                    style={{ background: '#061122', border: '1px solid rgba(0,136,255,0.3)', color: 'white' }}
                  >
                    <option value="信息收集">阶段一：信息收集与端口扫描</option>
                    <option value="漏洞发现">阶段二：漏洞验证与PoC测试</option>
                    <option value="成功提权">阶段三：成功突破或获取Webshell</option>
                    <option value="完成审计">阶段四：完成渗透并输出审计报告</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">渗透详情及步骤描述</label>
                  <textarea 
                    rows={6}
                    placeholder="请详细描述您的测试步骤、发现的漏洞详情（如注入点、敏感文件、越权接口等），以及您目前拿到的系统权限地步。"
                    value={reportText}
                    onChange={e => setReportText(e.target.value)}
                    className="form-control"
                    style={{ background: '#061122', border: '1px solid rgba(0,136,255,0.3)', color: 'white', resize: 'vertical' }}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  onClick={() => setActiveReportTask(null)} 
                  style={styles.modalCancelBtn}
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  style={styles.modalSubmitBtn}
                >
                  确认提交报告
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  userDashboard: {
    backgroundColor: '#02060f',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    width: '100vw',
    overflowX: 'hidden',
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
    padding: '12px 30px',
    backgroundColor: 'rgba(4, 12, 24, 0.85)',
    borderBottom: '1px solid rgba(0, 149, 255, 0.15)',
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
    fontSize: '28px',
  },
  logoTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: '0.5px',
  },
  logoSubtitle: {
    fontSize: '11px',
    color: '#8ab4f8',
    letterSpacing: '1px',
    marginTop: '1px',
  },
  navMenu: {
    display: 'flex',
    gap: '24px',
  },
  navLink: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#8ab4f8',
    cursor: 'pointer',
    padding: '6px 12px',
    borderRadius: '4px',
    transition: 'all 0.25s ease',
  },
  navLinkActive: {
    color: '#ffffff',
    backgroundColor: 'rgba(0, 136, 255, 0.2)',
    border: '1px solid rgba(0, 136, 255, 0.3)',
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
    top: '4px',
    right: '4px',
    width: '6px',
    height: '6px',
    backgroundColor: '#ff4a5a',
    borderRadius: '50%',
  },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    paddingLeft: '16px',
    borderLeft: '1px solid rgba(0, 149, 255, 0.15)',
  },
  userAvatar: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    border: '2px solid #0088ff',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  userName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#ffffff',
  },
  userLevel: {
    fontSize: '11px',
    color: '#00ffd5',
    fontWeight: '500',
    marginTop: '1px',
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
  mainGrid: {
    maxWidth: '1440px',
    width: '100%',
    margin: '0 auto',
    padding: '24px 30px',
    display: 'grid',
    gridTemplateColumns: '8fr 4fr',
    gap: '24px',
    flex: 1,
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  heroRow: {
    display: 'grid',
    gridTemplateColumns: '6.5fr 5.5fr',
    gap: '20px',
  },
  heroBanner: {
    background: 'linear-gradient(135deg, #021a3a 0%, #030c1d 100%)',
    border: '1px solid rgba(0, 136, 255, 0.25)',
    boxShadow: 'inset 0 0 15px rgba(0, 136, 255, 0.1)',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  bannerText: {
    zIndex: 2,
    maxWidth: '65%',
  },
  bannerTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: '1.3',
    textShadow: '0 0 10px rgba(0, 136, 255, 0.3)',
  },
  bannerSub: {
    fontSize: '13px',
    color: '#8ab4f8',
    margin: '10px 0 18px 0',
    lineHeight: '1.4',
  },
  bannerBtn: {
    background: '#0055cc',
    border: '1px solid #00ffd5',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s',
  },
  bannerGlowShield: {
    zIndex: 1,
    position: 'absolute',
    right: '10px',
    bottom: '-10px',
    opacity: 0.6,
  },
  shieldVisual: {
    fontSize: '120px',
    filter: 'drop-shadow(0 0 25px rgba(0, 136, 255, 0.4))',
  },
  userCard: {
    padding: '20px',
  },
  userCardHeader: {
    display: 'flex',
    gap: '14px',
    alignItems: 'center',
  },
  cardAvatar: {
    width: '54px',
    height: '54px',
    borderRadius: '50%',
    border: '2px solid #00ffd5',
    boxShadow: '0 0 10px rgba(0, 255, 213, 0.3)',
  },
  cardMeta: {
    flex: 1,
  },
  cardName: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'white',
  },
  cardLevel: {
    fontSize: '11px',
    color: '#8ab4f8',
  },
  expBarWrapper: {
    height: '6px',
    backgroundColor: '#0a1d35',
    borderRadius: '3px',
    marginTop: '6px',
    position: 'relative',
    overflow: 'hidden',
  },
  expBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #0088ff, #00ffd5)',
    borderRadius: '3px',
  },
  expText: {
    position: 'absolute',
    right: '0',
    top: '-12px',
    fontSize: '9px',
    color: '#4b6b94',
  },
  cardMetrics: {
    display: 'flex',
    justifyContent: 'space-around',
    borderTop: '1px solid rgba(0, 149, 255, 0.1)',
    borderBottom: '1px solid rgba(0, 149, 255, 0.1)',
    padding: '12px 0',
    margin: '16px 0 12px 0',
  },
  metricItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  metricVal: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#ffffff',
  },
  metricLabel: {
    fontSize: '11px',
    color: '#8ab4f8',
    marginTop: '3px',
  },
  quickGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
  },
  quickAction: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 4px',
    borderRadius: '6px',
    background: 'rgba(0, 136, 255, 0.05)',
    border: '1px solid rgba(0, 136, 255, 0.1)',
    cursor: 'pointer',
    fontSize: '10px',
    color: '#8ab4f8',
    transition: 'all 0.2s',
  },
  quickIcon: {
    color: '#00ffd5',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    borderLeft: '3px solid #00ffd5',
    paddingLeft: '10px',
  },
  moreLink: {
    fontSize: '12px',
    color: '#8ab4f8',
    cursor: 'pointer',
  },
  recommendedGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '14px',
  },
  recommendCard: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '200px',
  },
  recCardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '8px',
    marginBottom: '10px',
  },
  recBadge: {
    fontSize: '10px',
    padding: '2px 4px',
    borderRadius: '3px',
    fontWeight: '600',
  },
  badgeDanger: {
    backgroundColor: 'rgba(255, 74, 90, 0.15)',
    color: '#ff4a5a',
    border: '1px solid rgba(255, 74, 90, 0.3)',
  },
  badgeWarning: {
    backgroundColor: 'rgba(255, 170, 0, 0.15)',
    color: '#ffaa00',
    border: '1px solid rgba(255, 170, 0, 0.3)',
  },
  recCardTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  favStar: {
    color: '#4b6b94',
    cursor: 'pointer',
  },
  targetLabel: {
    fontSize: '11px',
    color: '#00ffd5',
    backgroundColor: 'rgba(0, 255, 213, 0.05)',
    border: '1px solid rgba(0, 255, 213, 0.15)',
    padding: '3px 8px',
    borderRadius: '4px',
    width: 'fit-content',
    marginBottom: '10px',
  },
  recDesc: {
    fontSize: '12px',
    color: '#8ab4f8',
    lineHeight: '1.4',
    flex: 1,
  },
  recRewards: {
    display: 'flex',
    gap: '12px',
    margin: '12px 0',
  },
  rewardVal: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#ffaa00',
  },
  pointsVal: {
    fontSize: '11px',
    color: '#00ffd5',
    alignSelf: 'center',
  },
  recFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  recTime: {
    fontSize: '11px',
    color: '#4b6b94',
  },
  recBtn: {
    background: '#0055cc',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  hallContainer: {
    display: 'grid',
    gridTemplateColumns: '2.5fr 9.5fr',
    gap: '16px',
  },
  filterSidebar: {
    padding: '16px',
    height: 'fit-content',
  },
  filterGroup: {
    marginBottom: '20px',
  },
  filterHeading: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '10px',
    borderBottom: '1px solid rgba(0, 149, 255, 0.1)',
    paddingBottom: '6px',
  },
  filterItem: {
    fontSize: '12px',
    color: '#8ab4f8',
    padding: '6px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginBottom: '2px',
  },
  filterItemActive: {
    color: '#00ffd5',
    backgroundColor: 'rgba(0, 255, 213, 0.08)',
    fontWeight: '600',
  },
  rewardInputs: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginBottom: '12px',
  },
  filterInput: {
    width: '100%',
    padding: '6px 8px',
    backgroundColor: '#030a16',
    border: '1px solid rgba(0, 149, 255, 0.2)',
    borderRadius: '4px',
    color: 'white',
    fontSize: '11px',
  },
  resetFiltersBtn: {
    width: '100%',
    padding: '6px 0',
    background: 'rgba(255, 74, 90, 0.1)',
    border: '1px solid rgba(255, 74, 90, 0.3)',
    color: '#ff4a5a',
    fontSize: '11px',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  taskTableWrapper: {
    padding: '16px',
  },
  tableTabs: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(0, 149, 255, 0.1)',
    paddingBottom: '10px',
    marginBottom: '10px',
  },
  tabsLeft: {
    display: 'flex',
    gap: '12px',
  },
  tableTab: {
    background: 'none',
    border: 'none',
    color: '#8ab4f8',
    fontSize: '13px',
    cursor: 'pointer',
    paddingBottom: '8px',
    position: 'relative',
  },
  tableTabActive: {
    color: '#00ffd5',
    fontWeight: '600',
    borderBottom: '2px solid #00ffd5',
  },
  sortDropdown: {
    fontSize: '12px',
    color: '#8ab4f8',
    cursor: 'pointer',
  },
  taskCellName: {
    fontWeight: '600',
    color: 'white',
    fontSize: '14px',
  },
  taskCellTarget: {
    fontSize: '11px',
    color: '#4b6b94',
    marginTop: '3px',
  },
  tableRewardText: {
    color: '#ffaa00',
    fontWeight: '700',
    fontSize: '14px',
  },
  tablePointsText: {
    color: '#00ffd5',
    fontSize: '11px',
    marginTop: '2px',
  },
  tableBtnAccept: {
    backgroundColor: '#0055cc',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(0,85,204,0.3)',
    transition: 'all 0.2s',
  },
  tableBtnReport: {
    backgroundColor: '#00ffd5',
    color: '#030a16',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(0,255,213,0.3)',
    transition: 'all 0.2s',
  },
  statusDisabled: {
    color: '#4b6b94',
    fontSize: '12px',
  },
  statusPending: {
    color: '#ffaa00',
    fontSize: '12px',
    fontWeight: '600',
  },
  statusCompleted: {
    color: '#00ffd5',
    fontSize: '12px',
    fontWeight: '600',
  },
  rightCardPanel: {
    padding: '16px',
  },
  rightCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },
  rightCardTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff',
    borderLeft: '3px solid #00ffd5',
    paddingLeft: '8px',
  },
  rightCardMore: {
    fontSize: '11px',
    color: '#4b6b94',
    cursor: 'pointer',
  },
  announceList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  announceItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
  },
  announceDot: {
    width: '4px',
    height: '4px',
    backgroundColor: '#00ffd5',
    borderRadius: '50%',
  },
  announceText: {
    color: '#8ab4f8',
    flex: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    cursor: 'pointer',
  },
  announceDate: {
    color: '#4b6b94',
    fontSize: '11px',
  },
  newsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  newsItem: {
    display: 'flex',
    gap: '10px',
    cursor: 'pointer',
  },
  newsThumbWrapper: {
    width: '70px',
    height: '45px',
    borderRadius: '4px',
    overflow: 'hidden',
    border: '1px solid rgba(0, 149, 255, 0.15)',
  },
  newsThumb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  newsMeta: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  newsTitle: {
    fontSize: '12px',
    color: '#ffffff',
    fontWeight: '500',
    lineHeight: '1.3',
  },
  newsInfo: {
    fontSize: '10px',
    color: '#4b6b94',
  },
  leaderboardTabs: {
    display: 'flex',
    background: '#040d1a',
    padding: '3px',
    borderRadius: '4px',
    marginBottom: '12px',
  },
  leaderboardTab: {
    flex: 1,
    fontSize: '11px',
    textAlign: 'center',
    color: '#8ab4f8',
    padding: '4px 0',
    borderRadius: '2px',
    cursor: 'pointer',
  },
  leaderboardTabActive: {
    background: 'rgba(0,136,255,0.2)',
    color: '#ffffff',
    fontWeight: '600',
  },
  leaderboardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  leaderboardItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 8px',
    borderRadius: '6px',
    background: 'rgba(0,149,255,0.02)',
  },
  leaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  rankNum: {
    fontSize: '11px',
    fontWeight: 'bold',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    backgroundColor: '#0c2240',
    color: '#8ab4f8',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rank1: { backgroundColor: '#ffd700', color: '#030a16' },
  rank2: { backgroundColor: '#c0c0c0', color: '#030a16' },
  rank3: { backgroundColor: '#cd7f32', color: '#030a16' },
  leaderAvatar: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
  },
  leaderName: {
    fontSize: '12px',
    color: '#8ab4f8',
  },
  leaderSelf: {
    color: '#00ffd5',
    fontWeight: '600',
  },
  leaderPoints: {
    fontSize: '11px',
    color: '#ffffff',
    fontWeight: '500',
  },
  footer: {
    marginTop: 'auto',
    borderTop: '1px solid rgba(0, 149, 255, 0.15)',
    padding: '30px 30px 20px 30px',
    backgroundColor: '#030a16',
  },
  footerFeatures: {
    maxWidth: '1200px',
    margin: '0 auto 20px auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '24px',
  },
  featureBox: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: '28px',
  },
  featureTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff',
  },
  featureDesc: {
    fontSize: '11px',
    color: '#4b6b94',
    marginTop: '2px',
  },
  copyright: {
    textAlign: 'center',
    color: '#4b6b94',
    fontSize: '11px',
    borderTop: '1px solid rgba(0, 149, 255, 0.05)',
    paddingTop: '16px',
  },
  noTasks: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: '30px',
    color: '#4b6b94',
    fontSize: '13px',
  },
  closeModalBtn: {
    background: 'none',
    border: 'none',
    color: '#4b6b94',
    cursor: 'pointer',
    fontSize: '16px',
  },
  modalCancelBtn: {
    backgroundColor: '#0a1d35',
    color: '#8ab4f8',
    border: '1px solid rgba(0,136,255,0.2)',
    padding: '8px 16px',
    borderRadius: '4px',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  modalSubmitBtn: {
    backgroundColor: '#00ffd5',
    color: '#030a16',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 0 10px rgba(0,255,213,0.3)',
  },
};

// Inject CSS styles for dashboard hover items
if (typeof document !== 'undefined') {
  const panelStyle = document.createElement('style');
  panelStyle.innerText = `
    .quick-action:hover {
      background: rgba(0, 136, 255, 0.15) !important;
      border-color: rgba(0, 255, 213, 0.3) !important;
      color: white !important;
      transform: translateY(-2px);
    }
    .pulsing-shield {
      animation: shield-pulse 4s infinite ease-in-out;
    }
    @keyframes shield-pulse {
      0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.5; }
      50% { transform: scale(1.05) rotate(5deg); opacity: 0.8; }
    }
    .recommendCard:hover {
      box-shadow: 0 4px 20px rgba(0, 136, 255, 0.15) !important;
    }
    .sec-table tbody tr:hover td {
      background: rgba(0, 136, 255, 0.04) !important;
    }
    @keyframes toast-in {
      from { transform: translate(-50%, -20px); opacity: 0; }
      to { transform: translate(-50%, 0); opacity: 1; }
    }
  `;
  document.head.appendChild(panelStyle);
}
