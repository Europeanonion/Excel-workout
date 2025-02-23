export interface WorkoutProgram {
  id: string; // UUID
  name: string; // User-provided name
  workouts: Workout[]; // The workout template
  history: WorkoutSession[]; // Completed workout sessions
}

export interface Workout {
  week: string;
  day: string; // "Push #1", "Pull #2", etc.
  exercises: Exercise[];
}

export interface Exercise {
  name: string;
  warmupSets: string | number | null | undefined;
  workingSets: string | number | null | undefined;
  reps: string | null | undefined;
  load: string | number | null | undefined;
  rpe: string | number | null | undefined;
  rest: string | number | null | undefined;
  substitution1: string | number | null | undefined;
  substitution2: string | number | null | undefined;
  notes: string | number | null | undefined;
}

export interface WorkoutSession {
  sessionId: string; // UUID
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
