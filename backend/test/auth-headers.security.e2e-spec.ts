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

describe('Security — Headers & CORS (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Helmet security headers', () => {
    it('response has X-Content-Type-Options: nosniff', async () => {
      const res = await request(app.getHttpServer()).get('/api/health');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('response has X-Frame-Options', async () => {
      const res = await request(app.getHttpServer()).get('/api/health');
      expect(res.headers['x-frame-options']).toBeDefined();
    });

    it('response has X-XSS-Protection', async () => {
      const res = await request(app.getHttpServer()).get('/api/health');
      // Helmet sets this header
      expect(res.headers['x-xss-protection']).toBeDefined();
    });

    it('response has Referrer-Policy', async () => {
      const res = await request(app.getHttpServer()).get('/api/health');
      expect(res.headers['referrer-policy']).toBeDefined();
    });

    it('response does not expose server version', async () => {
      const res = await request(app.getHttpServer()).get('/api/health');
      // Helmet removes X-Powered-By
      expect(res.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('CORS configuration', () => {
    it('allows requests from configured origin', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/health')
        .set('Origin', 'http://localhost:5173');
      expect(res.headers['access-control-allow-origin']).toBeDefined();
    });

    it('rejects requests from unauthorized origin', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/health')
        .set('Origin', 'https://evil.com');
      // Should not have ACAO header for evil.com
      expect(res.headers['access-control-allow-origin']).not.toBe(
        'https://evil.com',
      );
    });

    it('does not reflect arbitrary Origin header', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/health')
        .set('Origin', 'https://attacker.example.com');
      expect(res.headers['access-control-allow-origin']).not.toBe(
        'https://attacker.example.com',
      );
    });
  });

  describe('Error response format', () => {
    it('404 has consistent error format', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/nonexistent-endpoint',
      );
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('statusCode');
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('timestamp');
    });

    it('401 has consistent error format', async () => {
      const res = await request(app.getHttpServer()).get('/api/dashboard');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('statusCode');
      expect(res.body).toHaveProperty('message');
    });

    it('400 has consistent error format', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('statusCode');
      expect(res.body).toHaveProperty('message');
    });
  });
});
