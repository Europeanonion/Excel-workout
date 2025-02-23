p# Tech Context: Excel Workout PWA

## Technologies Used

*   **Frontend:**
    *   **React:** JavaScript library for building user interfaces.
    *   **TypeScript:**  Superset of JavaScript that adds static typing.
    *   **IndexedDB:**  Browser-based NoSQL database for offline storage.
    *   **`idb` library:**  A small wrapper around IndexedDB for easier use.
    *   **`xlsx` library:**  For parsing Excel files.
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

*   **iOS Safari Compatibility:**  The PWA must be fully compatible with iOS Safari, including IndexedDB and service worker support.
*   **Offline-First:**  The application must function correctly even without an internet connection.
* **Excel File Complexity:** The application should handle a reasonable level of complexity in the Excel files, including merged cells and different data types. We are using dynamic header mapping to increase flexibility.

## Dependencies
* Listed in `package.json`

**Note:** We should consider using a validation library like Zod or Yup for more complex data validation scenarios.
