import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ProgramList } from './ProgramList';
import { WorkoutProgram } from '../../types';
import { MemoryRouter } from 'react-router-dom';
import { serviceFactory } from '../../services';
// Temporarily suppress React warnings
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  // Suppress act warnings
  console.error = (...args) => {
    if (/Warning:.*ReactDOMTestUtils.act/.test(args[0])) {
      return;
    }
    originalError.call(console, ...args);
  };
  
  // Suppress React Router warnings
  console.warn = (...args) => {
    if (/React Router Future Flag Warning/.test(args[0])) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Mock the services module
jest.mock('../../services', () => ({
  serviceFactory: {
    getLocalStorageService: jest.fn()
  }
}));

describe('ProgramList', () => {
  const mockPrograms: WorkoutProgram[] = [
    {
      id: '1',
      name: 'Test Program 1',
      workouts: [
        {
          name: 'Push #1',
          week: 'Week 1',
          day: 'Push #1',
          exercises: [],
        },
      ],
      history: [
        {
          sessionId: 'session1',
          programId: '1',
          date: '2025-02-22T10:00:00.000Z',
          workoutName: 'Push #1',
          exercises: [],
          totalLoad: 0,
          notes: null,
        },
      ],
    },
    {
      id: '2',
      name: 'Test Program 2',
      workouts: [
        {
          name: 'Pull #1',
          week: 'Week 1',
          day: 'Pull #1',
          exercises: [],
        },
      ],
      history: [],
    },
  ];

  // Mock storage service
  let mockStorageService: any;

  beforeEach(() => {
    // Create mock storage service
    mockStorageService = {
      initStorage: jest.fn().mockResolvedValue(undefined),
      getAllWorkoutPrograms: jest.fn(),
      getWorkoutProgram: jest.fn().mockResolvedValue(null),
      storeWorkoutProgram: jest.fn().mockResolvedValue(undefined),
      deleteWorkoutProgram: jest.fn().mockResolvedValue(undefined),
      storeWorkoutSession: jest.fn().mockResolvedValue(undefined),
      getWorkoutSessions: jest.fn().mockResolvedValue([])
    };
    
    // Setup the service factory mock
    (serviceFactory.getLocalStorageService as jest.Mock).mockReturnValue(mockStorageService);
    
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('shows loading state initially', async () => {
    // Mock the function to return a promise that never resolves
    mockStorageService.getAllWorkoutPrograms.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(
      <MemoryRouter>
        <ProgramList />
      </MemoryRouter>
    );

    expect(screen.getByLabelText('Loading workout programs')).toBeInTheDocument();
    expect(screen.getByText('Loading programs...')).toBeInTheDocument();
  });

  it('shows error message when loading fails', async () => {
    const error = new Error('Failed to load programs');
    mockStorageService.getAllWorkoutPrograms.mockRejectedValue(error);

    render(
      <MemoryRouter>
        <ProgramList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load workout programs. Please try again later.')
      ).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('shows empty state when no programs exist', async () => {
    mockStorageService.getAllWorkoutPrograms.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <ProgramList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No workout programs found.')).toBeInTheDocument();
      expect(screen.getByText('Upload an Excel file to get started.')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

    it('displays workout programs when they exist', async () => {
        mockStorageService.getAllWorkoutPrograms.mockResolvedValue(mockPrograms);
        
        render(
            <MemoryRouter>
                <ProgramList />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Test Program 1')).toBeInTheDocument();
            expect(screen.getByText('Test Program 2')).toBeInTheDocument();

            expect(screen.getAllByText('1 workouts').length).toBe(2);

            const completedSessions = screen.getAllByText(/Completed:/);
            expect(completedSessions[0].nextSibling).toHaveTextContent('1 sessions');
            expect(completedSessions[1].nextSibling).toHaveTextContent('0 sessions');

            const lastWorkouts = screen.getAllByText(/Last workout:/);
            expect(lastWorkouts[0].nextSibling).toHaveTextContent('2/22/2025');
            expect(lastWorkouts[1].nextSibling).toHaveTextContent('Not started');

            const viewButtons = screen.getAllByText('View Program');
            expect(viewButtons).toHaveLength(2);
        }, { timeout: 1000 });
    });

    it('applies correct accessibility attributes', async () => {
        mockStorageService.getAllWorkoutPrograms.mockResolvedValue(mockPrograms);

        render(
            <MemoryRouter>
                <ProgramList />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByRole('region', { name: 'Workout Programs' })).toBeInTheDocument();
            expect(screen.getByRole('heading', { name: 'Your Workout Programs', level: 2 })).toBeInTheDocument();
            expect(screen.getByRole('list')).toBeInTheDocument();
            expect(screen.getAllByRole('listitem')).toHaveLength(2);

            const buttons = screen.getAllByRole('button');
            expect(buttons[0]).toHaveAccessibleName('View Test Program 1 details');
            expect(buttons[1]).toHaveAccessibleName('View Test Program 2 details');
        }, { timeout: 1000 });
    });
});
