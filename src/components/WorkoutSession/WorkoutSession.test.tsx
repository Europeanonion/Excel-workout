import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WorkoutSession } from './WorkoutSession';
import { act } from '@testing-library/react'; // Correct import for act
import type { Workout } from '../../types';
import * as idb from '../../lib/indexedDB';

const mockWorkout: Workout = {
  name: 'Push', // Changed from 'day' to 'name'
  day: 'Push', // Add day property
  exercises: [
    {
      name: 'Bench Press',
      // Removed warmupSets: 2,  <-- REMOVED THIS LINE
      sets: 3, // Changed from 'workingSets' to 'sets'
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

// Fix 2: Create a mock program object for updating
const mockProgram = {
  id: 'test-program-id',
  name: 'Test Program',
  workouts: [mockWorkout],
  history: []
};

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
    expect(screen.getByText(/Set 0\/3/i)).toBeInTheDocument(); // Check for initial progress indicator
    expect(screen.getByLabelText(/Notes for Bench Press/i)).toBeInTheDocument(); // Check for notes textarea
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
    expect(screen.getByText(/Set 1\/3/i)).toBeInTheDocument(); // Check progress indicator after adding a set
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

    it('updates program history in IndexedDB when Finish Workout is clicked', async () => {
      // Fix 3: Mock both getWorkoutProgram and storeWorkoutProgram properly
      mockGetWorkoutProgram.mockResolvedValue(mockProgram);
      
      await act(async () => {
          render(<WorkoutSession workout={mockWorkout} programId={programId} />);
      });

      // Add a set and enter values
      const addButton = screen.getByRole('button', { name: /Add Set/i });
      await act(async () => {
          fireEvent.click(addButton);
      });
      const repsInput = screen.getByLabelText(/Reps for set 1/i);
      const loadInput = screen.getByLabelText(/Load for set 1/i);
      const rpeInput = screen.getByLabelText(/RPE for set 1/i);
      await act(async () => {
          fireEvent.change(repsInput, { target: { value: '10' } });
          fireEvent.change(loadInput, { target: { value: '50' } });
          fireEvent.change(rpeInput, { target: { value: '7' } });
      });

      const finishButton = screen.getByRole('button', { name: /Finish Workout/i });
      await act(async () => {
          fireEvent.click(finishButton);
      });

      // Fix 4: Improve assertions with proper waitFor
      await waitFor(() => {
        // Check that getWorkoutProgram was called with the correct programId
        expect(mockGetWorkoutProgram).toHaveBeenCalledWith(programId);

        // Check that storeWorkoutProgram was called *at least once*
        expect(mockStoreWorkoutProgram).toHaveBeenCalledTimes(1);

        // Get the argument that was passed to storeWorkoutProgram
        const updatedProgram = mockStoreWorkoutProgram.mock.calls[0][0];

        // Assertions on the updatedProgram object:
        expect(updatedProgram.id).toBe(programId); // Check program ID
        expect(updatedProgram.history.length).toBe(1); // Check history length
        expect(updatedProgram.history[0].programId).toBe(programId); // Check programId in history
        expect(updatedProgram.history[0].workoutName).toBe(mockWorkout.name); // Check workoutName - Updated
        expect(updatedProgram.history[0].sessionId).toBeDefined(); // Check that sessionId exists
        expect(updatedProgram.history[0].date).toBeDefined(); // Check that date exists

        // Check the structure of the completed exercises (basic check)
        expect(updatedProgram.history[0].exercises.length).toBe(mockWorkout.exercises.length);
        expect(updatedProgram.history[0].exercises[0].exerciseName).toBe(mockWorkout.exercises[0].name);
        // You could add more detailed checks for sets and notes if needed

      }, { timeout: 1000 });
  });
    it('updates and stores notes correctly', async () => {
        const mockProgram = { id: programId, name: 'Test Program', workouts: [mockWorkout], history: [] };
        (idb.getWorkoutProgram as jest.Mock).mockResolvedValue(mockProgram);

        await act(async () => {
            render(<WorkoutSession workout={mockWorkout} programId={programId} />);
        });

        const notesTextarea = screen.getByLabelText(/Notes for Bench Press/i);
        await act(async () => {
            fireEvent.change(notesTextarea, { target: { value: 'Test notes' } });
        });

        const finishButton = screen.getByRole('button', { name: /Finish Workout/i });
        await act(async () => {
            fireEvent.click(finishButton);
        });

        await waitFor(() => {
            expect(mockStoreWorkoutSession).toHaveBeenCalledWith(expect.objectContaining({
                exercises: expect.arrayContaining([
                    expect.objectContaining({
                        notes: 'Test notes',
                    }),
                ]),
            }));
        });
    });
});
