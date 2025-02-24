import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ExcelUploader } from './ExcelUploader';
import { parseExcelFile } from '../../features/excelParsing/excelParser';

jest.mock('../../features/excelParsing/excelParser');

describe('ExcelUploader', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
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
        await act(async () => {
            render(<ExcelUploader onUploadSuccess={mockOnSuccess} onUploadError={mockOnError} />);
        })
        const input = screen.getByLabelText('Choose Excel file');
        const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        await act(async () => {
            fireEvent.change(input, { target: { files: [file] } });
        })
        expect(screen.getByText('Processing...')).toBeInTheDocument();
        expect(input).toBeDisabled();

        await waitFor(() => {
            expect(screen.getByText('Choose Excel File')).toBeInTheDocument();
            expect(input).not.toBeDisabled();
        });
    });

    it('handles successful file upload', async () => {
        (parseExcelFile as jest.Mock).mockResolvedValue([]);
        await act(async () => {
            render(<ExcelUploader onUploadSuccess={mockOnSuccess} onUploadError={mockOnError} />);
        });

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

    it('handles invalid file type', async () => {
        await act(async () => {
            render(<ExcelUploader onUploadError={mockOnError} />);
        })

        const input = screen.getByLabelText('Choose Excel file');
        const file = new File([''], 'test.txt', { type: 'text/plain' });

        await act(async () => {
            fireEvent.change(input, { target: { files: [file] } });
        });

        await waitFor(() => {
            expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
            expect(mockOnError.mock.calls[0][0].message).toBe('Please upload an Excel file (.xlsx or .xls)');
            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        });


        await act(async () => {
            render(<ExcelUploader onUploadError={() => {}} onUploadSuccess={() => {}} />);
        })

        const newInput = screen.getByLabelText('Choose Excel file');

        await act(async () => {
            fireEvent.change(newInput, { target: { files: [file] } });
        });

        await waitFor(() => {
            expect(screen.getByRole('alert')).toHaveTextContent('Please upload an Excel file (.xlsx or .xls)');
        });
    });

    it('handles parsing errors', async () => {
        const errorMessage = 'Failed to parse Excel file';
        (parseExcelFile as jest.Mock).mockRejectedValue(new Error(errorMessage));

        await act(async () => {
            render(<ExcelUploader onUploadError={mockOnError} />);
        })

        const input = screen.getByLabelText('Choose Excel file');
        const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        await act(async () => {
            fireEvent.change(input, { target: { files: [file] } });
        });

        await waitFor(() => {
            expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
            expect(mockOnError.mock.calls[0][0].message).toBe(errorMessage);
            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        });

        await act(async () => {
            render(<ExcelUploader onUploadError={() => {}} onUploadSuccess={() => {}} />);
        })

        const newInput = screen.getByLabelText('Choose Excel file');

        await act(async () => {
            fireEvent.change(newInput, { target: { files: [file] } });
        });

        await waitFor(() => {
            expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
        });
    });

    it('clears the input after successful upload', async () => {
        (parseExcelFile as jest.Mock).mockResolvedValue([]);
        await act(async () => {
            render(<ExcelUploader onUploadSuccess={mockOnSuccess} onUploadError={mockOnError} />);
        });

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
