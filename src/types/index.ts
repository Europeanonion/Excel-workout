
export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  load: number;
  rpe: number;
  rest: number;
  notes: string | null;
  substitution1?: string | null;
  substitution2?: string | null;
  warmupSets?: number;
  workingSets?: number;
}

export interface Workout {
  name: string;
  day: string;
  week?: string; // Optional week property
  exercises: Exercise[];
}

/**
 * Configuration for custom column mapping
 */
export interface ColumnMappingConfig {
  workout?: string;
  exercise?: string;
  sets?: string;
  reps?: string;
  load?: string;
  rpe?: string;
  rest?: string;
  notes?: string;
}

export interface WorkoutProgram {
  id: string; // UUID
  name: string; // User-provided name
  workouts: Workout[]; // Array of workouts
  history: any[]; // Replace with proper history type
  userId?: string; // Firebase user ID (optional for local-only programs)
  createdAt?: any; // Timestamp for creation date
  updatedAt?: any; // Timestamp for last update
}

export interface WorkoutSession {
  sessionId: string; // UUID
  programId: string; // ID of the associated WorkoutProgram
  date: string; // ISO 8601 format
  workoutName: string; // e.g., "Push #1"
  exercises: CompletedExercise[];
  totalLoad: number;
  notes: string | null;
}

export interface CompletedExercise {
  exerciseName: string;
  sets: CompletedSet[];
}

export interface CompletedSet {
  reps: number;
  load: number | null;
  rpe: number | null;
}
