import { Router, Request, Response } from 'express';
import { healthHandler } from '../handlers/health';
import { notesHandler } from '../handlers/notes';

export const routes = Router();

routes.get('/health', (_req: Request, res: Response) => {
  res.json(healthHandler());
});

routes.get('/notes', (_req: Request, res: Response) => {
  res.json(notesHandler.getAll());
});

routes.post('/notes', (req: Request, res: Response) => {
  const note = notesHandler.create(req.body);
  res.status(201).json(note);
});
