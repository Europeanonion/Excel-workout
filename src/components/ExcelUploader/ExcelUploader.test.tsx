import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { act } from 'react';
import { ExcelUploader } from './ExcelUploader';
import { parseExcelFile } from '../../features/excelParsing/excelParser';

jest.mock('../../features/excelParsing/excelParser');

describe('ExcelUploader', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('renders upload button and help text', () => {
    render(<ExcelUploader onUploadSuccess={() => {}} onUploadError={() => {}} />);
    expect(screen.getByLabelText('Choose Excel file')).toBeInTheDocument();
    expect(screen.getByText('Choose Excel File')).toBeInTheDocument();
    expect(screen.getByText('Supported formats: .xlsx, .xls')).toBeInTheDocument();
  });

  it('shows loading state while processing', async () => {
    (parseExcelFile as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<ExcelUploader onUploadSuccess={mockOnSuccess} onUploadError={mockOnError} />);

    const input = screen.getByLabelText('Choose Excel file');
    const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
    });

    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(input).toBeDisabled();

    await waitFor(() => {
        expect(screen.getByText('Choose Excel File')).toBeInTheDocument();
        expect(input).not.toBeDisabled();
    });
  });

  it('handles successful file upload', async () => {
    (parseExcelFile as jest.Mock).mockResolvedValue([]);
    render(<ExcelUploader onUploadSuccess={mockOnSuccess} onUploadError={mockOnError} />);

    const input = screen.getByLabelText('Choose Excel file');
    const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
    });

    await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(parseExcelFile).toHaveBeenCalledWith(file);
    });
  });

  it('handles invalid file type and calls onUploadError', async () => {
    render(<ExcelUploader onUploadSuccess={() => {}} onUploadError={mockOnError} />);

    const input = screen.getByLabelText('Choose Excel file', { selector: 'input[type="file"]' });
    const file = new File([''], 'test.txt', { type: 'text/plain' });

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
      const calledErrorMessage = mockOnError.mock.calls[0][0].message;
      expect(calledErrorMessage).toBe('Please upload an Excel file (.xlsx or .xls)');
    });
  });

  it('handles parsing errors and calls onUploadError', async () => {
    const errorMessage = 'Failed to parse Excel file';
    (parseExcelFile as jest.Mock).mockRejectedValue(new Error(errorMessage));
    render(<ExcelUploader onUploadSuccess={() => {}} onUploadError={mockOnError} />);

    const inputEl = screen.getByLabelText('Choose Excel file', { selector: 'input[type="file"]' });
    const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    await act(async () => {
      fireEvent.change(inputEl, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
      expect(mockOnError.mock.calls[0][0].message).toBe(errorMessage);
    });
  });

  it('handles invalid file type and displays inline error', async () => {
      render(<ExcelUploader onUploadSuccess={() => {}} />);
    const input = screen.getByLabelText('Choose Excel file', { selector: 'input[type="file"]' });
    const file = new File([''], 'test.txt', { type: 'text/plain' });

      await act(async () => {
          fireEvent.change(input, { target: { files: [file] } });
      });


      // Check if the alert exists and has the correct error message
      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Please upload an Excel file (.xlsx or .xls)');

  });

    it('handles parsing errors and displays inline error', async () => {
        const errorMessage = 'Failed to parse Excel file';
        (parseExcelFile as jest.Mock).mockRejectedValue(new Error(errorMessage));
        render(<ExcelUploader onUploadSuccess={() => {}}  />);
        const inputEl = screen.getByLabelText('Choose Excel file', { selector: 'input[type="file"]' });
    const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      await act(async () => {
          fireEvent.change(inputEl, { target: { files: [file] } });
      });


      // Check if the alert exists and has the correct error message
      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(errorMessage);

  });

  it('clears the input after successful upload', async () => {
    (parseExcelFile as jest.Mock).mockResolvedValue([]);
    render(<ExcelUploader onUploadSuccess={mockOnSuccess} onUploadError={mockOnError} />);

    const input = screen.getByLabelText('Choose Excel file') as HTMLInputElement;
    const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
    });

    await waitFor(() => {
        expect(input.value).toBe('');
    });
  });
});
