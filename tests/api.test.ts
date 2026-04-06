import request from 'supertest';
import app from '../src/index';
import { HealthResponse, NotesListResponse, Note } from '../src/types/index';

describe('API Endpoints', () => {
  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /notes', () => {
    it('should return list of notes', async () => {
      const response = await request(app).get('/notes');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('notes');
      expect(Array.isArray(response.body.notes)).toBe(true);
    });
  });

  describe('POST /notes', () => {
    it('should create a new note', async () => {
      const newNote = {
        title: 'Test Note',
        content: 'This is a test note',
      };
      const response = await request(app).post('/notes').send(newNote);
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title', 'Test Note');
      expect(response.body).toHaveProperty('content', 'This is a test note');
      expect(response.body).toHaveProperty('createdAt');
    });

    it('should reject missing fields', async () => {
      const response = await request(app).post('/notes').send({ title: 'Only Title' });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});
