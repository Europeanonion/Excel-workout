# Product Context: Excel Workout PWA

## Why This Project Exists

Many people use Excel spreadsheets to plan and track their workouts. However, Excel is not ideal for use during workouts, especially on mobile devices. This PWA aims to bridge the gap between workout planning in Excel and convenient tracking on a mobile device.

## Problems It Solves

*   **Mobile-Unfriendly Workout Tracking:** Excel is cumbersome to use on a phone during a workout.
*   **Offline Access:**  Users may not always have internet access in their workout environment (e.g., a gym).
*   **Data Synchronization:**  Users need a way to keep their workout data synchronized between devices and potentially back up their data.
*   **Progress Visualization:** Excel doesn't provide easy ways to visualize workout progress over time.
*   **Workout Timing:** Excel doesn't provide rest timers or workout timing features.
*   **Set Management:** Excel doesn't offer an intuitive way to track and manage workout sets.
*   **File Format Flexibility:** Users may have different Excel file formats for their workout programs.
*   **User Feedback:** Excel doesn't provide visual feedback during file processing or workout tracking.

## How It Should Work

1.  Users upload their Excel workout files through an intuitive interface with proper validation and feedback.
2.  The PWA parses the Excel data and stores it locally in IndexedDB.
3.  Users select a workout program and track their progress (sets, reps, load, RPE, notes).
4.  The app provides visual progress indicators, rest timers, and set management tools.
5.  Workout history is stored locally and synchronized with Firebase Firestore when online.
6.  Users can view their progress over time.

## User Experience Goals

*   **Intuitive and Easy to Use:** The app should be simple to navigate and use, even during a workout.
*   **Fast and Responsive:**  The app should load quickly and respond instantly to user interactions.
*   **Visually Appealing:**  The app should have a clean and modern design with visual feedback.
*   **Reliable:**  Data should be stored securely and reliably, both offline and online.
*   **Accessible:** The PWA should be accessible for users with disabilities.
*   **Flexible:** Users should be able to customize their workout experience (e.g., rest times, set order).
*   **Error Resilient:** The app should handle errors gracefully and provide helpful feedback to users.
*   **Progressive:** The app should work on basic devices but provide enhanced experiences on more capable devices.

## Technical Implementation Status

*   **Excel Parsing:** Implemented with dynamic header mapping, type-safe data handling, and error handling.
*   **Local Storage:** IndexedDB integration is working for storing workout programs and session history.
*   **UI Components:**
    * File upload with validation and error handling
      * Current implementation provides basic functionality
      * Identified improvements include:
        * Enhanced file type validation
        * Progress indicators for large files
        * Drag and drop support
        * File size validation
        * Preview functionality
        * Better error messages
        * File input reset button
        * Template download option
        * Multiple file upload support
        * Code refactoring for better maintainability
    * Program listing with statistics
    * Workout details with exercise information
    * Comprehensive workout session tracking with:
        * Progress visualization
        * Rest timers
        * Set management with drag-and-drop reordering
        * Note-taking for exercises and sessions
        * Visual feedback for completed sets
*   **Testing:** All tests are now passing, providing good coverage of the application's functionality.
*   **Firebase Integration:** Not yet implemented.
