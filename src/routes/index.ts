import { Router } from 'express';
import { healthHandler } from '../handlers/health';
import { notesHandler } from '../handlers/notes';

const router = Router();

router.get('/health', healthHandler);
router.post('/notes', notesHandler);

export default router;
