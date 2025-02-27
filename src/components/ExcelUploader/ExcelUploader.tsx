import React, { useState, useCallback, useRef } from 'react';
import { useExcelUpload } from '../../hooks/useExcelUpload';
import styles from './excel-uploader.module.css';

interface ExcelUploaderProps {
  onUploadSuccess?: () => void;
  onUploadError?: (error: Error) => void;
}

/**
 * Component for uploading Excel files containing workout programs.
 * Handles file validation, parsing, and error handling.
 */
export const ExcelUploader: React.FC<ExcelUploaderProps> = ({
  onUploadSuccess,
  onUploadError
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { isLoading, error, success, uploadExcel, reset } = useExcelUpload(() => {
    onUploadSuccess?.();
  });

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await uploadExcel(file);
    
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [uploadExcel]);

  const handleReset = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    reset();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await uploadExcel(files[0]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownloadTemplate = () => {
    const templateUrl = '/workout-template.xlsx';
    const link = document.createElement('a');
    link.href = templateUrl;
    link.download = 'workout-template.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Report errors to parent component if needed
  React.useEffect(() => {
    if (error && onUploadError) {
      onUploadError(new Error(error));
    }
  }, [error, onUploadError]);

  return (
    <div className={styles.container}>
      <h2>Upload Workout Excel File</h2>
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
            <label htmlFor="excel-file" className={styles.fileLabel}>
              Choose Excel File (.xlsx, .xls)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              id="excel-file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={isLoading}
              className={styles.fileInput}
              aria-label="Upload Excel file"
              aria-busy={isLoading}
              aria-describedby="file-upload-status"
            />
          </div>
        </div>
        
        <div className={styles.buttonGroup}>
          <button 
            onClick={handleReset} 
            className={styles.resetButton}
            disabled={isLoading}
          >
            Reset
          </button>
          <button 
            onClick={handleDownloadTemplate} 
            className={styles.templateButton}
            disabled={isLoading}
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
          {success && <p className={styles.success}>File processed successfully!</p>}
        </div>
      </div>
      
      <div className={styles.helpText}>
        Supported formats: .xlsx, .xls (max 5MB)
      </div>
    </div>
  );
};
