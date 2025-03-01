import { ISyncService } from '../../interfaces';

/**
 * Mock implementation of the ISyncService interface for testing
 */
export class MockSyncService implements ISyncService {
  private _isOnline: boolean = true;
  private onlineListeners: ((online: boolean) => void)[] = [];
  private remoteListenerUnsubscribe: (() => void) | null = null;

  /**
   * Initialize synchronization
   * Sets up listeners and performs initial sync if needed
   * @returns Promise resolving when initialization is complete
   */
  async initSync(): Promise<void> {
    // No actual initialization needed for mock
    return Promise.resolve();
  }

  /**
   * Sync data from local storage to remote storage
   * @returns Promise resolving when the operation is complete
   */
  async syncToRemote(): Promise<void> {
    // No actual sync needed for mock
    return Promise.resolve();
  }

  /**
   * Sync data from remote storage to local storage
   * @returns Promise resolving when the operation is complete
   */
  async syncFromRemote(): Promise<void> {
    // No actual sync needed for mock
    return Promise.resolve();
  }

  /**
   * Set up a listener for remote changes
   * @param userId The ID of the user to listen for changes
   * @returns Function to unsubscribe from changes
   */
  setupRemoteListener(userId: string): (() => void) {
    // Store the unsubscribe function for testing
    this.remoteListenerUnsubscribe = () => {
      // No actual unsubscribe needed for mock
    };
    
    return this.remoteListenerUnsubscribe;
  }

  /**
   * Initialize online status listeners
   * Sets up event listeners for online/offline status
   */
  initOnlineStatusListeners(): void {
    // No actual listeners needed for mock
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

  /**
   * Set the online status for testing
   * @param online The online status to set
   */
  setOnlineStatus(online: boolean): void {
    if (this._isOnline !== online) {
      this._isOnline = online;
      
      // Notify listeners
      for (const listener of this.onlineListeners) {
        listener(online);
      }
    }
  }

  /**
   * Check if remote listener is set up
   * @returns True if remote listener is set up, false otherwise
   */
  hasRemoteListener(): boolean {
    return this.remoteListenerUnsubscribe !== null;
  }

  /**
   * Simulate remote changes for testing
   * This would trigger any callbacks set up in setupRemoteListener
   */
  simulateRemoteChanges(): void {
    // In a real implementation, this would be triggered by Firestore
    // For testing, we can call this method to simulate remote changes
  }
}