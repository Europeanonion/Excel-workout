import { IAuthService, ISyncService, IStorageService } from '../../interfaces';
import { WorkoutProgram, WorkoutSession } from '../../../types';
import { debounce } from 'lodash';
import {
  onSnapshot,
  query,
  where,
  collection,
  Firestore,
  doc,
  getDoc,
  updateDoc,
  writeBatch,
  QuerySnapshot,
  DocumentData,
  Unsubscribe,
  getDocs
} from 'firebase/firestore';
import { db } from '../../../firebase/firestore-app';

/**
 * Represents a pending operation for offline sync
 */
interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: 'programs' | 'sessions';
  data?: any;
  timestamp: number;
  retryCount: number;
}

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
  private sessionsCollection: string = 'sessions';
  private pendingOperationsCollection: string = 'pendingOperations';
  private pendingOperations: PendingOperation[] = [];
  private syncInProgress: boolean = false;
  private programListeners: Unsubscribe[] = [];
  private sessionListeners: Unsubscribe[] = [];
  private maxRetryCount: number = 5;
  private syncInterval: number = 60000; // 1 minute
  private syncIntervalId: NodeJS.Timeout | null = null;

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
    if (!user) return;

    // Load pending operations from local storage
    await this.loadPendingOperations();
    
    if (this._isOnline) {
      // Initial sync from remote to local
      await this.syncFromRemote();
      
      // Process any pending operations
      await this.processPendingOperations();
      
      // Setup listeners for future changes
      this.setupRemoteListener(user.uid);
      
      // Start periodic sync
      this.startPeriodicSync();
    }
  }

  /**
   * Set up a listener for remote changes
   * @param userId The ID of the user to listen for changes
   * @returns Function to unsubscribe from changes
   */
  setupRemoteListener(userId: string): (() => void) {
    // Setup listeners for programs and sessions
    const programsUnsubscribe = this.setupProgramsListener(userId);
    const sessionsUnsubscribe = this.setupSessionsListener(userId);
    
    // Return a function that unsubscribes from both listeners
    return () => {
      programsUnsubscribe();
      sessionsUnsubscribe();
    };
  }

  /**
   * Start periodic sync to ensure data is synchronized
   */
  private startPeriodicSync(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }
    
    this.syncIntervalId = setInterval(async () => {
      if (this._isOnline && !this.syncInProgress) {
        try {
          await this.processPendingOperations();
          await this.syncToRemote();
        } catch (error) {
          console.error('Error during periodic sync:', error);
        }
      }
    }, this.syncInterval);
  }

  /**
   * Stop periodic sync
   */
  private stopPeriodicSync(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }

  /**
   * Load pending operations from local storage
   */
  private async loadPendingOperations(): Promise<void> {
    try {
      // Use IndexedDB to store pending operations
      const pendingOpsKey = 'pendingOperations';
      const storedOps = localStorage.getItem(pendingOpsKey);
      
      if (storedOps) {
        this.pendingOperations = JSON.parse(storedOps);
        console.log(`Loaded ${this.pendingOperations.length} pending operations`);
      }
    } catch (error) {
      console.error('Error loading pending operations:', error);
      this.pendingOperations = [];
    }
  }

  /**
   * Save pending operations to local storage
   */
  private async savePendingOperations(): Promise<void> {
    try {
      // Use IndexedDB to store pending operations
      const pendingOpsKey = 'pendingOperations';
      localStorage.setItem(pendingOpsKey, JSON.stringify(this.pendingOperations));
    } catch (error) {
      console.error('Error saving pending operations:', error);
    }
  }

  /**
   * Add a pending operation to the queue
   * @param operation The operation to add
   */
  private async addPendingOperation(operation: PendingOperation): Promise<void> {
    this.pendingOperations.push(operation);
    await this.savePendingOperations();
  }

  /**
   * Remove a pending operation from the queue
   * @param id The ID of the operation to remove
   */
  private async removePendingOperation(id: string): Promise<void> {
    this.pendingOperations = this.pendingOperations.filter(op => op.id !== id);
    await this.savePendingOperations();
  }

  /**
   * Process all pending operations
   * @returns Promise resolving when all operations are processed
   */
  private async processPendingOperations(): Promise<void> {
    if (!this._isOnline || this.syncInProgress || this.pendingOperations.length === 0) {
      return;
    }
    
    this.syncInProgress = true;
    
    try {
      const user = this.authService.getCurrentUser();
      if (!user) {
        this.syncInProgress = false;
        return;
      }
      
      // Sort operations by timestamp (oldest first)
      const sortedOperations = [...this.pendingOperations].sort((a, b) => a.timestamp - b.timestamp);
      
      // Process operations in batches to avoid Firestore limits
      const batchSize = 20;
      for (let i = 0; i < sortedOperations.length; i += batchSize) {
        const batch = sortedOperations.slice(i, i + batchSize);
        const successfulOps: string[] = [];
        
        for (const operation of batch) {
          try {
            if (operation.retryCount >= this.maxRetryCount) {
              console.warn(`Operation ${operation.id} exceeded max retry count, removing`);
              successfulOps.push(operation.id);
              continue;
            }
            
            // Increment retry count
            operation.retryCount++;
            
            // Process based on operation type
            switch (operation.type) {
              case 'create':
              case 'update':
                if (operation.collection === 'programs') {
                  await this.remoteStorageService.storeWorkoutProgram(operation.data);
                } else if (operation.collection === 'sessions') {
                  await this.remoteStorageService.storeWorkoutSession(operation.data);
                }
                break;
              case 'delete':
                if (operation.collection === 'programs') {
                  await this.remoteStorageService.deleteWorkoutProgram(operation.id);
                } else if (operation.collection === 'sessions') {
                  // Implement delete workout session in IStorageService
                  const docRef = doc(this.db, this.sessionsCollection, operation.id);
                  await updateDoc(docRef, { deleted: true });
                }
                break;
            }
            
            // Mark as successful
            successfulOps.push(operation.id);
          } catch (error) {
            console.error(`Error processing operation ${operation.id}:`, error);
            // Operation will be retried next time
          }
        }
        
        // Remove successful operations
        for (const opId of successfulOps) {
          await this.removePendingOperation(opId);
        }
      }
      
      console.log(`Processed ${sortedOperations.length} pending operations`);
    } catch (error) {
      console.error('Error processing pending operations:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync data from local storage to remote storage
   * @returns Promise resolving when the operation is complete
   */
  async syncToRemote(): Promise<void> {
    if (!this._isOnline || this.syncInProgress) return;
    
    const user = this.authService.getCurrentUser();
    if (!user) return;
    
    this.syncInProgress = true;
    
    try {
      // Get all programs from local storage
      const localPrograms = await this.localStorageService.getAllWorkoutPrograms();
      
      // Get all programs from remote storage for this user
      const remotePrograms = await this.getUserWorkoutPrograms(user.uid);
      const remoteProgramMap = new Map(remotePrograms.map(p => [p.id, p]));
      
      // Create a batch for Firestore operations
      const batch = writeBatch(this.db);
      let operationCount = 0;
      
      // Process each local program
      for (const program of localPrograms) {
        // Add user ID if not present
        const programWithUserId = {
          ...program,
          userId: program.userId || user.uid,
          updatedAt: Date.now()
        };
        
        const remoteProgram = remoteProgramMap.get(program.id);
        
        // If remote program doesn't exist or local is newer, save to remote
        if (!remoteProgram || !remoteProgram.updatedAt || (program.updatedAt && program.updatedAt > remoteProgram.updatedAt)) {
          const docRef = doc(this.db, this.programsCollection, program.id);
          batch.set(docRef, programWithUserId);
          operationCount++;
          
          // If batch is full, commit it and create a new one
          if (operationCount >= 500) {
            await batch.commit();
            operationCount = 0;
          }
        }
      }
      
      // Commit any remaining operations
      if (operationCount > 0) {
        await batch.commit();
      }
      
      // Now sync workout sessions
      await this.syncWorkoutSessionsToRemote(user.uid);
      
      console.log('Successfully synced to remote storage');
    } catch (error) {
      console.error('Error syncing to remote storage:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync workout sessions from local to remote storage
   * @param userId The ID of the user
   * @returns Promise resolving when the operation is complete
   */
  private async syncWorkoutSessionsToRemote(userId: string): Promise<void> {
    try {
      // Get all programs from local storage
      const localPrograms = await this.localStorageService.getAllWorkoutPrograms();
      
      // Create a batch for Firestore operations
      const batch = writeBatch(this.db);
      let operationCount = 0;
      
      // Process each program's sessions
      for (const program of localPrograms) {
        // Get sessions for this program
        const sessions = await this.localStorageService.getWorkoutSessions(program.id);
        
        for (const session of sessions) {
          // Add user ID if not present
          const sessionWithUserId = {
            ...session,
            userId: userId,
            updatedAt: Date.now()
          };
          
          const docRef = doc(this.db, this.sessionsCollection, session.sessionId);
          batch.set(docRef, sessionWithUserId);
          operationCount++;
          
          // If batch is full, commit it and create a new one
          if (operationCount >= 500) {
            await batch.commit();
            operationCount = 0;
          }
        }
      }
      
      // Commit any remaining operations
      if (operationCount > 0) {
        await batch.commit();
      }
      
      console.log('Successfully synced workout sessions to remote storage');
    } catch (error) {
      console.error('Error syncing workout sessions to remote storage:', error);
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
    if (!this._isOnline || this.syncInProgress) return;
    
    const user = this.authService.getCurrentUser();
    if (!user) return;
    
    this.syncInProgress = true;
    
    try {
      // Get all programs from remote storage for this user
      const remotePrograms = await this.getUserWorkoutPrograms(user.uid);
      
      // Get all programs from local storage
      const localPrograms = await this.localStorageService.getAllWorkoutPrograms();
      const localProgramMap = new Map(localPrograms.map(p => [p.id, p]));
      
      // Process each remote program
      for (const program of remotePrograms) {
        const localProgram = localProgramMap.get(program.id);
        
        // If local program doesn't exist or remote is newer, save to local storage
        if (!localProgram || !localProgram.updatedAt || (program.updatedAt && program.updatedAt > localProgram.updatedAt)) {
          await this.localStorageService.storeWorkoutProgram(program);
        } else if (localProgram.updatedAt && program.updatedAt && localProgram.updatedAt === program.updatedAt) {
          // If timestamps are equal, merge the data
          const mergedProgram = this.mergePrograms(localProgram, program);
          await this.localStorageService.storeWorkoutProgram(mergedProgram);
        }
      }
      
      // Now sync workout sessions
      await this.syncWorkoutSessionsFromRemote(user.uid);
      
      console.log('Successfully synced from remote storage');
    } catch (error) {
      console.error('Error syncing from remote storage:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync workout sessions from remote to local storage
   * @param userId The ID of the user
   * @returns Promise resolving when the operation is complete
   */
  private async syncWorkoutSessionsFromRemote(userId: string): Promise<void> {
    try {
      // Get all sessions from remote storage for this user
      const q = query(
        collection(this.db, this.sessionsCollection),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      
      const remoteSessions: WorkoutSession[] = [];
      querySnapshot.forEach((docSnapshot) => {
        const session = docSnapshot.data() as WorkoutSession;
        if (!session.deleted) {
          remoteSessions.push(session);
        }
      });
      
      // Process each remote session
      for (const session of remoteSessions) {
        // Get local sessions for this program
        const localSessions = await this.localStorageService.getWorkoutSessions(session.programId);
        const localSessionMap = new Map(localSessions.map(s => [s.sessionId, s]));
        
        const localSession = localSessionMap.get(session.sessionId);
        
        // If local session doesn't exist or remote is newer, save to local storage
        if (!localSession || !localSession.updatedAt || (session.updatedAt && session.updatedAt > localSession.updatedAt)) {
          await this.localStorageService.storeWorkoutSession(session);
        } else if (localSession.updatedAt && session.updatedAt && localSession.updatedAt === session.updatedAt) {
          // If timestamps are equal, merge the data
          const mergedSession = this.mergeSessions(localSession, session);
          await this.localStorageService.storeWorkoutSession(mergedSession);
        }
      }
      
      console.log('Successfully synced workout sessions from remote storage');
    } catch (error) {
      console.error('Error syncing workout sessions from remote storage:', error);
      throw error;
    }
  }

  /**
   * Merge two workout programs to resolve conflicts
   * @param local The local workout program
   * @param remote The remote workout program
   * @returns The merged workout program
   */
  private mergePrograms(local: WorkoutProgram, remote: WorkoutProgram): WorkoutProgram {
    // Create a new object with all properties from both programs
    const merged: WorkoutProgram = {
      ...remote,
      ...local,
      // Ensure ID and user ID are preserved
      id: local.id,
      userId: local.userId || remote.userId,
      // Use the latest timestamp
      updatedAt: Math.max(local.updatedAt || 0, remote.updatedAt || 0),
      // Merge workouts
      workouts: this.mergeWorkouts(local.workouts, remote.workouts),
      // Merge history (prefer local history as it's more likely to be up-to-date)
      history: this.mergeHistory(local.history, remote.history)
    };
    
    return merged;
  }

  /**
   * Merge two arrays of workouts
   * @param local The local workouts
   * @param remote The remote workouts
   * @returns The merged workouts
   */
  private mergeWorkouts(local: any[], remote: any[]): any[] {
    // Create a map of workouts by week and day
    const workoutMap = new Map<string, any>();
    
    // Add remote workouts to the map
    for (const workout of remote) {
      const key = `${workout.week}-${workout.day}`;
      workoutMap.set(key, workout);
    }
    
    // Override with local workouts where they exist
    for (const workout of local) {
      const key = `${workout.week}-${workout.day}`;
      workoutMap.set(key, workout);
    }
    
    // Convert map back to array
    return Array.from(workoutMap.values());
  }

  /**
   * Merge two arrays of workout history
   * @param local The local history
   * @param remote The remote history
   * @returns The merged history
   */
  private mergeHistory(local: any[], remote: any[]): any[] {
    // Create a map of history entries by session ID
    const historyMap = new Map<string, any>();
    
    // Add remote history to the map
    for (const entry of remote) {
      historyMap.set(entry.sessionId, entry);
    }
    
    // Override with local history where they exist
    for (const entry of local) {
      historyMap.set(entry.sessionId, entry);
    }
    
    // Convert map back to array and sort by date
    return Array.from(historyMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Merge two workout sessions to resolve conflicts
   * @param local The local workout session
   * @param remote The remote workout session
   * @returns The merged workout session
   */
  private mergeSessions(local: WorkoutSession, remote: WorkoutSession): WorkoutSession {
    // Create a new object with all properties from both sessions
    const merged: WorkoutSession = {
      ...remote,
      ...local,
      // Ensure session ID and program ID are preserved
      sessionId: local.sessionId,
      programId: local.programId,
      // Use the latest timestamp
      updatedAt: Math.max(local.updatedAt || 0, remote.updatedAt || 0),
      // Merge exercises (prefer local exercises as they're more likely to be up-to-date)
      exercises: this.mergeExercises(local.exercises, remote.exercises)
    };
    
    return merged;
  }

  /**
   * Merge two arrays of exercises
   * @param local The local exercises
   * @param remote The remote exercises
   * @returns The merged exercises
   */
  private mergeExercises(local: any[], remote: any[]): any[] {
    // Create a map of exercises by name
    const exerciseMap = new Map<string, any>();
    
    // Add remote exercises to the map
    for (const exercise of remote) {
      exerciseMap.set(exercise.exerciseName, exercise);
    }
    
    // Override with local exercises where they exist
    for (const exercise of local) {
      exerciseMap.set(exercise.exerciseName, exercise);
    }
    
    // Convert map back to array
    return Array.from(exerciseMap.values());
  }

  /**
   * Get all workout programs for a user from remote storage
   * @param userId The ID of the user
   * @returns Promise resolving to an array of workout programs
   */
  private async getUserWorkoutPrograms(userId: string): Promise<WorkoutProgram[]> {
    try {
      // Get all programs from remote storage
      const q = query(
        collection(this.db, this.programsCollection),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      
      const programs: WorkoutProgram[] = [];
      querySnapshot.forEach((docSnapshot) => {
        const program = docSnapshot.data() as WorkoutProgram;
        if (!program.deleted) {
          programs.push(program);
        }
      });
      
      return programs;
    } catch (error) {
      console.error('Error getting user workout programs:', error);
      throw error;
    }
  }

  /**
   * Set up listeners for remote changes
   * @param userId The ID of the user to listen for changes
   */
  setupRemoteListeners(userId: string): void {
    // Setup listener for workout programs
    this.setupProgramsListener(userId);
    
    // Setup listener for workout sessions
    this.setupSessionsListener(userId);
  }

  /**
   * Set up a listener for remote program changes
   * @param userId The ID of the user to listen for changes
   * @returns Function to unsubscribe from changes
   */
  private setupProgramsListener(userId: string): Unsubscribe {
    const q = query(
      collection(this.db, this.programsCollection),
      where('userId', '==', userId)
    );
    
    const unsubscribe = onSnapshot(q, async (querySnapshot: QuerySnapshot<DocumentData>) => {
      try {
        if (this.syncInProgress) return;
        
        this.syncInProgress = true;
        
        // Get all local programs
        const localPrograms = await this.localStorageService.getAllWorkoutPrograms();
        const localProgramMap = new Map(localPrograms.map(p => [p.id, p]));
        
        // Update or add programs from remote
        const remotePrograms: WorkoutProgram[] = [];
        querySnapshot.forEach((docSnapshot) => {
          const program = docSnapshot.data() as WorkoutProgram;
          if (!program.deleted) {
            remotePrograms.push(program);
          }
        });
        
        for (const program of remotePrograms) {
          const localProgram = localProgramMap.get(program.id);
          
          // If local program doesn't exist or remote is newer, save to local storage
          if (!localProgram || !localProgram.updatedAt || (program.updatedAt && program.updatedAt > localProgram.updatedAt)) {
            await this.localStorageService.storeWorkoutProgram(program);
          } else if (localProgram.updatedAt && program.updatedAt && localProgram.updatedAt === program.updatedAt) {
            // If timestamps are equal, merge the data
            const mergedProgram = this.mergePrograms(localProgram, program);
            await this.localStorageService.storeWorkoutProgram(mergedProgram);
          }
        }
        
        // Handle deleted programs
        const remoteIds = new Set(remotePrograms.map(p => p.id));
        for (const localProgram of localPrograms) {
          if (!remoteIds.has(localProgram.id) && localProgram.userId === userId) {
            // Check if it's marked as deleted in Firestore
            const docRef = doc(this.db, this.programsCollection, localProgram.id);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists() && docSnap.data().deleted) {
              await this.localStorageService.deleteWorkoutProgram(localProgram.id);
            } else if (!docSnap.exists()) {
              // If it doesn't exist in Firestore, it might have been deleted
              // Add a pending operation to check if it should be recreated
              await this.addPendingOperation({
                id: localProgram.id,
                type: 'update',
                collection: 'programs',
                data: {
                  ...localProgram,
                  updatedAt: Date.now()
                },
                timestamp: Date.now(),
                retryCount: 0
              });
            }
          }
        }
        
        console.log('Successfully updated local storage from remote program changes');
      } catch (error) {
        console.error('Error updating local storage from remote program changes:', error);
      } finally {
        this.syncInProgress = false;
      }
    });
    
    // Add to program listeners for cleanup
    this.programListeners.push(unsubscribe);
    
    return unsubscribe;
  }

  /**
   * Set up a listener for remote session changes
   * @param userId The ID of the user to listen for changes
   * @returns Function to unsubscribe from changes
   */
  private setupSessionsListener(userId: string): Unsubscribe {
    const q = query(
      collection(this.db, this.sessionsCollection),
      where('userId', '==', userId)
    );
    
    const unsubscribe = onSnapshot(q, async (querySnapshot: QuerySnapshot<DocumentData>) => {
      try {
        if (this.syncInProgress) return;
        
        this.syncInProgress = true;
        
        // Get all local programs
        const localPrograms = await this.localStorageService.getAllWorkoutPrograms();
        
        // Process each program's sessions
        for (const program of localPrograms) {
          // Get local sessions for this program
          const localSessions = await this.localStorageService.getWorkoutSessions(program.id);
          const localSessionMap = new Map(localSessions.map(s => [s.sessionId, s]));
          
          // Get remote sessions for this program
          const remoteSessions: WorkoutSession[] = [];
          querySnapshot.forEach((docSnapshot) => {
            const session = docSnapshot.data() as WorkoutSession;
            if (session.programId === program.id && !session.deleted) {
              remoteSessions.push(session);
            }
          });
          
          // Update or add sessions from remote
          for (const session of remoteSessions) {
            const localSession = localSessionMap.get(session.sessionId);
            
            // If local session doesn't exist or remote is newer, save to local storage
            if (!localSession || !localSession.updatedAt || (session.updatedAt && session.updatedAt > localSession.updatedAt)) {
              await this.localStorageService.storeWorkoutSession(session);
            } else if (localSession.updatedAt && session.updatedAt && localSession.updatedAt === session.updatedAt) {
              // If timestamps are equal, merge the data
              const mergedSession = this.mergeSessions(localSession, session);
              await this.localStorageService.storeWorkoutSession(mergedSession);
            }
          }
          
          // Handle deleted sessions
          const remoteIds = new Set(remoteSessions.map(s => s.sessionId));
          for (const localSession of localSessions) {
            if (!remoteIds.has(localSession.sessionId)) {
              // Check if it's marked as deleted in Firestore
              const docRef = doc(this.db, this.sessionsCollection, localSession.sessionId);
              const docSnap = await getDoc(docRef);
              
              if (docSnap.exists() && docSnap.data().deleted) {
                // Implement delete workout session in IStorageService
                // For now, we'll just add a pending operation
                await this.addPendingOperation({
                  id: localSession.sessionId,
                  type: 'delete',
                  collection: 'sessions',
                  timestamp: Date.now(),
                  retryCount: 0
                });
              } else if (!docSnap.exists()) {
                // If it doesn't exist in Firestore, it might have been deleted
                // Add a pending operation to check if it should be recreated
                await this.addPendingOperation({
                  id: localSession.sessionId,
                  type: 'update',
                  collection: 'sessions',
                  data: {
                    ...localSession,
                    updatedAt: Date.now()
                  },
                  timestamp: Date.now(),
                  retryCount: 0
                });
              }
            }
          }
        }
        
        console.log('Successfully updated local storage from remote session changes');
      } catch (error) {
        console.error('Error updating local storage from remote session changes:', error);
      } finally {
        this.syncInProgress = false;
      }
    });
    
    // Add to session listeners for cleanup
    this.sessionListeners.push(unsubscribe);
    
    return unsubscribe;
  }

  /**
   * Initialize online status listeners
   * Sets up event listeners for online/offline status
   */
  initOnlineStatusListeners(): void {
    window.addEventListener('online', () => {
      this._isOnline = true;
      this.onlineListeners.forEach(listener => listener(true));
      
      // Sync when coming back online
      this.processPendingOperations().then(() => {
        return this.syncToRemote();
      }).catch(error => {
        console.error('Error syncing after coming online:', error);
      });
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

  /**
   * Clean up resources when the service is no longer needed
   */
  cleanup(): void {
    // Stop periodic sync
    this.stopPeriodicSync();
    
    // Remove program listeners
    for (const unsubscribe of this.programListeners) {
      unsubscribe();
    }
    this.programListeners = [];
    
    // Remove session listeners
    for (const unsubscribe of this.sessionListeners) {
      unsubscribe();
    }
    this.sessionListeners = [];
    
    // Remove online status listeners
    window.removeEventListener('online', () => {});
    window.removeEventListener('offline', () => {});
  }
}