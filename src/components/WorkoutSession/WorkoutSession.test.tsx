import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WorkoutSession } from './WorkoutSession';
import { act } from 'react'; // Import act from React instead of react-dom/test-utils
import type { Workout } from '../../types';
import { serviceFactory } from '../../services';

// Mock the services module
jest.mock('../../services', () => ({
  serviceFactory: {
    getLocalStorageService: jest.fn()
  }
}));

const mockWorkout: Workout = {
  name: 'Push',
  day: 'Push',
  exercises: [
    {
      name: 'Bench Press',
      sets: 3,
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

// Create a mock program object for updating
const mockProgram = {
  id: 'test-program-id',
  name: 'Test Program',
  workouts: [mockWorkout],
  history: []
};

describe('WorkoutSession', () => {
    // Mock storage service functions
    let mockStorageService: any;
    let mockStoreWorkoutSession: jest.Mock;
    let mockGetWorkoutProgram: jest.Mock;
    let mockStoreWorkoutProgram: jest.Mock;

    beforeEach(() => {
        // Create mock storage service
        mockStoreWorkoutSession = jest.fn().mockResolvedValue(undefined);
        mockGetWorkoutProgram = jest.fn().mockResolvedValue(mockProgram);
        mockStoreWorkoutProgram = jest.fn().mockResolvedValue(undefined);
        
        mockStorageService = {
            initStorage: jest.fn().mockResolvedValue(undefined),
            storeWorkoutSession: mockStoreWorkoutSession,
            getWorkoutProgram: mockGetWorkoutProgram,
            storeWorkoutProgram: mockStoreWorkoutProgram,
            getAllWorkoutPrograms: jest.fn().mockResolvedValue([]),
            deleteWorkoutProgram: jest.fn().mockResolvedValue(undefined),
            getWorkoutSessions: jest.fn().mockResolvedValue([])
        };
        
        // Setup the service factory mock
        (serviceFactory.getLocalStorageService as jest.Mock).mockReturnValue(mockStorageService);
        
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    it('renders workout session component', async () => {
        await act(async () => {
            render(<WorkoutSession workout={mockWorkout} programId={programId} />);
        });
        
        expect(screen.getByText(/Workout Session: Push/i)).toBeInTheDocument();
        expect(screen.getByText(/Bench Press/i)).toBeInTheDocument();
        expect(screen.getByText(/Sets: 0\/3/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Notes for Bench Press/i)).toBeInTheDocument();
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
        expect(screen.getByText(/Sets: 0\/3/i)).toBeInTheDocument();
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
        await act(async () => {
            fireEvent.change(rpeInput, { target: { value: '7' } });
        });
        
        expect(rpeInput).toHaveValue(7);
    });

    it('renders Finish Workout button', async () => {
        await act(async () => {
            render(<WorkoutSession workout={mockWorkout} programId={programId} />);
        });
        
        expect(screen.getByRole('button', { name: /Finish Workout/i })).toBeInTheDocument();
    });

    it('calls storeWorkoutSession when Finish Workout is clicked', async () => {
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
        }, { timeout: 1000 });
    });

    it('updates program history in IndexedDB when Finish Workout is clicked', async () => {
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

        await waitFor(() => {
            // Check that getWorkoutProgram was called with the correct programId
            expect(mockGetWorkoutProgram).toHaveBeenCalledWith(programId);

            // Check that storeWorkoutProgram was called *at least once*
            expect(mockStoreWorkoutProgram).toHaveBeenCalledTimes(1);

            // Get the argument that was passed to storeWorkoutProgram
            const updatedProgram = mockStoreWorkoutProgram.mock.calls[0][0];

            // Assertions on the updatedProgram object:
            expect(updatedProgram.id).toBe(programId);
            expect(updatedProgram.history.length).toBe(1);
            expect(updatedProgram.history[0].programId).toBe(programId);
            expect(updatedProgram.history[0].workoutName).toBe(mockWorkout.name);
            expect(updatedProgram.history[0].sessionId).toBeDefined();
            expect(updatedProgram.history[0].date).toBeDefined();

            // Check the structure of the completed exercises
            expect(updatedProgram.history[0].exercises.length).toBe(mockWorkout.exercises.length);
            expect(updatedProgram.history[0].exercises[0].exerciseName).toBe(mockWorkout.exercises[0].name);
        }, { timeout: 1000 });
    });
    
    it('updates and stores notes correctly', async () => {
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
        }, { timeout: 1000 });
    });
});
