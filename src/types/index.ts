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
  week: string; // Add 'week' property
  exercises: Exercise[];
}

export interface WorkoutProgram {
  id: string; // UUID
  name: string; // User-provided name
  workouts: any[]; // Replace with proper workout type
  history: any[]; // Replace with proper history type
  createdAt?: any; // Timestamp for creation date
  updatedAt?: any; // Timestamp for last update
  userId?: string; // ID of the user who owns this program
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
