# Error Log

## Initial Load Errors (2/24/2025)

### Error 1

**Description:** `TypeError: Cannot read properties of undefined (reading 'getAll')` in `ProgramList.tsx` and `indexedDB.ts`.

**Location:**

*   `ProgramList.tsx:20`
*   `indexedDB.ts:37`

**Call Stack:**

```
getAllWorkoutPrograms (indexedDB.ts:37:1)
loadPrograms (ProgramList.tsx:16:1)
ProgramList.tsx:26:1
```

**Potential Cause:** The `db` object in `src/lib/indexedDB.ts` is `undefined` when `getAllWorkoutPrograms` is called. This means `initDB` hasn't completed (or hasn't been called) before `getAllWorkoutPrograms`.

**Proposed Solution:** Call and await `initDB` in the `App` component's `useEffect` hook, before rendering any components that rely on IndexedDB.

### Error 2

**Description:** CORS error and WebSocket connection errors.

**Location:** Browser console.

**Potential Cause:** Issues with the development environment (GitHub Codespaces) and how the development server is being accessed/proxied. These are not code errors within the application itself.

**Proposed Solution:**  These errors are likely specific to the Codespaces environment and should not be present in a production deployment. No code changes are needed. The user can continue testing by refreshing the page.
