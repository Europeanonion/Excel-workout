import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { WorkoutProgram, WorkoutSession } from '../../../types';
import { IStorageService } from '../../interfaces';

interface WorkoutDB extends DBSchema {
  'workout-programs': {
    key: string;
    value: WorkoutProgram;
  };
  'workout-sessions': {
    key: string;
    value: WorkoutSession;
    indexes: { 'programId': string };
  };
}

/**
 * IndexedDB implementation of the IStorageService interface
 */
export class IndexedDBStorageService implements IStorageService {
  private db: IDBPDatabase<WorkoutDB> | null = null;
  private dbPromise: Promise<IDBPDatabase<WorkoutDB>> | null = null;
  private dbName: string = 'workout-db';
  private dbVersion: number = 1;

  /**
   * Initialize the storage
   * @returns Promise resolving when initialization is complete
   */
  async initStorage(): Promise<void> {
    if (!this.dbPromise) {
      this.dbPromise = openDB<WorkoutDB>(this.dbName, this.dbVersion, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('workout-programs')) {
            db.createObjectStore('workout-programs', { keyPath: 'id' });
          }
          
          if (!db.objectStoreNames.contains('workout-sessions')) {
            const sessionStore = db.createObjectStore('workout-sessions', { keyPath: 'sessionId' });
            sessionStore.createIndex('programId', 'programId');
          }
        },
      });
    }
    
    this.db = await this.dbPromise;
  }

  /**
   * Ensures the database is initialized before performing operations
   */
  private async ensureDB(): Promise<IDBPDatabase<WorkoutDB>> {
    if (!this.db) {
      await this.initStorage();
    }
    
    if (!this.db) {
      throw new Error('Failed to initialize IndexedDB');
    }
    
    return this.db;
  }

  /**
   * Store a workout program
   * @param program The workout program to store
   * @returns Promise resolving when the operation is complete
   */
  async storeWorkoutProgram(program: WorkoutProgram): Promise<void> {
    const db = await this.ensureDB();
    await db.put('workout-programs', program);
  }

  /**
   * Get a workout program by ID
   * @param id The ID of the workout program
   * @returns Promise resolving to the workout program or undefined if not found
   */
  async getWorkoutProgram(id: string): Promise<WorkoutProgram | undefined> {
    const db = await this.ensureDB();
    return await db.get('workout-programs', id);
  }

  /**
   * Get all workout programs
   * @returns Promise resolving to an array of workout programs
   */
  async getAllWorkoutPrograms(): Promise<WorkoutProgram[]> {
    const db = await this.ensureDB();
    return await db.getAll('workout-programs');
  }

  /**
   * Delete a workout program by ID
   * @param id The ID of the workout program to delete
   * @returns Promise resolving when the operation is complete
   */
  async deleteWorkoutProgram(id: string): Promise<void> {
    const db = await this.ensureDB();
    await db.delete('workout-programs', id);
  }

  /**
   * Store a workout session
   * @param session The workout session to store
   * @returns Promise resolving when the operation is complete
   */
  async storeWorkoutSession(session: WorkoutSession): Promise<void> {
    const db = await this.ensureDB();
    await db.put('workout-sessions', session);
  }

  /**
   * Get all workout sessions for a specific program
   * @param programId The ID of the workout program
   * @returns Promise resolving to an array of workout sessions
   */
  async getWorkoutSessions(programId: string): Promise<WorkoutSession[]> {
    const db = await this.ensureDB();
    return await db.getAllFromIndex('workout-sessions', 'programId', programId);
  }
}