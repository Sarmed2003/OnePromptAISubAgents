import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { noteStore } from '../src/lib/noteStore';
import type { Express } from 'express';

interface TestSetupState {
  app: Express | null;
  createdNoteId: string | null;
  userId: string;
  authToken: string;
}

const testState: TestSetupState = {
  app: null,
  createdNoteId: null,
  userId: 'test-user-123',
  authToken: 'Bearer test-user-123',
};

beforeAll(async (): Promise<void> => {
  testState.app = createApp();

  // Initialize test data
  try {
    const note = await noteStore.createNote('Test Note', 'This is a test note', testState.userId);
    testState.createdNoteId = note.id;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Failed to create test note:', errorMessage);
  }
});

afterAll(async (): Promise<void> => {
  // Cleanup test data
  try {
    if (testState.createdNoteId) {
      await noteStore.deleteNote(testState.createdNoteId);
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Failed to cleanup test note:', errorMessage);
  }
});

describe('API Endpoints', () => {
  describe('GET /health', () => {
    it('should return healthy status', async (): Promise<void> => {
      if (!testState.app) {
        throw new Error('App not initialized');
      }
      const response = await request(testState.app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('GET /api/notes', () => {
    it('should return array of notes', async (): Promise<void> => {
      if (!testState.app) {
        throw new Error('App not initialized');
      }
      const response = await request(testState.app)
        .get('/api/notes')
        .set('Authorization', testState.authToken);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/notes', () => {
    it('should reject request without authentication', async (): Promise<void> => {
      if (!testState.app) {
        throw new Error('App not initialized');
      }
      const newNote = {
        title: 'Test Note',
        content: 'This is a test note',
      };
      const response = await request(testState.app)
        .post('/api/notes')
        .send(newNote);
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should create a new note with authentication', async (): Promise<void> => {
      if (!testState.app) {
        throw new Error('App not initialized');
      }
      const newNote = {
        title: 'Test Note',
        content: 'This is a test note',
      };
      const response = await request(testState.app)
        .post('/api/notes')
        .set('Authorization', testState.authToken)
        .send(newNote);
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title', 'Test Note');
      expect(response.body).toHaveProperty('content', 'This is a test note');
      expect(response.body).toHaveProperty('userId', testState.userId);
    });

    it('should reject note without title', async (): Promise<void> => {
      if (!testState.app) {
        throw new Error('App not initialized');
      }
      const newNote = {
        content: 'This is a test note',
      };
      const response = await request(testState.app)
        .post('/api/notes')
        .set('Authorization', testState.authToken)
        .send(newNote);
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/notes/:id', () => {
    it('should return a note by id', async (): Promise<void> => {
      if (!testState.app || !testState.createdNoteId) {
        throw new Error('App not initialized or test note not created');
      }
      const response = await request(testState.app)
        .get(`/api/notes/${testState.createdNoteId}`)
        .set('Authorization', testState.authToken);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testState.createdNoteId);
    });

    it('should return 404 for non-existent note', async (): Promise<void> => {
      if (!testState.app) {
        throw new Error('App not initialized');
      }
      const response = await request(testState.app)
        .get('/api/notes/non-existent-id-12345')
        .set('Authorization', testState.authToken);
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/notes/:id', () => {
    it('should reject update without authentication', async (): Promise<void> => {
      if (!testState.app || !testState.createdNoteId) {
        throw new Error('App not initialized or test note not created');
      }
      const response = await request(testState.app)
        .put(`/api/notes/${testState.createdNoteId}`)
        .send({ title: 'Updated Title' });
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should update note with correct ownership', async (): Promise<void> => {
      if (!testState.app || !testState.createdNoteId) {
        throw new Error('App not initialized or test note not created');
      }
      const response = await request(testState.app)
        .put(`/api/notes/${testState.createdNoteId}`)
        .set('Authorization', testState.authToken)
        .send({ title: 'Updated Title', content: 'Updated content' });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('title', 'Updated Title');
      expect(response.body).toHaveProperty('content', 'Updated content');
    });

    it('should reject update with different user', async (): Promise<void> => {
      if (!testState.app || !testState.createdNoteId) {
        throw new Error('App not initialized or test note not created');
      }
      const response = await request(testState.app)
        .put(`/api/notes/${testState.createdNoteId}`)
        .set('Authorization', 'Bearer different-user-456')
        .send({ title: 'Malicious Update', content: 'Malicious body' });
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/notes/:id', () => {
    it('should reject delete without authentication', async (): Promise<void> => {
      if (!testState.app) {
        throw new Error('App not initialized');
      }
      const response = await request(testState.app).delete(
        '/api/notes/some-note-id'
      );
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should delete note with correct ownership', async (): Promise<void> => {
      if (!testState.app) {
        throw new Error('App not initialized');
      }
      // Create a note to delete
      const note = await noteStore.createNote('To Delete', 'This will be deleted', testState.userId);
      const response = await request(testState.app)
        .delete(`/api/notes/${note.id}`)
        .set('Authorization', testState.authToken);
      expect(response.status).toBe(204);
    });

    it('should reject delete with different user', async (): Promise<void> => {
      if (!testState.app || !testState.createdNoteId) {
        throw new Error('App not initialized or test note not created');
      }
      const response = await request(testState.app)
        .delete(`/api/notes/${testState.createdNoteId}`)
        .set('Authorization', 'Bearer different-user-456');
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });
});
