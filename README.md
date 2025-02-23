# Excel Workout PWA

This project is a Progressive Web Application (PWA) that converts Excel workout files into a mobile-friendly workout tracking app. It is built with React, TypeScript, and Firebase, and supports offline functionality on iOS devices.

## Project Setup

1.  **Install Node.js and npm:** Make sure you have Node.js and npm installed on your system.
2.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    ```
3.  **Navigate to the project directory:**
    ```bash
    cd excel-workout-pwa
    ```
4.  **Install dependencies:**
    ```bash
    npm install
    ```
5.  **Set up Firebase:**
    *   Create a Firebase project in the Firebase console.
    *   Enable Firestore.
    *   (Optional) Enable Firebase Authentication.
    *   Obtain your Firebase configuration (API key, auth domain, project ID, etc.).
    *   Create a file named `.env.local` in the root of your project and add your Firebase config:
        ```
        REACT_APP_FIREBASE_API_KEY=your_api_key
        REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
        REACT_APP_FIREBASE_PROJECT_ID=your_project_id
        REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
        REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
        REACT_APP_FIREBASE_APP_ID=your_app_id
        REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
        ```
6.  **Start the development server:**
    ```bash
    npm start
    ```

## Future Development

*   **User Authentication:** Implement user authentication using Firebase Authentication.
*   **Progress Visualization:** Add charts and graphs to visualize workout progress.
*   **Workout Timer:** Include a built-in timer for tracking rest periods.
*   **Exercise Instructions/Videos:** Link to external resources for exercise demonstrations.
*   **User Settings:** Allow users to customize settings (e.g., preferred units).
*   **Onboarding:** Add an onboarding flow for new users.
* **Workout Template Editing:** Allow users to edit the workout templates after the initial upload.
* **Advanced Progress Metrics:** Track additional metrics like one-rep max estimates.
* **Social Features:** Allow users to share their progress or connect with friends.

</content>
# Excel-workout
