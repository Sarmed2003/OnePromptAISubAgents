import { Request, Response } from 'express';
import { noteStore } from '../lib/noteStore';
import { logger } from '../lib/utils';

export const notesHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content } = req.body;
    if (!content) {
      res.status(400).json({ error: 'Content is required' });
      return;
    }
    const note = await noteStore.create(content);
    logger.info(`Note created: ${note.id}`);
    res.status(201).json(note);
  } catch (error) {
    logger.error('Error creating note', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
