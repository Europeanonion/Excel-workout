import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  onSnapshot,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firestore-app';
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