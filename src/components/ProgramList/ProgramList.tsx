import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkoutProgram } from '../../types';
import { getAllWorkoutPrograms } from '../../lib/indexedDB';
import styles from './program-list.module.css';

interface ProgramListProps {
  programs?: WorkoutProgram[];
}

export const ProgramList: React.FC<ProgramListProps> = ({ programs: propPrograms }) => {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If programs are provided as props, use them directly
    if (propPrograms) {
      setPrograms(propPrograms);
      setIsLoading(false);
      return;
    }

    // Otherwise load from IndexedDB
    const loadPrograms = async () => {
      try {
        const loadedPrograms = await getAllWorkoutPrograms();
        setPrograms(loadedPrograms);
      } catch (err) {
        setError('Failed to load workout programs. Please try again later.');
        console.error('Error loading programs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPrograms();
  }, [propPrograms]);

  if (isLoading) {
    return (
      <div 
        className={styles.loading}
        role="status"
        aria-label="Loading workout programs"
      >
        <div className={styles.spinner} />
        <span className={styles.loadingText}>Loading programs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className={styles.error}
        role="alert"
      >
        {error}
      </div>
    );
  }

  if (!programs || programs.length === 0) {
    return (
      <div 
        className={styles.empty}
        role="status"
      >
        <p>No workout programs found.</p>
        <p>Upload an Excel file to get started.</p>
      </div>
    );
  }

  return (
    <div 
      className={styles.container}
      role="region"
      aria-label="Workout Programs"
    >
      <h2 className={styles.title}>Your Workout Programs</h2>
      <ul className={styles.list}>
        {programs.map(program => (
          <li 
            key={program.id}
            className={styles.item}
          >
            <div className={styles.programHeader}>
              <h3 className={styles.programName}>{program.name}</h3>
              <span className={styles.workoutCount}>
                {program.workouts.length} workouts
              </span>
            </div>
            
            <div className={styles.programStats}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Last workout:</span>
                <span className={styles.statValue}>
                  {program.history.length > 0
                    ? new Date(program.history[program.history.length - 1].date).toLocaleDateString()
                    : 'Not started'}
                </span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Completed:</span>
                <span className={styles.statValue}>
                  {program.history.length} sessions
                </span>
              </div>
            </div>

            <button
              className={styles.viewButton}
              onClick={() => navigate(`/program/${program.id}`)}
              aria-label={`View ${program.name} details`}
            >
              View Program
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
