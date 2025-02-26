import React, { useState, useCallback } from 'react';
import { parseExcelFile } from '../../features/excelParsing/excelParser';
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset state
    setIsLoading(true);
    setError(null);

    try {
      // Validate file type
      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        throw new Error('Please upload an Excel file (.xlsx or .xls)');
      }

      // Parse the file
      await parseExcelFile(file);
      
      // Clear the input
      event.target.value = '';
      
      // Notify success
      onUploadSuccess?.();
    } catch (err) {
      // Extract error message
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      
      // Always set the error state for display
      setError(message);
      
      // Call the error callback if provided
      if (onUploadError) {
        onUploadError(err instanceof Error ? err : new Error(message));
      }
    } finally {
      setIsLoading(false);
    }
  }, [onUploadSuccess, onUploadError]);

  return (
    <div className={styles.container} role="region" aria-label="Excel file upload">
      <label className={styles.uploadLabel}>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          disabled={isLoading}
          className={styles.fileInput}
          aria-label="Choose Excel file"
          aria-describedby={error ? 'upload-error' : undefined}
        />
        <span className={styles.uploadButton}>
          {isLoading ? 'Processing...' : 'Choose Excel File'}
        </span>
      </label>
      
      {error && (
        <div
          id="upload-error"
          className={styles.error}
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}
      
      <div className={styles.helpText}>
        Supported formats: .xlsx, .xls
      </div>
    </div>
  );
};
