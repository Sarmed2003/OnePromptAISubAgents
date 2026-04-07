import express, { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// GET /api/notes - list all notes (requires auth)
router.get('/', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Return empty array for now
    res.status(200).json([]);
  } catch (err) {
    next(err);
  }
});

// POST /api/notes - create a new note (requires auth)
router.post('/', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    res.status(201).json({ id: '1', title, content, userId });
  } catch (err) {
    next(err);
  }
});

// GET /api/notes/:id - get a specific note (requires auth)
router.get('/:id', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { id } = req.params;
    res.status(200).json({ id, title: 'Note', content: 'Content', userId });
  } catch (err) {
    next(err);
  }
});

// PUT /api/notes/:id - update a note (requires auth)
router.put('/:id', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { id } = req.params;
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    res.status(200).json({ id, title, content, userId });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/notes/:id - delete a note (requires auth)
router.delete('/:id', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
