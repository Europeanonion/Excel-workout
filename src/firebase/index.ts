// Re-export Firebase modules
// This file serves as a centralized entry point for Firebase functionality

// Config
export { firebaseConfig } from './config';

// App
export { app } from './app';

// Firestore
export { db } from './firestore-app';
export {
  saveWorkoutProgram,
  getWorkoutProgram,
  getUserWorkoutPrograms,
  deleteWorkoutProgram,
  onUserProgramsChange,
  batchSaveWorkoutPrograms
} from './firestore';

// Auth
export { auth } from './auth-app';
export {
  registerUser,
  signIn,
  signOut,
  getCurrentUser,
  onAuthChange
} from './auth';