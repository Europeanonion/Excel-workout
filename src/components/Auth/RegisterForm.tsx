import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import styles from './auth.module.css';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  
  const { register, isLoading, error } = useAuth();
  
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
    
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }
    
    try {
      await register(email, password);
      // Registration successful - AuthContext will update the UI
    } catch (err) {
      // Error is handled by AuthContext
    }
  };
  
  return (
    <div className={styles.authContainer}>
      <h2 className={styles.title}>Create Account</h2>
      
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
        
        <div className={styles.formGroup}>
          <label htmlFor="confirmPassword" className={styles.label}>
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            className={styles.input}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            aria-describedby="confirm-password-error"
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
            'Register'
          )}
        </button>
      </form>
      
      <div className={styles.switchText}>
        Already have an account?{' '}
        <span 
          className={styles.switchLink}
          onClick={onSwitchToLogin}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onSwitchToLogin();
            }
          }}
        >
          Log In
        </span>
      </div>
    </div>
  );
};