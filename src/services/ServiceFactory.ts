import { 
  IAuthService, 
  IStorageService, 
  ISyncService 
} from './interfaces';
import { 
  FirebaseAuthService, 
  FirebaseStorageService, 
  FirebaseSyncService 
} from './implementations/firebase';
import { 
  IndexedDBStorageService 
} from './implementations/indexeddb';
import { 
  MockAuthService, 
  MockStorageService, 
  MockSyncService 
} from './implementations/mock';

/**
 * Environment type for service factory
 */
export type Environment = 'production' | 'development' | 'testing';

/**
 * Service factory for creating service instances
 */
export class ServiceFactory {
  private static instance: ServiceFactory;
  private environment: Environment;
  
  // Service instances
  private authService: IAuthService | null = null;
  private localStorageService: IStorageService | null = null;
  private remoteStorageService: IStorageService | null = null;
  private syncService: ISyncService | null = null;

  /**
   * Private constructor to enforce singleton pattern
   * @param environment The environment to use for service creation
   */
  private constructor(environment: Environment = 'production') {
    this.environment = environment;
  }

  /**
   * Get the singleton instance of the service factory
   * @param environment The environment to use for service creation
   * @returns The service factory instance
   */
  public static getInstance(environment?: Environment): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory(environment);
    } else if (environment && ServiceFactory.instance.environment !== environment) {
      // If environment changes, reset the instance
      ServiceFactory.instance = new ServiceFactory(environment);
    }
    
    return ServiceFactory.instance;
  }

  /**
   * Set the environment for service creation
   * @param environment The environment to use
   */
  public setEnvironment(environment: Environment): void {
    if (this.environment !== environment) {
      this.environment = environment;
      
      // Reset service instances
      this.authService = null;
      this.localStorageService = null;
      this.remoteStorageService = null;
      this.syncService = null;
    }
  }

  /**
   * Get the current environment
   * @returns The current environment
   */
  public getEnvironment(): Environment {
    return this.environment;
  }

  /**
   * Get the authentication service
   * @returns The authentication service
   */
  public getAuthService(): IAuthService {
    if (!this.authService) {
      switch (this.environment) {
        case 'production':
        case 'development':
          this.authService = new FirebaseAuthService();
          break;
        case 'testing':
          this.authService = new MockAuthService();
          break;
      }
    }
    
    return this.authService;
  }

  /**
   * Get the local storage service
   * @returns The local storage service
   */
  public getLocalStorageService(): IStorageService {
    if (!this.localStorageService) {
      switch (this.environment) {
        case 'production':
        case 'development':
          this.localStorageService = new IndexedDBStorageService();
          break;
        case 'testing':
          this.localStorageService = new MockStorageService();
          // Auto-initialize in testing environment
          this.localStorageService.initStorage().catch(err => {
            console.warn('Failed to auto-initialize MockStorageService:', err);
          });
          break;
      }
    }
    
    return this.localStorageService;
  }

  /**
   * Get the remote storage service
   * @returns The remote storage service
   */
  public getRemoteStorageService(): IStorageService {
    if (!this.remoteStorageService) {
      switch (this.environment) {
        case 'production':
        case 'development':
          this.remoteStorageService = new FirebaseStorageService();
          break;
        case 'testing':
          this.remoteStorageService = new MockStorageService();
          break;
      }
    }
    
    return this.remoteStorageService;
  }

  /**
   * Get the synchronization service
   * @returns The synchronization service
   */
  public getSyncService(): ISyncService {
    if (!this.syncService) {
      switch (this.environment) {
        case 'production':
        case 'development':
          this.syncService = new FirebaseSyncService(
            this.getAuthService(),
            this.getLocalStorageService(),
            this.getRemoteStorageService()
          );
          break;
        case 'testing':
          this.syncService = new MockSyncService();
          break;
      }
    }
    
    return this.syncService;
  }

  /**
   * Initialize all services
   * @returns Promise resolving when all services are initialized
   */
  public async initializeServices(): Promise<void> {
    // Get all services to create them
    const authService = this.getAuthService();
    const localStorageService = this.getLocalStorageService();
    const remoteStorageService = this.getRemoteStorageService();
    const syncService = this.getSyncService();
    
    // Initialize storage services
    await localStorageService.initStorage();
    
    // Only initialize remote storage in production/development
    if (this.environment !== 'testing') {
      await remoteStorageService.initStorage();
    }
    
    // Initialize sync service
    await syncService.initSync();
  }
}

// Export a default instance with the current environment
export const serviceFactory = ServiceFactory.getInstance(
  process.env.NODE_ENV === 'test' ? 'testing' : 'production'
);