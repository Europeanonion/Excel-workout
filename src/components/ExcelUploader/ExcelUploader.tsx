import React, { useRef, useState } from 'react';
import { useExcelUpload } from '../../hooks/useExcelUpload';
import { ColumnMappingConfig, WorkoutProgram } from '../../types';
import styles from './excel-uploader.module.css';

interface ExcelUploaderProps {
  onUploadSuccess?: () => void;
  onUploadError?: (error: Error) => void;
}

/**
 * Component for uploading Excel files containing workout programs.
 * Handles file validation, parsing, preview, and error handling.
 * Supports drag and drop, file type validation, and template download.
 */
export const ExcelUploader: React.FC<ExcelUploaderProps> = ({
  onUploadSuccess,
  onUploadError
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showColumnMapping, setShowColumnMapping] = useState(false);
  const [columnMapping, setColumnMapping] = useState<ColumnMappingConfig>({
    workout: 'workout',
    exercise: 'exercise',
    sets: 'sets',
    reps: 'reps',
    load: 'load',
    rpe: 'rpe',
    rest: 'rest',
    notes: 'notes'
  });
  
  // Use our custom hook for file handling
  const {
    isLoading,
    error,
    success,
    previewData,
    uploadExcel,
    confirmUpload,
    reset
  } = useExcelUpload(onUploadSuccess);

  /**
   * Handle file selection from input
   */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        await uploadExcel(files[0], showColumnMapping ? columnMapping : undefined);
        
        // If there's an error callback and an error occurred, call it
        if (error && onUploadError) {
          onUploadError(new Error(error));
        }
      } finally {
        // Clear file input after processing
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  /**
   * Handle drag enter event
   */
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  /**
   * Handle drag leave event
   */
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  /**
   * Handle drag over event
   */
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  /**
   * Handle drop event
   */
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      try {
        await uploadExcel(files[0], showColumnMapping ? columnMapping : undefined);
        
        // If there's an error callback and an error occurred, call it
        if (error && onUploadError) {
          onUploadError(new Error(error));
        }
      } finally {
        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  /**
   * Reset the file input and state
   */
  const handleReset = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    reset();
  };

  /**
   * Download the template file
   */
  const handleDownloadTemplate = () => {
    const templateUrl = '/templates/workout-template.csv';
    const link = document.createElement('a');
    link.href = templateUrl;
    link.download = 'workout-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Handle column mapping change
   */
  const handleColumnMappingChange = (field: keyof ColumnMappingConfig, value: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Toggle column mapping visibility
   */
  const toggleColumnMapping = () => {
    setShowColumnMapping(!showColumnMapping);
  };

  /**
   * Handle confirmation of preview data
   */
  const handleConfirmUpload = async () => {
    await confirmUpload();
  };

  /**
   * Render preview of the parsed data
   */
  const renderPreview = (data: WorkoutProgram) => {
    return (
      <div className={styles.previewContainer}>
        <h3>Preview: {data.name}</h3>
        <div className={styles.previewContent}>
          <p><strong>Program ID:</strong> {data.id}</p>
          <p><strong>Workouts:</strong> {data.workouts.length}</p>
          <div className={styles.workoutsList}>
            {data.workouts.map((workout, index) => (
              <div key={index} className={styles.workoutPreview}>
                <h4>{workout.name}</h4>
                <p>{workout.exercises.length} exercises</p>
              </div>
            ))}
          </div>
        </div>
        <button 
          onClick={handleConfirmUpload}
          className={styles.confirmButton}
          disabled={isLoading}
        >
          Confirm and Save
        </button>
        <button 
          onClick={handleReset}
          className={styles.resetButton}
          disabled={isLoading}
        >
          Cancel
        </button>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <h2>Upload Workout Excel File</h2>
      
      {!previewData ? (
        <>
          <div className={styles.optionsContainer}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={showColumnMapping}
                onChange={toggleColumnMapping}
                className={styles.checkbox}
              />
              Customize Column Mapping
            </label>
          </div>

          {showColumnMapping && (
            <div className={styles.columnMappingContainer}>
              <h3>Column Mapping</h3>
              <p className={styles.mappingHelp}>
                Specify the column names in your Excel file that correspond to each required field.
              </p>
              <div className={styles.mappingGrid}>
                {Object.entries(columnMapping).map(([key, value]) => (
                  <div key={key} className={styles.mappingRow}>
                    <label htmlFor={`mapping-${key}`}>{key.charAt(0).toUpperCase() + key.slice(1)}:</label>
                    <input
                      id={`mapping-${key}`}
                      type="text"
                      value={value}
                      onChange={(e) => handleColumnMappingChange(key as keyof ColumnMappingConfig, e.target.value)}
                      className={styles.mappingInput}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            className={`${styles.uploaderCard} ${isDragging ? styles.dragging : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className={styles.dropZone}>
              <p>Drag and drop your Excel file here, or</p>
              
              <div className={styles.inputGroup}>
                <label htmlFor="excel-file" className={styles.uploadLabel}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="excel-file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    disabled={isLoading}
                    className={styles.fileInput}
                    aria-label="Upload Excel file"
                    aria-busy={isLoading}
                    aria-describedby="file-upload-status"
                  />
                  <span className={styles.uploadButton}>
                    Choose Excel File
                  </span>
                </label>
              </div>
            </div>
            
            <div className={styles.buttonGroup}>
              <button
                onClick={handleReset}
                className={styles.resetButton}
                disabled={isLoading}
                aria-label="Reset file selection"
              >
                Reset
              </button>
              <button
                onClick={handleDownloadTemplate}
                className={styles.templateButton}
                disabled={isLoading}
                aria-label="Download template file"
              >
                Download Template
              </button>
            </div>
            
            <div id="file-upload-status" className={styles.status}>
              {isLoading && (
                <div className={styles.loadingContainer}>
                  <p className={styles.loading}>Processing your file...</p>
                  <div className={styles.progressBar}>
                    <div className={styles.progressIndicator}></div>
                  </div>
                </div>
              )}
              {error && <p className={styles.error} role="alert">{error}</p>}
              {success && <p className={styles.success} role="status">File processed successfully!</p>}
            </div>
          </div>
          
          <div className={styles.helpText}>
            Supported formats: .xlsx, .xls, .csv
          </div>
        </>
      ) : (
        renderPreview(previewData)
      )}
    </div>
  );
};
