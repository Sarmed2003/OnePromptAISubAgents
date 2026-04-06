import request from 'supertest';
import { createApp } from '../src/app';
import { HealthResponse, NotesListResponse } from '../src/models';

describe('API Endpoints', () => {
  let app: any;

  beforeAll(() => {
    app = createApp();
  });

  describe('GET /health', () => {
    test('should return 200 with status=ok and valid timestamp', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.timestamp).toBe('string');
      // Verify timestamp is a valid ISO 8601 date string
      expect(() => new Date(response.body.timestamp)).not.toThrow();
    });

    test('should match HealthResponse type', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      const body: HealthResponse = response.body;
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('timestamp');
      expect(typeof body.status).toBe('string');
      expect(typeof body.timestamp).toBe('string');
      // Verify the response conforms to HealthResponse interface
      expect(body.status).toMatch(/^[a-z]+$/);
    });
  });

  describe('GET /notes', () => {
    test('should return 200 with items array', async () => {
      const response = await request(app).get('/notes');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    test('should match NotesListResponse type', async () => {
      const response = await request(app).get('/notes');

      expect(response.status).toBe(200);
      const body: NotesListResponse = response.body;
      expect(body).toHaveProperty('items');
      expect(Array.isArray(body.items)).toBe(true);
      // Verify each item has expected note properties
      if (body.items.length > 0) {
        const firstItem = body.items[0];
        expect(firstItem).toHaveProperty('id');
        expect(firstItem).toHaveProperty('title');
        expect(typeof firstItem.id).toBe('string');
        expect(typeof firstItem.title).toBe('string');
      }
    });

    test('should have at least 3 items', async () => {
      const response = await request(app).get('/notes');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.items.length).toBeGreaterThanOrEqual(3);
    });
  });
});
