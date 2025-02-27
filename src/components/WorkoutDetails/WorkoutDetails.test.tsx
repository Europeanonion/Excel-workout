import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react'; // Added within
import { act } from '@testing-library/react'; // Correct import for act
import { WorkoutDetails } from './WorkoutDetails';
import { getWorkoutProgram } from '../../lib/indexedDB';
import type { WorkoutProgram } from '../../types';

jest.mock('../../lib/indexedDB');

const mockWorkoutProgram: WorkoutProgram = {
  id: 'test-program-id',
  name: 'Test Program',
  workouts: [
    {
      name: 'Push',
      week: '1',
      day: 'Push',
      exercises: [
        {
          name: 'Bench Press',
          sets: 5, // Total sets (warmup + working)
          warmupSets: 2,
          workingSets: 3,
          reps: '8-12',
          load: 100,
          rpe: 8,
          rest: 120,
          substitution1: null,
          substitution2: null,
          notes: '', // Changed from null to empty string
        },
      ],
    },
  ],
  history: [
    {
      sessionId: 'session-1',
      programId: 'test-program-id',
      date: '2024-01-01T12:00:00.000Z',
      workoutName: 'Push',
      exercises: [],
      totalLoad: 0,
      notes: null,
    },
  ],
};

const mockedGetWorkoutProgram = getWorkoutProgram as jest.MockedFunction<
  typeof getWorkoutProgram
>;

test('renders loading state', async () => {
  mockedGetWorkoutProgram.mockImplementation(
    () => new Promise((resolve) => setTimeout(() => resolve(undefined), 50))
  );

  render(<WorkoutDetails programId="test-program-id" />);

  expect(screen.getByText(/Loading program.../i)).toBeInTheDocument();

  // Fix 2: Use proper waitFor with adequate timeout
  await waitFor(() =>
    expect(screen.queryByText(/Loading program.../i)).not.toBeInTheDocument(),
    { timeout: 200 }
  );
});

test('renders error state', async () => {
  mockedGetWorkoutProgram.mockRejectedValue(new Error('Failed to load program'));
  await act(() => {
      render(<WorkoutDetails programId="test-program-id" />);
  });
  await waitFor(() =>
    expect(screen.getByText(/Failed to load workout program/i)).toBeInTheDocument()
  );
});

test('renders workout program details', async () => {
  mockedGetWorkoutProgram.mockResolvedValue(mockWorkoutProgram);
  await act(async () => {
      render(<WorkoutDetails programId="test-program-id" />);
  });

  await waitFor(() => {
    expect(screen.getByText(/Test Program/i)).toBeInTheDocument();
    expect(screen.getByText(/1 - Push/i)).toBeInTheDocument();
    const exerciseSection = screen.getByRole('group', { name: /Exercise: Bench Press/i });
    expect(within(exerciseSection).getByText(/Bench Press/i)).toBeInTheDocument();
  });
});

test('renders workout history', async () => {
  mockedGetWorkoutProgram.mockResolvedValue(mockWorkoutProgram);
  await act(() => {
    render(<WorkoutDetails programId="test-program-id" />);
  });

  await waitFor(() => {
    expect(screen.getByText('1/1/2024')).toBeInTheDocument();
  });
});

test('renders no workout history message', async () => {
  const noHistoryProgram = { ...mockWorkoutProgram, history: [] };
  mockedGetWorkoutProgram.mockResolvedValue(noHistoryProgram);
  await act(() => {
      render(<WorkoutDetails programId="test-program-id" />);
  });

  await waitFor(() => {
    expect(screen.getByText(/No workout history yet/i)).toBeInTheDocument();
  });
});
