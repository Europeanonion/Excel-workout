import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExcelUploader } from './ExcelUploader';
import { parseExcelFile } from '../../features/excelParsing/excelParser';

// Mock the excelParser module
jest.mock('../../features/excelParsing/excelParser', () => ({
  parseExcelFile: jest.fn()
}));

describe('ExcelUploader', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders upload button and help text', () => {
    render(<ExcelUploader />);
    
    expect(screen.getByLabelText('Choose Excel file')).toBeInTheDocument();
    expect(screen.getByText('Choose Excel File')).toBeInTheDocument();
    expect(screen.getByText('Supported formats: .xlsx, .xls')).toBeInTheDocument();
  });

  it('shows loading state while processing', async () => {
    (parseExcelFile as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<ExcelUploader onUploadSuccess={mockOnSuccess} />);
    
    const input = screen.getByLabelText('Choose Excel file');
    const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    fireEvent.change(input, { target: { files: [file] } });
    
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(input).toBeDisabled();
    
    await waitFor(() => {
      expect(screen.getByText('Choose Excel File')).toBeInTheDocument();
      expect(input).not.toBeDisabled();
    });
  });

  it('handles successful file upload', async () => {
    (parseExcelFile as jest.Mock).mockResolvedValue([]);
    
    render(<ExcelUploader onUploadSuccess={mockOnSuccess} />);
    
    const input = screen.getByLabelText('Choose Excel file');
    const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(parseExcelFile).toHaveBeenCalledWith(file);
    });
  });

  it('handles invalid file type', async () => {
    // Test with parent error handling
    render(<ExcelUploader onUploadError={mockOnError} />);
    
    const input = screen.getByLabelText('Choose Excel file');
    const file = new File([''], 'test.txt', { type: 'text/plain' });
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
      expect(mockOnError.mock.calls[0][0].message).toBe('Please upload an Excel file (.xlsx or .xls)');
      // Error message should not be shown in component when onUploadError is provided
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    // Test without parent error handling
    render(<ExcelUploader />);
    
    const input2 = screen.getByLabelText('Choose Excel file');
    fireEvent.change(input2, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Please upload an Excel file (.xlsx or .xls)');
    });
  });

  it('handles parsing errors', async () => {
    const errorMessage = 'Failed to parse Excel file';
    (parseExcelFile as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    // Test with parent error handling
    render(<ExcelUploader onUploadError={mockOnError} />);
    
    const input = screen.getByLabelText('Choose Excel file');
    const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
      expect(mockOnError.mock.calls[0][0].message).toBe(errorMessage);
      // Error message should not be shown in component when onUploadError is provided
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    // Test without parent error handling
    render(<ExcelUploader />);
    
    const input2 = screen.getByLabelText('Choose Excel file');
    fireEvent.change(input2, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
    });
  });

  it('clears the input after successful upload', async () => {
    (parseExcelFile as jest.Mock).mockResolvedValue([]);
    
    render(<ExcelUploader onUploadSuccess={mockOnSuccess} />);
    
    const input = screen.getByLabelText('Choose Excel file') as HTMLInputElement;
    const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });
});
