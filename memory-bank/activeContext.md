# Active Context: Excel Workout PWA

## Current Work Focus

Implementing core workout program management functionality and preparing for workout tracking features.

## Recent Changes

*   Completed Excel parsing implementation with:
    * Dynamic header mapping
    * Type-safe data handling
    * Comprehensive error handling
    * Full test coverage
*   Implemented IndexedDB integration for local storage
*   Created UI components:
    * ExcelUploader with file validation and error handling
    * ProgramList with dynamic loading and statistics
    * Responsive design and accessibility features
*   Added CSS Modules with high contrast mode support
*   Implemented comprehensive test coverage
*   Initialized Git repository and created initial commit


## Next Steps

**Phase 1: Core Functionality - Excel Parsing and Local Storage** ✅
- Completed Excel parsing with dynamic header mapping
- Implemented IndexedDB integration
- Created basic UI components with accessibility support
- Added comprehensive test coverage

**Phase 2: Workout Tracking Interface**
**Completed:**
- Create WorkoutDetails component
- Implement workout navigation
- Add exercise details display
- Include workout history view

**Next Steps:**
1. **Session Tracking:**
    - Create WorkoutSession component
    - Implement set tracking interface
    - Add progress indicators
    - Include note-taking functionality

2. **State Management:**
    - Evaluate state complexity
    - Consider implementing Zustand if needed
    - Set up proper state persistence

**Phase 3: Data Synchronization and Refinement**
1. **Firebase Integration:**
   - Set up Firebase configuration
   - Implement data synchronization
   - Add conflict resolution
   - Handle offline mode

2. **Enhanced Features:**
   - Add progress visualization
   - Implement workout statistics
   - Add export functionality
   - Include data backup options

3. **Performance Optimization:**
   - Implement service worker caching
   - Add iOS-specific optimizations
   - Profile and optimize performance
   - Implement proper error boundaries

**Phase 4: Optional Features**
1. **Authentication:**
   - Evaluate authentication requirements
   - Consider implementing Firebase Authentication
   - Add user profile management

**General Notes:**

*   Implement comprehensive error handling, display user-friendly messages, log errors.
*   Sanitize user input.
*   Write JSDoc comments.
*   Update `README.md`.
*   Run the linter (`npm run lint`).
*   Test with a screen reader.

## Active Decisions

*   Using Firebase (Firestore) for backend data storage and synchronization.
*   Using IndexedDB (with the `idb` library) for offline storage.
*   Using a feature-based architecture for the React codebase.
*   Using dynamic header mapping for flexible Excel file parsing.
*   Using UUIDs to uniquely identify workout programs.
*   Using a timestamp-based merge strategy with user override for conflict resolution.

## Potential Issues

*   In `WorkoutDetails.tsx`, the `startWorkout` function updates the program's history in both the component's state and IndexedDB. This might lead to redundant updates to IndexedDB. It would be better to update the program in IndexedDB only when a workout session is *completed*, not when it's *started*.

## Planned Fixes

Here's the plan to address the current issues:

1.  **`WorkoutDetails.tsx`:**
    *   Fix the `console.error` syntax (add missing comma).

2.  **`WorkoutDetails.test.tsx`:**
    *   Fix the `waitFor` timeout syntax.
    *   Update the selector for "Bench Press" to be more specific, using `within` and `getByRole('group', { name: /exercise-Bench Press/i })`.

3.  **`WorkoutSession.tsx`:**
      * Rename the imported `WorkoutSession` type to `WorkoutSessionType`.

4.  **`App.test.tsx` and `ProgramList.test.tsx`:**
    *   Wrap the `render` call in each test case with `MemoryRouter`.

5.  **`ExcelUploader.test.tsx` and `WorkoutSession.test.tsx`:**
    *   Wrap state updates and component rendering within `act()`.

6.  **`excelParser.ts` and `excelParser.test.ts`:**
    *   Update logic and tests to handle missing headers and exercise names.
