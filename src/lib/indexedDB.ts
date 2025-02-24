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

export async function initDB() {
  db = await openDB<WorkoutDB>('workout-db', 1, {
    upgrade(db) {
      db.createObjectStore('workout-programs', { keyPath: 'id' });
      const sessionStore = db.createObjectStore('workout-sessions', { keyPath: 'sessionId' });
      sessionStore.createIndex('programId', 'programId');
    },
  });
}

export async function storeWorkoutProgram(program: WorkoutProgram): Promise<void> {
  await db.put('workout-programs', program);
}

export async function getWorkoutProgram(id: string): Promise<WorkoutProgram | undefined> {
  return await db.get('workout-programs', id);
}

export async function getAllWorkoutPrograms(): Promise<WorkoutProgram[]> {
  return await db.getAll('workout-programs');
}

export async function deleteWorkoutProgram(id: string): Promise<void> {
  await db.delete('workout-programs', id);
}

export async function storeWorkoutSession(session: WorkoutSession): Promise<void> {
    await db.put('workout-sessions', session);
}
      
export async function getWorkoutSessions(programId: string): Promise<WorkoutSession[]> {
    return await db.getAllFromIndex('workout-sessions', 'programId', programId);
}
