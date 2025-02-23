import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { WorkoutProgram } from '../types';

interface WorkoutDB extends DBSchema {
    'workout-programs': {
        key: string;
        value: WorkoutProgram;
    };
}

let db: IDBPDatabase<WorkoutDB>;

export async function initDB() {
    db = await openDB<WorkoutDB>('workout-db', 1, {
        upgrade(db) {
            db.createObjectStore('workout-programs', { keyPath: 'id' });
        },
    });
}

// Add functions for storing, retrieving, and deleting workout programs here.

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
