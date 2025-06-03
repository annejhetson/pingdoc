import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { User, UserCredential, Auth, AuthError } from 'firebase/auth';

const mockUnsubscribe = jest.fn();

// Mock Firebase app
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApps: jest.fn(() => []),
}));

// Mock Firebase auth functions
jest.mock('firebase/auth', () => {
  const mockGoogleProvider = {
    setCustomParameters: jest.fn(),
  };

  return {
    getAuth: jest.fn(() => ({
      currentUser: null,
    })),
    onAuthStateChanged: jest.fn((auth, callback) => {
      // Don't call the callback immediately in the mock
      // Let the tests control when the callback is called
      return mockUnsubscribe;
    }),
    signInWithPopup: jest.fn(),
    signOut: jest.fn(),
    GoogleAuthProvider: jest.fn(() => mockGoogleProvider),
  };
});

// Mock Firebase firestore
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
}));

// Mock Firebase storage
jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({})),
}));

// Mock Firebase functions
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({})),
}));

// Import auth and functions after mocking
import { auth } from '../../firebase';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should update user state when auth state changes', () => {
    const mockUser = { uid: '123', email: 'test@example.com' } as User;
    let authStateCallback: ((user: User | null) => void) | null = null;

    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      authStateCallback = callback;
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useAuth());
    expect(result.current.loading).toBe(true);

    // Simulate auth state change
    act(() => {
      if (authStateCallback) {
        authStateCallback(mockUser);
      }
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.error).toBeNull();
  });

  it('should handle sign in with Google', async () => {
    const mockUser = { uid: '123', email: 'test@example.com' } as User;
    const mockCredential = { user: mockUser } as UserCredential;
    (signInWithPopup as jest.Mock).mockResolvedValue(mockCredential);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signInWithGoogle();
    });

    expect(signInWithPopup).toHaveBeenCalled();
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle sign out', async () => {
    (signOut as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signOutUser();
    });

    expect(signOut).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle sign in error', async () => {
    const error = new Error('Failed to sign in') as AuthError;
    (signInWithPopup as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.signInWithGoogle();
      } catch (e) {
        // Expected error
      }
    });

    expect(result.current.error).toEqual(error);
    expect(result.current.loading).toBe(false);
  });

  it('should handle sign out error', async () => {
    const error = new Error('Failed to sign out') as AuthError;
    (signOut as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.signOutUser();
      } catch (e) {
        // Expected error
      }
    });

    expect(result.current.error).toEqual(error);
    expect(result.current.loading).toBe(false);
  });

  it('should clean up auth listener on unmount', () => {
    const { unmount } = renderHook(() => useAuth());
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
