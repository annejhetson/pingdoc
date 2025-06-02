import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import Home from '../page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock firebase/auth
jest.mock('firebase/auth', () => ({
  signInWithPopup: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

// Mock firebase configuration
jest.mock('@/lib/firebase', () => ({
  auth: {},
  googleProvider: {},
}));

describe('Home Page', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      callback(null); // Start with no user
      return () => {}; // Return unsubscribe function
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the sign-in page correctly', () => {
    render(<Home />);

    // Check for main elements
    expect(screen.getByText('Get your document signed in no time')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('initiates Google sign-in when clicking Sign In', async () => {
    render(<Home />);

    const signInButton = screen.getByText('Sign In');
    fireEvent.click(signInButton);

    expect(signInWithPopup).toHaveBeenCalled();
  });

  it('redirects to /documents after successful sign-in', async () => {
    (signInWithPopup as jest.Mock).mockResolvedValueOnce({
      user: { uid: '123', email: 'test@example.com' },
    });

    render(<Home />);

    const signInButton = screen.getByText('Sign In');
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/documents');
    });
  });

  it('handles sign-in error gracefully', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    (signInWithPopup as jest.Mock).mockRejectedValueOnce(new Error('Sign-in failed'));

    render(<Home />);

    const signInButton = screen.getByText('Sign In');
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });

    consoleError.mockRestore();
  });

  it('redirects to /documents if user is already signed in', () => {
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      callback({ uid: '123', email: 'test@example.com' }); // Simulate signed-in user
      return () => {};
    });

    render(<Home />);

    expect(mockRouter.push).toHaveBeenCalledWith('/documents');
  });
});
