p# Tech Context: Excel Workout PWA

## Technologies Used

*   **Frontend:**
    *   **React:** JavaScript library for building user interfaces.
        * Functional components with hooks
        * CSS Modules for component-scoped styling
        * React Testing Library for component testing
    *   **TypeScript:**  Superset of JavaScript that adds static typing.
        * Strict type checking enabled
        * Custom type declarations for CSS modules
        * Comprehensive interfaces for data models
    *   **IndexedDB:**  Browser-based NoSQL database for offline storage.
        * Structured workout program storage
        * Async/await wrapper functions
        * Error handling and type safety
    *   **`idb` library:**  A small wrapper around IndexedDB for easier use.
    *   **`xlsx` library:**  For parsing Excel files.
        * Dynamic header mapping
        * Type-safe data extraction
        * Error handling for invalid files
    *   **`uuid` library:** For generating unique identifiers.
    *   **Service Worker API:** For enabling PWA features (offline support, background sync).
*   **Backend:**
    *   **Firebase Firestore:** NoSQL, real-time database for data storage and synchronization.
    *   **Firebase Authentication (Optional):** For user authentication.
* **Development Tools:**
    * **npm:** Package manager.
    * **Create React App:**  Tool for bootstrapping React projects.
    * **VS Code:** Code editor.

## Development Setup

1.  **Install Node.js and npm:**  Make sure you have Node.js and npm installed on your system.
2.  **Clone the repository:** `git clone <repository_url>`
3.  **Install dependencies:** `npm install`
4.  **Set up Firebase:**
    *   Create a Firebase project in the Firebase console.
    *   Enable Firestore.
    *   (Optional) Enable Firebase Authentication.
    *   Obtain your Firebase configuration (API key, auth domain, project ID, etc.).
    * Create a file named `.env.local` in the root of your project and add your Firebase config:
        ```
        REACT_APP_FIREBASE_API_KEY=your_api_key
        REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
        REACT_APP_FIREBASE_PROJECT_ID=your_project_id
        REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
        REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
        REACT_APP_FIREBASE_APP_ID=your_app_id
        REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
        ```
5.  **Start the development server:** `npm start`

## Technical Constraints

*   **iOS Safari Compatibility:**  
    * Full IndexedDB support with error handling
    * Service worker compatibility
    * Touch-friendly UI components
    * High contrast mode support
*   **Offline-First:**  
    * Complete offline functionality
    * Local-first data storage
    * Background sync capability
    * Graceful error handling
*   **Excel File Complexity:** 
    * Dynamic header mapping for flexibility
    * Support for merged cells
    * Multiple data type handling
    * Validation and error reporting
*   **Accessibility:**
    * ARIA attributes for all components
    * Semantic HTML structure
    * Keyboard navigation support
    * Screen reader compatibility

## Dependencies
* Listed in `package.json`

## Development Patterns
* **Component Structure:**
    * One component per file
    * CSS Module for styling
    * Test file alongside component
    * Index.ts for clean exports
* **Type Safety:**
    * TypeScript interfaces for all data structures
    * Strict null checks enabled
    * Type declarations for external modules
* **Testing:**
    * Jest for unit testing
    * React Testing Library for components
    * Mock implementations for external services
* **Error Handling:**
    * Type-safe error handling
    * User-friendly error messages
    * Comprehensive error logging

**Note:** We should consider using a validation library like Zod or Yup for more complex data validation scenarios.
