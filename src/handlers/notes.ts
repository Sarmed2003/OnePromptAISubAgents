import { Request, Response } from 'express';
import { noteStore } from '../lib/noteStore';
import { logger } from '../lib/utils';
import { AuthenticatedRequest, extractUserId } from '../middleware/auth';

export const notesHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      res.status(400).json({ error: 'Title and content are required' });
      return;
    }
    
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = extractUserId(authenticatedReq);
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    const note = await noteStore.createNote(title, content, userId);
    logger.info(`Note created: ${note.id} by user: ${userId}`);
    res.status(201).json(note);
  } catch (error) {
    logger.error('Error creating note', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateNoteHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    
    if (!id) {
      res.status(400).json({ error: 'Note ID is required' });
      return;
    }
    
    if (!title && !content) {
      res.status(400).json({ error: 'At least one of title or content is required' });
      return;
    }
    
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = extractUserId(authenticatedReq);
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    const note = await noteStore.get(id);
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }
    
    if (note.userId !== userId) {
      res.status(403).json({ error: 'Forbidden: You do not own this note' });
      return;
    }
    
    const updatedNote = await noteStore.updateNote(id, title, content);
    logger.info(`Note updated: ${id} by user: ${userId}`);
    res.status(200).json(updatedNote);
  } catch (error) {
    logger.error('Error updating note', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteNoteHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({ error: 'Note ID is required' });
      return;
    }
    
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = extractUserId(authenticatedReq);
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    const note = await noteStore.get(id);
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }
    
    if (note.userId !== userId) {
      res.status(403).json({ error: 'Forbidden: You do not own this note' });
      return;
    }
    
    await noteStore.deleteNote(id);
    logger.info(`Note deleted: ${id} by user: ${userId}`);
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting note', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
