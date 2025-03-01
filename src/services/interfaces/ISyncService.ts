/**
 * Interface for synchronization service
 * Provides methods for synchronizing data between local and remote storage
 */
export interface ISyncService {
  /**
   * Initialize synchronization
   * Sets up listeners and performs initial sync if needed
   * @returns Promise resolving when initialization is complete
   */
  initSync(): Promise<void>;

  /**
   * Sync data from local storage to remote storage
   * @returns Promise resolving when the operation is complete
   */
  syncToRemote(): Promise<void>;

  /**
   * Sync data from remote storage to local storage
   * @returns Promise resolving when the operation is complete
   */
  syncFromRemote(): Promise<void>;

  /**
   * Set up a listener for remote changes
   * @param userId The ID of the user to listen for changes
   * @returns Function to unsubscribe from changes
   */
  setupRemoteListener(userId: string): (() => void);

  /**
   * Initialize online status listeners
   * Sets up event listeners for online/offline status
   */
  initOnlineStatusListeners(): void;

  /**
   * Add a listener for online status changes
   * @param listener Function to call when online status changes
   */
  addOnlineStatusListener(listener: (online: boolean) => void): void;

  /**
   * Remove a listener for online status changes
   * @param listener The listener to remove
   */
  removeOnlineStatusListener(listener: (online: boolean) => void): void;

  /**
   * Get the current online status
   * @returns True if online, false if offline
   */
  isOnline(): boolean;
}