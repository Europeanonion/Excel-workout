import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { ExcelUploader } from './components/ExcelUploader';
import { ProgramList } from './components/ProgramList';
import { WorkoutDetails } from './components/WorkoutDetails';
import { initDB, getAllWorkoutPrograms } from './lib/indexedDB';
import type { WorkoutProgram } from './types';
import './App.css';

/**
 * Main application content component.
 * Handles database initialization, program loading, and UI state.
 */
export function AppContent() {
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);

  // Initialize IndexedDB
  useEffect(() => {
    const initializeDB = async () => {
      try {
        await initDB();
        setDbInitialized(true);
      } catch (error) {
        console.error("Failed to initialize IndexedDB:", error);
        // Still set initialized to true to allow the app to proceed
        // The individual components will handle their own errors
        setDbInitialized(true);
      }
    };
    initializeDB();
  }, []);

  // Load programs after DB is initialized
  useEffect(() => {
    if (!dbInitialized) return;
    
    const loadPrograms = async () => {
      try {
        const loadedPrograms = await getAllWorkoutPrograms();
        setPrograms(loadedPrograms);
      } catch (error) {
        console.error("Failed to load programs:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPrograms();
  }, [refreshTrigger, dbInitialized]);

  const handleUploadSuccess = useCallback(() => {
    setMessage('Workout program uploaded successfully!');
    setMessageType('success');
    // Trigger ProgramList refresh
    setRefreshTrigger(prev => prev + 1);
    // Clear message after 5 seconds
    setTimeout(() => {
      setMessage(null);
      setMessageType(null);
    }, 5000);
  }, []);

  const handleUploadError = useCallback((error: Error) => {
    setMessage(error.message);
    setMessageType('error');
  }, []);

  const WorkoutDetailsWrapper = () => {
    const { programId } = useParams<{ programId: string }>();
    return <WorkoutDetails programId={programId || ''} />;
  };

  // Show loading state while DB is initializing
  if (!dbInitialized) {
    return (
      <div className="App">
        <header role="banner">
          <h1>Excel Workout PWA</h1>
          <p>Track and manage your workout programs</p>
        </header>
        <main>
          <p>Initializing application...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="App">
      <header role="banner">
        <h1>Excel Workout PWA</h1>
        <p>Track and manage your workout programs</p>
      </header>

      <main>
        {message && (
          <div
            className={`message ${messageType}`}
            role="status"
            aria-live="polite"
          >
            {message}
          </div>
        )}
        
        <section role="region" aria-label="Excel file upload">
          <ExcelUploader
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        </section>

        <section role="region" aria-label="Workout Programs">
          {isLoading ? (
            <p>Loading programs...</p>
          ) : (
            programs.length === 0 ? (
              <>
                <p>No workout programs found.</p>
                <p>Upload an Excel file to get started.</p>
              </>
            ) : (
              <ProgramList key={refreshTrigger} />
            )
          )}
        </section>
      </main>
    </div>
  );
}

/**
 * Root application component.
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="/program/:programId" element={<WorkoutDetailsWrapper />} />
      </Routes>
    </BrowserRouter>
  );
}

/**
 * Wrapper component for WorkoutDetails to handle route parameters.
 */
export function WorkoutDetailsWrapper() {
  const { programId } = useParams<{ programId: string }>();
  return <WorkoutDetails programId={programId || ''} />;
}

export default App;
