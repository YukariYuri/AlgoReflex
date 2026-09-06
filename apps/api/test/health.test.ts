import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';

describe('API Route Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns 200 and operational status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    const json = JSON.parse(response.payload);
    expect(json.status).toBe('ok');
    expect(json.service).toBe('algoreflex-api');
    expect(typeof json.uptime).toBe('number');
  });

  it('GET /api/version returns 200 and M0 version info', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/version',
    });

    expect(response.statusCode).toBe(200);
    const json = JSON.parse(response.payload);
    expect(json.name).toBe('AlgoReflex API');
    expect(json.milestone).toBe('M0');
    expect(json.version).toBe('0.1.0');
  });
});
