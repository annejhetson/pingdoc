import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { ProtectedRoute } from '../ProtectedRoute';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';

// Mock the hooks
jest.mock('@/lib/hooks/useAuth');
jest.mock('next/navigation');

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
};

(useRouter as jest.Mock).mockReturnValue(mockRouter);

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state when authentication is being checked', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('redirects to root path when user is not authenticated', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    });

    await act(async () => {
      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );
    });

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/');
    });
  });

  it('renders children when user is authenticated', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { uid: '123', email: 'test@example.com' },
      loading: false,
    });

    await act(async () => {
      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );
    });

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
});
