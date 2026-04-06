import { Router } from 'express';
import { getHealth } from '../handlers/health';
import { getAllNotes, getNoteById, createNote, updateNote, deleteNote } from '../handlers/notes';

const router = Router();

// Health check endpoint
router.get('/health', getHealth);

// Notes endpoints
router.get('/api/notes', getAllNotes);
router.post('/api/notes', createNote);
router.get('/api/notes/:id', getNoteById);
router.put('/api/notes/:id', updateNote);
router.delete('/api/notes/:id', deleteNote);

export default router;
