# Firebase Integration Implementation Plan

## 1. Objectives

The primary objective is to integrate Firebase into our Excel Workout PWA to enable:

1. Cross-device synchronization of workout programs and history
2. Offline functionality with data persistence
3. User authentication for personalized workout tracking
4. Secure data storage and retrieval

## 2. Requirements

### 2.1 Functional Requirements

- Users should be able to access their workout programs from any device
- Changes made on one device should sync to all other devices when online
- The application should work offline with local data storage
- When coming back online, the application should sync local changes to Firebase
- User authentication should be implemented for data security
- Workout history should be synchronized across devices

### 2.2 Technical Requirements

- Firebase Firestore for NoSQL database storage
- Firebase Authentication for user management
- IndexedDB for local storage and offline functionality
- Synchronization service between IndexedDB and Firestore
- Online/offline detection mechanism
- Conflict resolution strategy for concurrent edits

### 2.3 Non-Functional Requirements

- Performance: Synchronization should not impact the user experience
- Security: User data should be protected with proper authentication and authorization
- Reliability: Data should not be lost during synchronization
- Scalability: The solution should handle a growing number of users and workout programs

## 3. Technical Approach

### 3.1 Firebase Project Setup

1. Create a new Firebase project in the Firebase Console
2. Enable Firestore database
3. Configure Firebase Authentication
4. Set up security rules for Firestore
5. Generate Firebase configuration for the web application

### 3.2 Project Dependencies

```bash
# Install Firebase dependencies
npm install firebase
# Install additional utilities
npm install lodash
```

### 3.3 Firebase Configuration

Create a new file `src/firebase/config.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase configuration
// Replace with your own Firebase config
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

### Personal Firebase config
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyATj12GA9QN7qgS5LYNiHBH7cEc1_5UzDA",
  authDomain: "workout-tracker-ca120.firebaseapp.com",
  projectId: "workout-tracker-ca120",
  storageBucket: "workout-tracker-ca120.firebasestorage.app",
  messagingSenderId: "685212434875",
  appId: "1:685212434875:web:38cb29601e29a75b40849e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
```

Create a `.env.local` file in the project root (not to be committed to version control):

```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### 3.4 Authentication Service

Create a new file `src/firebase/auth.ts`:

```typescript
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from './config';

// Register a new user
export const registerUser = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

// Sign in an existing user
export const signIn = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

// Sign out the current user
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Get the current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Listen for authentication state changes
export const onAuthChange = (callback: (user: User | null) => void): (() => void) => {
  return onAuthStateChanged(auth, callback);
};
```

### 3.5 Firestore Data Service

Create a new file `src/firebase/firestore.ts`:

```typescript
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';
import { WorkoutProgram } from '../types';

// Collection references
const programsCollection = collection(db, 'programs');

// Add or update a workout program
export const saveWorkoutProgram = async (userId: string, program: WorkoutProgram): Promise<void> => {
  try {
    const programRef = doc(programsCollection, program.id);
    
    // Add user ID and timestamps to the program
    const programWithMeta = {
      ...program,
      userId,
      updatedAt: Timestamp.now(),
      createdAt: program.createdAt || Timestamp.now()
    };
    
    await setDoc(programRef, programWithMeta);
  } catch (error) {
    console.error('Error saving workout program:', error);
    throw error;
  }
};

// Get a workout program by ID
export const getWorkoutProgram = async (programId: string): Promise<WorkoutProgram | null> => {
  try {
    const programRef = doc(programsCollection, programId);
    const programSnap = await getDoc(programRef);
    
    if (programSnap.exists()) {
      return programSnap.data() as WorkoutProgram;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting workout program:', error);
    throw error;
  }
};

// Get all workout programs for a user
export const getUserWorkoutPrograms = async (userId: string): Promise<WorkoutProgram[]> => {
  try {
    const q = query(programsCollection, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const programs: WorkoutProgram[] = [];
    querySnapshot.forEach((doc) => {
      programs.push(doc.data() as WorkoutProgram);
    });
    
    return programs;
  } catch (error) {
    console.error('Error getting user workout programs:', error);
    throw error;
  }
};

// Delete a workout program
export const deleteWorkoutProgram = async (programId: string): Promise<void> => {
  try {
    const programRef = doc(programsCollection, programId);
    await deleteDoc(programRef);
  } catch (error) {
    console.error('Error deleting workout program:', error);
    throw error;
  }
};

// Listen for changes to a user's workout programs
export const onUserProgramsChange = (
  userId: string, 
  callback: (programs: WorkoutProgram[]) => void
): (() => void) => {
  const q = query(programsCollection, where('userId', '==', userId));
  
  return onSnapshot(q, (querySnapshot) => {
    const programs: WorkoutProgram[] = [];
    querySnapshot.forEach((doc) => {
      programs.push(doc.data() as WorkoutProgram);
    });
    callback(programs);
  });
};

// Batch save multiple workout programs (for initial sync)
export const batchSaveWorkoutPrograms = async (
  userId: string, 
  programs: WorkoutProgram[]
): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    programs.forEach(program => {
      const programRef = doc(programsCollection, program.id);
      const programWithMeta = {
        ...program,
        userId,
        updatedAt: Timestamp.now(),
        createdAt: program.createdAt || Timestamp.now()
      };
      batch.set(programRef, programWithMeta);
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error batch saving workout programs:', error);
    throw error;
  }
};
```

### 3.6 Synchronization Service

Create a new file `src/firebase/sync.ts`:

```typescript
import { getCurrentUser } from './auth';
import { batchSaveWorkoutPrograms, getUserWorkoutPrograms } from './firestore';
import { getAllWorkoutPrograms, saveWorkoutProgram, deleteWorkoutProgram } from '../lib/indexedDB';
import { WorkoutProgram } from '../types';
import { debounce } from 'lodash';

// Online status tracking
let isOnline = navigator.onLine;
const onlineListeners: ((online: boolean) => void)[] = [];

// Initialize online status listeners
export const initOnlineStatusListeners = (): void => {
  window.addEventListener('online', () => {
    isOnline = true;
    onlineListeners.forEach(listener => listener(true));
    syncToFirestore(); // Sync when coming back online
  });
  
  window.addEventListener('offline', () => {
    isOnline = false;
    onlineListeners.forEach(listener => listener(false));
  });
};

// Add online status change listener
export const addOnlineStatusListener = (listener: (online: boolean) => void): void => {
  onlineListeners.push(listener);
  // Immediately call with current status
  listener(isOnline);
};

// Remove online status change listener
export const removeOnlineStatusListener = (listener: (online: boolean) => void): void => {
  const index = onlineListeners.indexOf(listener);
  if (index !== -1) {
    onlineListeners.splice(index, 1);
  }
};

// Sync from IndexedDB to Firestore (when online)
export const syncToFirestore = async (): Promise<void> => {
  if (!isOnline) return;
  
  const user = getCurrentUser();
  if (!user) return;
  
  try {
    // Get all programs from IndexedDB
    const localPrograms = await getAllWorkoutPrograms();
    
    // Batch save to Firestore
    await batchSaveWorkoutPrograms(user.uid, localPrograms);
    
    console.log('Successfully synced to Firestore');
  } catch (error) {
    console.error('Error syncing to Firestore:', error);
    throw error;
  }
};

// Debounced version of syncToFirestore to prevent too many calls
export const debouncedSyncToFirestore = debounce(syncToFirestore, 5000);

// Sync from Firestore to IndexedDB (initial load)
export const syncFromFirestore = async (): Promise<void> => {
  if (!isOnline) return;
  
  const user = getCurrentUser();
  if (!user) return;
  
  try {
    // Get all programs from Firestore
    const remotePrograms = await getUserWorkoutPrograms(user.uid);
    
    // Save each program to IndexedDB
    for (const program of remotePrograms) {
      await saveWorkoutProgram(program);
    }
    
    console.log('Successfully synced from Firestore');
  } catch (error) {
    console.error('Error syncing from Firestore:', error);
    throw error;
  }
};

// Listen for changes in Firestore and update IndexedDB
export const setupFirestoreListener = (userId: string): (() => void) => {
  // Import here to avoid circular dependencies
  const { onUserProgramsChange } = require('./firestore');
  
  return onUserProgramsChange(userId, async (programs: WorkoutProgram[]) => {
    try {
      // Get all local programs
      const localPrograms = await getAllWorkoutPrograms();
      const localProgramMap = new Map(localPrograms.map(p => [p.id, p]));
      
      // Update or add programs from Firestore
      for (const program of programs) {
        const localProgram = localProgramMap.get(program.id);
        
        // If local program doesn't exist or remote is newer, save to IndexedDB
        if (!localProgram || (program.updatedAt > localProgram.updatedAt)) {
          await saveWorkoutProgram(program);
        }
      }
      
      // Delete programs that exist locally but not in Firestore
      const remoteIds = new Set(programs.map(p => p.id));
      for (const localProgram of localPrograms) {
        if (!remoteIds.has(localProgram.id)) {
          await deleteWorkoutProgram(localProgram.id);
        }
      }
      
      console.log('Successfully updated IndexedDB from Firestore changes');
    } catch (error) {
      console.error('Error updating IndexedDB from Firestore changes:', error);
    }
  });
};

// Initialize synchronization
export const initSync = async (): Promise<void> => {
  initOnlineStatusListeners();
  
  const user = getCurrentUser();
  if (user && isOnline) {
    // Initial sync from Firestore to IndexedDB
    await syncFromFirestore();
    
    // Setup listener for future changes
    setupFirestoreListener(user.uid);
  }
};
```

### 3.7 IndexedDB Updates

Update the existing `src/lib/indexedDB.ts` file to work with the sync service:

```typescript
import { WorkoutProgram } from '../types';
import { debouncedSyncToFirestore } from '../firebase/sync';

const DB_NAME = 'ExcelWorkoutDB';
const DB_VERSION = 1;
const PROGRAM_STORE = 'workoutPrograms';

// Open the database
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      reject(request.error);
    };
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = request.result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(PROGRAM_STORE)) {
        const store = db.createObjectStore(PROGRAM_STORE, { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: false });
      }
    };
  });
};

// Save a workout program to IndexedDB
export const saveWorkoutProgram = async (program: WorkoutProgram): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(PROGRAM_STORE, 'readwrite');
    const store = transaction.objectStore(PROGRAM_STORE);
    
    // Add updatedAt timestamp if not present
    const programToSave = {
      ...program,
      updatedAt: program.updatedAt || new Date().toISOString()
    };
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(programToSave);
      
      request.onerror = () => {
        reject(request.error);
      };
      
      request.onsuccess = () => {
        resolve();
      };
    });
    
    // Trigger sync to Firestore if online
    debouncedSyncToFirestore();
  } catch (error) {
    console.error('Error saving workout program to IndexedDB:', error);
    throw error;
  }
};

// Get a workout program by ID
export const getWorkoutProgram = async (id: string): Promise<WorkoutProgram | null> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(PROGRAM_STORE, 'readonly');
    const store = transaction.objectStore(PROGRAM_STORE);
    
    return await new Promise<WorkoutProgram | null>((resolve, reject) => {
      const request = store.get(id);
      
      request.onerror = () => {
        reject(request.error);
      };
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
    });
  } catch (error) {
    console.error('Error getting workout program from IndexedDB:', error);
    throw error;
  }
};

// Get all workout programs
export const getAllWorkoutPrograms = async (): Promise<WorkoutProgram[]> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(PROGRAM_STORE, 'readonly');
    const store = transaction.objectStore(PROGRAM_STORE);
    
    return await new Promise<WorkoutProgram[]>((resolve, reject) => {
      const request = store.getAll();
      
      request.onerror = () => {
        reject(request.error);
      };
      
      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  } catch (error) {
    console.error('Error getting all workout programs from IndexedDB:', error);
    throw error;
  }
};

// Delete a workout program
export const deleteWorkoutProgram = async (id: string): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(PROGRAM_STORE, 'readwrite');
    const store = transaction.objectStore(PROGRAM_STORE);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id);
      
      request.onerror = () => {
        reject(request.error);
      };
      
      request.onsuccess = () => {
        resolve();
      };
    });
    
    // Trigger sync to Firestore if online
    debouncedSyncToFirestore();
  } catch (error) {
    console.error('Error deleting workout program from IndexedDB:', error);
    throw error;
  }
};
```

### 3.8 Authentication Components

Create a new file `src/components/Auth/AuthContext.tsx`:

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange } from '../../firebase/auth';
import { initSync } from '../../firebase/sync';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (authUser) => {
      setUser(authUser);
      
      if (authUser) {
        // Initialize sync when user is authenticated
        await initSync();
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

Create a new file `src/components/Auth/LoginForm.tsx`:

```typescript
import React, { useState } from 'react';
import { signIn } from '../../firebase/auth';
import styles from './auth.module.css';

interface LoginFormProps {
  onSuccess?: () => void;
  onRegisterClick: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onRegisterClick }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn(email, password);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError('Invalid email or password. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <h2>Log In</h2>
      <form onSubmit={handleSubmit} className={styles.authForm}>
        <div className={styles.formGroup}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <button type="submit" disabled={loading} className={styles.submitButton}>
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
      <div className={styles.authSwitch}>
        Don't have an account?{' '}
        <button onClick={onRegisterClick} className={styles.switchButton}>
          Register
        </button>
      </div>
    </div>
  );
};
```

Create a new file `src/components/Auth/RegisterForm.tsx`:

```typescript
import React, { useState } from 'react';
import { registerUser } from '../../firebase/auth';
import styles from './auth.module.css';

interface RegisterFormProps {
  onSuccess?: () => void;
  onLoginClick: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onLoginClick }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await registerUser(email, password);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Email is already in use');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak');
      } else {
        setError('Failed to register. Please try again.');
      }
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <h2>Register</h2>
      <form onSubmit={handleSubmit} className={styles.authForm}>
        <div className={styles.formGroup}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            minLength={6}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <button type="submit" disabled={loading} className={styles.submitButton}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <div className={styles.authSwitch}>
        Already have an account?{' '}
        <button onClick={onLoginClick} className={styles.switchButton}>
          Log In
        </button>
      </div>
    </div>
  );
};
```

Create a new file `src/components/Auth/auth.module.css`:

```css
.authContainer {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  background-color: #fff;
}

.authForm {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.formGroup {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.formGroup label {
  font-weight: 500;
  color: #333;
}

.formGroup input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.error {
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 0.875rem;
}

.submitButton {
  padding: 0.75rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submitButton:hover {
  background-color: #0056b3;
}

.submitButton:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.authSwitch {
  margin-top: 1rem;
  text-align: center;
  color: #6c757d;
}

.switchButton {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  font-weight: 500;
}

.switchButton:hover {
  text-decoration: underline;
}
```

Create a new file `src/components/Auth/AuthPage.tsx`:

```typescript
import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import styles from './auth.module.css';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className={styles.authPageContainer}>
      <h1>Excel Workout PWA</h1>
      {isLogin ? (
        <LoginForm 
          onRegisterClick={() => setIsLogin(false)} 
        />
      ) : (
        <RegisterForm 
          onLoginClick={() => setIsLogin(true)} 
        />
      )}
    </div>
  );
};
```

### 3.9 App Integration

Update `src/App.tsx` to integrate Firebase authentication:

```typescript
import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ExcelUploader } from './components/ExcelUploader';
import { ProgramList } from './components/ProgramList';
import { WorkoutDetails } from './components/WorkoutDetails';
import { AuthProvider, useAuth } from './components/Auth/AuthContext';
import { AuthPage } from './components/Auth/AuthPage';
import { initDB } from './lib/indexedDB';
import './App.css';

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" />;
  }
  
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user } = useAuth();

  const handleUploadSuccess = useCallback(() => {
    setMessage('File uploaded and processed successfully!');
    setMessageType('success');
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const handleUploadError = useCallback((error: Error) => {
    setMessage(`Error: ${error.message}`);
    setMessageType('error');
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMessage(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    initDB().catch(console.error);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Excel Workout PWA</h1>
        {user && (
          <div className="user-info">
            <span>{user.email}</span>
            <button onClick={() => signOut()}>Sign Out</button>
          </div>
        )}
      </header>
      
      {message && (
        <div 
          className={`message ${messageType}`} 
          role="status" 
          aria-live="polite"
        >
          {message}
        </div>
      )}
      
      <Routes>
        <Route 
          path="/auth" 
          element={user ? <Navigate to="/" /> : <AuthPage />} 
        />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <div className="main-content">
                <ExcelUploader 
                  onUploadSuccess={handleUploadSuccess} 
                  onUploadError={handleUploadError} 
                />
                <ProgramList refreshTrigger={refreshTrigger} />
              </div>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/program/:programId" 
          element={
            <ProtectedRoute>
              <WorkoutDetails />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
```

### 3.10 Online/Offline Status Indicator

Create a new file `src/components/OnlineStatus/OnlineStatusIndicator.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { addOnlineStatusListener, removeOnlineStatusListener } from '../../firebase/sync';
import styles from './online-status.module.css';

export const OnlineStatusIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleStatusChange = (online: boolean) => {
      setIsOnline(online);
    };

    addOnlineStatusListener(handleStatusChange);

    return () => {
      removeOnlineStatusListener(handleStatusChange);
    };
  }, []);

  return (
    <div className={styles.statusContainer}>
      <div className={`${styles.statusIndicator} ${isOnline ? styles.online : styles.offline}`} />
      <span>{isOnline ? 'Online' : 'Offline'}</span>
    </div>
  );
};
```

Create a new file `src/components/OnlineStatus/online-status.module.css`:

```css
.statusContainer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  font-size: 0.875rem;
}

.statusIndicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.online {
  background-color: #28a745;
}

.offline {
  background-color: #dc3545;
}
```

Add the indicator to the App header:

```typescript
<header className="app-header">
  <h1>Excel Workout PWA</h1>
  {user && (
    <div className="user-info">
      <OnlineStatusIndicator />
      <span>{user.email}</span>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  )}
</header>
```

## 4. Testing Strategy

### 4.1 Unit Tests

Create unit tests for the Firebase services:

```typescript
// src/firebase/auth.test.ts
import { registerUser, signIn, signOut, getCurrentUser } from './auth';
import { auth } from './config';

// Mock Firebase auth
jest.mock('./config', () => ({
  auth: {
    currentUser: null,
    createUserWithEmailAndPassword: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn()
  }
}));

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('registerUser calls createUserWithEmailAndPassword', async () => {
    const mockUser = { uid: '123', email: 'test@example.com' };
    (auth.createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({
      user: mockUser
    });

    const result = await registerUser('test@example.com', 'password');
    
    expect(auth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
      auth, 'test@example.com', 'password'
    );
    expect(result).toEqual(mockUser);
  });

  // Add more tests for signIn, signOut, getCurrentUser
});
```

```typescript
// src/firebase/firestore.test.ts
import { 
  saveWorkoutProgram, 
  getWorkoutProgram, 
  getUserWorkoutPrograms 
} from './firestore';
import { db } from './config';

// Mock Firestore
jest.mock('./config', () => ({
  db: {
    collection: jest.fn(),
    doc: jest.fn()
  }
}));

describe('Firestore Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('saveWorkoutProgram saves program to Firestore', async () => {
    // Setup mocks
    const mockDoc = {
      set: jest.fn().mockResolvedValue(undefined)
    };
    const mockCollection = {
      doc: jest.fn().mockReturnValue(mockDoc)
    };
    (db.collection as jest.Mock).mockReturnValue(mockCollection);

    const program = {
      id: '123',
      name: 'Test Program',
      workouts: []
    };

    await saveWorkoutProgram('user123', program);
    
    expect(db.collection).toHaveBeenCalledWith('programs');
    expect(mockCollection.doc).toHaveBeenCalledWith('123');
    expect(mockDoc.set).toHaveBeenCalled();
  });

  // Add more tests for getWorkoutProgram, getUserWorkoutPrograms
});
```

### 4.2 Integration Tests

Create integration tests for the synchronization service:

```typescript
// src/firebase/sync.test.ts
import { 
  initOnlineStatusListeners, 
  syncToFirestore, 
  syncFromFirestore 
} from './sync';
import { getCurrentUser } from './auth';
import { getUserWorkoutPrograms } from './firestore';
import { getAllWorkoutPrograms, saveWorkoutProgram } from '../lib/indexedDB';

// Mock dependencies
jest.mock('./auth');
jest.mock('./firestore');
jest.mock('../lib/indexedDB');

describe('Sync Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true
    });
  });

  test('syncToFirestore syncs local programs to Firestore when online', async () => {
    // Mock getCurrentUser to return a user
    (getCurrentUser as jest.Mock).mockReturnValue({ uid: 'user123' });
    
    // Mock getAllWorkoutPrograms to return programs
    const mockPrograms = [
      { id: '1', name: 'Program 1' },
      { id: '2', name: 'Program 2' }
    ];
    (getAllWorkoutPrograms as jest.Mock).mockResolvedValue(mockPrograms);
    
    await syncToFirestore();
    
    // Verify batchSaveWorkoutPrograms was called with the right arguments
    // You'll need to mock this function in the jest.mock('./firestore') setup
  });

  // Add more tests for syncFromFirestore, initSync
});
```

### 4.3 End-to-End Tests

Create end-to-end tests using Cypress:

```javascript
// cypress/integration/auth.spec.js
describe('Authentication', () => {
  it('should allow a user to register', () => {
    cy.visit('/auth');
    cy.contains('Register').click();
    cy.get('#email').type('test@example.com');
    cy.get('#password').type('password123');
    cy.get('#confirmPassword').type('password123');
    cy.contains('button', 'Register').click();
    
    // Assert user is redirected to home page
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });
  
  it('should allow a user to log in', () => {
    cy.visit('/auth');
    cy.get('#email').type('test@example.com');
    cy.get('#password').type('password123');
    cy.contains('button', 'Log In').click();
    
    // Assert user is redirected to home page
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });
});
```

```javascript
// cypress/integration/sync.spec.js
describe('Data Synchronization', () => {
  beforeEach(() => {
    // Log in before each test
    cy.login('test@example.com', 'password123');
  });
  
  it('should sync data between devices', () => {
    // Upload a workout program
    cy.get('input[type="file"]').attachFile('workout.xlsx');
    cy.contains('File processed successfully');
    
    // Verify program appears in the list
    cy.contains('h3', 'My Workout Program');
    
    // Simulate offline mode
    cy.window().then((win) => {
      cy.stub(win.navigator, 'onLine').value(false);
      win.dispatchEvent(new Event('offline'));
    });
    
    // Verify offline indicator shows
    cy.contains('Offline');
    
    // Simulate coming back online
    cy.window().then((win) => {
      cy.stub(win.navigator, 'onLine').value(true);
      win.dispatchEvent(new Event('online'));
    });
    
    // Verify online indicator shows
    cy.contains('Online');
    
    // Verify data is still available
    cy.contains('h3', 'My Workout Program');
  });
});
```

## 5. Deployment

### 5.1 Firebase Hosting Setup

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase Hosting:
```bash
firebase init hosting
```

4. Build the React app:
```bash
npm run build
```

5. Deploy to Firebase Hosting:
```bash
firebase deploy --only hosting
```

### 5.2 Environment Variables

For production deployment, set up environment variables in the Firebase Console:

1. Go to Project Settings > Service accounts
2. Generate new private key for Admin SDK
3. Store the key securely
4. Set up environment variables in your CI/CD pipeline or hosting platform

## 6. Security Considerations

### 6.1 Firestore Security Rules

Create a `firestore.rules` file:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read and write only their own data
    match /programs/{programId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

Deploy the security rules:
```bash
firebase deploy --only firestore:rules
```

### 6.2 Authentication Security

1. Set up email verification
2. Configure password policies
3. Set up account recovery options
4. Enable multi-factor authentication for sensitive operations

## 7. Performance Considerations

### 7.1 Optimizing Firestore Queries

1. Use composite indexes for complex queries
2. Limit the amount of data retrieved
3. Use pagination for large datasets
4. Cache frequently accessed data

### 7.2 Reducing Network Usage

1. Implement batching for multiple operations
2. Use offline persistence
3. Implement throttling for synchronization operations

## 8. Implementation Checklist

- [ ] Set up Firebase project
- [ ] Install Firebase dependencies
- [ ] Create Firebase configuration
- [ ] Implement authentication service
- [ ] Implement Firestore data service
- [ ] Create synchronization service
- [ ] Update IndexedDB implementation
- [ ] Create authentication components
- [ ] Integrate Firebase with the app
- [ ] Add online/offline status indicator
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Set up end-to-end tests
- [ ] Configure Firebase Hosting
- [ ] Set up security rules
- [ ] Optimize performance
- [ ] Deploy the application