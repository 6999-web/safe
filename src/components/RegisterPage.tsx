import React, { useState } from 'react';
import { Lock, Shield, User as UserIcon, UserCheck } from 'lucide-react';
import { api } from '../api';
import { User } from '../types';

interface RegisterPageProps {
  onRegisterSuccess: (user: User, token: string) => void;
  onNavigate: (view: 'landing' | 'login') => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onRegisterSuccess, onNavigate }) => {
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    setLoading(true);
    try {
      const { user, token } = await api.register({ username, nickname, password, role: 'user' });
      onRegisterSuccess(user, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleRegister} style={styles.card}>
        <Shield size={34} color="#1E62EC" />
        <h2 style={styles.title}>使用者账号注册</h2>
        <p style={styles.subtitle}>注册后即可接收管理端发布的真实任务并提交进度表单。</p>

        {error && <div style={styles.errorAlert}>{error}</div>}

        <label style={styles.inputWrapper}>
          <UserIcon size={18} style={styles.inputIcon} />
          <input
            type="text"
            placeholder="账号，英文/数字/下划线"
            value={username}
            onChange={event => setUsername(event.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
            style={styles.input}
            required
          />
        </label>

        <label style={styles.inputWrapper}>
          <UserCheck size={18} style={styles.inputIcon} />
          <input
            type="text"
            placeholder="昵称"
            value={nickname}
            onChange={event => setNickname(event.target.value)}
            style={styles.input}
            required
          />
        </label>

        <label style={styles.inputWrapper}>
          <Lock size={18} style={styles.inputIcon} />
          <input
            type="password"
            placeholder="密码，至少 6 位"
            value={password}
            onChange={event => setPassword(event.target.value)}
            style={styles.input}
            required
          />
        </label>

        <label style={styles.inputWrapper}>
          <Lock size={18} style={styles.inputIcon} />
          <input
            type="password"
            placeholder="再次输入密码"
            value={confirmPassword}
            onChange={event => setConfirmPassword(event.target.value)}
            style={styles.input}
            required
          />
        </label>

        <button type="submit" style={styles.submitButton} disabled={loading}>
          {loading ? '注册中...' : '注册并进入系统'}
        </button>

        <button type="button" onClick={() => onNavigate('login')} style={styles.linkButton}>
          已有账号，返回登录
        </button>
      </form>

      <button type="button" onClick={() => onNavigate('landing')} style={styles.backButton}>
        返回系统首页
      </button>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '100vw',
    minHeight: '100vh',
    background: '#f5f7fa',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '24px 20px',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)',
    padding: '34px 32px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  title: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#081426',
    marginTop: '12px',
  },
  subtitle: {
    color: '#718096',
    fontSize: '13px',
    lineHeight: 1.5,
    margin: '8px 0 20px',
    textAlign: 'center',
  },
  errorAlert: {
    width: '100%',
    padding: '10px 14px',
    backgroundColor: '#ffeef0',
    border: '1px solid #ffccd3',
    borderRadius: '6px',
    color: '#ff4a5a',
    fontSize: '13px',
    marginBottom: '16px',
  },
  inputWrapper: {
    position: 'relative',
    width: '100%',
    marginBottom: '14px',
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
    height: '42px',
    padding: '0 12px 0 42px',
    fontSize: '14px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    color: '#2d3748',
    backgroundColor: '#ffffff',
    outline: 'none',
  },
  submitButton: {
    width: '100%',
    height: '46px',
    marginTop: '6px',
    backgroundColor: '#1E62EC',
    color: '#ffffff',
    border: 0,
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(30, 98, 236, 0.25)',
  },
  linkButton: {
    marginTop: '16px',
    border: 0,
    background: 'transparent',
    color: '#1E62EC',
    cursor: 'pointer',
    fontSize: '13px',
  },
  backButton: {
    marginTop: '14px',
    border: 0,
    background: 'transparent',
    color: '#718096',
    fontSize: '13px',
    cursor: 'pointer',
  },
};
