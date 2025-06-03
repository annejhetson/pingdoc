import { jest } from '@jest/globals';

export const useRouter = jest.fn().mockReturnValue({
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
});

export const usePathname = jest.fn().mockReturnValue('/');
export const useSearchParams = jest.fn().mockReturnValue(new URLSearchParams());
export const useSelectedLayoutSegment = jest.fn().mockReturnValue(null);
