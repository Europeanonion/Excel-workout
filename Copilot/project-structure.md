# Excel Workout PWA - Project Structure
Generated on Tue Mar  4 10:23:16 UTC 2025

## Directory Tree

```
.
├── Copilot
│   ├── Copilot-memory bank.md
│   ├── Copilot-progress.md
│   ├── Project-structure.md
│   └── project_analysis
│       ├── bundle.txt
│       ├── components.txt
│       ├── file_types.txt
│       ├── performance.txt
│       ├── pwa.txt
│       ├── report.md
│       ├── state.txt
│       └── structure.txt
├── Critical Vulnerability fixes - potential.txt
├── Optimisation suggestion.text
├── bundle-analysis.json
├── coverage
│   ├── clover.xml
│   ├── coverage-final.json
│   ├── lcov-report
│   │   ├── base.css
│   │   ├── block-navigation.js
│   │   ├── favicon.png
│   │   ├── index.html
│   │   ├── prettify.css
│   │   ├── prettify.js
│   │   ├── sort-arrow-sprite.png
│   │   ├── sorter.js
│   │   └── src
│   │       ├── App.tsx.html
│   │       ├── components
│   │       │   ├── ExcelUploader
│   │       │   └── WorkoutDetails
│   │       ├── features
│   │       │   └── excelParsing
│   │       ├── index.html
│   │       ├── index.tsx.html
│   │       ├── lib
│   │       │   ├── index.html
│   │       │   └── indexedDB.ts.html
│   │       └── types
│   │           ├── index.html
│   │           └── index.ts.html
│   └── lcov.info
├── craco.config.js
├── dependencies_backup.txt
├── generate-project-tree.sh
├── jest.config.js
├── memory-bank
│   ├── HighLevelOverview.md
│   ├── Project notes
│   │   ├── AIAgentOptimizationAnalysis.md
│   │   ├── APIAbstractionLayerImplementation.md
│   │   ├── ArchitecturalRecommendationsPrioritized.md
│   │   ├── ExcelParser_AdvancedImprovementsAnalysis.md
│   │   ├── ExcelParser_ImplementedImprovements.md
│   │   ├── FirebaseIntegrationImplementation.md
│   │   ├── PWAConfigurationAnalysis.md
│   │   ├── PerformanceOptimizationPlan.md
│   │   └── TestSuiteImprovements.md
│   ├── ProjectStructureAnalysis.md
│   ├── README.md
│   ├── VERSION.md
│   ├── activeContext.md
│   ├── consolidated
│   │   └── memoryBank.md
│   ├── decisionLog.md
│   ├── productContext.md
│   ├── progress.md
│   ├── projectBrief.md
│   ├── shared
│   │   └── memoryBankHandler.md
│   ├── systemPatterns.md
│   └── techContext.md
├── package-lock.json
├── package.json
├── project-docs
│   └── project-structure.md
├── public
│   ├── browserconfig.xml
│   ├── index.html
│   ├── manifest.json
│   ├── service-worker.js
│   └── templates
│       └── workout-template.csv
├── sourcemap-analysis.json
├── src
│   ├── App.css
│   ├── App.test.tsx
│   ├── App.tsx
│   ├── ErrorBoundary.tsx
│   ├── components
│   │   ├── Auth
│   │   │   ├── AuthContext.tsx
│   │   │   ├── AuthPage.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── auth.module.css
│   │   │   └── index.ts
│   │   ├── ExcelUploader
│   │   │   ├── ExcelUploader.test.tsx
│   │   │   ├── ExcelUploader.tsx
│   │   │   ├── excel-uploader.module.css
│   │   │   └── index.ts
│   │   ├── InstallPrompt
│   │   │   ├── InstallPrompt.tsx
│   │   │   ├── index.ts
│   │   │   └── install-prompt.module.css
│   │   ├── OnlineStatus
│   │   │   ├── OnlineStatusIndicator.tsx
│   │   │   ├── index.ts
│   │   │   └── online-status.module.css
│   │   ├── ProgramList
│   │   │   ├── ProgramList.test.tsx
│   │   │   ├── ProgramList.tsx
│   │   │   ├── index.ts
│   │   │   └── program-list.module.css
│   │   ├── WorkoutDetails
│   │   │   ├── WorkoutDetails.test.tsx
│   │   │   ├── WorkoutDetails.tsx
│   │   │   ├── index.ts
│   │   │   └── workout-details.module.css
│   │   └── WorkoutSession
│   │       ├── WorkoutSession.test.tsx
│   │       ├── WorkoutSession.tsx
│   │       ├── index.ts
│   │       └── workout-session.module.css
│   ├── features
│   │   └── excelParsing
│   │       ├── excelParser.test.ts
│   │       ├── excelParser.ts
│   │       └── excelProcessorUtils.ts
│   ├── firebase
│   │   ├── __mocks__
│   │   │   └── config.ts
│   │   ├── app.ts
│   │   ├── auth-app.ts
│   │   ├── auth.ts
│   │   ├── config.ts
│   │   ├── firestore-app.ts
│   │   ├── firestore.ts
│   │   ├── index.ts
│   │   └── sync.ts
│   ├── hooks
│   │   └── useExcelUpload.ts
│   ├── index.css
│   ├── index.tsx
│   ├── lib
│   │   └── indexedDB.ts
│   ├── reportWebVitals.ts
│   ├── serviceWorkerRegistration.ts
│   ├── services
│   │   ├── ServiceFactory.ts
│   │   ├── __mocks__
│   │   │   └── index.ts
│   │   ├── implementations
│   │   │   ├── firebase
│   │   │   │   ├── FirebaseAuthService.ts
│   │   │   │   ├── FirebaseStorageService.ts
│   │   │   │   ├── FirebaseSyncService.ts
│   │   │   │   └── index.ts
│   │   │   ├── index.ts
│   │   │   ├── indexeddb
│   │   │   │   ├── IndexedDBStorageService.ts
│   │   │   │   └── index.ts
│   │   │   └── mock
│   │   │       ├── MockAuthService.ts
│   │   │       ├── MockStorageService.ts
│   │   │       ├── MockSyncService.ts
│   │   │       ├── __mocks__
│   │   │       └── index.ts
│   │   ├── index.ts
│   │   └── interfaces
│   │       ├── IAuthService.ts
│   │       ├── IStorageService.ts
│   │       ├── ISyncService.ts
│   │       └── index.ts
│   ├── setupTests.ts
│   └── types
│       ├── css.d.ts
│       ├── index.ts
│       └── lodash.d.ts
├── test-bundle-size.js
├── test-output.txt
├── tsconfig.json
└── workout.csv

43 directories, 143 files
```

## File Counts by Directory

```
.: 21 files
./.git: 8 files
./memory-bank: 11 files
./memory-bank/shared: 1 files
./memory-bank/consolidated: 1 files
./memory-bank/Project notes: 9 files
./coverage: 3 files
./coverage/lcov-report: 8 files
./coverage/lcov-report/src: 3 files
./coverage/lcov-report/src/types: 2 files
./coverage/lcov-report/src/components: 0 files
./coverage/lcov-report/src/components/WorkoutDetails: 2 files
./coverage/lcov-report/src/components/ExcelUploader: 2 files
./coverage/lcov-report/src/lib: 2 files
./coverage/lcov-report/src/features: 0 files
./coverage/lcov-report/src/features/excelParsing: 2 files
./src: 9 files
./src/types: 3 files
./src/hooks: 1 files
./src/components: 0 files
./src/components/OnlineStatus: 3 files
./src/components/InstallPrompt: 3 files
./src/components/WorkoutSession: 4 files
./src/components/Auth: 6 files
./src/components/ProgramList: 4 files
./src/components/WorkoutDetails: 4 files
./src/components/ExcelUploader: 4 files
./src/firebase: 8 files
./src/firebase/__mocks__: 1 files
./src/lib: 1 files
./src/features: 0 files
./src/features/excelParsing: 3 files
./src/services: 2 files
./src/services/__mocks__: 1 files
./src/services/interfaces: 4 files
./src/services/implementations: 1 files
./src/services/implementations/indexeddb: 2 files
./src/services/implementations/firebase: 4 files
./src/services/implementations/mock: 4 files
./src/services/implementations/mock/__mocks__: 1 files
./Copilot: 3 files
./Copilot/project_analysis: 8 files
./public: 4 files
./public/templates: 1 files
./build: 5 files
./node_modules: 2 files
./project-docs: 1 files
```

## File Types

```
     46 ts
     27 md
     18 tsx
     15 html
     11 css
     10 txt
      7 json
      7 js
      2 xml
      2 png
      2 csv
      1 text
      1 sh
      1 info
```

## React Components

```
./src/App.tsx
./src/ErrorBoundary.tsx
./src/components/Auth/AuthContext.tsx
./src/components/Auth/AuthPage.tsx
./src/components/Auth/LoginForm.tsx
./src/components/Auth/RegisterForm.tsx
./src/components/ExcelUploader/ExcelUploader.tsx
./src/components/InstallPrompt/InstallPrompt.tsx
./src/components/OnlineStatus/OnlineStatusIndicator.tsx
./src/components/ProgramList/ProgramList.tsx
./src/components/WorkoutDetails/WorkoutDetails.tsx
./src/components/WorkoutSession/WorkoutSession.tsx
./src/index.tsx
```

## Performance Optimizations

```
Lazy Loaded Components:
3

Dynamic Imports:
11

Memoized Components:
2

useCallback Hooks:
27
```

## PWA Features

Service Worker Implementation:
```
❌ No Service Worker implementation found
```

Web App Manifest:
```
✅ Web App Manifest found

Manifest Contents:
{
  "short_name": "Workout PWA",
  "name": "Excel Workout Progressive Web App",
  "description": "Track your workout routines using Excel spreadsheets as the data source, with full offline support",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon",
      "purpose": "any"
    },
    {
      "src": "logo192.png",
      "type": "image/png",
      "sizes": "192x192",
      "purpose": "any"
    },
    {
      "src": "logo512.png",
      "type": "image/png",
      "sizes": "512x512",
      "purpose": "any"
    },
    {
      "src": "logo192-maskable.png",
      "type": "image/png",
      "sizes": "192x192",
      "purpose": "maskable"
    },
    {
      "src": "logo512-maskable.png",
      "type": "image/png",
      "sizes": "512x512",
      "purpose": "maskable"
    }
  ],
  "screenshots": [
    {
      "src": "screenshot1.png",
      "type": "image/png",
      "sizes": "1280x720",
      "form_factor": "wide"
    },
    {
      "src": "screenshot2.png",
      "type": "image/png",
      "sizes": "750x1334",
      "form_factor": "narrow"
    }
  ],
  "shortcuts": [
    {
      "name": "Upload Workout",
      "short_name": "Upload",
      "description": "Upload a new workout Excel file",
      "url": "/upload",
      "icons": [{ "src": "upload-icon.png", "sizes": "192x192" }]
    },
    {
      "name": "Start Workout",
      "short_name": "Workout",
      "description": "Start a new workout session",
      "url": "/workout/new",
      "icons": [{ "src": "workout-icon.png", "sizes": "192x192" }]
    },
    {
      "name": "View Programs",
      "short_name": "Programs",
      "description": "View your workout programs",
      "url": "/programs",
      "icons": [{ "src": "programs-icon.png", "sizes": "192x192" }]
    }
  ],
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "any",
  "theme_color": "#4285F4",
  "background_color": "#ffffff",
  "prefer_related_applications": false,
  "categories": ["fitness", "health", "lifestyle"],
  "lang": "en-US",
  "dir": "ltr"
}
```
