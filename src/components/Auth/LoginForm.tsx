import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import styles from './auth.module.css';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  
  const { login, isLoading, error } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    // Basic validation
    if (!email.trim()) {
      setFormError('Email is required');
      return;
    }
    
    if (!password) {
      setFormError('Password is required');
      return;
    }
    
    try {
      await login(email, password);
      // Login successful - AuthContext will update the UI
    } catch (err) {
      // Error is handled by AuthContext
    }
  };
  
  return (
    <div className={styles.authContainer}>
      <h2 className={styles.title}>Log In</h2>
      
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.label}>
            Email
          </label>
          <input
            id="email"
            type="email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            aria-describedby="email-error"
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="password" className={styles.label}>
            Password
          </label>
          <input
            id="password"
            type="password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            aria-describedby="password-error"
          />
        </div>
        
        {(formError || error) && (
          <div className={styles.error} role="alert">
            {formError || error}
          </div>
        )}
        
        <button 
          type="submit" 
          className={styles.button}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className={styles.spinner} aria-hidden="true" />
          ) : (
            'Log In'
          )}
        </button>
      </form>
      
      <div className={styles.switchText}>
        Don't have an account?{' '}
        <span 
          className={styles.switchLink}
          onClick={onSwitchToRegister}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onSwitchToRegister();
            }
          }}
        >
          Register
        </span>
      </div>
    </div>
  );
};