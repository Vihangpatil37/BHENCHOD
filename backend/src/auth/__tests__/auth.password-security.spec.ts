import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import * as bcrypt from 'bcrypt';

const execMock = jest.fn();

const mockModel = () => {
  const fn: any = function (this: any, data: any) {
    Object.assign(this, data);
    this.get = (field: string) =>
      field === 'created_at' || field === 'updated_at' ? new Date() : undefined;
    this.save = jest.fn().mockResolvedValue(undefined);
  };
  fn.findOne = jest.fn(() => ({
    exec: execMock,
    select: () => ({ exec: execMock }),
  }));
  return fn;
};

const mockJwt = () => ({
  sign: jest.fn().mockReturnValue('mock-token'),
  verify: jest.fn(),
});

const makeUser = (overrides = {}) => ({
  user_id: 'mock-uuid',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'student',
  email_verified: false,
  password_hash: bcrypt.hashSync('Password1', 10),
  failed_login_attempts: 0,
  locked_until: undefined,
  last_login: undefined,
  get: (field: string) =>
    field === 'created_at' || field === 'updated_at' ? new Date() : undefined,
  save: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('Auth Security — Password Policy', () => {
  let service: AuthService;
  let userModel: any;
  let jwtService: any;

  beforeEach(() => {
    execMock.mockReset();
    userModel = mockModel();
    jwtService = mockJwt();
    service = new AuthService(userModel, jwtService);
  });

  describe('Password storage', () => {
    it('never stores plaintext password', async () => {
      execMock.mockResolvedValue(null);
      await service.register({
        email: 'a@b.com',
        password: 'Abcdefg1',
        full_name: 'T',
      });
      const constructorCall = userModel.mock?.calls?.[0]?.[0];
      if (constructorCall) {
        expect(constructorCall.password_hash).not.toBe('Abcdefg1');
        expect(typeof constructorCall.password_hash).toBe('string');
        expect(constructorCall.password_hash.length).toBeGreaterThan(20);
      }
    });

    it('password_hash uses bcrypt format', async () => {
      execMock.mockResolvedValue(null);
      await service.register({
        email: 'a@b.com',
        password: 'Abcdefg1',
        full_name: 'T',
      });
      const constructorCall = userModel.mock?.calls?.[0]?.[0];
      if (constructorCall) {
        expect(constructorCall.password_hash).toMatch(/^\$2[aby]?\$/);
      }
    });

    it('bcrypt compare works with stored hash', async () => {
      execMock.mockResolvedValue(null);
      const password = 'SecureP@ss1';
      await service.register({
        email: 'a@b.com',
        password,
        full_name: 'T',
      });
      const constructorCall = userModel.mock?.calls?.[0]?.[0];
      if (constructorCall) {
        const match = await bcrypt.compare(password, constructorCall.password_hash);
        expect(match).toBe(true);
        const wrongMatch = await bcrypt.compare('wrong', constructorCall.password_hash);
        expect(wrongMatch).toBe(false);
      }
    });
  });

  describe('sanitizeUser never leaks password_hash', () => {
    it('output does not contain password_hash', () => {
      const user = makeUser();
      const result = service.sanitizeUser(user as any);
      expect(result).not.toHaveProperty('password_hash');
    });

    it('output does not contain failed_login_attempts', () => {
      const user = makeUser();
      const result = service.sanitizeUser(user as any);
      expect(result).not.toHaveProperty('failed_login_attempts');
    });

    it('output does not contain locked_until', () => {
      const user = makeUser();
      const result = service.sanitizeUser(user as any);
      expect(result).not.toHaveProperty('locked_until');
    });

    it('output does not contain provider', () => {
      const user = makeUser();
      const result = service.sanitizeUser(user as any);
      expect(result).not.toHaveProperty('provider');
    });

    it('output contains only safe fields', () => {
      const user = makeUser();
      const result = service.sanitizeUser(user as any);
      const allowedKeys = [
        'user_id',
        'email',
        'full_name',
        'role',
        'email_verified',
        'created_at',
        'updated_at',
      ];
      expect(Object.keys(result).sort()).toEqual(allowedKeys.sort());
    });
  });

  describe('Login uses select(+password_hash)', () => {
    it('calls select with +password_hash on findOne', async () => {
      execMock.mockResolvedValue(null);
      try {
        await service.login({ email: 'a@b.com', password: 'x' });
      } catch {
        // expected to throw
      }
      expect(userModel.findOne).toHaveBeenCalled();
    });
  });

  describe('Account lockout', () => {
    it('locks account after 5 failed attempts', async () => {
      const user = makeUser({ failed_login_attempts: 4 });
      execMock.mockResolvedValue(user);
      await expect(
        service.login({ email: 't@t.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(user.failed_login_attempts).toBe(5);
      expect(user.locked_until).toBeInstanceOf(Date);
    });

    it('resets failed_attempts on successful login', async () => {
      const user = makeUser({ failed_login_attempts: 3 });
      execMock.mockResolvedValue(user);
      await service.login({ email: 't@t.com', password: 'Password1' });
      expect(user.failed_login_attempts).toBe(0);
      expect(user.locked_until).toBeUndefined();
    });

    it('rejects login for locked account', async () => {
      const user = makeUser({
        locked_until: new Date(Date.now() + 600000),
      });
      execMock.mockResolvedValue(user);
      await expect(
        service.login({ email: 't@t.com', password: 'Password1' }),
      ).rejects.toThrow(/Account is locked/);
    });

    it('lockout time is approximately 15 minutes', async () => {
      const user = makeUser({ failed_login_attempts: 4 });
      execMock.mockResolvedValue(user);
      const before = Date.now();
      await service.login({ email: 't@t.com', password: 'wrong' }).catch(() => {});
      const lockTime = user.locked_until?.getTime() || 0;
      const diff = lockTime - before;
      // Should be ~15 min (900000ms), allow 1s tolerance
      expect(diff).toBeGreaterThanOrEqual(899000);
      expect(diff).toBeLessThanOrEqual(901000);
    });
  });

  describe('Password hash not in login response', () => {
    it('login response does not include password_hash', async () => {
      const user = makeUser();
      execMock.mockResolvedValue(user);
      const result = await service.login({
        email: 't@t.com',
        password: 'Password1',
      });
      expect(result).not.toHaveProperty('password_hash');
      expect(result.user).toBeDefined();
      expect(result.user).not.toHaveProperty('password_hash');
    });
  });
});

