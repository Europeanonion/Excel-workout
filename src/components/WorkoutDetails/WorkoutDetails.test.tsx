import React from 'react';
import { render, screen, waitFor, within, act } from '@testing-library/react';
import { WorkoutDetails } from './WorkoutDetails';
import { getWorkoutProgram } from '../../lib/indexedDB';
import type { WorkoutProgram } from '../../types';

jest.mock('../../lib/indexedDB');

const mockWorkoutProgram: WorkoutProgram = {
  id: 'test-program-id',
  name: 'Test Program',
  workouts: [
    {
      week: '1',
      day: 'Push',
      exercises: [
        {
          name: 'Bench Press',
          warmupSets: 2,
          workingSets: 3,
          reps: '8-12',
          load: 100,
          rpe: 8,
          rest: 120,
          substitution1: null,
          substitution2: null,
          notes: null,
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
    () => new Promise((resolve) => setTimeout(resolve, 50))
  );
  await act(() => {
    render(<WorkoutDetails programId="test-program-id" />);
  });
  expect(screen.getByText(/Loading program.../i)).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByText(/Loading program.../i)).not.toBeInTheDocument(), {timeout: 100});
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
