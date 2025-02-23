import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ProgramList } from './ProgramList';
import { getAllWorkoutPrograms } from '../../lib/indexedDB';
import { WorkoutProgram } from '../../types';

// Mock the indexedDB functions
jest.mock('../../lib/indexedDB', () => ({
  getAllWorkoutPrograms: jest.fn()
}));

describe('ProgramList', () => {
  const mockPrograms: WorkoutProgram[] = [
    {
      id: '1',
      name: 'Test Program 1',
      workouts: [
        {
          week: 'Week 1',
          day: 'Push #1',
          exercises: []
        }
      ],
      history: [
        {
          sessionId: 'session1',
          date: '2025-02-22T10:00:00.000Z',
          workoutName: 'Push #1',
          exercises: [],
          totalLoad: 0,
          notes: null
        }
      ]
    },
    {
      id: '2',
      name: 'Test Program 2',
      workouts: [
        {
          week: 'Week 1',
          day: 'Pull #1',
          exercises: []
        }
      ],
      history: []
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state initially', () => {
    (getAllWorkoutPrograms as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<ProgramList />);
    
    expect(screen.getByLabelText('Loading workout programs')).toBeInTheDocument();
    expect(screen.getByText('Loading programs...')).toBeInTheDocument();
  });

  it('shows error message when loading fails', async () => {
    const error = new Error('Failed to load programs');
    (getAllWorkoutPrograms as jest.Mock).mockRejectedValue(error);

    render(<ProgramList />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load workout programs. Please try again later.')).toBeInTheDocument();
    });
  });

  it('shows empty state when no programs exist', async () => {
    (getAllWorkoutPrograms as jest.Mock).mockResolvedValue([]);

    render(<ProgramList />);
    
    await waitFor(() => {
      expect(screen.getByText('No workout programs found.')).toBeInTheDocument();
      expect(screen.getByText('Upload an Excel file to get started.')).toBeInTheDocument();
    });
  });

  it('displays workout programs when they exist', async () => {
    (getAllWorkoutPrograms as jest.Mock).mockResolvedValue(mockPrograms);

    render(<ProgramList />);
    
    await waitFor(() => {
      // Check program names are displayed
      expect(screen.getByText('Test Program 1')).toBeInTheDocument();
      expect(screen.getByText('Test Program 2')).toBeInTheDocument();

      // Check workout counts
      expect(screen.getByText('1 workouts')).toBeInTheDocument();

      // Check session counts
      const completedSessions = screen.getAllByText(/Completed:/);
      expect(completedSessions[0].nextSibling).toHaveTextContent('1 sessions');
      expect(completedSessions[1].nextSibling).toHaveTextContent('0 sessions');

      // Check last workout dates
      const lastWorkouts = screen.getAllByText(/Last workout:/);
      expect(lastWorkouts[0].nextSibling).toHaveTextContent('2/22/2025');
      expect(lastWorkouts[1].nextSibling).toHaveTextContent('Not started');

      // Check view buttons
      const viewButtons = screen.getAllByText('View Program');
      expect(viewButtons).toHaveLength(2);
    });
  });

  it('applies correct accessibility attributes', async () => {
    (getAllWorkoutPrograms as jest.Mock).mockResolvedValue(mockPrograms);

    render(<ProgramList />);
    
    await waitFor(() => {
      // Check region role and label
      expect(screen.getByRole('region', { name: 'Workout Programs' })).toBeInTheDocument();

      // Check heading hierarchy
      expect(screen.getByRole('heading', { name: 'Your Workout Programs', level: 2 })).toBeInTheDocument();
      
      // Check list structure
      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(2);

      // Check button accessibility
      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveAccessibleName('View Test Program 1 details');
      expect(buttons[1]).toHaveAccessibleName('View Test Program 2 details');
    });
  });
});
