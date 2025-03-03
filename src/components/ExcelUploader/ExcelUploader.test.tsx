import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { act } from 'react';
import { ExcelUploader } from './ExcelUploader';
import { parseExcelFile } from '../../features/excelParsing/excelParser';
import { serviceFactory } from '../../services';

jest.mock('../../features/excelParsing/excelParser');
jest.mock('../../services');

describe('ExcelUploader', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('renders upload button and help text', () => {
    render(<ExcelUploader onUploadSuccess={() => {}} onUploadError={() => {}} />);
    expect(screen.getByLabelText('Upload Excel file')).toBeInTheDocument();
    expect(screen.getByText('Choose Excel File')).toBeInTheDocument();
    expect(screen.getByText('Supported formats: .xlsx, .xls, .csv')).toBeInTheDocument();
  });

  it('shows loading state while processing', async () => {
    const mockProgram = {
      id: 'test-id',
      name: 'Test Program',
      workouts: [],
      history: []
    };
    (parseExcelFile as jest.Mock).mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve(mockProgram), 100))
    );
    render(<ExcelUploader onUploadSuccess={mockOnSuccess} onUploadError={mockOnError} />);

    const input = screen.getByLabelText('Upload Excel file');
    const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
    });

    expect(screen.getByText('Processing your file...')).toBeInTheDocument();
    expect(input).toBeDisabled();

    // Wait for the preview to appear
    await waitFor(() => {
        expect(screen.getByText('Preview: Test Program')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('handles successful file upload and confirmation', async () => {
    const mockProgram = {
      id: 'test-id',
      name: 'Test Program',
      workouts: [],
      history: []
    };
    
    // Mock the parseExcelFile function
    (parseExcelFile as jest.Mock).mockResolvedValue(mockProgram);
    
    // Mock the storage service
    const mockStorageService = {
      storeWorkoutProgram: jest.fn().mockResolvedValue(undefined)
    };
    
    // Mock the sync service
    const mockSyncService = {
      isOnline: jest.fn().mockReturnValue(true),
      syncToRemote: jest.fn().mockResolvedValue(undefined)
    };
    
    // Update the service factory mock for this test
    (serviceFactory.getLocalStorageService as jest.Mock).mockReturnValue(mockStorageService);
    (serviceFactory.getSyncService as jest.Mock).mockReturnValue(mockSyncService);
    
    render(<ExcelUploader onUploadSuccess={mockOnSuccess} onUploadError={mockOnError} />);

    const input = screen.getByLabelText('Upload Excel file');
    const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
    });

    // First check that the preview is shown
    await waitFor(() => {
        expect(screen.getByText('Preview: Test Program')).toBeInTheDocument();
        expect(parseExcelFile).toHaveBeenCalledWith(file, undefined);
    }, { timeout: 1000 });

    // Then click the confirm button
    const confirmButton = screen.getByText('Confirm and Save');
    await act(async () => {
        fireEvent.click(confirmButton);
    });

    // Now check that the success callback was called
    await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockStorageService.storeWorkoutProgram).toHaveBeenCalledWith(mockProgram);
    }, { timeout: 1000 });
  });

  it('handles invalid file type and displays error message', async () => {
    render(<ExcelUploader onUploadSuccess={() => {}} onUploadError={mockOnError} />);

    const input = screen.getByLabelText('Upload Excel file', { selector: 'input[type="file"]' });
    const file = new File([''], 'test.txt', { type: 'text/plain' });

    // Remove act wrapper
    fireEvent.change(input, { target: { files: [file] } });

    // Check for error message in the UI
    const errorMessage = 'Please select a valid file (.xlsx, .xls, .csv)';
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    }, { timeout: 1000 });

    // Wait for the error callback to be called
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
    }, { timeout: 1000 });
    
    const calledErrorMessage = mockOnError.mock.calls[0][0].message;
    expect(calledErrorMessage).toBe(errorMessage);
  });

  it('handles parsing errors and displays error message', async () => {
    const errorMessage = 'Failed to parse Excel file';
    (parseExcelFile as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    render(<ExcelUploader onUploadSuccess={() => {}} onUploadError={mockOnError} />);

    const inputEl = screen.getByLabelText('Upload Excel file', { selector: 'input[type="file"]' });
    const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // Remove act wrapper
    fireEvent.change(inputEl, { target: { files: [file] } });

    // Check for error message in the UI
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    }, { timeout: 1000 });

    // Wait for the error callback to be called
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
    }, { timeout: 1000 });
    
    expect(mockOnError.mock.calls[0][0].message).toBe(errorMessage);
  });

  it('handles invalid file type and displays inline error', async () => {
    render(<ExcelUploader onUploadSuccess={() => {}} />);
    const input = screen.getByLabelText('Upload Excel file', { selector: 'input[type="file"]' });
    const file = new File([''], 'test.txt', { type: 'text/plain' });

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    // Check if the alert exists and has the correct error message
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Please select a valid file (.xlsx, .xls, .csv)');
  });

  it('handles parsing errors and displays inline error', async () => {
    const errorMessage = 'Failed to parse Excel file';
    (parseExcelFile as jest.Mock).mockRejectedValue(new Error(errorMessage));
    render(<ExcelUploader onUploadSuccess={() => {}}  />);
    const inputEl = screen.getByLabelText('Upload Excel file', { selector: 'input[type="file"]' });
    const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    await act(async () => {
      fireEvent.change(inputEl, { target: { files: [file] } });
    });

    // Check if the alert exists and has the correct error message
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(errorMessage);
  });

  it('clears the input after successful upload', async () => {
    const mockProgram = {
      id: 'test-id',
      name: 'Test Program',
      workouts: [],
      history: []
    };
    (parseExcelFile as jest.Mock).mockResolvedValue(mockProgram);
    render(<ExcelUploader onUploadSuccess={mockOnSuccess} onUploadError={mockOnError} />);

    const input = screen.getByLabelText('Upload Excel file') as HTMLInputElement;
    const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
    });

    await waitFor(() => {
        expect(input.value).toBe('');
    }, { timeout: 1000 });
  });
});
