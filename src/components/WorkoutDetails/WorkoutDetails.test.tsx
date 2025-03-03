import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { act } from 'react'; // Import act from React instead of react-dom/test-utils
import { WorkoutDetails } from './WorkoutDetails';
import { serviceFactory } from '../../services';
import type { WorkoutProgram } from '../../types';

// Mock the services module
jest.mock('../../services', () => ({
  serviceFactory: {
    getLocalStorageService: jest.fn()
  }
}));

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

// Setup before each test
beforeEach(() => {
  // Mock the storage service
  const mockStorageService = {
    initStorage: jest.fn().mockResolvedValue(undefined),
    getWorkoutProgram: jest.fn(),
    storeWorkoutProgram: jest.fn().mockResolvedValue(undefined),
    getAllWorkoutPrograms: jest.fn().mockResolvedValue([]),
    deleteWorkoutProgram: jest.fn().mockResolvedValue(undefined),
    storeWorkoutSession: jest.fn().mockResolvedValue(undefined),
    getWorkoutSessions: jest.fn().mockResolvedValue([])
  };
  
  // Setup the service factory mock
  (serviceFactory.getLocalStorageService as jest.Mock).mockReturnValue(mockStorageService);
  
  // Clear all mocks before each test
  jest.clearAllMocks();
});

test('renders loading state', async () => {
  // Setup the mock to delay resolution
  const mockStorageService = serviceFactory.getLocalStorageService();
  (mockStorageService.getWorkoutProgram as jest.Mock).mockImplementation(
    () => new Promise((resolve) => setTimeout(() => resolve(undefined), 50))
  );

  await act(async () => {
    render(<WorkoutDetails programId="test-program-id" />);
  });

  expect(screen.getByText(/Loading program.../i)).toBeInTheDocument();

  // Use proper waitFor with adequate timeout
  await waitFor(() =>
    expect(screen.queryByText(/Loading program.../i)).not.toBeInTheDocument(),
    { timeout: 200 }
  );
});

test('renders error state', async () => {
  // Setup the mock to reject
  const mockStorageService = serviceFactory.getLocalStorageService();
  (mockStorageService.getWorkoutProgram as jest.Mock).mockRejectedValue(
    new Error('Failed to load program')
  );
  
  await act(async () => {
    render(<WorkoutDetails programId="test-program-id" />);
  });
  
  await waitFor(() =>
    expect(screen.getByText(/Failed to load workout program/i)).toBeInTheDocument()
  );
});

test('renders workout program details', async () => {
  // Setup the mock to resolve with program data
  const mockStorageService = serviceFactory.getLocalStorageService();
  (mockStorageService.getWorkoutProgram as jest.Mock).mockResolvedValue(mockWorkoutProgram);
  
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
  // Setup the mock to resolve with program data
  const mockStorageService = serviceFactory.getLocalStorageService();
  (mockStorageService.getWorkoutProgram as jest.Mock).mockResolvedValue(mockWorkoutProgram);
  
  await act(async () => {
    render(<WorkoutDetails programId="test-program-id" />);
  });

  await waitFor(() => {
    expect(screen.getByText('1/1/2024')).toBeInTheDocument();
  });
});

test('renders no workout history message', async () => {
  // Setup the mock to resolve with program data without history
  const noHistoryProgram = { ...mockWorkoutProgram, history: [] };
  const mockStorageService = serviceFactory.getLocalStorageService();
  (mockStorageService.getWorkoutProgram as jest.Mock).mockResolvedValue(noHistoryProgram);
  
  await act(async () => {
    render(<WorkoutDetails programId="test-program-id" />);
  });

  await waitFor(() => {
    expect(screen.getByText(/No workout history yet/i)).toBeInTheDocument();
  });
});
