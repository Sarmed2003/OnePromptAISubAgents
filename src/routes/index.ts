import { Router } from 'express';
import { getNotesHandler, getNoteByIdHandler, createNoteHandler, updateNoteHandler, deleteNoteHandler } from '../handlers/notes';

export const router = Router();

router.get('/notes', getNotesHandler);
router.post('/notes', createNoteHandler);
router.get('/notes/:id', getNoteByIdHandler);
router.put('/notes/:id', updateNoteHandler);
router.delete('/notes/:id', deleteNoteHandler);
