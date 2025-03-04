import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from '../../../firebase/auth-app';
import { IAuthService } from '../../interfaces';

/**
 * Firebase implementation of the IAuthService interface
 */
export class FirebaseAuthService implements IAuthService {
  /**
   * Register a new user
   * @param email User's email
   * @param password User's password
   * @returns Promise resolving to the created user
   */
  async registerUser(email: string, password: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }

  /**
   * Sign in an existing user
   * @param email User's email
   * @param password User's password
   * @returns Promise resolving to the authenticated user
   */
  async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  /**
   * Sign out the current user
   * @returns Promise resolving when sign out is complete
   */
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  /**
   * Get the current authenticated user
   * @returns The current user or null if not authenticated
   */
  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * Listen for authentication state changes
   * @param callback Function to call when auth state changes
   * @returns Function to unsubscribe from auth state changes
   */
  onAuthChange(callback: (user: User | null) => void): (() => void) {
    return onAuthStateChanged(auth, callback);
  }
}