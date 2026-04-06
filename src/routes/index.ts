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
import { rateLimitMiddleware } from '../middleware/errorHandler';

const router = Router();

// Apply rate limiting to all routes
router.use(rateLimitMiddleware);

// Health check endpoint (public)
router.get('/health', (req: Request, res: Response, next: NextFunction) => {
  getHealth(req, res);
});

// Notes endpoints
router.get('/api/notes', (req: Request, res: Response, next: NextFunction) => {
  getAllNotes(req, res);
});

router.post(
  '/api/notes',
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    createNote(req, res);
  }
);

router.get(
  '/api/notes/:id',
  (req: Request, res: Response, next: NextFunction) => {
    getNoteById(req, res);
  }
);

router.put(
  '/api/notes/:id',
  authMiddleware,
  resourceOwnershipMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    updateNote(req, res);
  }
);

router.delete(
  '/api/notes/:id',
  authMiddleware,
  resourceOwnershipMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    deleteNote(req, res);
  }
);

export default router;
