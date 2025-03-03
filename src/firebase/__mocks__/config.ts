// Mock Firebase configuration for tests
import { jest } from '@jest/globals';

// Mock Firebase app
const app = {
  name: '[DEFAULT]',
  options: {
    apiKey: 'test-api-key',
    authDomain: 'test-auth-domain',
    projectId: 'test-project-id',
    storageBucket: 'test-storage-bucket',
    messagingSenderId: 'test-messaging-sender-id',
    appId: 'test-app-id'
  },
  automaticDataCollectionEnabled: false
};

// Mock Firestore
const db = {
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({
        exists: true,
        data: () => ({}),
        id: 'test-doc-id'
      })),
      set: jest.fn(() => Promise.resolve()),
      update: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => Promise.resolve())
    })),
    where: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({
        docs: [],
        empty: true
      }))
    })),
    add: jest.fn(() => Promise.resolve({
      id: 'test-doc-id'
    }))
  }))
};

// Mock Auth
const auth = {
  currentUser: null,
  onAuthStateChanged: jest.fn((callback: (user: null) => void) => {
    callback(null);
    return () => {};
  }),
  signInWithEmailAndPassword: jest.fn(() => Promise.resolve({
    user: {
      uid: 'test-user-id',
      email: 'test@example.com'
    }
  })),
  createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({
    user: {
      uid: 'test-user-id',
      email: 'test@example.com'
    }
  })),
  signOut: jest.fn(() => Promise.resolve())
};

export { app, db, auth };