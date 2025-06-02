import { NextResponse } from 'next/server';
import { GET } from '@/app/api/health/route';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data) => ({ json: () => data })),
  },
}));

describe('Health Check API', () => {
  it('should return uptime and OK status', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data).toHaveProperty('uptime');
    expect(data).toHaveProperty('message', 'OK');
    expect(data).toHaveProperty('timestamp');
    expect(typeof data.uptime).toBe('number');
    expect(typeof data.timestamp).toBe('number');
  });
}); 