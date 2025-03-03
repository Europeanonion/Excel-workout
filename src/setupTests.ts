// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Set up environment variables for tests
process.env.REACT_APP_FIREBASE_API_KEY = 'test-api-key';
process.env.REACT_APP_FIREBASE_AUTH_DOMAIN = 'test-auth-domain';
process.env.REACT_APP_FIREBASE_PROJECT_ID = 'test-project-id';
process.env.REACT_APP_FIREBASE_STORAGE_BUCKET = 'test-storage-bucket';
process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID = 'test-messaging-sender-id';
process.env.REACT_APP_FIREBASE_APP_ID = 'test-app-id';

// Add TextEncoder and TextDecoder polyfills for Firebase
class MockTextEncoder {
  encoding = 'utf-8';
  
  encode(input: string): Uint8Array {
    return new TextEncoder().encode(input);
  }
  
  encodeInto(source: string, destination: Uint8Array): { read: number; written: number } {
    // Simplified implementation
    const buf = this.encode(source);
    const written = Math.min(buf.length, destination.length);
    
    for (let i = 0; i < written; i++) {
      destination[i] = buf[i];
    }
    
    return { read: source.length, written };
  }
}

class MockTextDecoder {
  encoding = 'utf-8';
  fatal = false;
  ignoreBOM = false;
  
  constructor(_label?: string, _options?: { fatal?: boolean; ignoreBOM?: boolean }) {
    // Constructor implementation
  }
  
  decode(input?: BufferSource): string {
    if (!input) return '';
    
    if (input instanceof Uint8Array) {
      return new TextDecoder().decode(input);
    }
    
    return '';
  }
}

// Mock ReadableStream for Firebase
class MockReadableStream {
  constructor() {
    // Constructor implementation
  }

  getReader() {
    return {
      read: () => Promise.resolve({ done: true, value: undefined }),
      releaseLock: () => {}
    };
  }

  cancel() {
    return Promise.resolve();
  }

  pipeTo() {
    return Promise.resolve();
  }

  pipeThrough() {
    return new MockReadableStream();
  }

  tee() {
    return [new MockReadableStream(), new MockReadableStream()];
  }
}

// Use type assertion to bypass TypeScript's strict type checking
global.TextEncoder = MockTextEncoder as unknown as typeof global.TextEncoder;
global.TextDecoder = MockTextDecoder as unknown as typeof global.TextDecoder;
global.ReadableStream = MockReadableStream as unknown as typeof global.ReadableStream;

// Mock fetch for Firebase
global.fetch = jest.fn();

// Mock IndexedDB for tests
const mockIDBFactory = {
  open: jest.fn(),
  deleteDatabase: jest.fn(),
  databases: jest.fn(),
  cmp: jest.fn()
};

// @ts-ignore - Mocking IndexedDB
global.indexedDB = mockIDBFactory;

configure({
  testIdAttribute: 'data-testid',
});
