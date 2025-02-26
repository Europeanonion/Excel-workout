import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { WorkoutProgram, WorkoutSession } from '../types';

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

let db: IDBPDatabase<WorkoutDB>;
let dbPromise: Promise<IDBPDatabase<WorkoutDB>> | null = null;

/**
 * Initializes the IndexedDB database.
 * This function should be called before any other database operations.
 */
export async function initDB() {
  if (!dbPromise) {
    dbPromise = openDB<WorkoutDB>('workout-db', 1, {
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
  
  db = await dbPromise;
  return db;
}

/**
 * Ensures the database is initialized before performing operations.
 */
async function ensureDB() {
  if (!db) {
    await initDB();
  }
  return db;
}

/**
 * Stores a workout program in the database.
 */
export async function storeWorkoutProgram(program: WorkoutProgram): Promise<void> {
  const database = await ensureDB();
  await database.put('workout-programs', program);
}

/**
 * Retrieves a workout program by ID.
 */
export async function getWorkoutProgram(id: string): Promise<WorkoutProgram | undefined> {
  const database = await ensureDB();
  return await database.get('workout-programs', id);
}

/**
 * Retrieves all workout programs.
 */
export async function getAllWorkoutPrograms(): Promise<WorkoutProgram[]> {
  const database = await ensureDB();
  return await database.getAll('workout-programs');
}

/**
 * Deletes a workout program by ID.
 */
export async function deleteWorkoutProgram(id: string): Promise<void> {
  const database = await ensureDB();
  await database.delete('workout-programs', id);
}

/**
 * Stores a workout session in the database.
 */
export async function storeWorkoutSession(session: WorkoutSession): Promise<void> {
  const database = await ensureDB();
  await database.put('workout-sessions', session);
}
      
/**
 * Retrieves all workout sessions for a specific program.
 */
export async function getWorkoutSessions(programId: string): Promise<WorkoutSession[]> {
  const database = await ensureDB();
  return await database.getAllFromIndex('workout-sessions', 'programId', programId);
}
