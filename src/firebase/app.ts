import { initializeApp } from 'firebase/app';
import { firebaseConfig } from './config';

// Initialize Firebase app
export const app = initializeApp(firebaseConfig);