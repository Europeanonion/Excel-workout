import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { parseExcelFile } from './features/excelParsing/excelParser';
import { getAllWorkoutPrograms } from './lib/indexedDB';

// Mock the modules
jest.mock('./features/excelParsing/excelParser', () => ({
  parseExcelFile: jest.fn()
}));

jest.mock('./lib/indexedDB', () => ({
  getAllWorkoutPrograms: jest.fn()
}));

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAllWorkoutPrograms as jest.Mock).mockResolvedValue([]);
  });

  it('renders header and both components', () => {
    render(<App />);
    
    // Header
    expect(screen.getByText('Excel Workout PWA')).toBeInTheDocument();
    expect(screen.getByText('Track and manage your workout programs')).toBeInTheDocument();
    
    // Upload section
    expect(screen.getByText('Upload Program')).toBeInTheDocument();
    expect(screen.getByLabelText('Choose Excel file')).toBeInTheDocument();
    
    // Program list section (empty state)
    expect(screen.getByText('No workout programs found.')).toBeInTheDocument();
  });

  it('shows success message and refreshes program list after successful upload', async () => {
    const mockProgram = {
      id: '1',
      name: 'Test Program',
      workouts: [],
      history: []
    };

    // First return empty array, then return with the new program
    (getAllWorkoutPrograms as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([mockProgram]);
    
    (parseExcelFile as jest.Mock).mockResolvedValue([]);
    
    render(<App />);
    
    const input = screen.getByLabelText('Choose Excel file');
    const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Initially should show empty state
    expect(screen.getByText('No workout programs found.')).toBeInTheDocument();
    
    // Upload file
    fireEvent.change(input, { target: { files: [file] } });
    
    // Success message should appear
    await waitFor(() => {
      expect(screen.getByText('Workout program uploaded successfully!')).toBeInTheDocument();
    });

    // Program list should refresh and show the new program
    await waitFor(() => {
      expect(screen.getByText('Test Program')).toBeInTheDocument();
    });

    // Success message should disappear after 5 seconds
    await waitFor(() => {
      expect(screen.queryByText('Workout program uploaded successfully!')).not.toBeInTheDocument();
    }, { timeout: 6000 });
  });

  it('shows error message when upload fails', async () => {
    const errorMessage = 'Failed to parse Excel file';
    (parseExcelFile as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    render(<App />);
    
    const input = screen.getByLabelText('Choose Excel file');
    const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      const errorElement = screen.getByRole('status', { name: errorMessage });
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveClass('App-message', 'error');
    });
  });

  it('maintains proper section structure and accessibility', () => {
    render(<App />);
    
    // Check section headings
    const headings = screen.getAllByRole('heading');
    expect(headings[0]).toHaveTextContent('Excel Workout PWA');
    expect(headings[1]).toHaveTextContent('Upload Program');
    expect(headings[2]).toHaveTextContent('Your Workout Programs');

    // Check section landmarks
    expect(screen.getByRole('banner')).toBeInTheDocument(); // header
    expect(screen.getByRole('main')).toBeInTheDocument();
    
    // Check that sections are properly labeled
    const sections = screen.getAllByRole('region');
    expect(sections.some(section => section.getAttribute('aria-label') === 'Excel file upload')).toBe(true);
    expect(sections.some(section => section.getAttribute('aria-label') === 'Workout Programs')).toBe(true);
  });
});
