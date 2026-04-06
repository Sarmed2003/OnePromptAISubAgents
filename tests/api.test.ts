import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { Express } from 'express';

let app: Express;

beforeAll(() => {
  app = createApp();
});

describe('API Endpoints', () => {
  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('GET /api/notes', () => {
    it('should return array of notes', async () => {
      const response = await request(app).get('/api/notes');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/notes', () => {
    it('should create a new note', async () => {
      const newNote = {
        title: 'Test Note',
        content: 'This is a test note',
      };
      const response = await request(app).post('/api/notes').send(newNote);
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title', 'Test Note');
      expect(response.body).toHaveProperty('content', 'This is a test note');
    });

    it('should reject note without title', async () => {
      const newNote = {
        content: 'This is a test note',
      };
      const response = await request(app).post('/api/notes').send(newNote);
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/notes/:id', () => {
    it('should return a note by id', async () => {
      const response = await request(app).get('/api/notes/note-001');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'note-001');
    });

    it('should return 404 for non-existent note', async () => {
      const response = await request(app).get('/api/notes/non-existent');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
});
