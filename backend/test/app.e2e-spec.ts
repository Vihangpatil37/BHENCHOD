import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AIServiceClient } from '../src/ai-service/ai-service.client';
import { createTestApp } from './test-app.helper';

// ponytail: mock the AI client to reject so tests exercise the deterministic
// offline scenario fallback (no network, no provider keys, fast, deterministic)
const aiClientStub = {
  run: jest.fn().mockRejectedValue(new Error('offline in e2e')),
};

describe('API (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AIServiceClient)
      .useValue(aiClientStub)
      .compile();

    app = await createTestApp(moduleRef);

    connection = app.get<Connection>(getConnectionToken());
  });

  beforeEach(async () => {
    await connection.dropDatabase();
    accessToken = '';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    it('registers, logs in, and returns tokens', async () => {
      const email = `e2e-${Date.now()}@test.com`;

      const reg = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, password: 'Password1', full_name: 'E2E User' });
      expect(reg.status).toBe(201);
      expect(reg.body.data.email).toBe(email);

      const login = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'Password1' });
      expect(login.status).toBe(200);
      expect(login.body.data.access_token).toBeDefined();
      expect(login.body.data.refresh_token).toBeDefined();
    });

    it('rejects login with wrong password', async () => {
      await request(app.getHttpServer()).post('/api/auth/register').send({
        email: 'bad@test.com',
        password: 'Password1',
        full_name: 'Bad',
      });
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'bad@test.com', password: 'wrong' });
      expect(res.status).toBe(401);
    });
  });

  describe('Onboarding', () => {
    beforeEach(async () => {
      const email = `e2e-${Date.now()}@test.com`;
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, password: 'Password1', full_name: 'E2E User' });
      const login = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'Password1' });
      accessToken = login.body.data.access_token;
      refreshToken = login.body.data.refresh_token;
    });

    it('resume returns 401 without token', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/onboarding/resume',
      );
      expect(res.status).toBe(401);
    });

    it('resume returns profile with token (auto-starts onboarding)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/onboarding/resume')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.onboarding_step).toBe('personal');
    });

    it('scenarios returns 401 without token', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/onboarding/scenarios',
      );
      expect(res.status).toBe(401);
    });

    it('scenarios returns 10 offline scenarios with token', async () => {
      // start onboarding so a profile exists to run scenarios against
      await request(app.getHttpServer())
        .get('/api/onboarding/resume')
        .set('Authorization', `Bearer ${accessToken}`);
      const res = await request(app.getHttpServer())
        .get('/api/onboarding/scenarios')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      const scenarios = res.body.data.scenarios;
      expect(scenarios).toHaveLength(10);
      for (const s of scenarios) {
        expect(s).toHaveProperty('id');
        expect(s).toHaveProperty('question');
        expect(s.options).toHaveLength(4);
        expect(s).toHaveProperty('trait');
      }
    });

    it('refresh issues a new access token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refresh_token: refreshToken });
      expect(res.status).toBe(200);
      expect(res.body.data.access_token).toBeDefined();
      expect(res.body.data.refresh_token).toBeDefined();
    });
  });
});
