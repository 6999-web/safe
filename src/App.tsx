import { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { UserPanel } from './components/UserPanel';
import { AdminPanel } from './components/AdminPanel';
import { User } from './types';
import { db } from './data/db';

type ViewType = 'landing' | 'login' | 'register' | 'user' | 'admin';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Initialize DB on application startup
  useEffect(() => {
    // Seeding DB if empty
    db.getTasks();
    db.getUsers();
    db.getReports();

    // Check if session exists in localStorage
    const savedUser = localStorage.getItem('sec_intel_session_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser) as User;
      setCurrentUser(parsedUser);
      setCurrentView(parsedUser.role === 'admin' ? 'admin' : 'user');
    }
  }, []);

  const handleNavigate = (view: ViewType) => {
    setCurrentView(view);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('sec_intel_session_user', JSON.stringify(user));
    setCurrentView(user.role === 'admin' ? 'admin' : 'user');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sec_intel_session_user');
    setCurrentView('landing');
  };

  const handleRegisterSuccess = () => {
    setCurrentView('login');
  };

  return (
    <>
      {currentView === 'landing' && (
        <LandingPage onNavigate={handleNavigate} />
      )}
      
      {currentView === 'login' && (
        <LoginPage 
          onLoginSuccess={handleLoginSuccess} 
          onNavigate={handleNavigate} 
        />
      )}

      {currentView === 'register' && (
        <RegisterPage 
          onRegisterSuccess={handleRegisterSuccess} 
          onNavigate={handleNavigate} 
        />
      )}

      {currentView === 'user' && currentUser && (
        <UserPanel 
          user={currentUser} 
          onLogout={handleLogout} 
        />
      )}

      {currentView === 'admin' && currentUser && (
        <AdminPanel 
          user={currentUser} 
          onLogout={handleLogout} 
        />
      )}
    </>
  );
}
