import { jest } from '@jest/globals';
import {
  Firestore,
  DocumentData,
  QuerySnapshot,
  Query,
  DocumentSnapshot,
} from 'firebase/firestore';
import { FirebaseStorage, StorageReference } from 'firebase/storage';
import { Auth } from 'firebase/auth';

export const googleProvider = {
  getCustomParameters: jest.fn().mockReturnValue({
    prompt: 'select_account',
    login_hint: 'project-811472285651',
  }),
};

export const auth = {
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  config: {
    emulator:
      process.env.NODE_ENV === 'development'
        ? {
            url: 'http://localhost:9099',
          }
        : undefined,
  },
} as unknown as Auth;

const mockDocs = [
  {
    id: 'doc1',
    data: () => ({
      name: 'test.pdf',
      status: 'pending',
      createdAt: new Date(),
    }),
  },
] as unknown as DocumentSnapshot<DocumentData>[];

export const db = {
  collection: jest.fn().mockReturnValue({
    where: jest.fn().mockReturnThis(),
    onSnapshot: jest
      .fn()
      .mockImplementation((callback: (snapshot: QuerySnapshot<DocumentData>) => void) => {
        callback({
          docs: mockDocs,
          forEach: (fn: (doc: DocumentSnapshot<DocumentData>) => void) => {
            mockDocs.forEach(fn);
          },
        } as unknown as QuerySnapshot<DocumentData>);
        return jest.fn(); // Unsubscribe function
      }),
  } as unknown as Query<DocumentData>),
} as unknown as Firestore;

export const storage = {
  ref: jest.fn().mockReturnValue({
    getDownloadURL: jest.fn().mockResolvedValue('http://example.com/test.pdf'),
    put: jest.fn().mockResolvedValue({}),
  } as unknown as StorageReference),
} as unknown as FirebaseStorage;

export const functions = {
  httpsCallable: jest.fn(),
};

export const app = {
  name: '[DEFAULT]',
  options: {},
};
