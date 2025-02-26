import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react'; // Import from react instead of react-dom/test-utils
import { AppContent } from './App'; // Import AppContent instead of App
import { parseExcelFile } from './features/excelParsing/excelParser';
import { WorkoutProgram } from './types';
import { getAllWorkoutPrograms } from './lib/indexedDB';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

jest.setTimeout(10000); // Increase Jest timeout to 10 seconds

jest.mock('./features/excelParsing/excelParser', () => ({
  parseExcelFile: jest.fn(),
}));

const mockPrograms: WorkoutProgram[] = [];

jest.mock('./lib/indexedDB', () => ({
  getAllWorkoutPrograms: jest.fn(() => Promise.resolve(mockPrograms)),
  initDB: jest.fn(() => Promise.resolve()),
}));

// Helper function to render with Router
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrograms.length = 0; // Clear mock programs array
  });

  it('renders header and both components', async () => {
    renderWithRouter(<AppContent />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading programs...')).not.toBeInTheDocument();
    });

    // Header
    expect(await screen.findByText('Excel Workout PWA')).toBeInTheDocument();
    expect(screen.getByText('Track and manage your workout programs')).toBeInTheDocument();

    // Upload section
    expect(screen.getByLabelText('Choose Excel file')).toBeInTheDocument();
    
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

    renderWithRouter(<AppContent />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('No workout programs found.')).toBeInTheDocument();
    });

    const input = screen.getByLabelText('Choose Excel file');
    const file = new File([''], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    // Upload file
    fireEvent.change(input, { target: { files: [file] } });

    // Success message should appear and then disappear
    await waitFor(
      () => {
        expect(
          screen.queryByText('Workout program uploaded successfully!')
        ).not.toBeInTheDocument();
      },
      { timeout: 6000 }
    );

    // Program list should refresh and show the new program
    await waitFor(() => {
      expect(screen.getByText('Test Program')).toBeInTheDocument();
    });
  });

  it('shows error message when upload fails', async () => {
    const errorMessage = 'Failed to parse Excel file';
    (getAllWorkoutPrograms as jest.Mock).mockResolvedValue([]);
    (parseExcelFile as jest.Mock).mockRejectedValue(new Error(errorMessage));

    renderWithRouter(<AppContent />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('No workout programs found.')).toBeInTheDocument();
    });

    const input = screen.getByLabelText('Choose Excel file');
    const file = new File([''], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      const errorElement = screen.getByText(errorMessage);
      expect(errorElement).toBeInTheDocument();
    });
  });

  it('maintains proper section structure and accessibility', async () => {
    // Mock empty programs list
    (getAllWorkoutPrograms as jest.Mock).mockResolvedValue([]);

    renderWithRouter(<AppContent />);

    // Wait for loading state to resolve
    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });

    // Check header section
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Excel Workout PWA/i })).toBeInTheDocument();

    // Check main content area
    const mainContent = screen.getByRole('main');
    expect(mainContent).toBeInTheDocument();

    // Check upload section
    expect(screen.getByRole('region', { name: /Excel file upload/i })).toBeInTheDocument();

    // Check programs section - using findByRole to handle async rendering
    const programsSection = await screen.findByRole('region', { name: /Workout Programs/i });
    expect(programsSection).toBeInTheDocument();
    
    // Verify empty state message
    expect(screen.getByText(/no workout programs found/i)).toBeInTheDocument();
  });
});
