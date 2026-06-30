import React, { useState } from 'react';
import { Lock, User, UserCheck } from 'lucide-react';
import { db } from '../data/db';
import { User as UserType } from '../types';

interface RegisterPageProps {
  onRegisterSuccess: () => void;
  onNavigate: (view: 'landing' | 'login') => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onRegisterSuccess, onNavigate }) => {
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致！');
      return;
    }

    const users = db.getUsers();
    const userExists = users.some(u => u.username.toLowerCase() === username.toLowerCase());

    if (userExists) {
      setError('该账号用户名已存在，请换一个！');
      return;
    }

    const newUser: UserType = {
      username,
      nickname: nickname || (role === 'user' ? `白帽子_${username}` : `管理员_${username}`),
      avatar: role === 'user' 
        ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80' 
        : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&h=100&q=80',
      level: role === 'user' ? 'Lv.1 新晋白帽' : '系统管理员',
      exp: role === 'user' ? 0 : 0,
      maxExp: role === 'user' ? 500 : 0,
      points: role === 'user' ? 0 : 0,
      completedTasks: 0,
      rank: role === 'user' ? users.filter(u => u.role === 'user').length + 1 : 0,
      role,
      region: role === 'user' ? '南宁' : undefined
    };

    users.push(newUser);
    db.saveUsers(users);

    setSuccess('注册成功！3秒后自动返回登录页面...');
    setTimeout(() => {
      onRegisterSuccess();
    }, 2000);
  };

  return (
    <div style={styles.container}>
      {/* Left side: Network security banner (cropping the left part of 登录主页.png) */}
      <div style={styles.leftPanel}>
        <div style={styles.leftOverlay}></div>
      </div>

      {/* Right side: Register form card */}
      <div style={styles.rightPanel}>
        <div style={styles.registerCard}>
          <div style={styles.logoWrapper}>
            <div style={styles.logoBadge}>🛡️</div>
          </div>

          <h2 style={styles.title}>安全情报社区 - 账号注册</h2>
          
          {/* Role selector tabs */}
          <div style={styles.roleTabs}>
            <button 
              type="button"
              onClick={() => setRole('user')}
              style={{
                ...styles.roleTab,
                ...(role === 'user' ? styles.activeTab : {})
              }}
            >
              注册为 使用者
            </button>
            <button 
              type="button"
              onClick={() => setRole('admin')}
              style={{
                ...styles.roleTab,
                ...(role === 'admin' ? styles.activeTab : {})
              }}
            >
              注册为 管理员
            </button>
          </div>

          {error && <div style={styles.errorAlert}>{error}</div>}
          {success && <div style={styles.successAlert}>{success}</div>}

          <form onSubmit={handleRegister} style={styles.form}>
            {/* Username */}
            <div style={styles.inputWrapper}>
              <User size={18} style={styles.inputIcon} />
              <input 
                type="text" 
                placeholder="请输入登录账号 (仅限英文和数字)" 
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                style={styles.input}
                required
              />
            </div>

            {/* Nickname */}
            <div style={styles.inputWrapper}>
              <UserCheck size={18} style={styles.inputIcon} />
              <input 
                type="text" 
                placeholder="请输入昵称 (如: 白帽子阿飞)" 
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            {/* Password */}
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input 
                type="password" 
                placeholder="请输入密码" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            {/* Confirm Password */}
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input 
                type="password" 
                placeholder="请再次输入密码以确认" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            {/* Submit */}
            <button type="submit" style={styles.submitBtn}>
              注 册
            </button>
          </form>

          {/* Footer warning */}
          <div style={styles.footerWarning}>
            <span>已有账号？</span>
            <span 
              onClick={() => onNavigate('login')} 
              style={styles.loginLink}
            >
              直接登录
            </span>
          </div>
        </div>

        {/* Back to landing link */}
        <span onClick={() => onNavigate('landing')} style={styles.backLink}>
          ← 返回系统首页
        </span>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    backgroundColor: '#030a16',
    overflow: 'hidden',
  },
  leftPanel: {
    width: '65%',
    height: '100%',
    backgroundImage: 'url("/登录主页.png")',
    backgroundSize: 'cover',
    backgroundPosition: 'left center',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    borderRight: '1px solid rgba(0, 149, 255, 0.2)',
  },
  leftOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(90deg, rgba(3, 10, 22, 0) 60%, rgba(3, 10, 22, 0.9) 100%)',
    pointerEvents: 'none',
  },
  rightPanel: {
    width: '35%',
    height: '100%',
    backgroundColor: '#f5f7fa',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    padding: '40px 20px',
  },
  registerCard: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)',
    padding: '36px 32px 24px 32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  logoWrapper: {
    width: '54px',
    height: '54px',
    marginBottom: '16px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e6f0ff',
    borderRadius: '50%',
  },
  logoBadge: {
    fontSize: '24px',
  },
  title: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#081426',
    marginBottom: '20px',
    fontFamily: "'Inter', sans-serif",
  },
  roleTabs: {
    display: 'flex',
    width: '100%',
    background: '#f0f3f6',
    borderRadius: '8px',
    padding: '4px',
    marginBottom: '20px',
  },
  roleTab: {
    flex: 1,
    padding: '8px 0',
    fontSize: '13px',
    fontWeight: '600',
    color: '#718096',
    background: 'none',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  activeTab: {
    background: '#ffffff',
    color: '#1E62EC',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },
  errorAlert: {
    width: '100%',
    padding: '8px 12px',
    backgroundColor: '#ffeef0',
    border: '1px solid #ffccd3',
    borderRadius: '6px',
    color: '#ff4a5a',
    fontSize: '12px',
    marginBottom: '14px',
  },
  successAlert: {
    width: '100%',
    padding: '8px 12px',
    backgroundColor: '#e6fffa',
    border: '1px solid #b2f5ea',
    borderRadius: '6px',
    color: '#00a389',
    fontSize: '12px',
    marginBottom: '14px',
  },
  form: {
    width: '100%',
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: '14px',
    width: '100%',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#a0aec0',
  },
  input: {
    width: '100%',
    padding: '10px 12px 10px 42px',
    fontSize: '13px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    color: '#2d3748',
    backgroundColor: '#ffffff',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  submitBtn: {
    width: '100%',
    padding: '10px 0',
    backgroundColor: '#1E62EC',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(30, 98, 236, 0.25)',
    marginTop: '10px',
  },
  footerWarning: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#718096',
    marginTop: '20px',
    width: '100%',
  },
  loginLink: {
    color: '#1E62EC',
    cursor: 'pointer',
    fontWeight: '600',
  },
  backLink: {
    marginTop: '20px',
    color: '#718096',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontWeight: '500',
  },
};
