import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './workout-session.module.css';
import type { Workout, CompletedSet, CompletedExercise, WorkoutSession as WorkoutSessionType } from '../../types';
import { storeWorkoutSession, getWorkoutProgram, storeWorkoutProgram } from '../../lib/indexedDB';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  workout: Workout;
  programId: string;
  onSessionComplete?: () => void;
}

interface DragInfo {
  exerciseName: string;
  setIndex: number;
}

export const WorkoutSession: React.FC<Props> = ({ workout, programId, onSessionComplete }) => {
  const [completedSets, setCompletedSets] = useState<{ [exerciseName: string]: CompletedSet[] }>({});
  const [notes, setNotes] = useState<{ [exerciseName: string]: string }>({});
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [isFinished, setIsFinished] = useState(false);
  const [timer, setTimer] = useState<{ active: boolean; seconds: number; targetExercise: string | null }>({
    active: false,
    seconds: 0,
    targetExercise: null,
  });
  const [customRestTime, setCustomRestTime] = useState<number>(60);
  const [draggedSet, setDraggedSet] = useState<DragInfo | null>(null);
  const [workoutProgress, setWorkoutProgress] = useState<number>(0);
  
  // Refs for drag and drop
  const dragSourceRef = useRef<HTMLDivElement | null>(null);
  const dragTargetRef = useRef<HTMLDivElement | null>(null);

  // Calculate overall workout progress
  useEffect(() => {
    const totalExercises = workout.exercises.length;
    if (totalExercises === 0) return;
    
    let completedExercisesCount = 0;
    
    workout.exercises.forEach(exercise => {
      const progress = calculateExerciseProgress(exercise.name);
      if (progress === 100) {
        completedExercisesCount++;
      } else if (progress > 0) {
        // Partial credit for exercises in progress
        completedExercisesCount += progress / 100;
      }
    });
    
    const progress = Math.round((completedExercisesCount / totalExercises) * 100);
    setWorkoutProgress(progress);
  }, [completedSets, workout.exercises]);

  // Timer functionality
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (timer.active && timer.seconds > 0) {
      interval = setInterval(() => {
        setTimer(prev => ({
          ...prev,
          seconds: prev.seconds - 1
        }));
      }, 1000);
    } else if (timer.active && timer.seconds === 0) {
      // Timer finished
      setTimer(prev => ({
        ...prev,
        active: false
      }));
      
      // Play sound or show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Rest Timer Complete', {
          body: 'Time to start your next set!'
        });
      } else {
        // Fallback for browsers without notification support
        const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
        audio.play().catch(e => console.log('Audio play failed:', e));
      }
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  const startTimer = useCallback((exerciseName: string | null, restTime: number = 0) => {
    // Use custom rest time if provided, otherwise use the exercise's default rest time
    const timeToUse = restTime > 0 ? restTime :
      (exerciseName ?
        workout.exercises.find(e => e.name === exerciseName)?.rest || customRestTime :
        customRestTime);
    
    setTimer({
      active: true,
      seconds: timeToUse,
      targetExercise: exerciseName
    });
  }, [workout.exercises, customRestTime]);

  const stopTimer = useCallback(() => {
    setTimer(prev => ({
      ...prev,
      active: false
    }));
  }, []);

  const resetTimer = useCallback((exerciseName: string | null, restTime: number = 0) => {
    // Use custom rest time if provided, otherwise use the exercise's default rest time
    const timeToUse = restTime > 0 ? restTime :
      (exerciseName ?
        workout.exercises.find(e => e.name === exerciseName)?.rest || customRestTime :
        customRestTime);
    
    setTimer({
      active: false,
      seconds: timeToUse,
      targetExercise: exerciseName
    });
  }, [workout.exercises, customRestTime]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Drag and drop handlers
  const handleDragStart = (exerciseName: string, setIndex: number, e: React.DragEvent<HTMLDivElement>) => {
    setDraggedSet({ exerciseName, setIndex });
    dragSourceRef.current = e.currentTarget;
    e.currentTarget.classList.add(styles.setDragging);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    if (dragSourceRef.current) {
      dragSourceRef.current.classList.remove(styles.setDragging);
    }
    setDraggedSet(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragTargetRef.current = e.currentTarget;
  };

  const handleDrop = (exerciseName: string, targetIndex: number, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (!draggedSet) return;
    
    // Only allow reordering within the same exercise
    if (draggedSet.exerciseName !== exerciseName) return;
    
    // Reorder the sets
    setCompletedSets(prevSets => {
      const currentSets = [...(prevSets[exerciseName] || [])];
      const [movedSet] = currentSets.splice(draggedSet.setIndex, 1);
      currentSets.splice(targetIndex, 0, movedSet);
      
      return {
        ...prevSets,
        [exerciseName]: currentSets
      };
    });
    
    setDraggedSet(null);
  };

  // Set management functions
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

  const handleRemoveSet = (exerciseName: string, setIndex: number) => {
    setCompletedSets((prevSets) => {
      const currentSets = prevSets[exerciseName] || [];
      const updatedSets = currentSets.filter((_, index) => index !== setIndex);
      return {
        ...prevSets,
        [exerciseName]: updatedSets,
      };
    });
  };

  const handleMoveSet = (exerciseName: string, setIndex: number, direction: 'up' | 'down') => {
    setCompletedSets((prevSets) => {
      const currentSets = [...(prevSets[exerciseName] || [])];
      if (direction === 'up' && setIndex > 0) {
        // Swap with previous set
        [currentSets[setIndex], currentSets[setIndex - 1]] = [currentSets[setIndex - 1], currentSets[setIndex]];
      } else if (direction === 'down' && setIndex < currentSets.length - 1) {
        // Swap with next set
        [currentSets[setIndex], currentSets[setIndex + 1]] = [currentSets[setIndex + 1], currentSets[setIndex]];
      }
      return {
        ...prevSets,
        [exerciseName]: currentSets,
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

  const isSetComplete = (set: CompletedSet): boolean => {
    return set.reps > 0 && set.load !== null && set.rpe !== null;
  };

  const calculateExerciseProgress = (exerciseName: string): number => {
    const sets = completedSets[exerciseName] || [];
    if (sets.length === 0) return 0;
    
    const exercise = workout.exercises.find(e => e.name === exerciseName);
    if (!exercise) return 0;
    
    const completedSetsCount = sets.filter(isSetComplete).length;
    return Math.min(100, Math.round((completedSetsCount / exercise.sets) * 100));
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
      notes: sessionNotes || null,
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
    return (
      <div className={styles.completionMessage}>
        <h2>Workout session completed!</h2>
        <p>Great job! Your workout has been saved.</p>
      </div>
    );
  }

  return (
    <div className={styles.container} role="region" aria-label={`Workout Session for ${workout.day}`}>
      <h2>Workout Session: {workout.day}</h2>
      
      {/* Overall workout progress */}
      <div className={styles.workoutProgressContainer}>
        <div className={styles.workoutProgressText}>
          <span>Overall Progress: {workoutProgress}%</span>
          <span>{workout.exercises.filter(e => calculateExerciseProgress(e.name) === 100).length}/{workout.exercises.length} Exercises Completed</span>
        </div>
        <div className={styles.workoutProgressBar}>
          <div
            className={styles.workoutProgressFill}
            style={{ width: `${workoutProgress}%` }}
            role="progressbar"
            aria-valuenow={workoutProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Overall workout progress: ${workoutProgress}%`}
          />
        </div>
      </div>
      
      {/* Custom rest timer settings */}
      <div className={styles.timerSettings}>
        <label className={styles.timerSettingsLabel}>
          Default Rest Time (seconds):
          <input
            type="number"
            value={customRestTime}
            onChange={(e) => setCustomRestTime(Math.max(5, parseInt(e.target.value, 10) || 60))}
            className={styles.timerSettingsInput}
            min="5"
            step="5"
          />
        </label>
        <button
          className={`${styles.timerButton} ${styles.start}`}
          onClick={() => startTimer(null, customRestTime)}
          disabled={timer.active}
          aria-label="Start global rest timer"
        >
          Start Global Timer
        </button>
      </div>
      
      {timer.active && !timer.targetExercise && (
        <div className={styles.timerContainer}>
          <div className={styles.timerDisplay} aria-live="polite">
            Global Rest: {formatTime(timer.seconds)}
          </div>
          <div className={styles.timerControls}>
            <button
              className={`${styles.timerButton} ${styles.stop}`}
              onClick={stopTimer}
              aria-label="Stop timer"
            >
              Stop
            </button>
            <button
              className={`${styles.timerButton} ${styles.reset}`}
              onClick={() => resetTimer(null, customRestTime)}
              aria-label="Reset timer"
            >
              Reset
            </button>
          </div>
        </div>
      )}
      
      {workout.exercises.map((exercise) => {
        const progress = calculateExerciseProgress(exercise.name);
        const currentSets = completedSets[exercise.name] || [];
        
        return (
          <div key={exercise.name} className={styles.exerciseContainer}>
            <div className={styles.exerciseHeader}>
              <h3>{exercise.name}</h3>
            </div>
            
            <div className={styles.progressContainer}>
              <div className={styles.progressText}>
                <span>Progress: {progress}%</span>
                <span>Sets: {currentSets.filter(isSetComplete).length}/{exercise.sets}</span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progress}%` }}
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Exercise progress: ${progress}%`}
                />
              </div>
            </div>
            
            {timer.active && timer.targetExercise === exercise.name && (
              <div className={styles.timerContainer}>
                <div className={styles.timerDisplay} aria-live="polite">
                  Rest: {formatTime(timer.seconds)}
                </div>
                <button
                  className={`${styles.timerButton} ${styles.stop}`}
                  onClick={stopTimer}
                  aria-label="Stop timer"
                >
                  Stop
                </button>
                <button
                  className={`${styles.timerButton} ${styles.reset}`}
                  onClick={() => resetTimer(exercise.name, exercise.rest)}
                  aria-label="Reset timer"
                >
                  Reset
                </button>
              </div>
            )}
            
            <div className={styles.setsContainer}>
              {currentSets.length > 0 ? (
                currentSets.map((set, index) => (
                  <div
                    key={index}
                    className={`${styles.set} ${isSetComplete(set) ? styles.completedSet : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(exercise.name, index, e)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(exercise.name, index, e)}
                  >
                    <span className={styles.setNumber}>Set {index + 1}:</span>
                    <label className={styles.inputLabel}>
                      Reps:
                      <input
                        type="number"
                        value={set.reps}
                        onChange={(e) =>
                          handleSetChange(exercise.name, index, 'reps', parseInt(e.target.value, 10) || 0)
                        }
                        className={styles.inputField}
                        aria-label={`Reps for set ${index + 1}`}
                        min="0"
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
                        min="0"
                        step="0.5"
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
                        min="0"
                        max="10"
                        step="0.5"
                      />
                    </label>
                    
                    <div className={styles.setControls}>
                      {!timer.active && (
                        <button
                          className={styles.setControlButton}
                          onClick={() => startTimer(exercise.name, exercise.rest)}
                          aria-label={`Start rest timer for ${exercise.rest} seconds`}
                          title="Start rest timer"
                        >
                          ⏱️
                        </button>
                      )}
                      <button
                        className={styles.setControlButton}
                        onClick={() => handleMoveSet(exercise.name, index, 'up')}
                        disabled={index === 0}
                        aria-label="Move set up"
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        className={styles.setControlButton}
                        onClick={() => handleMoveSet(exercise.name, index, 'down')}
                        disabled={index === currentSets.length - 1}
                        aria-label="Move set down"
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button
                        className={styles.setControlButton}
                        onClick={() => handleRemoveSet(exercise.name, index)}
                        aria-label="Remove set"
                        title="Remove set"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className={styles.noSets}>No sets completed yet.</p>
              )}
              
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
                  placeholder="Add notes about this exercise..."
                />
              </label>
            </div>
          </div>
        );
      })}
      
      <div className={styles.sessionNotesContainer}>
        <label className={styles.sessionNotesLabel}>
          Workout Session Notes:
          <textarea
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            className={styles.textareaField}
            aria-label="Workout session notes"
            placeholder="Add notes about the entire workout session..."
          />
        </label>
      </div>
      
      <button className={styles.finishButton} onClick={handleFinishWorkout}>
        Finish Workout
      </button>
    </div>
  );
};
