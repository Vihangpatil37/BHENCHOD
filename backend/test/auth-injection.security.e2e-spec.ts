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

describe('Security — Input Validation & Injection (e2e)', () => {
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

    app = await createTestApp(moduleRef);

    connection = app.get<Connection>(getConnectionToken());
  });

  beforeEach(async () => {
    await connection.dropDatabase();
    const email = `inj-${Date.now()}@test.com`;
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: 'Password1', full_name: 'Inj User' });
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'Password1' });
    studentToken = login.body.data.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('NoSQL injection via login', () => {
    it('rejects $gt operator in email field', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: { $gt: '' }, password: 'x' });
      expect(res.status).toBe(400);
    });

    it('rejects $ne operator in email field', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: { $ne: null }, password: 'x' });
      expect(res.status).toBe(400);
    });

    it('rejects $regex operator in email field', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: { $regex: '.*' }, password: 'x' });
      expect(res.status).toBe(400);
    });

    it('rejects $where operator in email field', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: { $where: '1==1' }, password: 'x' });
      expect(res.status).toBe(400);
    });
  });

  describe('NoSQL injection via register', () => {
    it('rejects object in email field', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: { $ne: '' }, password: 'Password1', full_name: 'X' });
      expect(res.status).toBe(400);
    });

    it('rejects object in password field', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'a@b.com', password: { $gt: '' }, full_name: 'X' });
      expect(res.status).toBe(400);
    });
  });

  describe('Extra field stripping (whitelist)', () => {
    it('rejects role field from register (forbidNonWhitelisted prevents self-promotion)', async () => {
      const email = `extra-${Date.now()}@test.com`;
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password: 'Password1',
          full_name: 'X',
          role: 'admin',
        });
      expect(res.status).toBe(400);
    });

    it('rejects unknown fields from register (forbidNonWhitelisted)', async () => {
      const email = `extra2-${Date.now()}@test.com`;
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password: 'Password1',
          full_name: 'X',
          evilField: 'injected',
          anotherBad: 123,
        });
      expect(res.status).toBe(400);
    });
  });

  describe('ReDoS protection in careers search', () => {
    it('handles catastrophic regex pattern without hanging', async () => {
      const start = Date.now();
      const res = await request(app.getHttpServer())
        .get('/api/careers?search=' + encodeURIComponent('^(a+)+$'));
      const elapsed = Date.now() - start;
      expect(res.status).toBe(200);
      expect(elapsed).toBeLessThan(5000); // Should not hang
    });

    it('handles .* pattern safely', async () => {
      const start = Date.now();
      const res = await request(app.getHttpServer())
        .get('/api/careers?search=' + encodeURIComponent('.*'));
      const elapsed = Date.now() - start;
      expect(res.status).toBe(200);
      expect(elapsed).toBeLessThan(5000);
    });
  });

  describe('History limit clamping', () => {
    it('clamps limit=99999 to max 100', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/history?limit=99999')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeLessThanOrEqual(100);
      expect(res.body.data.limit).toBeLessThanOrEqual(100);
    });

    it('handles limit=0 gracefully', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/history?limit=0')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
    });

    it('handles limit=-1 gracefully', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/history?limit=-1')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
    });

    it('handles limit=abc gracefully', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/history?limit=abc')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('Analytics event type whitelist', () => {
    it('silently ignores unknown event types', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/analytics/event')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ event_type: 'EVIL_EVENT_INJECT', payload: { hack: true } });
      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
    });

    it('accepts known event types', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/analytics/event')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          event_type: 'ONBOARDING_STEP_COMPLETED',
          payload: { step: 'personal' },
        });
      expect(res.status).toBe(200);
    });
  });

  describe('Missing required fields', () => {
    it('register with missing email returns 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ password: 'Password1', full_name: 'X' });
      expect(res.status).toBe(400);
    });

    it('register with missing password returns 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'a@b.com', full_name: 'X' });
      expect(res.status).toBe(400);
    });

    it('register with missing full_name returns 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'a@b.com', password: 'Password1' });
      expect(res.status).toBe(400);
    });

    it('login with missing email returns 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ password: 'Password1' });
      expect(res.status).toBe(400);
    });

    it('login with missing password returns 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'a@b.com' });
      expect(res.status).toBe(400);
    });
  });

  describe('Malformed input', () => {
    it('register with empty body returns 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({});
      expect(res.status).toBe(400);
    });

    it('login with empty body returns 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({});
      expect(res.status).toBe(400);
    });

    it('register with extremely long email returns 400', async () => {
      const longEmail = 'a'.repeat(500) + '@test.com';
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: longEmail, password: 'Password1', full_name: 'X' });
      expect(res.status).toBe(400);
    });

    it('register with empty string email returns 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: '', password: 'Password1', full_name: 'X' });
      expect(res.status).toBe(400);
    });

    it('register with invalid email format returns 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'not-an-email', password: 'Password1', full_name: 'X' });
      expect(res.status).toBe(400);
    });
  });
});
