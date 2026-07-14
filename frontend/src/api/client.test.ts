import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { useAuthStore } from '../store/authStore';

const handlers = vi.hoisted(() => {
  const h: { request: any[]; response: any[] } = { request: [], response: [] };
  return h;
});

vi.mock('axios', () => {
  const mockInstance = {
    interceptors: {
      request: { use: (fn: any) => handlers.request.push(fn) },
      response: { use: (fn: any, errFn: any) => handlers.response.push({ fn, errFn }) },
    },
    post: vi.fn(),
    get: vi.fn(),
  };
  return {
    default: {
      create: vi.fn(() => mockInstance),
      post: vi.fn(),
    },
  };
});

describe('API client', () => {
  beforeAll(async () => {
    await import('./client');
  });

  beforeEach(() => {
    useAuthStore.setState({ user: null, accessToken: null, refreshToken: null });
  });

  it('creates axios instance with base URL', async () => {
    const axios = (await import('axios')).default;
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: expect.any(String),
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('request interceptor attaches JWT from store', () => {
    useAuthStore.getState().setAuth({} as any, 'test-token', 'rt');
    const reqHandler = handlers.request[0];
    const config = { headers: {} };
    const result = reqHandler(config);
    expect(result.headers.Authorization).toBe('Bearer test-token');
  });

  it('request interceptor skips when no token', async () => {
    const reqHandler = handlers.request[0];
    const config = { headers: {} };
    const result = reqHandler(config);
    expect(result.headers.Authorization).toBeUndefined();
  });

  it('response interceptor unwraps { data, ... } envelope', () => {
    const resHandler = handlers.response[0].fn;
    const result = resHandler({ data: { data: 'payload', timestamp: '...', requestId: 'r1' } });
    expect(result).toBe('payload');
  });

  it('response interceptor passes through non-envelope responses', () => {
    const resHandler = handlers.response[0].fn;
    const result = resHandler({ data: 'raw' });
    expect(result).toBe('raw');
  });
});
