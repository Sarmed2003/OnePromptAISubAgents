import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../src/app';

let server: any;

beforeAll(async () => {
  server = app.listen(3001);
  await new Promise(resolve => setTimeout(resolve, 100));
});

afterAll(async () => {
  if (server) {
    await new Promise(resolve => server.close(resolve));
  }
});

describe('GET /health', () => {
  it('should return status 200', async () => {
    const response = await fetch('http://localhost:3001/health');
    expect(response.status).toBe(200);
  });

  it('should return body with status="ok"', async () => {
    const response = await fetch('http://localhost:3001/health');
    const body = await response.json();
    expect(body.status).toBe('ok');
  });

  it('should return body with timestamp property', async () => {
    const response = await fetch('http://localhost:3001/health');
    const body = await response.json();
    expect(body.timestamp).toBeDefined();
    expect(typeof body.timestamp).toBe('string');
  });
});

describe('GET /notes', () => {
  it('should return status 200', async () => {
    const response = await fetch('http://localhost:3001/notes');
    expect(response.status).toBe(200);
  });

  it('should return body as an array', async () => {
    const response = await fetch('http://localhost:3001/notes');
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it('should return array where each item has id, title, content, createdAt', async () => {
    const response = await fetch('http://localhost:3001/notes');
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    
    if (body.length > 0) {
      body.forEach((item: any) => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('title');
        expect(item).toHaveProperty('content');
        expect(item).toHaveProperty('createdAt');
        expect(typeof item.id).toBe('string');
        expect(typeof item.title).toBe('string');
        expect(typeof item.content).toBe('string');
        expect(typeof item.createdAt).toBe('string');
      });
    }
  });
});
