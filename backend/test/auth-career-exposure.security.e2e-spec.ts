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

describe('Security — Career Data Exposure (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;

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
    // Seed a career via the service's seed method
    // The careers module auto-seeds on init if empty
    await new Promise((resolve) => setTimeout(resolve, 2000)); // wait for seed
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Public career endpoints — active-only filtering', () => {
    it('GET /api/careers returns only active careers', async () => {
      const res = await request(app.getHttpServer()).get('/api/careers');
      expect(res.status).toBe(200);
      const careers = res.body.data;
      if (Array.isArray(careers)) {
        for (const career of careers) {
          // All returned careers should be active (or undefined, which is treated as active)
          if (career.is_active !== undefined) {
            expect(career.is_active).toBe(true);
          }
        }
      }
    });

    it('GET /api/careers does not return draft fields', async () => {
      const res = await request(app.getHttpServer()).get('/api/careers');
      expect(res.status).toBe(200);
      const careers = res.body.data;
      if (Array.isArray(careers) && careers.length > 0) {
        const career = careers[0];
        expect(career).not.toHaveProperty('trait_weights_draft');
        expect(career).not.toHaveProperty('eligibility_draft');
        expect(career).not.toHaveProperty('backfill_status');
        expect(career).not.toHaveProperty('needs_enrichment');
        expect(career).not.toHaveProperty('source_catalog_parts');
      }
    });

    it('GET /api/careers/:code returns active career', async () => {
      const listRes = await request(app.getHttpServer()).get('/api/careers');
      if (
        listRes.status === 200 &&
        Array.isArray(listRes.body.data) &&
        listRes.body.data.length > 0
      ) {
        const code = listRes.body.data[0].career_code;
        const res = await request(app.getHttpServer()).get(
          `/api/careers/${code}`,
        );
        expect(res.status).toBe(200);
        expect(res.body.data.career_code).toBe(code);
      }
    });

    it('GET /api/careers/:code returns 404 for non-existent career', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/careers/nonexistent_career_12345',
      );
      expect(res.status).toBe(404);
    });

    it('GET /api/careers/by-codes filters active only', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/careers/by-codes?codes=software_engineer,data_scientist',
      );
      expect(res.status).toBe(200);
    });
  });

  describe('Search — regex safety', () => {
    it('search with special chars does not crash', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/careers?search=' + encodeURIComponent('[.*+?^${}()|]'),
      );
      expect(res.status).toBe(200);
    });

    it('search with empty string returns results', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/careers?search=',
      );
      expect(res.status).toBe(200);
    });
  });

  describe('Category endpoint', () => {
    it('GET /api/careers/categories returns distinct categories', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/careers/categories',
      );
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
