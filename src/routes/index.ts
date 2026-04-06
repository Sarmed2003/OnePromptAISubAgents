import { Router, Request, Response, NextFunction } from 'express';
import { getHealth } from '../handlers/health';
import {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
} from '../handlers/notes';
import { authMiddleware, resourceOwnershipMiddleware } from '../middleware/auth';

const router = Router();

// Health check endpoint (public)
router.get('/health', (req: Request, res: Response, next: NextFunction) => {
  getHealth(req, res, next);
});

// Notes endpoints
router.get('/api/notes', (req: Request, res: Response, next: NextFunction) => {
  getAllNotes(req, res, next);
});

router.post(
  '/api/notes',
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    createNote(req, res, next);
  }
);

router.get(
  '/api/notes/:id',
  (req: Request, res: Response, next: NextFunction) => {
    getNoteById(req, res, next);
  }
);

router.put(
  '/api/notes/:id',
  authMiddleware,
  resourceOwnershipMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    updateNote(req, res, next);
  }
);

router.delete(
  '/api/notes/:id',
  authMiddleware,
  resourceOwnershipMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    deleteNote(req, res, next);
  }
);

export default router;
