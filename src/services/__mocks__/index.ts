// Mock service factory for tests
import { User } from 'firebase/auth';
import { IAuthService, IStorageService, ISyncService } from '../interfaces';
import { WorkoutProgram, WorkoutSession } from '../../types';

// Flag to track if storage has been initialized
let storageInitialized = false;

// Mock Auth Service
const mockAuthService: IAuthService = {
  registerUser: jest.fn(() => Promise.resolve({} as User)),
  signIn: jest.fn(() => Promise.resolve({} as User)),
  signOut: jest.fn(() => Promise.resolve()),
  getCurrentUser: jest.fn(() => null),
  onAuthChange: jest.fn(() => () => {})
};

// Mock Storage Service with auto-initialization
const mockStorageService: IStorageService = {
  initStorage: jest.fn(() => {
    storageInitialized = true;
    return Promise.resolve();
  }),
  storeWorkoutProgram: jest.fn(() => {
    if (!storageInitialized) {
      // Auto-initialize if not already initialized
      storageInitialized = true;
    }
    return Promise.resolve();
  }),
  getWorkoutProgram: jest.fn(() => {
    if (!storageInitialized) {
      // Auto-initialize if not already initialized
      storageInitialized = true;
    }
    return Promise.resolve(undefined);
  }),
  getAllWorkoutPrograms: jest.fn(() => {
    if (!storageInitialized) {
      // Auto-initialize if not already initialized
      storageInitialized = true;
    }
    return Promise.resolve([]);
  }),
  deleteWorkoutProgram: jest.fn(() => {
    if (!storageInitialized) {
      // Auto-initialize if not already initialized
      storageInitialized = true;
    }
    return Promise.resolve();
  }),
  storeWorkoutSession: jest.fn(() => {
    if (!storageInitialized) {
      // Auto-initialize if not already initialized
      storageInitialized = true;
    }
    return Promise.resolve();
  }),
  getWorkoutSessions: jest.fn(() => {
    if (!storageInitialized) {
      // Auto-initialize if not already initialized
      storageInitialized = true;
    }
    return Promise.resolve([]);
  })
};

// Mock Sync Service
const mockSyncService: ISyncService = {
  initSync: jest.fn(() => Promise.resolve()),
  syncToRemote: jest.fn(() => Promise.resolve()),
  syncFromRemote: jest.fn(() => Promise.resolve()),
  setupRemoteListener: jest.fn(() => () => {}),
  initOnlineStatusListeners: jest.fn(),
  addOnlineStatusListener: jest.fn(),
  removeOnlineStatusListener: jest.fn(),
  isOnline: jest.fn(() => true)
};

// Mock Service Factory
export const getAuthService = jest.fn(() => mockAuthService);
export const getStorageService = jest.fn(() => {
  // Ensure storage is initialized when retrieved
  if (!storageInitialized) {
    mockStorageService.initStorage();
  }
  return mockStorageService;
});
export const getLocalStorageService = jest.fn(() => {
  // Ensure storage is initialized when retrieved
  if (!storageInitialized) {
    mockStorageService.initStorage();
  }
  return mockStorageService;
});
export const getSyncService = jest.fn(() => mockSyncService);
export const initializeServices = jest.fn(() => Promise.resolve());

// Define the service factory type to avoid circular reference
type MockServiceFactory = {
  getAuthService: jest.Mock;
  getStorageService: jest.Mock;
  getLocalStorageService: jest.Mock;
  getSyncService: jest.Mock;
  initializeServices: jest.Mock;
  getInstance: jest.Mock;
  setEnvironment: jest.Mock;
  getEnvironment: jest.Mock;
  getRemoteStorageService: jest.Mock;
};

// Export the service factory object with all methods
export const serviceFactory: MockServiceFactory = {
  getAuthService,
  getStorageService,
  getLocalStorageService,
  getSyncService,
  initializeServices,
  getInstance: jest.fn(() => serviceFactory),
  setEnvironment: jest.fn(),
  getEnvironment: jest.fn(() => 'testing'),
  getRemoteStorageService: jest.fn(() => mockStorageService)
};

// Export mock instances for direct manipulation in tests
export const mockAuth = mockAuthService;
export const mockStorage = mockStorageService;
export const mockSync = mockSyncService;

// Helper function to reset initialization state (useful for test cleanup)
export const resetMockStorage = () => {
  storageInitialized = false;
};