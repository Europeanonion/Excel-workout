// Mock Firebase implementation for tests

// Mock Auth
export const getAuth = jest.fn(() => ({
  currentUser: null,
  onAuthStateChanged: jest.fn((callback) => {
    callback(null);
    return () => {};
  }),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn()
}));

export const signInWithEmailAndPassword = jest.fn();
export const createUserWithEmailAndPassword = jest.fn();
export const signOut = jest.fn();

// Mock Firestore
export const getFirestore = jest.fn(() => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn()
}));

export const collection = jest.fn();
export const doc = jest.fn();
export const getDoc = jest.fn();
export const getDocs = jest.fn();
export const setDoc = jest.fn();
export const updateDoc = jest.fn();
export const deleteDoc = jest.fn();
export const query = jest.fn();
export const where = jest.fn();
export const onSnapshot = jest.fn();
export const serverTimestamp = jest.fn();

// Mock Firebase app
export const initializeApp = jest.fn(() => ({
  name: '[DEFAULT]',
  options: {},
  automaticDataCollectionEnabled: false
}));