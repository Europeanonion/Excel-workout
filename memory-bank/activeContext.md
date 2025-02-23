# Active Context: Excel Workout PWA

## Current Work Focus

Initializing the memory bank and setting up the basic project structure.

## Recent Changes

*   Created `package.json`, `tsconfig.json`.
*   Created `public/index.html`, `public/manifest.json`.
*   Created `src/index.tsx`, `src/App.tsx`, `src/serviceWorkerRegistration.ts`, `src/index.css`, `src/reportWebVitals.ts`, `src/types/index.ts`.
*   Created `memory-bank/projectbrief.md`, `memory-bank/productContext.md`, `memory-bank/systemPatterns.md`, `memory-bank/techContext.md`, `memory-bank/progress.md`.
*   Created `.gitignore` and added `node_modules/`.
*   Created `src/features/excelParsing/excelParser.ts` and `src/features/excelParsing/excelParser.test.ts`.
*   Refined the development plan through discussion and analysis.


## Next Steps

**Phase 1: Core Functionality - Excel Parsing and Local Storage**

1.  **Install Dependencies:** Run `npm install`.
2.  **Complete Excel Parsing:**
    *   Implement in `src/features/excelParsing/excelParser.ts`.
    *   Use dynamic header mapping.
    *   Handle data types and convert dates to ISO 8601 format.
    *   Implement robust error handling and display user-friendly messages.
    *   Thoroughly test with `src/features/excelParsing/excelParser.test.ts`.
    *   Use TypeScript interfaces from `src/types/index.ts`.
3.  **IndexedDB Integration:**
    *   Implement in `src/lib/indexedDB.ts` (create this file).
    *   Create database and object store.
    *   Implement functions to store, retrieve, and delete workout programs.
    *   Handle IndexedDB errors.

**Phase 2: Basic UI and Workout Tracking**

4.  **Basic UI Components:**
    *   Create React component(s) for file input, program list, and workout display.
    *   Use CSS Modules.
    *   Use semantic HTML and ARIA attributes.
5.  **Workout Tracking (Initial Implementation):**
    *   Implement basic state management (`useState`, `useContext`).
    *   Add UI for marking sets complete, entering reps/load.
    *   Use functional form of `setState`.

**Phase 3: Data Synchronization and Refinement**

6.  **Firebase Integration:**
    *   Set up Firebase (create `.env.local`).
    *   Implement in `src/features/dataSync/` (create directory and files).
    *   Implement synchronization and conflict resolution.
    *   Handle Firestore errors.
7.  **Enhanced UI and Features:**
    *   Add RPE and notes inputs.
    *   Implement progress visualization.
    *   Improve UI/UX.
8.  **Testing and Optimization:**
    *   Write comprehensive tests.
    *   Address iOS considerations.
    *   Implement service worker caching.
    *   Profile and optimize performance (memoization).
    *   Consider a validation library.
9.  **Address TODOs:**
    *   Address npm vulnerabilities.

**Phase 4: Optional Features**

10. **Authentication (Optional):** Implement Firebase Authentication.

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
