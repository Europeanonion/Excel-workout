import { IAuthService } from '../../interfaces';
import { User } from 'firebase/auth';

/**
 * Mock implementation of the IAuthService interface for testing
 */
export class MockAuthService implements IAuthService {
  private currentUser: User | null = null;
  private authListeners: ((user: User | null) => void)[] = [];

  /**
   * Register a new user
   * @param email User's email
   * @param password User's password
   * @returns Promise resolving to the created user
   */
  async registerUser(email: string, password: string): Promise<User> {
    // Create a mock user
    const mockUser = this.createMockUser(email);
    this.currentUser = mockUser;
    
    // Notify listeners
    this.notifyListeners();
    
    return mockUser;
  }

  /**
   * Sign in an existing user
   * @param email User's email
   * @param password User's password
   * @returns Promise resolving to the authenticated user
   */
  async signIn(email: string, password: string): Promise<User> {
    // Create a mock user
    const mockUser = this.createMockUser(email);
    this.currentUser = mockUser;
    
    // Notify listeners
    this.notifyListeners();
    
    return mockUser;
  }

  /**
   * Sign out the current user
   * @returns Promise resolving when sign out is complete
   */
  async signOut(): Promise<void> {
    this.currentUser = null;
    
    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Get the current authenticated user
   * @returns The current user or null if not authenticated
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Listen for authentication state changes
   * @param callback Function to call when auth state changes
   * @returns Function to unsubscribe from auth state changes
   */
  onAuthChange(callback: (user: User | null) => void): (() => void) {
    this.authListeners.push(callback);
    
    // Immediately call with current state
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      const index = this.authListeners.indexOf(callback);
      if (index !== -1) {
        this.authListeners.splice(index, 1);
      }
    };
  }

  /**
   * Set the current user for testing
   * @param user The user to set
   */
  setCurrentUser(user: User | null): void {
    this.currentUser = user;
    this.notifyListeners();
  }

  /**
   * Notify all listeners of the current auth state
   */
  private notifyListeners(): void {
    for (const listener of this.authListeners) {
      listener(this.currentUser);
    }
  }

  /**
   * Create a mock user
   * @param email The email for the mock user
   * @returns A mock user
   */
  private createMockUser(email: string): User {
    return {
      uid: `mock-uid-${Date.now()}`,
      email,
      emailVerified: true,
      isAnonymous: false,
      displayName: null,
      phoneNumber: null,
      photoURL: null,
      providerId: 'password',
      metadata: {
        creationTime: new Date().toISOString(),
        lastSignInTime: new Date().toISOString()
      },
      providerData: [],
      refreshToken: 'mock-refresh-token',
      tenantId: null,
      delete: async () => {},
      getIdToken: async () => 'mock-id-token',
      getIdTokenResult: async () => ({
        token: 'mock-id-token',
        signInProvider: 'password',
        expirationTime: new Date(Date.now() + 3600000).toISOString(),
        issuedAtTime: new Date().toISOString(),
        authTime: new Date().toISOString(),
        claims: {}
      }),
      reload: async () => {},
      toJSON: () => ({})
    } as unknown as User;
  }
}