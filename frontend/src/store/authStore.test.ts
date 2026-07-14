import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

const mockUser = { user_id: 'u1', email: 't@t.com', full_name: 'T', role: 'student', email_verified: false, created_at: '', updated_at: '' };

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, accessToken: null, refreshToken: null });
  });

  it('starts with null state', () => {
    const s = useAuthStore.getState();
    expect(s.user).toBeNull();
    expect(s.accessToken).toBeNull();
    expect(s.refreshToken).toBeNull();
  });

  it('setAuth populates state', () => {
    useAuthStore.getState().setAuth(mockUser, 'at', 'rt');
    const s = useAuthStore.getState();
    expect(s.user?.email).toBe('t@t.com');
    expect(s.accessToken).toBe('at');
    expect(s.refreshToken).toBe('rt');
  });

  it('clearAuth resets to null', () => {
    useAuthStore.getState().setAuth(mockUser, 'at', 'rt');
    useAuthStore.getState().clearAuth();
    const s = useAuthStore.getState();
    expect(s.user).toBeNull();
    expect(s.accessToken).toBeNull();
    expect(s.refreshToken).toBeNull();
  });

  it('updateAccessToken replaces token', () => {
    useAuthStore.getState().setAuth(mockUser, 'old', 'rt');
    useAuthStore.getState().updateAccessToken('new');
    expect(useAuthStore.getState().accessToken).toBe('new');
    expect(useAuthStore.getState().refreshToken).toBe('rt');
  });
});
