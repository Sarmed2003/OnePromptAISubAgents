import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Mock database for notes
const notesDb: { [key: string]: { id: string; title: string; content: string; userId: string } } = {};
let noteIdCounter = 1;

// GET /api/notes - list all notes (requires auth)
router.get('/', authMiddleware, (req: Request, res: Response, next: NextFunction): void => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    // Return notes for the authenticated user
    const userNotes = Object.values(notesDb).filter(note => note.userId === userId);
    res.status(200).json(userNotes);
  } catch (err) {
    next(err);
  }
});

// POST /api/notes - create a new note (requires auth)
router.post('/', authMiddleware, (req: Request, res: Response, next: NextFunction): void => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { title, content } = req.body;
    if (!title || !content) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    const id = String(noteIdCounter++);
    const note = { id, title, content, userId };
    notesDb[id] = note;
    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
});

// GET /api/notes/:id - get a specific note (requires auth)
router.get('/:id', authMiddleware, (req: Request, res: Response, next: NextFunction): void => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const note = notesDb[id];
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.status(200).json(note);
  } catch (err) {
    next(err);
  }
});

// PUT /api/notes/:id - update a note (requires auth)
router.put('/:id', authMiddleware, (req: Request, res: Response, next: NextFunction): void => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const { title, content } = req.body;
    if (!title || !content) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    const note = notesDb[id];
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    if (note.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    note.title = title;
    note.content = content;
    res.status(200).json(note);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/notes/:id - delete a note (requires auth)
router.delete('/:id', authMiddleware, (req: Request, res: Response, next: NextFunction): void => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const note = notesDb[id];
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    if (note.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    delete notesDb[id];
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
