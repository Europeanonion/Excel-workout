import { IStorageService } from '../../interfaces';
import { WorkoutProgram, WorkoutSession } from '../../../types';

/**
 * Mock implementation of the IStorageService interface for testing
 */
export class MockStorageService implements IStorageService {
  private programs: Map<string, WorkoutProgram> = new Map();
  private sessions: Map<string, WorkoutSession> = new Map();
  private initialized: boolean = false;

  /**
   * Initialize the storage
   * @returns Promise resolving when initialization is complete
   */
  async initStorage(): Promise<void> {
    this.initialized = true;
    return Promise.resolve();
  }

  /**
   * Store a workout program
   * @param program The workout program to store
   * @returns Promise resolving when the operation is complete
   */
  async storeWorkoutProgram(program: WorkoutProgram): Promise<void> {
    this.ensureInitialized();
    this.programs.set(program.id, { ...program });
    return Promise.resolve();
  }

  /**
   * Get a workout program by ID
   * @param id The ID of the workout program
   * @returns Promise resolving to the workout program or undefined if not found
   */
  async getWorkoutProgram(id: string): Promise<WorkoutProgram | undefined> {
    this.ensureInitialized();
    const program = this.programs.get(id);
    return Promise.resolve(program ? { ...program } : undefined);
  }

  /**
   * Get all workout programs
   * @returns Promise resolving to an array of workout programs
   */
  async getAllWorkoutPrograms(): Promise<WorkoutProgram[]> {
    this.ensureInitialized();
    return Promise.resolve(Array.from(this.programs.values()).map(program => ({ ...program })));
  }

  /**
   * Delete a workout program by ID
   * @param id The ID of the workout program to delete
   * @returns Promise resolving when the operation is complete
   */
  async deleteWorkoutProgram(id: string): Promise<void> {
    this.ensureInitialized();
    this.programs.delete(id);
    return Promise.resolve();
  }

  /**
   * Store a workout session
   * @param session The workout session to store
   * @returns Promise resolving when the operation is complete
   */
  async storeWorkoutSession(session: WorkoutSession): Promise<void> {
    this.ensureInitialized();
    this.sessions.set(session.sessionId, { ...session });
    return Promise.resolve();
  }

  /**
   * Get all workout sessions for a specific program
   * @param programId The ID of the workout program
   * @returns Promise resolving to an array of workout sessions
   */
  async getWorkoutSessions(programId: string): Promise<WorkoutSession[]> {
    this.ensureInitialized();
    const programSessions = Array.from(this.sessions.values())
      .filter(session => session.programId === programId)
      .map(session => ({ ...session }));
    return Promise.resolve(programSessions);
  }

  /**
   * Clear all stored data (for testing)
   */
  clear(): void {
    this.programs.clear();
    this.sessions.clear();
  }

  /**
   * Set mock data (for testing)
   * @param programs Array of workout programs to set
   * @param sessions Array of workout sessions to set
   */
  setMockData(programs: WorkoutProgram[] = [], sessions: WorkoutSession[] = []): void {
    this.clear();
    
    for (const program of programs) {
      this.programs.set(program.id, { ...program });
    }
    
    for (const session of sessions) {
      this.sessions.set(session.sessionId, { ...session });
    }
  }

  /**
   * Ensure the storage is initialized
   * @throws Error if the storage is not initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('MockStorageService is not initialized. Call initStorage() first.');
    }
  }
}