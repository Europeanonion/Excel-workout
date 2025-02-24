import React, { useState, useEffect } from 'react';
import { WorkoutProgram, type Workout, type Exercise } from '../../types';
import { getWorkoutProgram } from '../../lib/indexedDB';
import { WorkoutSession } from '../WorkoutSession';
import styles from './workout-details.module.css';

interface Props {
  programId: string;
}

const WorkoutComponent: React.FC<{ workout: Workout; programId: string }> = ({ workout, programId }) => (
  <div className={styles.workout} role="group" aria-labelledby={`workout-${workout.week}-${workout.day}`}>
    <h3 id={`workout-${workout.week}-${workout.day}`}>{workout.week} - {workout.day}</h3>
    <WorkoutSession workout={workout} programId={programId} />
    {workout.exercises.map((exercise, index) => (
      <ExerciseComponent key={index} exercise={exercise} />
    ))}
  </div>
);

const ExerciseComponent: React.FC<{ exercise: Exercise }> = ({ exercise }) => (
  <div className={styles.exercise} role="group" aria-label={`Exercise: ${exercise.name}`}>
    <h4>{exercise.name}</h4>
    <p>Warmup Sets: {exercise.warmupSets ?? 'N/A'}</p>
    <p>Working Sets: {exercise.workingSets ?? 'N/A'}</p>
    <p>Reps: {exercise.reps ?? 'N/A'}</p>
    <p>Load: {exercise.load ?? 'N/A'}</p>
    <p>RPE: {exercise.rpe ?? 'N/A'}</p>
    <p>Rest: {exercise.rest ?? 'N/A'}</p>
    <p>Substitution 1: {exercise.substitution1 ?? 'N/A'}</p>
    <p>Substitution 2: {exercise.substitution2 ?? 'N/A'}</p>
    <p>Notes: {exercise.notes ?? 'N/A'}</p>
  </div>
);

export const WorkoutDetails: React.FC<Props> = ({ programId }) => {
  const [program, setProgram] = useState<WorkoutProgram | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProgram = async () => {
      try {
        const loadedProgram = await getWorkoutProgram(programId);
        if (loadedProgram) {
          setProgram(loadedProgram);
        } else {
          setError('Workout program not found.');
        }
      } catch (err) {
        setError('Failed to load workout program. Please try again later.');
        if (err instanceof Error) {
            console.error('Error loading program:', err.message);
        } else {
            console.error('Error loading program:', err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadProgram();
  }, [programId]);

  if (isLoading) {
    return (
      <div className={styles.loading} role="status" aria-label="Loading workout program">
        <div className={styles.spinner} />
        <span className={styles.loadingText}>Loading program...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error} role="alert">
        {error}
      </div>
    );
  }

  if (!program) {
    return null; // Or a "Not Found" message
  }

  return (
    <div className={styles.container} role="region" aria-label={`Workout Details for ${program.name}`}>
      <h2>{program.name}</h2>
      {program.workouts.map((workout, index) => (
        <WorkoutComponent key={index} workout={workout} programId={programId} />
      ))}
      <h3 id="workout-history">Workout History</h3>
      {program.history.length > 0 ? (
        <ul aria-labelledby="workout-history">
          {program.history.map((session, index) => (
            <li key={index}>{new Date(session.date).toLocaleDateString()}</li>
          ))}
        </ul>
      ) : (
        <p>No workout history yet.</p>
      )}
    </div>
  );
};
