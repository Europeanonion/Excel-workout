# System Patterns: Excel Workout PWA

## System Architecture

This application follows a client-server architecture, with the PWA acting as the client and Firebase Firestore acting as the server. The client handles the user interface, Excel file parsing, and offline data storage, while the server handles data persistence, synchronization, and (optionally) authentication.

## Key Technical Decisions

*   **Offline-First:** The application is designed to work offline, using IndexedDB for local data storage. Data is synchronized with Firestore when a network connection is available.
*   **Data Synchronization:**  Firestore's real-time capabilities are leveraged for data synchronization. A timestamp-based merge strategy with user override is used for conflict resolution.
*   **Dynamic Header Mapping:**  The Excel parsing logic uses dynamic header mapping to support various file formats.

## Design Patterns

*   **Component-Based UI (React):** The user interface is built using reusable React components.
*   **Feature-Based Architecture:** The codebase is organized by feature, promoting modularity and maintainability.
*   **Model-View-Controller (MVC):**  Loosely follows the MVC pattern, with React components as the View, the data model (TypeScript interfaces) as the Model, and the application logic (including data fetching and synchronization) as the Controller.
* **Observer Pattern:** Used implicitly through React's state management and potentially explicitly with Firestore's real-time listeners.

## Component Relationships

```mermaid
graph LR
    subgraph Client [PWA - React + TypeScript]
        UI[User Interface Components] --> EL[Excel Parsing Logic (xlsx)]
        UI --> IDB[IndexedDB (idb library)]
        EL --> IDB
        IDB --> FS[Firebase SDK]
    end
    subgraph Server [Firebase]
        FS --> Firestore[Firestore Database]
        FS --> FA[Firebase Authentication (Optional)]
    end
