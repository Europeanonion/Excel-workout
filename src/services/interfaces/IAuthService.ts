import { User } from 'firebase/auth';

/**
 * Interface for authentication service
 * Provides methods for user authentication and management
 */
export interface IAuthService {
  /**
   * Register a new user
   * @param email User's email
   * @param password User's password
   * @returns Promise resolving to the created user
   */
  registerUser(email: string, password: string): Promise<User>;

  /**
   * Sign in an existing user
   * @param email User's email
   * @param password User's password
   * @returns Promise resolving to the authenticated user
   */
  signIn(email: string, password: string): Promise<User>;

  /**
   * Sign out the current user
   * @returns Promise resolving when sign out is complete
   */
  signOut(): Promise<void>;

  /**
   * Get the current authenticated user
   * @returns The current user or null if not authenticated
   */
  getCurrentUser(): User | null;

  /**
   * Listen for authentication state changes
   * @param callback Function to call when auth state changes
   * @returns Function to unsubscribe from auth state changes
   */
  onAuthChange(callback: (user: User | null) => void): (() => void);
}