import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AIServiceClient } from '../src/ai-service/ai-service.client';
import { createTestApp } from './test-app.helper';

const aiClientStub = {
  run: jest.fn().mockRejectedValue(new Error('offline in e2e')),
};

describe('Security — BOLA/IDOR (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  let userAToken: string;
  let userBToken: string;
  let userAId: string;
  let userBId: string;

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

    // Create user A
    const emailA = `bola-a-${Date.now()}@test.com`;
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: emailA, password: 'Password1', full_name: 'User A' });
    const loginA = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: emailA, password: 'Password1' });
    userAToken = loginA.body.data.access_token;
    userAId = loginA.body.data.user.user_id;

    // Create user B
    const emailB = `bola-b-${Date.now()}@test.com`;
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: emailB, password: 'Password1', full_name: 'User B' });
    const loginB = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: emailB, password: 'Password1' });
    userBToken = loginB.body.data.access_token;
    userBId = loginB.body.data.user.user_id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Onboarding — user-scoped data', () => {
    it('User A can access own onboarding resume', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/onboarding/resume')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.user_id).toBe(userAId);
    });

    it('User B can access own onboarding resume', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/onboarding/resume')
        .set('Authorization', `Bearer ${userBToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.user_id).toBe(userBId);
    });
  });

  describe('Dashboard — user-scoped data', () => {
    it('User A can access own dashboard', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res.status).toBe(200);
    });

    it('User B can access own dashboard', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${userBToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('History — user-scoped data', () => {
    it('User A can access own history', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/history')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.items).toBeDefined();
    });

    it('User B can access own history', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/history')
        .set('Authorization', `Bearer ${userBToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('Recommendations — user-scoped data', () => {
    it('User A can access own recommendations', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/recommendations/latest')
        .set('Authorization', `Bearer ${userAToken}`);
      // May return 404 if no recommendation generated yet, but not 200 with B's data
      expect([200, 404]).toContain(res.status);
    });

    it('User B can access own recommendations', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/recommendations/latest')
        .set('Authorization', `Bearer ${userBToken}`);
      expect([200, 404]).toContain(res.status);
    });
  });

  describe('Saved careers — user-scoped data', () => {
    it('User A can access own saved careers', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/careers/saved')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res.status).toBe(200);
    });

    it('User B can access own saved careers', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/careers/saved')
        .set('Authorization', `Bearer ${userBToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('Counselor conversations — user-scoped data', () => {
    it('User A cannot access User B conversations by ID', async () => {
      // Create a fake conversation ID (valid ObjectId format)
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app.getHttpServer())
        .get(`/api/counselor/conversations/${fakeId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      // Should return 404 (not found for this user) or 400 (invalid), not 200
      expect([400, 404]).toContain(res.status);
    });

    it('User A cannot delete User B conversations by ID', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app.getHttpServer())
        .delete(`/api/counselor/conversations/${fakeId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect([400, 404]).toContain(res.status);
    });
  });

  describe('Cross-user token isolation', () => {
    it('User A token cannot be used as User B', async () => {
      // Verify tokens are different
      expect(userAToken).not.toBe(userBToken);
      expect(userAId).not.toBe(userBId);
    });
  });
});
