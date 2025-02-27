import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import styles from './auth.module.css';
import { useNavigate } from 'react-router-dom';

enum AuthMode {
  LOGIN,
  REGISTER
}

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>(AuthMode.LOGIN);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);
  
  const switchToLogin = () => setMode(AuthMode.LOGIN);
  const switchToRegister = () => setMode(AuthMode.REGISTER);
  
  return (
    <div>
      {mode === AuthMode.LOGIN ? (
        <LoginForm onSwitchToRegister={switchToRegister} />
      ) : (
        <RegisterForm onSwitchToLogin={switchToLogin} />
      )}
    </div>
  );
};

export default AuthPage;