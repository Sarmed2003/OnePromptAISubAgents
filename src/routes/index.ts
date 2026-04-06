import { Express } from 'express';
import { healthHandler } from '../handlers/health';
import { getNotesHandler, createNoteHandler } from '../handlers/notes';
import { authMiddleware } from '../middleware/auth';

export function setupRoutes(app: Express): void {
  app.get('/health', healthHandler);
  app.get('/notes', getNotesHandler);
  app.post('/notes', authMiddleware, createNoteHandler);
}
