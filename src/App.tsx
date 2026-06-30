import { useEffect, useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { UserPanel } from './components/UserPanel';
import { AdminPanel } from './components/AdminPanel';
import { api, sessionStore } from './api';
import { User } from './types';

type ViewType = 'landing' | 'login' | 'register' | 'user' | 'admin';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const saved = sessionStore.load();
    if (!saved) {
      setBooting(false);
      return;
    }

    setCurrentUser(saved.user);
    setCurrentView(saved.user.role === 'admin' ? 'admin' : 'user');
    api.me()
      .then(({ user }) => {
        sessionStore.save(user, saved.token);
        setCurrentUser(user);
        setCurrentView(user.role === 'admin' ? 'admin' : 'user');
      })
      .catch(() => {
        sessionStore.clear();
        setCurrentUser(null);
        setCurrentView('landing');
      })
      .finally(() => setBooting(false));
  }, []);

  const handleLoginSuccess = (user: User, token: string) => {
    sessionStore.save(user, token);
    setCurrentUser(user);
    setCurrentView(user.role === 'admin' ? 'admin' : 'user');
  };

  const handleLogout = () => {
    sessionStore.clear();
    setCurrentUser(null);
    setCurrentView('landing');
  };

  if (booting) {
    return <div style={styles.bootScreen}>正在连接真实数据服务...</div>;
  }

  return (
    <>
      {currentView === 'landing' && <LandingPage onNavigate={setCurrentView} />}
      {currentView === 'login' && (
        <LoginPage onLoginSuccess={handleLoginSuccess} onNavigate={setCurrentView} />
      )}
      {currentView === 'register' && (
        <RegisterPage onRegisterSuccess={handleLoginSuccess} onNavigate={setCurrentView} />
      )}
      {currentView === 'user' && currentUser && (
        <UserPanel user={currentUser} onLogout={handleLogout} />
      )}
      {currentView === 'admin' && currentUser && (
        <AdminPanel user={currentUser} onLogout={handleLogout} />
      )}
    </>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  bootScreen: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#02060f',
    color: '#8ab4f8',
    fontSize: '14px',
  },
};
