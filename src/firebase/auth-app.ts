import { getAuth } from 'firebase/auth';
import { app } from './app';

// Initialize Auth
export const auth = getAuth(app);