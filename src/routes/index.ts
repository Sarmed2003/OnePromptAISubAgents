import { Router } from 'express';
import { getHealth } from '../handlers/health';
import { getAllNotes, getNoteById, createNote, updateNote, deleteNote } from '../handlers/notes';
import { authMiddleware, resourceOwnershipMiddleware } from '../middleware/auth';

const router = Router();

// Health check endpoint (public)
router.get('/health', getHealth);

// Notes endpoints
router.get('/api/notes', getAllNotes);
router.post('/api/notes', authMiddleware, createNote);
router.get('/api/notes/:id', getNoteById);
router.put('/api/notes/:id', authMiddleware, resourceOwnershipMiddleware, updateNote);
router.delete('/api/notes/:id', authMiddleware, resourceOwnershipMiddleware, deleteNote);

export default router;
