import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AIServiceClient } from '../src/ai-service/ai-service.client';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

const aiClientStub = {
  run: jest.fn().mockRejectedValue(new Error('offline in e2e')),
};

describe('Security — Information Disclosure (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  let studentToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AIServiceClient)
      .useValue(aiClientStub)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    connection = app.get<Connection>(getConnectionToken());
  });

  beforeEach(async () => {
    await connection.dropDatabase();
    const email = `disc-${Date.now()}@test.com`;
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: 'Password1', full_name: 'Disc User' });
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'Password1' });
    studentToken = login.body.data.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Stack trace disclosure', () => {
    it('500 error response does not contain stack trace', async () => {
      // Trigger a non-HttpException error (e.g., invalid ObjectId lookup)
      const res = await request(app.getHttpServer())
        .get('/api/counselor/conversations/invalid-id-format')
        .set('Authorization', `Bearer ${studentToken}`);
      // Response should not contain stack, file paths, or internal details
      const body = JSON.stringify(res.body);
      expect(body).not.toMatch(/\.ts:/);
      expect(body).not.toMatch(/\.js:/);
      expect(body).not.toMatch(/node_modules/);
      expect(body).not.toMatch(/at\s+\w+\s+\(/);
    });
  });

  describe('Password hash not exposed', () => {
    it('GET /api/auth/me does not return password_hash', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).not.toHaveProperty('password_hash');
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('GET /api/auth/me does not return failed_login_attempts', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.body.data).not.toHaveProperty('failed_login_attempts');
    });

    it('GET /api/auth/me does not return locked_until', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.body.data).not.toHaveProperty('locked_until');
    });

    it('GET /api/auth/me does not return provider', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.body.data).not.toHaveProperty('provider');
    });
  });

  describe('Career data not exposed', () => {
    it('GET /api/careers does not return trait_weights_draft', async () => {
      const res = await request(app.getHttpServer()).get('/api/careers');
      expect(res.status).toBe(200);
      const careers = res.body.data;
      if (Array.isArray(careers) && careers.length > 0) {
        for (const career of careers) {
          expect(career).not.toHaveProperty('trait_weights_draft');
        }
      }
    });

    it('GET /api/careers does not return eligibility_draft', async () => {
      const res = await request(app.getHttpServer()).get('/api/careers');
      expect(res.status).toBe(200);
      const careers = res.body.data;
      if (Array.isArray(careers) && careers.length > 0) {
        for (const career of careers) {
          expect(career).not.toHaveProperty('eligibility_draft');
        }
      }
    });

    it('GET /api/careers does not return backfill_status', async () => {
      const res = await request(app.getHttpServer()).get('/api/careers');
      expect(res.status).toBe(200);
      const careers = res.body.data;
      if (Array.isArray(careers) && careers.length > 0) {
        for (const career of careers) {
          expect(career).not.toHaveProperty('backfill_status');
        }
      }
    });

    it('GET /api/careers does not return needs_enrichment', async () => {
      const res = await request(app.getHttpServer()).get('/api/careers');
      expect(res.status).toBe(200);
      const careers = res.body.data;
      if (Array.isArray(careers) && careers.length > 0) {
        for (const career of careers) {
          expect(career).not.toHaveProperty('needs_enrichment');
        }
      }
    });

    it('GET /api/careers does not return source_catalog_parts', async () => {
      const res = await request(app.getHttpServer()).get('/api/careers');
      expect(res.status).toBe(200);
      const careers = res.body.data;
      if (Array.isArray(careers) && careers.length > 0) {
        for (const career of careers) {
          expect(career).not.toHaveProperty('source_catalog_parts');
        }
      }
    });
  });

  describe('Login error does not leak info', () => {
    it('wrong password returns generic message', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nonexistent@test.com', password: 'wrong' });
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('wrong password does not reveal whether email exists', async () => {
      const res1 = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nonexistent@test.com', password: 'wrong' });
      const res2 = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'disc-' + Date.now() + '@test.com', password: 'wrong' });
      // Both should return same generic message
      expect(res1.body.message).toBe(res2.body.message);
    });
  });

  describe('JWT secrets not in responses', () => {
    it('login response does not contain JWT_SECRET', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: `disc2-${Date.now()}@test.com`,
          password: 'Password1',
        });
      // First register
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: `disc2-${Date.now()}@test.com`,
          password: 'Password1',
          full_name: 'X',
        });
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: `disc2-${Date.now()}@test.com`,
          password: 'Password1',
        });
      const body = JSON.stringify(loginRes.body);
      expect(body).not.toMatch(/JWT_SECRET/i);
      expect(body).not.toMatch(/fallback/i);
      expect(body).not.toMatch(/super_secret/i);
    });
  });
});
