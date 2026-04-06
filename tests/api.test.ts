import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { healthHandler } from '../src/handlers/health';
import { notesHandler } from '../src/handlers/notes';

describe('Health Handler', () => {
  it('should return healthy status', () => {
    const result = healthHandler();
    expect(result.status).toBe('healthy');
    expect(result.timestamp).toBeDefined();
  });
});

describe('GET /health', () => {
  it('should return HTTP 200 with {"ok":true}', async () => {
    const response = await fetch('http://localhost:3000/health');
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ ok: true });
  });
});

describe('Notes Handler', () => {
  it('should create a note', () => {
    const note = notesHandler.create({
      title: 'Test Note',
      content: 'This is a test note',
    });
    expect(note.id).toBeDefined();
    expect(note.title).toBe('Test Note');
    expect(note.content).toBe('This is a test note');
  });
  
  it('should throw error if title is missing', () => {
    expect(() => {
      notesHandler.create({ content: 'No title' });
    }).toThrow('Title is required');
  });
  
  it('should retrieve all notes', () => {
    notesHandler.create({ title: 'Note 1', content: 'Content 1' });
    notesHandler.create({ title: 'Note 2', content: 'Content 2' });
    const notes = notesHandler.getAll();
    expect(notes.length).toBeGreaterThanOrEqual(2);
  });
});
