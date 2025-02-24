import React, { useState } from 'react';
import styles from './workout-session.module.css';
import type { Workout, CompletedSet, CompletedExercise, WorkoutSession as WorkoutSessionType } from '../../types';
import { storeWorkoutSession, getWorkoutProgram, storeWorkoutProgram } from '../../lib/indexedDB';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  workout: Workout;
  programId: string;
  onSessionComplete?: () => void;
}

export const WorkoutSession: React.FC<Props> = ({ workout, programId, onSessionComplete }) => {
  const [completedSets, setCompletedSets] = useState<{ [exerciseName: string]: CompletedSet[] }>({});
  const [notes, setNotes] = useState<{ [exerciseName: string]: string }>({});
  const [isFinished, setIsFinished] = useState(false);

  const handleAddSet = (exerciseName: string) => {
    setCompletedSets((prevSets) => {
      const currentSets = prevSets[exerciseName] || [];
      const newSet: CompletedSet = { reps: 0, load: null, rpe: null };
      return {
        ...prevSets,
        [exerciseName]: [...currentSets, newSet],
      };
    });
  };

  const handleSetChange = (
    exerciseName: string,
    setIndex: number,
    field: keyof CompletedSet,
    value: number | null
  ) => {
    setCompletedSets((prevSets) => {
      const currentSets = prevSets[exerciseName] || [];
      const updatedSets = currentSets.map((set, index) => {
        if (index === setIndex) {
          return { ...set, [field]: value };
        }
        return set;
      });
      return {
        ...prevSets,
        [exerciseName]: updatedSets,
      };
    });
  };

  const handleNotesChange = (exerciseName: string, value: string) => {
    setNotes((prevNotes) => ({
      ...prevNotes,
      [exerciseName]: value,
    }));
  };

  const handleFinishWorkout = async () => {
    let totalLoad = 0;
    const completedExercises: CompletedExercise[] = workout.exercises.map((exercise) => {
      const sets = completedSets[exercise.name] || [];
      const exerciseTotalLoad = sets.reduce((acc, set) => acc + (set.load || 0) * set.reps, 0);
      totalLoad += exerciseTotalLoad;
        const exerciseNotes = notes[exercise.name] || null;
      return {
        exerciseName: exercise.name,
        sets: sets,
        notes: exerciseNotes,
      };
    });

    const workoutSession: WorkoutSessionType = {
      sessionId: uuidv4(),
      programId,
      date: new Date().toISOString(),
      workoutName: workout.day,
      exercises: completedExercises,
      totalLoad,
      notes: null, // Global notes are not used yet
    };

    try {
      await storeWorkoutSession(workoutSession);

      const program = await getWorkoutProgram(programId);
      if (program) {
        const updatedProgram = {
          ...program,
          history: [...program.history, workoutSession],
        };
        await storeWorkoutProgram(updatedProgram);
      } else {
        console.error('Program not found when trying to update history');
      }

      setIsFinished(true);
      onSessionComplete?.();
    } catch (error) {
      console.error('Failed to store workout session:', error);
    }
  };

  if (isFinished) {
    return <p>Workout session completed!</p>;
  }

  return (
    <div className={styles.container} role="region" aria-label={`Workout Session for ${workout.day}`}>
      <h2>Workout Session: {workout.day}</h2>
      {workout.exercises.map((exercise) => (
        <div key={exercise.name} className={styles.exerciseContainer}>
          <h3>{exercise.name}</h3>
          <div className={styles.setsContainer}>
            <p className={styles.progressIndicator}>
              Set {completedSets[exercise.name]?.length || 0}/{exercise.workingSets || 0}
            </p>
            {completedSets[exercise.name]?.map((set, index) => (
              <div key={index} className={styles.set}>
                <span className={styles.setNumber}>Set {index + 1}:</span>
                <label className={styles.inputLabel}>
                  Reps:
                  <input
                    type="number"
                    value={set.reps}
                    onChange={(e) =>
                      handleSetChange(exercise.name, index, 'reps', parseInt(e.target.value, 10))
                    }
                    className={styles.inputField}
                    aria-label={`Reps for set ${index + 1}`}
                  />
                </label>
                <label className={styles.inputLabel}>
                  Load:
                  <input
                    type="number"
                    value={set.load || ''}
                    onChange={(e) =>
                      handleSetChange(exercise.name, index, 'load', parseFloat(e.target.value) || null)
                    }
                    className={styles.inputField}
                    aria-label={`Load for set ${index + 1}`}
                  />
                </label>
                <label className={styles.inputLabel}>
                  RPE:
                  <input
                    type="number"
                    value={set.rpe || ''}
                    onChange={(e) =>
                      handleSetChange(exercise.name, index, 'rpe', parseFloat(e.target.value) || null)
                    }
                    className={styles.inputField}
                    aria-label={`RPE for set ${index + 1}`}
                  />
                </label>
              </div>
            )) || <p className={styles.noSets}>No sets completed yet.</p>}
            <button
              className={styles.addSetButton}
              onClick={() => handleAddSet(exercise.name)}
              aria-label={`Add set for ${exercise.name}`}
            >
              Add Set
            </button>
          </div>
          <div className={styles.notesContainer}>
            <label className={styles.inputLabel}>
              Notes:
              <textarea
                value={notes[exercise.name] || ''}
                onChange={(e) => handleNotesChange(exercise.name, e.target.value)}
                className={styles.textareaField}
                aria-label={`Notes for ${exercise.name}`}
              />
            </label>
          </div>
        </div>
      ))}
      <button className={styles.finishButton} onClick={handleFinishWorkout}>
        Finish Workout
      </button>
    </div>
  );
};
