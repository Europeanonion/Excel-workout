import React, { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { ExcelUploader } from './components/ExcelUploader';
import { ProgramList } from './components/ProgramList';
import { WorkoutDetails } from './components/WorkoutDetails';
import './App.css';

function App() {
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

  return (
    <BrowserRouter>
      <div className="App">
        <header className="App-header">
          <h1>Excel Workout PWA</h1>
          <p>Track and manage your workout programs</p>
        </header>
        
        <main className="App-main">
          <Routes>
            <Route path="/" element={(
              <>
                <section className="App-section">
                  <h2 className="section-title">Upload Program</h2>
                  <ExcelUploader
                    onUploadSuccess={handleUploadSuccess}
                    onUploadError={handleUploadError}
                  />
                  
                  {message && (
                    <div 
                      className={`App-message ${messageType}`}
                      role="status"
                      aria-live="polite"
                    >
                      {message}
                    </div>
                  )}
                </section>

                <section className="App-section">
                  <ProgramList key={refreshTrigger} />
                </section>
              </>
            )} />
            <Route path="/program/:programId" element={<WorkoutDetailsWrapper />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
