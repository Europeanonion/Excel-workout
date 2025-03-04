import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  Timestamp,
  Firestore
} from 'firebase/firestore';
import { db } from '../../../firebase/firestore-app';
import { WorkoutProgram, WorkoutSession } from '../../../types';
import { IStorageService } from '../../interfaces';

/**
 * Firebase implementation of the IStorageService interface
 */
export class FirebaseStorageService implements IStorageService {
  private db: Firestore;
  private programsCollection: string = 'programs';
  private sessionsCollection: string = 'workout-sessions';

  constructor(firestore: Firestore = db) {
    this.db = firestore;
  }

  /**
   * Initialize the storage
   * @returns Promise resolving when initialization is complete
   */
  async initStorage(): Promise<void> {
    // Firebase Firestore is initialized automatically when imported
    // No additional initialization needed
    return Promise.resolve();
  }

  /**
   * Store a workout program
   * @param program The workout program to store
   * @returns Promise resolving when the operation is complete
   */
  async storeWorkoutProgram(program: WorkoutProgram): Promise<void> {
    try {
      const programRef = doc(this.db, this.programsCollection, program.id);
      
      // Add timestamps if not present
      const programWithMeta = {
        ...program,
        updatedAt: Timestamp.now(),
        createdAt: program.createdAt || Timestamp.now()
      };
      
      await setDoc(programRef, programWithMeta);
    } catch (error) {
      console.error('Error saving workout program:', error);
      throw error;
    }
  }

  /**
   * Get a workout program by ID
   * @param id The ID of the workout program
   * @returns Promise resolving to the workout program or undefined if not found
   */
  async getWorkoutProgram(id: string): Promise<WorkoutProgram | undefined> {
    try {
      const programRef = doc(this.db, this.programsCollection, id);
      const programSnap = await getDoc(programRef);
      
      if (programSnap.exists()) {
        return programSnap.data() as WorkoutProgram;
      } else {
        return undefined;
      }
    } catch (error) {
      console.error('Error getting workout program:', error);
      throw error;
    }
  }

  /**
   * Get all workout programs
   * @returns Promise resolving to an array of workout programs
   */
  async getAllWorkoutPrograms(): Promise<WorkoutProgram[]> {
    try {
      const programsRef = collection(this.db, this.programsCollection);
      const querySnapshot = await getDocs(programsRef);
      
      const programs: WorkoutProgram[] = [];
      querySnapshot.forEach((doc) => {
        programs.push(doc.data() as WorkoutProgram);
      });
      
      return programs;
    } catch (error) {
      console.error('Error getting all workout programs:', error);
      throw error;
    }
  }

  /**
   * Delete a workout program by ID
   * @param id The ID of the workout program to delete
   * @returns Promise resolving when the operation is complete
   */
  async deleteWorkoutProgram(id: string): Promise<void> {
    try {
      const programRef = doc(this.db, this.programsCollection, id);
      await deleteDoc(programRef);
    } catch (error) {
      console.error('Error deleting workout program:', error);
      throw error;
    }
  }

  /**
   * Store a workout session
   * @param session The workout session to store
   * @returns Promise resolving when the operation is complete
   */
  async storeWorkoutSession(session: WorkoutSession): Promise<void> {
    try {
      const sessionRef = doc(this.db, this.sessionsCollection, session.sessionId);
      
      // Add timestamps if not present
      const sessionWithMeta = {
        ...session,
        updatedAt: Timestamp.now(),
        createdAt: (session as any).createdAt || Timestamp.now()
      };
      
      await setDoc(sessionRef, sessionWithMeta);
    } catch (error) {
      console.error('Error saving workout session:', error);
      throw error;
    }
  }

  /**
   * Get all workout sessions for a specific program
   * @param programId The ID of the workout program
   * @returns Promise resolving to an array of workout sessions
   */
  async getWorkoutSessions(programId: string): Promise<WorkoutSession[]> {
    try {
      const sessionsRef = collection(this.db, this.sessionsCollection);
      const q = query(sessionsRef, where('programId', '==', programId));
      const querySnapshot = await getDocs(q);
      
      const sessions: WorkoutSession[] = [];
      querySnapshot.forEach((doc) => {
        sessions.push(doc.data() as WorkoutSession);
      });
      
      return sessions;
    } catch (error) {
      console.error('Error getting workout sessions:', error);
      throw error;
    }
  }
}