import { IAuthService, ISyncService, IStorageService } from '../../interfaces';
import { WorkoutProgram } from '../../../types';
import { debounce } from 'lodash';
import { onSnapshot, query, where, collection, Firestore } from 'firebase/firestore';
import { db } from '../../../firebase/config';

/**
 * Firebase implementation of the ISyncService interface
 */
export class FirebaseSyncService implements ISyncService {
  private authService: IAuthService;
  private localStorageService: IStorageService;
  private remoteStorageService: IStorageService;
  private db: Firestore;
  private _isOnline: boolean = navigator.onLine;
  private onlineListeners: ((online: boolean) => void)[] = [];
  private programsCollection: string = 'programs';

  constructor(
    authService: IAuthService,
    localStorageService: IStorageService,
    remoteStorageService: IStorageService,
    firestore: Firestore = db
  ) {
    this.authService = authService;
    this.localStorageService = localStorageService;
    this.remoteStorageService = remoteStorageService;
    this.db = firestore;
  }

  /**
   * Initialize synchronization
   * Sets up listeners and performs initial sync if needed
   * @returns Promise resolving when initialization is complete
   */
  async initSync(): Promise<void> {
    this.initOnlineStatusListeners();
    
    const user = this.authService.getCurrentUser();
    if (user && this._isOnline) {
      // Initial sync from remote to local
      await this.syncFromRemote();
      
      // Setup listener for future changes
      this.setupRemoteListener(user.uid);
    }
  }

  /**
   * Sync data from local storage to remote storage
   * @returns Promise resolving when the operation is complete
   */
  async syncToRemote(): Promise<void> {
    if (!this._isOnline) return;
    
    const user = this.authService.getCurrentUser();
    if (!user) return;
    
    try {
      // Get all programs from local storage
      const localPrograms = await this.localStorageService.getAllWorkoutPrograms();
      
      // Save each program to remote storage
      for (const program of localPrograms) {
        // Add user ID if not present
        const programWithUserId = {
          ...program,
          userId: program.userId || user.uid
        };
        
        await this.remoteStorageService.storeWorkoutProgram(programWithUserId);
      }
      
      console.log('Successfully synced to remote storage');
    } catch (error) {
      console.error('Error syncing to remote storage:', error);
      throw error;
    }
  }

  /**
   * Debounced version of syncToRemote to prevent too many calls
   */
  debouncedSyncToRemote = debounce(this.syncToRemote.bind(this), 5000);

  /**
   * Sync data from remote storage to local storage
   * @returns Promise resolving when the operation is complete
   */
  async syncFromRemote(): Promise<void> {
    if (!this._isOnline) return;
    
    const user = this.authService.getCurrentUser();
    if (!user) return;
    
    try {
      // Get all programs from remote storage for this user
      const remotePrograms = await this.getUserWorkoutPrograms(user.uid);
      
      // Save each program to local storage
      for (const program of remotePrograms) {
        await this.localStorageService.storeWorkoutProgram(program);
      }
      
      console.log('Successfully synced from remote storage');
    } catch (error) {
      console.error('Error syncing from remote storage:', error);
      throw error;
    }
  }

  /**
   * Get all workout programs for a user from remote storage
   * @param userId The ID of the user
   * @returns Promise resolving to an array of workout programs
   */
  private async getUserWorkoutPrograms(userId: string): Promise<WorkoutProgram[]> {
    try {
      // Get all programs from remote storage
      const allPrograms = await this.remoteStorageService.getAllWorkoutPrograms();
      
      // Filter programs for this user
      return allPrograms.filter(program => program.userId === userId);
    } catch (error) {
      console.error('Error getting user workout programs:', error);
      throw error;
    }
  }

  /**
   * Set up a listener for remote changes
   * @param userId The ID of the user to listen for changes
   * @returns Function to unsubscribe from changes
   */
  setupRemoteListener(userId: string): (() => void) {
    const q = query(
      collection(this.db, this.programsCollection),
      where('userId', '==', userId)
    );
    
    return onSnapshot(q, async (querySnapshot) => {
      try {
        // Get all local programs
        const localPrograms = await this.localStorageService.getAllWorkoutPrograms();
        const localProgramMap = new Map(localPrograms.map(p => [p.id, p]));
        
        // Update or add programs from remote
        const remotePrograms: WorkoutProgram[] = [];
        querySnapshot.forEach((doc) => {
          remotePrograms.push(doc.data() as WorkoutProgram);
        });
        
        for (const program of remotePrograms) {
          const localProgram = localProgramMap.get(program.id);
          
          // If local program doesn't exist or remote is newer, save to local storage
          if (!localProgram || (program.updatedAt > localProgram.updatedAt)) {
            await this.localStorageService.storeWorkoutProgram(program);
          }
        }
        
        // Delete programs that exist locally but not in remote
        const remoteIds = new Set(remotePrograms.map(p => p.id));
        for (const localProgram of localPrograms) {
          if (!remoteIds.has(localProgram.id)) {
            await this.localStorageService.deleteWorkoutProgram(localProgram.id);
          }
        }
        
        console.log('Successfully updated local storage from remote changes');
      } catch (error) {
        console.error('Error updating local storage from remote changes:', error);
      }
    });
  }

  /**
   * Initialize online status listeners
   * Sets up event listeners for online/offline status
   */
  initOnlineStatusListeners(): void {
    window.addEventListener('online', () => {
      this._isOnline = true;
      this.onlineListeners.forEach(listener => listener(true));
      this.syncToRemote(); // Sync when coming back online
    });
    
    window.addEventListener('offline', () => {
      this._isOnline = false;
      this.onlineListeners.forEach(listener => listener(false));
    });
  }

  /**
   * Add a listener for online status changes
   * @param listener Function to call when online status changes
   */
  addOnlineStatusListener(listener: (online: boolean) => void): void {
    this.onlineListeners.push(listener);
    // Immediately call with current status
    listener(this._isOnline);
  }

  /**
   * Remove a listener for online status changes
   * @param listener The listener to remove
   */
  removeOnlineStatusListener(listener: (online: boolean) => void): void {
    const index = this.onlineListeners.indexOf(listener);
    if (index !== -1) {
      this.onlineListeners.splice(index, 1);
    }
  }

  /**
   * Get the current online status
   * @returns True if online, false if offline
   */
  isOnline(): boolean {
    return this._isOnline;
  }
}