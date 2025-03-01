import { WorkoutProgram, WorkoutSession } from '../../types';

/**
 * Interface for storage service
 * Provides methods for storing and retrieving workout data
 */
export interface IStorageService {
  /**
   * Initialize the storage
   * @returns Promise resolving when initialization is complete
   */
  initStorage(): Promise<void>;

  /**
   * Store a workout program
   * @param program The workout program to store
   * @returns Promise resolving when the operation is complete
   */
  storeWorkoutProgram(program: WorkoutProgram): Promise<void>;

  /**
   * Get a workout program by ID
   * @param id The ID of the workout program
   * @returns Promise resolving to the workout program or undefined if not found
   */
  getWorkoutProgram(id: string): Promise<WorkoutProgram | undefined>;

  /**
   * Get all workout programs
   * @returns Promise resolving to an array of workout programs
   */
  getAllWorkoutPrograms(): Promise<WorkoutProgram[]>;

  /**
   * Delete a workout program by ID
   * @param id The ID of the workout program to delete
   * @returns Promise resolving when the operation is complete
   */
  deleteWorkoutProgram(id: string): Promise<void>;

  /**
   * Store a workout session
   * @param session The workout session to store
   * @returns Promise resolving when the operation is complete
   */
  storeWorkoutSession(session: WorkoutSession): Promise<void>;

  /**
   * Get all workout sessions for a specific program
   * @param programId The ID of the workout program
   * @returns Promise resolving to an array of workout sessions
   */
  getWorkoutSessions(programId: string): Promise<WorkoutSession[]>;
}