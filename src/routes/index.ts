import { Router, Request, Response } from 'express';
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
router.get('/health', (req: Request, res: Response) => {
  getHealth(req, res);
});

// Notes endpoints
router.get('/api/notes', (req: Request, res: Response) => {
  getAllNotes(req, res);
});

router.post(
  '/api/notes',
  authMiddleware,
  (req: Request, res: Response) => {
    createNote(req, res);
  }
);

router.get(
  '/api/notes/:id',
  (req: Request, res: Response) => {
    getNoteById(req, res);
  }
);

router.put(
  '/api/notes/:id',
  authMiddleware,
  resourceOwnershipMiddleware,
  (req: Request, res: Response) => {
    updateNote(req, res);
  }
);

router.delete(
  '/api/notes/:id',
  authMiddleware,
  resourceOwnershipMiddleware,
  (req: Request, res: Response) => {
    deleteNote(req, res);
  }
);

export default router;
