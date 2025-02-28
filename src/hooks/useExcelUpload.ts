import { useState, useCallback } from 'react';
import { parseExcelFile } from '../features/excelParsing/excelParser';
import { WorkoutProgram } from '../types';
import { storeWorkoutProgram } from '../lib/indexedDB';

/**
 * Interface for the return value of the useExcelUpload hook
 */
export interface UseExcelUploadResult {
  /** Whether a file is currently being processed */
  isLoading: boolean;
  /** Error message if file processing failed */
  error: string | null;
  /** Whether file processing was successful */
  success: boolean;
  /** Function to upload and process an Excel file */
  uploadExcel: (file: File) => Promise<void>;
  /** Function to reset the state */
  reset: () => void;
}

/**
 * Custom hook for handling Excel file uploads with validation and processing
 * @param onSuccess Optional callback function to be called on successful upload
 * @returns Object containing state and functions for Excel file handling
 */
export function useExcelUpload(onSuccess?: () => void): UseExcelUploadResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Reset all state values
   */
  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setSuccess(false);
  }, []);

  /**
   * Validate the file before processing
   * @param file The file to validate
   * @returns boolean indicating if the file is valid
   */
  const validateFile = useCallback((file: File): boolean => {
    // Validate file extension
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(fileExtension)) {
      setError(`Please select a valid file (${validExtensions.join(', ')})`);
      return false;
    }
    
    // Validate MIME type
    const validMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/csv'
    ];
    if (!validMimeTypes.includes(file.type) && file.type !== '') {
      setError(`Invalid file type: ${file.type}. Please select a valid Excel or CSV file.`);
      return false;
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError(`File is too large. Maximum size is 5MB.`);
      return false;
    }
    
    return true;
  }, []);

  /**
   * Upload and process an Excel file
   * @param file The file to upload and process
   */
  const uploadExcel = useCallback(async (file: File): Promise<void> => {
    reset();
    
    if (!validateFile(file)) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const program: WorkoutProgram = await parseExcelFile(file);
      await storeWorkoutProgram(program);
      setSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'An unknown error occurred while processing the file';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess, reset, validateFile]);

  return {
    isLoading,
    error,
    success,
    uploadExcel,
    reset
  };
}