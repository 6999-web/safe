import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
import { db } from '../data/db';
import { User as UserType } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: UserType) => void;
  onNavigate: (view: 'landing' | 'register') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onNavigate }) => {
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [username, setUsername] = useState(role === 'user' ? 'xiaoming' : 'admin');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const handleRoleChange = (selectedRole: 'user' | 'admin') => {
    setRole(selectedRole);
    setUsername(selectedRole === 'user' ? 'xiaoming' : 'admin');
    setError('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const users = db.getUsers();
    const foundUser = users.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.role === role
    );

    if (foundUser) {
      onLoginSuccess(foundUser);
    } else {
      setError('用户名或密码错误，请检查角色选择是否正确！');
    }
  };

  return (
    <div style={styles.container}>
      {/* Left side: Network security banner (cropping the left part of 登录主页.png) */}
      <div style={styles.leftPanel}>
        <div style={styles.leftOverlay}>
          {/* We use the left part of 登录主页.png directly to guarantee 100% visual fidelity */}
        </div>
      </div>

      {/* Right side: Login form card */}
      <div style={styles.rightPanel}>
        <div style={styles.loginCard}>
          {/* National Emblem Logo */}
          <div style={styles.logoWrapper}>
            <img 
              src="https://img.alicdn.com/imgextra/i4/O1CN01lR7t3M1d9QdczR3zK_!!6000000003695-2-tps-128-128.png" 
              alt="警徽" 
              style={styles.logo}
              onError={(e) => {
                // Fallback shield if external image fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
            {/* Fallback avatar shape if offline */}
            <div className="badge-logo-fallback" style={styles.logoFallback}>👮</div>
          </div>

          <h2 style={styles.title}>安全情报社区</h2>
          
          {/* Role selector tabs */}
          <div style={styles.roleTabs}>
            <button 
              onClick={() => handleRoleChange('user')}
              style={{
                ...styles.roleTab,
                ...(role === 'user' ? styles.activeTab : {})
              }}
            >
              使用者端登录
            </button>
            <button 
              onClick={() => handleRoleChange('admin')}
              style={{
                ...styles.roleTab,
                ...(role === 'admin' ? styles.activeTab : {})
              }}
            >
              管理端登录
            </button>
          </div>

          {error && <div style={styles.errorAlert}>{error}</div>}

          <form onSubmit={handleLogin} style={styles.form}>
            {/* Username */}
            <div style={styles.inputWrapper}>
              <User size={18} style={styles.inputIcon} />
              <input 
                type="text" 
                placeholder="请输入账号" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            {/* Password */}
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="请输入密码" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                required
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Remember account option */}
            <div style={styles.formOptions}>
              <label style={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={styles.checkbox}
                />
                <span>记住账号</span>
              </label>
              
              <span 
                onClick={() => onNavigate('register')} 
                style={styles.registerLink}
              >
                没有账号？立即注册
              </span>
            </div>

            {/* Submit */}
            <button type="submit" style={styles.submitBtn}>
              登 录
            </button>
          </form>

          {/* Certificate Login */}
          <div style={styles.otherLogin}>
            <div style={styles.dividerLine}>
              <span style={styles.dividerText}>其他登录方式</span>
            </div>
            <div style={styles.certLoginWrapper}>
              <div style={styles.certIconBtn}>
                💳
              </div>
              <span style={styles.certText}>证书登录</span>
            </div>
          </div>

          {/* Footer Warning */}
          <div style={styles.footerWarning}>
            <span style={styles.shieldIcon}>🛡️</span>
            <span>为保障账号安全，建议使用单位内部网络进行登录</span>
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
    backgroundColor: '#f5f7fa', // Muted clean light gray background matching screenshot login card wrapper
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    padding: '40px 20px',
  },
  loginCard: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)',
    padding: '40px 32px 24px 32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  logoWrapper: {
    width: '64px',
    height: '64px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  logo: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  logoFallback: {
    position: 'absolute',
    fontSize: '32px',
    display: 'none',
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#081426',
    marginBottom: '24px',
    fontFamily: "'Inter', sans-serif",
    letterSpacing: '0.5px',
  },
  roleTabs: {
    display: 'flex',
    width: '100%',
    background: '#f0f3f6',
    borderRadius: '8px',
    padding: '4px',
    marginBottom: '24px',
  },
  roleTab: {
    flex: 1,
    padding: '10px 0',
    fontSize: '14px',
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
    padding: '10px 14px',
    backgroundColor: '#ffeef0',
    border: '1px solid #ffccd3',
    borderRadius: '6px',
    color: '#ff4a5a',
    fontSize: '13px',
    marginBottom: '16px',
  },
  form: {
    width: '100%',
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: '16px',
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
    padding: '12px 12px 12px 42px',
    fontSize: '14px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    color: '#2d3748',
    backgroundColor: '#ffffff',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#a0aec0',
  },
  formOptions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    fontSize: '13px',
    color: '#718096',
    marginBottom: '24px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
  },
  checkbox: {
    cursor: 'pointer',
  },
  registerLink: {
    color: '#1E62EC',
    cursor: 'pointer',
    fontWeight: '500',
  },
  submitBtn: {
    width: '100%',
    padding: '12px 0',
    backgroundColor: '#1E62EC',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(30, 98, 236, 0.25)',
  },
  otherLogin: {
    width: '100%',
    marginTop: '28px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  dividerLine: {
    width: '100%',
    borderBottom: '1px solid #e2e8f0',
    lineHeight: '0.1em',
    margin: '10px 0 20px 0',
    textAlign: 'center',
  },
  dividerText: {
    background: '#ffffff',
    padding: '0 10px',
    color: '#a0aec0',
    fontSize: '12px',
  },
  certLoginWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
  },
  certIconBtn: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    backgroundColor: '#edf2f7',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '18px',
    transition: 'all 0.2s ease',
  },
  certText: {
    fontSize: '11px',
    color: '#718096',
  },
  footerWarning: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '11px',
    color: '#a0aec0',
    marginTop: '28px',
    width: '100%',
    paddingTop: '16px',
    borderTop: '1px solid #f0f3f6',
    textAlign: 'left',
  },
  shieldIcon: {
    fontSize: '14px',
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

// Add fallback styles
if (typeof document !== 'undefined') {
  const fallbackStyles = document.createElement('style');
  fallbackStyles.innerText = `
    input:focus {
      border-color: #1E62EC !important;
      box-shadow: 0 0 0 3px rgba(30, 98, 236, 0.15) !important;
    }
    .certLoginWrapper:hover div {
      background-color: #e2e8f0 !important;
      transform: scale(1.05);
    }
    span[onClick]:hover {
      text-decoration: underline;
    }
  `;
  document.head.appendChild(fallbackStyles);
}
