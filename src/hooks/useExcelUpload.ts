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

export function useExcelUpload(onSuccess?: () => void): UseExcelUploadResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setIsLoading(false);
    setError(null);
    setSuccess(false);
  };

  const validateFile = (file: File): boolean => {
    // Validate file extension
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(fileExtension)) {
      setError('Please upload an Excel file (.xlsx or .xls)');
      return false;
    }
    
    // Validate MIME type
    const validMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    if (!validMimeTypes.includes(file.type)) {
      setError('Invalid file format. Please upload a valid Excel file');
      return false;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('File size exceeds 5MB limit');
      return false;
    }

    return true;
  };

  const uploadExcel = async (file: File): Promise<void> => {
    reset();
    
    if (!validateFile(file)) return;

    setIsLoading(true);
    
    try {
      const program: WorkoutProgram = await parseExcelFile(file);
      await storeWorkoutProgram(program);
      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, error, success, uploadExcel, reset };
}