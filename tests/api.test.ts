import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { noteStore } from '../src/lib/noteStore';
import type { Express } from 'express';

interface TestSetupState {
  app: Express | null;
  createdNoteId: string | null;
}

const testState: TestSetupState = {
  app: null,
  createdNoteId: null,
};

beforeAll(async (): Promise<void> => {
  testState.app = createApp();

  // Initialize test data
  try {
    const note = await noteStore.createNote('Test Note', 'This is a test note');
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
      const response = await request(testState.app).get('/api/notes');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/notes', () => {
    it('should create a new note', async (): Promise<void> => {
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
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title', 'Test Note');
      expect(response.body).toHaveProperty('content', 'This is a test note');
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
      const response = await request(testState.app).get(
        `/api/notes/${testState.createdNoteId}`
      );
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testState.createdNoteId);
    });

    it('should return 404 for non-existent note', async (): Promise<void> => {
      if (!testState.app) {
        throw new Error('App not initialized');
      }
      const response = await request(testState.app).get(
        '/api/notes/non-existent-id-12345'
      );
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
});
