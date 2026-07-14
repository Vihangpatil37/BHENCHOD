import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcrypt';

const execMock = jest.fn();

const mockModel = () => {
  const fn: any = function (this: any, data: any) {
    this.user_id = data.user_id;
    this.email = data.email;
    this.full_name = data.full_name;
    this.role = data.role;
    this.password_hash = data.password_hash;
    this.failed_login_attempts = data.failed_login_attempts || 0;
    this.locked_until = data.locked_until;
    this.get = (field: string) => (field === 'created_at' || field === 'updated_at' ? new Date() : undefined);
    this.save = jest.fn().mockResolvedValue(undefined);
  };
  fn.findOne = jest.fn(() => ({ exec: execMock }));
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
  password_hash: bcrypt.hashSync('password123', 10),
  failed_login_attempts: 0,
  locked_until: undefined,
  last_login: undefined,
  get: (field: string) => (field === 'created_at' || field === 'updated_at' ? new Date() : undefined),
  save: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('AuthService', () => {
  let service: AuthService;
  let userModel: any;
  let jwtService: any;

  beforeEach(() => {
    execMock.mockReset();
    userModel = mockModel();
    jwtService = mockJwt();
    service = new AuthService(userModel, jwtService);
  });

  describe('register', () => {
    it('throws ConflictException when email exists', async () => {
      execMock.mockResolvedValue(makeUser());
      await expect(service.register({ email: 't@t.com', password: '123456', full_name: 'T' }))
        .rejects.toThrow(ConflictException);
    });

    it('creates user for new email', async () => {
      execMock.mockResolvedValue(null);
      const result = await service.register({ email: 'new@t.com', password: '123456', full_name: 'New' });
      expect(result.email).toBe('new@t.com');
      expect(result).not.toHaveProperty('password_hash');
    });
  });

  describe('login', () => {
    it('rejects unknown email', async () => {
      execMock.mockResolvedValue(null);
      await expect(service.login({ email: 'x@x.com', password: 'x' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('rejects locked account', async () => {
      execMock.mockResolvedValue(makeUser({ locked_until: new Date(Date.now() + 60000) }));
      await expect(service.login({ email: 't@t.com', password: 'x' }))
        .rejects.toThrow(/Account is locked/);
    });

    it('locks after 5 failed attempts', async () => {
      const user = makeUser({ failed_login_attempts: 4 });
      execMock.mockResolvedValue(user);

      await expect(service.login({ email: 't@t.com', password: 'wrong' }))
        .rejects.toThrow(UnauthorizedException);
      expect(user.failed_login_attempts).toBe(5);
      expect(user.locked_until).toBeInstanceOf(Date);
    });

    it('returns tokens on success and resets attempts', async () => {
      const user = makeUser({ failed_login_attempts: 2 });
      execMock.mockResolvedValue(user);

      const result = await service.login({ email: 't@t.com', password: 'password123' });
      expect(result.access_token).toBe('mock-token');
      expect(result.user).toBeDefined();
      expect(user.failed_login_attempts).toBe(0);
      expect(user.locked_until).toBeUndefined();
    });
  });

  describe('refresh', () => {
    it('rejects invalid token', async () => {
      jwtService.verify.mockImplementation(() => { throw new Error('bad'); });
      await expect(service.refresh('bad')).rejects.toThrow(UnauthorizedException);
    });

    it('returns new tokens for valid refresh token', async () => {
      jwtService.verify.mockReturnValue({ sub: 'mock-uuid' });
      execMock.mockResolvedValue(makeUser());
      const result = await service.refresh('good');
      expect(result.access_token).toBe('mock-token');
    });
  });

  describe('sanitizeUser', () => {
    it('strips sensitive fields', () => {
      const user = makeUser();
      const s = service.sanitizeUser(user as any);
      expect(s.user_id).toBe('mock-uuid');
      expect(s).not.toHaveProperty('password_hash');
      expect(s).not.toHaveProperty('failed_login_attempts');
      expect(s).not.toHaveProperty('locked_until');
    });
  });
});
