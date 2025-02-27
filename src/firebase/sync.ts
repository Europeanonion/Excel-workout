import { getCurrentUser } from './auth';
import { batchSaveWorkoutPrograms, getUserWorkoutPrograms } from './firestore';
import { getAllWorkoutPrograms, storeWorkoutProgram as saveWorkoutProgram, deleteWorkoutProgram } from '../lib/indexedDB';
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