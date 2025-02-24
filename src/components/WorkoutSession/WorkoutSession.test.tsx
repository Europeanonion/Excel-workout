import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { WorkoutSession } from './WorkoutSession';
import { Workout } from '../../types';
import * as idb from '../../lib/indexedDB';

const mockWorkout: Workout = {
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
};

const programId = 'test-program-id';

jest.mock('../../lib/indexedDB');

describe('WorkoutSession', () => {
    const mockStoreWorkoutSession = jest.spyOn(idb, 'storeWorkoutSession');
    const mockGetWorkoutProgram = jest.spyOn(idb, 'getWorkoutProgram');
    const mockStoreWorkoutProgram = jest.spyOn(idb, 'storeWorkoutProgram');

    beforeEach(() => {
        jest.clearAllMocks();
        mockStoreWorkoutSession.mockResolvedValue(undefined);
        mockStoreWorkoutProgram.mockResolvedValue(undefined);
    });

  it('renders workout session component', async () => {
      await act(async () => {
          render(<WorkoutSession workout={mockWorkout} programId={programId} />);
      });
    expect(screen.getByText(/Workout Session: Push/i)).toBeInTheDocument();
    expect(screen.getByText(/Bench Press/i)).toBeInTheDocument();
  });

  it('adds a set when Add Set button is clicked', async () => {
      await act(async () => {
          render(<WorkoutSession workout={mockWorkout} programId={programId} />);
      });
    const addButton = screen.getByRole('button', { name: /Add Set/i });
      await act(async () => {
          fireEvent.click(addButton);
      });
    expect(screen.getByText(/Set 1:/i)).toBeInTheDocument();
  });

  it('updates reps value when input changes', async() => {
      await act(async () => {
          render(<WorkoutSession workout={mockWorkout} programId={programId} />);
      });
    const addButton = screen.getByRole('button', { name: /Add Set/i });
      await act(async () => {
          fireEvent.click(addButton);
      });
    const repsInput = screen.getByLabelText(/Reps for set 1/i);
      await act(async () => {
          fireEvent.change(repsInput, { target: { value: '10' } });
      });
    expect(repsInput).toHaveValue(10);
  });

  it('updates load value when input changes', async() => {
      await act(async () => {
          render(<WorkoutSession workout={mockWorkout} programId={programId} />);
      });
    const addButton = screen.getByRole('button', { name: /Add Set/i });
    await act(async () => {
        fireEvent.click(addButton);
    });
    const loadInput = screen.getByLabelText(/Load for set 1/i);
      await act(async() => {
          fireEvent.change(loadInput, { target: { value: '50' } });
      });
    expect(loadInput).toHaveValue(50);
  });

  it('updates RPE value when input changes', async() => {
      await act(async () => {
          render(<WorkoutSession workout={mockWorkout} programId={programId} />);
      });
    const addButton = screen.getByRole('button', { name: /Add Set/i });
      await act(async () => {
          fireEvent.click(addButton);
      });
    const rpeInput = screen.getByLabelText(/RPE for set 1/i);
    await act( async () => {
        fireEvent.change(rpeInput, { target: { value: '7' } });
    });
    expect(rpeInput).toHaveValue(7);
  });

    it('renders Finish Workout button', () => {
        render(<WorkoutSession workout={mockWorkout} programId={programId} />);
        expect(screen.getByRole('button', { name: /Finish Workout/i })).toBeInTheDocument();
    });

    it('calls storeWorkoutSession when Finish Workout is clicked', async () => {
        (idb.getWorkoutProgram as jest.Mock).mockResolvedValue({ history: [] });
        await act(async () => {
            render(<WorkoutSession workout={mockWorkout} programId={programId} />);
        });
        const finishButton = screen.getByRole('button', { name: /Finish Workout/i });

        await act(async () => {
            fireEvent.click(finishButton);
        });

        await waitFor(() => {
            expect(mockStoreWorkoutSession).toHaveBeenCalled();
            expect(mockStoreWorkoutProgram).toHaveBeenCalled();

        });
    });
});
