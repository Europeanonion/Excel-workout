import { useState } from 'react';
import { parseExcelFile } from '../features/excelParsing/excelParser';
import { WorkoutProgram } from '../types';
import { storeWorkoutProgram } from '../lib/indexedDB';

interface UseExcelUploadResult {
  isLoading: boolean;
  error: string | null;
  success: boolean;
  uploadExcel: (file: File) => Promise<void>;
  reset: () => void;
}

/**
 * Custom hook for handling Excel file uploads.
 * Provides file validation, parsing, and error handling functionality.
 */
export function useExcelUpload(onSuccess?: () => void): UseExcelUploadResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setIsLoading(false);
    setError(null);
    setSuccess(false);
  };

  /**
   * Validates the file type, MIME type, and size.
   */
  const validateFile = (file: File): boolean => {
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
      setError(`Invalid file type: ${file.type}. Please select an Excel or CSV file.`);
      return false;
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('File is too large. Maximum size is 5MB.');
      return false;
    }
    
    return true;
  };

  /**
   * Uploads and processes an Excel file.
   */
  const uploadExcel = async (file: File): Promise<void> => {
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
  };

  return {
    isLoading,
    error,
    success,
    uploadExcel,
    reset
  };
}