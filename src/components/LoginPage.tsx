import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Shield, User as UserIcon } from 'lucide-react';
import { api } from '../api';
import { User, UserRole } from '../types';

const loginHeroImage = `${import.meta.env.BASE_URL}login-left.png`;

interface LoginPageProps {
  onLoginSuccess: (user: User, token: string) => void;
  onNavigate: (view: 'landing' | 'register') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onNavigate }) => {
  const [role, setRole] = useState<UserRole>('user');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user, token } = await api.login({ username, password, role });
      onLoginSuccess(user, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-shell" style={styles.container}>
      <section className="login-hero-panel" style={styles.heroPanel}>
        <img src={loginHeroImage} alt="安全情报社区" style={styles.heroImage} />
      </section>

      <section className="login-form-panel" style={styles.formPanel}>
        <form onSubmit={handleLogin} style={styles.loginCard}>
          <Shield size={34} color="#1E62EC" />
          <h2 style={styles.title}>安全情报社区</h2>

          <div style={styles.roleTabs}>
            <button
              type="button"
              onClick={() => setRole('user')}
              style={{ ...styles.roleTab, ...(role === 'user' ? styles.activeTab : {}) }}
            >
              使用者端
            </button>
            <button
              type="button"
              onClick={() => setRole('admin')}
              style={{ ...styles.roleTab, ...(role === 'admin' ? styles.activeTab : {}) }}
            >
              管理端
            </button>
          </div>

          {error && <div style={styles.errorAlert}>{error}</div>}

          <label style={styles.inputWrapper}>
            <UserIcon size={18} style={styles.inputIcon} />
            <input
              type="text"
              placeholder="请输入账号"
              value={username}
              onChange={event => setUsername(event.target.value)}
              style={styles.input}
              required
            />
          </label>

          <label style={styles.inputWrapper}>
            <Lock size={18} style={styles.inputIcon} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="请输入密码"
              value={password}
              onChange={event => setPassword(event.target.value)}
              style={{ ...styles.input, paddingRight: '42px' }}
              required
            />
            <button
              type="button"
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
              onClick={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </label>

          <button type="submit" style={styles.submitButton} disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>

          <button type="button" onClick={() => onNavigate('register')} style={styles.linkButton}>
            没有使用者账号？立即注册
          </button>
        </form>

        <button type="button" onClick={() => onNavigate('landing')} style={styles.backButton}>
          返回系统首页
        </button>
      </section>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '100vw',
    minHeight: '100vh',
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 65fr) minmax(420px, 35fr)',
    backgroundColor: '#030a16',
    overflow: 'hidden',
  },
  heroPanel: {
    position: 'relative',
    minHeight: '100vh',
    overflow: 'hidden',
    backgroundColor: '#041229',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    minHeight: '100vh',
    objectFit: 'cover',
    objectPosition: 'center center',
    display: 'block',
  },
  formPanel: {
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '24px 20px',
    overflowY: 'auto',
  },
  loginCard: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)',
    padding: '30px 32px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  title: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#081426',
    margin: '12px 0 20px',
  },
  roleTabs: {
    display: 'flex',
    width: '100%',
    backgroundColor: '#f0f3f6',
    borderRadius: '8px',
    padding: '4px',
    marginBottom: '20px',
  },
  roleTab: {
    flex: 1,
    padding: '10px 0',
    fontSize: '14px',
    fontWeight: 600,
    color: '#718096',
    background: 'transparent',
    border: 0,
    borderRadius: '6px',
    cursor: 'pointer',
  },
  activeTab: {
    backgroundColor: '#ffffff',
    color: '#1E62EC',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
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
    marginBottom: '16px',
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
  eyeButton: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'transparent',
    border: 0,
    color: '#a0aec0',
    cursor: 'pointer',
    display: 'inline-flex',
  },
  submitButton: {
    width: '100%',
    height: '46px',
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
