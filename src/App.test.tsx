import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from './App';
import { parseExcelFile } from './features/excelParsing/excelParser';
import { getAllWorkoutPrograms } from './lib/indexedDB';
import { MemoryRouter } from 'react-router-dom';

jest.mock('./features/excelParsing/excelParser', () => ({
  parseExcelFile: jest.fn(),
}));

jest.mock('./lib/indexedDB', () => ({
  getAllWorkoutPrograms: jest.fn(),
}));

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAllWorkoutPrograms as jest.Mock).mockResolvedValue([]);
  });

  it('renders header and both components', async () => {
    (getAllWorkoutPrograms as jest.Mock).mockResolvedValue([]);
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    // Header
    expect(screen.getByText('Excel Workout PWA')).toBeInTheDocument();
    expect(screen.getByText('Track and manage your workout programs')).toBeInTheDocument();

    // Upload section
    expect(screen.getByLabelText('Choose Excel file')).toBeInTheDocument();
    expect(screen.getByText('Upload Program')).toBeInTheDocument();
    // Initially shows loading state
    expect(screen.getByText('Loading programs...')).toBeInTheDocument();

    // Then shows empty state
    await waitFor(() => {
      expect(screen.getByText('Upload an Excel file to get started.')).toBeInTheDocument();
      expect(screen.getByText('No workout programs found.')).toBeInTheDocument();
    });
  });

  it('shows success message and refreshes program list after successful upload', async () => {
    const mockProgram = {
      id: '1',
      name: 'Test Program',
      workouts: [],
      history: [],
    };

    // First return empty array, then return with the new program
    (getAllWorkoutPrograms as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([mockProgram]);
    (parseExcelFile as jest.Mock).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('No workout programs found.')).toBeInTheDocument();
    });

    const input = screen.getByLabelText('Choose Excel file');
    const file = new File([''], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    // Upload file
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    // Success message should appear
    await waitFor(() => {
      const message = screen.getByRole('status');
      expect(message).toHaveClass('App-message', 'success');
      expect(message).toHaveTextContent('Workout program uploaded successfully!');
    });

    // Program list should refresh and show the new program
    await waitFor(() => {
      expect(screen.getByText('Test Program')).toBeInTheDocument();
    });

    // Success message should disappear after 5 seconds
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    }, { timeout: 6000 });
  });

  it('shows error message when upload fails', async () => {
    const errorMessage = 'Failed to parse Excel file';
    (getAllWorkoutPrograms as jest.Mock).mockResolvedValue([]);
    (parseExcelFile as jest.Mock).mockRejectedValue(new Error(errorMessage));

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('No workout programs found.')).toBeInTheDocument();
    });

    const input = screen.getByLabelText('Choose Excel file');
    const file = new File([''], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    await waitFor(() => {
      const errorElement = screen.getByRole('status');
      expect(errorElement).toHaveClass('App-message', 'error');
      expect(errorElement).toHaveTextContent(errorMessage);
    });
  });

  it('maintains proper section structure and accessibility', async () => {
    (getAllWorkoutPrograms as jest.Mock).mockResolvedValue([]);
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    // Check section headings
    const headings = await screen.findAllByRole('heading');
    expect(headings[0]).toHaveTextContent('Excel Workout PWA');
    expect(headings[1]).toHaveTextContent('Upload Program');

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading programs...')).not.toBeInTheDocument();
    });

    // Check section landmarks
    expect(screen.getByRole('banner')).toBeInTheDocument(); // header
    expect(screen.getByRole('main')).toBeInTheDocument();

    // Check that sections are properly labeled
    const sections = screen.getAllByRole('region');
    expect(
      sections.some((section) => section.getAttribute('aria-label') === 'Excel file upload')
    ).toBe(true);
    expect(
      sections.some((section) => section.getAttribute('aria-label') === 'Workout Programs')
    ).toBe(true);
  });
});
