import React, { useState, useCallback, useEffect } from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import { ExcelUploader } from './components/ExcelUploader';
import { ProgramList } from './components/ProgramList';
import { WorkoutDetails } from './components/WorkoutDetails';
import { serviceFactory } from './services';
import type { WorkoutProgram } from './types';
import { AuthProvider } from './components/Auth/AuthContext';
import './App.css';

/**
 * Main application content component.
 * Handles service initialization, program loading, and UI state.
 */
export function AppContent() {
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [servicesInitialized, setServicesInitialized] = useState(false);
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize all services
        await serviceFactory.initializeServices();
        setServicesInitialized(true);
      } catch (error) {
        console.error("Failed to initialize services:", error);
        // Still set initialized to true to allow the app to proceed
        // The individual components will handle their own errors
        setServicesInitialized(true);
      }
    };
    initializeServices();
  }, []);

  // Load programs after services are initialized
  useEffect(() => {
    if (!servicesInitialized) return;
    
    const loadPrograms = async () => {
      try {
        // Get the local storage service
        const storageService = serviceFactory.getLocalStorageService();
        
        // Get all workout programs
        const loadedPrograms = await storageService.getAllWorkoutPrograms();
        setPrograms(loadedPrograms);
      } catch (error) {
        console.error("Failed to load programs:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPrograms();
  }, [refreshTrigger, servicesInitialized]);

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

  // Show loading state while services are initializing
  if (!servicesInitialized) {
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
            !programs || programs.length === 0 ? (
              <>
                <p>No workout programs found.</p>
                <p>Upload an Excel file to get started.</p>
              </>
            ) : (
              <ProgramList key={`program-list-${refreshTrigger}`} programs={programs} />
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
    <AuthProvider>
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="/program/:programId" element={<WorkoutDetailsWrapper />} />
      </Routes>
    </AuthProvider>
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
