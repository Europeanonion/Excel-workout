# System Patterns: Excel Workout PWA

## System Architecture

This application follows a client-server architecture, with the PWA acting as the client and Firebase Firestore acting as the server. The client handles the user interface, Excel file parsing, and offline data storage, while the server handles data persistence, synchronization, and (optionally) authentication.

## Key Technical Decisions

*   **Offline-First:** The application is designed to work offline, using IndexedDB for local data storage. Data is synchronized with Firestore when a network connection is available.
*   **Data Synchronization:**  Firestore's real-time capabilities are leveraged for data synchronization. A timestamp-based merge strategy with user override is used for conflict resolution.
*   **Dynamic Header Mapping:**  The Excel parsing logic uses dynamic header mapping to support various file formats.

## Design Patterns

*   **Component-Based UI (React):** The user interface is built using reusable React components, each with its own:
    * CSS Module for scoped styling
    * TypeScript interface for props
    * Comprehensive test suite
    * Accessibility features
*   **Feature-Based Architecture:** The codebase is organized by feature, promoting modularity and maintainability:
    * Each feature has its own directory (e.g., excelParsing)
    * Features contain related components, utilities, and tests
    * Clear separation of concerns between features
*   **Model-View-Controller (MVC):**  Loosely follows the MVC pattern:
    * View: React components with CSS Modules
    * Model: TypeScript interfaces and IndexedDB storage
    * Controller: Feature-specific logic and data handling
*   **Observer Pattern:** Used in multiple ways:
    * React's state management for UI updates
    * IndexedDB operations with async/await
    * Component refresh triggers (e.g., ProgramList refresh after upload)
*   **Compound Component Pattern:** Used in form-related components:
    * ExcelUploader handles file input and validation
    * Error and loading states managed internally
    * Props for external event handling

## Component Relationships

```mermaid
graph TB
    subgraph Client [PWA - React + TypeScript]
        subgraph Components
            App[App Component] --> EU[ExcelUploader]
            App --> PL[ProgramList]
            PL --> WD[WorkoutDetails]
            WD --> WS[WorkoutSession]
        end
        
        subgraph Features
            EU --> EP[Excel Parsing]
            EP --> DM[Data Model]
            PL --> DM
            WD --> DM
        end
        
        subgraph Storage
            DM --> IDB[IndexedDB]
            IDB --> FS[Firebase SDK]
        end
    end
    
    subgraph Server [Firebase]
        FS --> Firestore[Firestore Database]
        FS --> FA[Firebase Authentication]
    end

    style App fill:#f9f,stroke:#333,stroke-width:2px
    style EU fill:#bbf,stroke:#333,stroke-width:2px
    style PL fill:#bbf,stroke:#333,stroke-width:2px
    style WD fill:#ddd,stroke:#333,stroke-width:2px,stroke-dasharray: 5, 5
    style WS fill:#ddd,stroke:#333,stroke-width:2px,stroke-dasharray: 5, 5
    
    classDef implemented fill:#bbf,stroke:#333,stroke-width:2px;
    classDef planned fill:#ddd,stroke:#333,stroke-width:2px,stroke-dasharray: 5, 5;
    class EU,PL,EP,DM,IDB implemented;
    class WD,WS planned;
