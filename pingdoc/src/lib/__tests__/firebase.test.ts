import { GoogleAuthProvider } from 'firebase/auth';

// Mock Firebase modules
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApps: jest.fn(() => []),
}));

interface MockAuthConfig {
  config: {
    emulator?: { url: string };
  };
  currentUser: null;
}

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(
    () =>
      ({
        config: {},
        currentUser: null,
      }) as MockAuthConfig
  ),
  GoogleAuthProvider: jest.fn(() => ({
    setCustomParameters: jest.fn(),
    getCustomParameters: jest.fn(() => ({
      prompt: 'select_account',
      login_hint: 'project-811472285651',
    })),
  })),
  connectAuthEmulator: jest.fn((auth: MockAuthConfig, url: string) => {
    auth.config.emulator = { url };
  }),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  connectFirestoreEmulator: jest.fn(),
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({})),
  connectStorageEmulator: jest.fn(),
}));

jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({})),
  connectFunctionsEmulator: jest.fn(),
}));

describe('Firebase Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, NODE_ENV: 'test' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should initialize Firebase services', async () => {
    const { auth, db, storage, functions } = await import('../firebase');
    expect(auth).toBeDefined();
    expect(db).toBeDefined();
    expect(storage).toBeDefined();
    expect(functions).toBeDefined();
  });

  it('should configure Google Auth Provider', async () => {
    const { googleProvider } = await import('../firebase');
    expect(googleProvider).toBeDefined();
    const params = googleProvider.getCustomParameters();
    expect(params?.prompt).toBe('select_account');
    expect(params?.login_hint).toBe('project-811472285651');
  });

  describe('Emulator Connection', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it('should connect to emulators in development', async () => {
      process.env = { ...originalEnv, NODE_ENV: 'development' };
      const { auth } = await import('../firebase');
      const mockAuth = auth as unknown as MockAuthConfig;
      expect(mockAuth.config.emulator).toBeDefined();
      expect(mockAuth.config.emulator?.url).toBe('http://localhost:9099');
    });

    it('should not connect to emulators in production', async () => {
      process.env = { ...originalEnv, NODE_ENV: 'production' };
      const { auth } = await import('../firebase');
      const mockAuth = auth as unknown as MockAuthConfig;
      expect(mockAuth.config.emulator).toBeUndefined();
    });
  });
});
