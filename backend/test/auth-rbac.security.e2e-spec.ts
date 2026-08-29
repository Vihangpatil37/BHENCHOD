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

describe('Security — RBAC (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  let studentToken: string;
  let adminToken: string;

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

    // Create student
    const studentEmail = `rbac-student-${Date.now()}@test.com`;
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: studentEmail,
        password: 'Password1',
        full_name: 'Student',
      });
    const studentLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: studentEmail, password: 'Password1' });
    studentToken = studentLogin.body.data.access_token;

    // Create admin user directly in DB
    const adminEmail = `rbac-admin-${Date.now()}@test.com`;
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: adminEmail,
        password: 'Password1',
        full_name: 'Admin',
      });
    // Promote to admin via direct DB update
    const userModel = connection.collection('users');
    await userModel.updateOne(
      { email: adminEmail },
      { $set: { role: 'admin' } },
    );
    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminEmail, password: 'Password1' });
    adminToken = adminLogin.body.data.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Analytics endpoints — RBAC enforcement', () => {
    it('GET /api/analytics/me returns 200 for student', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/analytics/me')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
    });

    it('GET /api/analytics/platform returns 403 for student', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/analytics/platform')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    it('GET /api/analytics/platform returns 200 for admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/analytics/platform')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('GET /api/analytics/careers returns 403 for student', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/analytics/careers')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    it('GET /api/analytics/careers returns 200 for admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/analytics/careers')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('GET /api/analytics/ai returns 403 for student', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/analytics/ai')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    it('GET /api/analytics/ai returns 200 for admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/analytics/ai')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('Careers admin endpoints — RBAC enforcement', () => {
    it('GET /api/careers/admin/careers returns 403 for student', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/careers/admin/careers')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    it('GET /api/careers/admin/careers returns 200 for admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/careers/admin/careers')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('AI service health — RBAC enforcement', () => {
    it('GET /api/ai-service/health returns 403 for student', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/ai-service/health')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    it('GET /api/ai-service/health returns 200 for admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/ai-service/health')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('Unauthenticated access', () => {
    it('GET /api/analytics/me returns 401 without token', async () => {
      const res = await request(app.getHttpServer()).get('/api/analytics/me');
      expect(res.status).toBe(401);
    });

    it('GET /api/analytics/platform returns 401 without token', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/analytics/platform',
      );
      expect(res.status).toBe(401);
    });

    it('GET /api/careers/admin/careers returns 401 without token', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/careers/admin/careers',
      );
      expect(res.status).toBe(401);
    });

    it('GET /api/ai-service/health returns 401 without token', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/ai-service/health',
      );
      expect(res.status).toBe(401);
    });
  });
});
