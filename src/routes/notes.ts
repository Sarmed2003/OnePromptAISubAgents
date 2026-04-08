import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth';
import { noteStore } from '../lib/noteStore';

const router = Router();

// GET /api/notes - list all notes (requires auth)
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const all = await noteStore.list();
    const userNotes = all.filter((note) => note.userId === userId);
    res.status(200).json(userNotes);
  } catch (err) {
    next(err);
  }
});

// POST /api/notes - create a new note (requires auth)
router.post('/', authMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { title, content } = req.body as { title?: string; content?: string };
    if (!title || !content) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    const note = await noteStore.createNote(title, content, userId);
    res.status(201).json({
      id: note.id,
      title: note.title,
      content: note.content,
      userId: note.userId,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/notes/:id - get a specific note (requires auth)
router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const note = await noteStore.get(id);
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }
    res.status(200).json(note);
  } catch (err) {
    next(err);
  }
});

// PUT /api/notes/:id - update a note (requires auth)
router.put('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const { title, content } = req.body as { title?: string; content?: string };
    if (!title || !content) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    const existing = await noteStore.get(id);
    if (!existing) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }
    if (existing.userId !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    const note = await noteStore.updateNote(id, title, content);
    res.status(200).json(note);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/notes/:id - delete a note (requires auth)
router.delete('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const existing = await noteStore.get(id);
    if (!existing) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }
    if (existing.userId !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    await noteStore.deleteNote(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
