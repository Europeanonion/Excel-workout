import React, { useState, useEffect } from 'react';
import { addOnlineStatusListener, removeOnlineStatusListener } from '../../firebase/sync';
import styles from './online-status.module.css';

export const OnlineStatusIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  
  useEffect(() => {
    // Set up listener for online status changes
    const handleStatusChange = (online: boolean) => {
      setIsOnline(online);
    };
    
    // Add listener
    addOnlineStatusListener(handleStatusChange);
    
    // Clean up listener on unmount
    return () => {
      removeOnlineStatusListener(handleStatusChange);
    };
  }, []);
  
  return (
    <div 
      className={`${styles.indicator} ${isOnline ? styles.online : styles.offline}`}
      role="status"
      aria-live="polite"
    >
      <span className={styles.dot}></span>
      <span className={styles.text}>
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  );
};

export default OnlineStatusIndicator;