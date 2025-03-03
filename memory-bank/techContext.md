# Technical Context: Excel Workout PWA

This document provides technical context for the Excel Workout PWA, including the technology stack, development environment, and key technical decisions.

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **State Management**: React Context API
- **Styling**: CSS Modules for component-scoped styling
- **Routing**: React Router v6
- **Local Storage**: IndexedDB via custom wrapper
- **Excel Parsing**: xlsx library
- **Testing**: Jest and React Testing Library
- **Build Tool**: Create React App with TypeScript template

### Backend
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication
- **Storage**: Firebase Storage (for future use)
- **Hosting**: Firebase Hosting (planned)

### PWA Features
- **Service Worker**: Workbox for caching and offline support
- **Web App Manifest**: For installability on devices
- **Offline Support**: IndexedDB for local data storage

## Development Environment

### Required Tools
- Node.js (v16+)
- npm (v8+)
- Git
- Visual Studio Code (recommended)

### Recommended Extensions
- ESLint
- Prettier
- Jest Runner
- React Developer Tools
- Firebase Explorer

### Setup Instructions
1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm start` to start the development server
4. Run `npm test` to run tests
5. Run `npm run build` to create a production build

## Project Structure

### Key Directories
- `src/components/`: React components organized by feature
- `src/features/`: Feature-specific logic (e.g., Excel parsing)
- `src/services/`: Service interfaces and implementations
- `src/types/`: TypeScript type definitions
- `src/hooks/`: Custom React hooks
- `src/firebase/`: Firebase configuration and utilities
- `public/`: Static assets and HTML template

### Key Files
- `src/App.tsx`: Main application component
- `src/index.tsx`: Application entry point
- `src/features/excelParsing/excelParser.ts`: Excel parsing logic
- `src/services/ServiceFactory.ts`: Factory for service implementations
- `src/firebase/config.ts`: Firebase configuration
- `src/types/index.ts`: Core type definitions

## API Abstraction Layer

The application uses an API abstraction layer to decouple business logic from implementation details:

### Service Interfaces
- `IAuthService`: Authentication operations
- `IStorageService`: Data storage operations
- `ISyncService`: Data synchronization operations

### Implementations
- Firebase implementations for production
- IndexedDB implementation for local storage
- Mock implementations for testing

### Service Factory
The `ServiceFactory` provides the appropriate service implementation based on the environment:
- Production: Firebase implementations
- Development: Firebase or mock implementations based on configuration
- Testing: Mock implementations

## Data Flow

1. **Excel Upload**:
   - User uploads Excel file
   - Excel parser processes file
   - Data is stored in IndexedDB
   - Data is synchronized with Firestore when online

2. **Workout Management**:
   - Programs are loaded from IndexedDB
   - User selects a program to view details
   - User can start a workout session

3. **Workout Session**:
   - Session data is stored in IndexedDB
   - Changes are synchronized with Firestore when online
   - Completed sessions are added to workout history

## Offline Support

The application uses an offline-first approach:
- All data is stored locally in IndexedDB
- Changes made offline are queued for synchronization
- Conflict resolution uses timestamp-based merging strategies
- Service worker caches assets for offline use

## Testing Strategy

- **Unit Tests**: For individual functions and components
- **Integration Tests**: For component interactions
- **Mock Services**: For testing without external dependencies
- **Test Coverage**: Aim for 80%+ coverage

## Performance Considerations

- Code splitting for optimized loading
- Lazy loading for non-critical components
- IndexedDB for efficient local data storage
- Optimized Excel parsing for large files
- Efficient synchronization with batch operations

## Security Considerations

- Firebase Authentication for user identity
- Firestore security rules for data access control
- Input validation for Excel files
- Content Security Policy for XSS protection
- HTTPS-only for secure communication

## Accessibility

- ARIA attributes for screen reader support
- Keyboard navigation support
- High contrast mode
- Responsive design for various devices
- Focus management for modal dialogs

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- iOS Safari with specific optimizations
- Android Chrome and WebView
- Minimum Internet Explorer support (basic functionality only)

## Deployment Pipeline

1. **Development**: Local development environment
2. **Testing**: Automated tests in CI/CD pipeline
3. **Staging**: Deployment to staging environment for manual testing
4. **Production**: Deployment to production environment

## Monitoring and Analytics

- Error tracking with console logging (Firebase Analytics planned)
- Performance monitoring with browser tools (Lighthouse)
- Usage analytics (planned)