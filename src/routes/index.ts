import { Router } from 'express';
import { healthHandler } from '../handlers/health';
import { getNotesHandler, createNoteHandler, getNoteHandler, updateNoteHandler, deleteNoteHandler } from '../handlers/notes';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Health check (no auth required)
router.get('/health', healthHandler);

// Notes routes (with auth middleware)
router.get('/api/notes', authMiddleware, getNotesHandler);
router.post('/api/notes', authMiddleware, createNoteHandler);
router.get('/api/notes/:id', authMiddleware, getNoteHandler);
router.put('/api/notes/:id', authMiddleware, updateNoteHandler);
router.delete('/api/notes/:id', authMiddleware, deleteNoteHandler);

export default router;
