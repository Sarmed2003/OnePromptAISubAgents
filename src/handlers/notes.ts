import { Request, Response } from 'express';
import { z } from 'zod';
import { Note, NotesListResponse, CreateNoteRequest, createNoteRequestSchema } from '../types/index';
import { getAllNotes, addNote } from '../lib/noteStore';
import { generateId } from '../lib/utils';

export function getNotesHandler(req: Request, res: Response<NotesListResponse>): void {
  const notes = getAllNotes();
  res.json({ notes });
}

export function createNoteHandler(req: Request, res: Response<Note | { error: string }>): void {
  try {
    const validationResult = createNoteRequestSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('; ');
      res.status(400).json({ error: `Validation failed: ${errors}` });
      return;
    }

    const { title, content } = validationResult.data as CreateNoteRequest;

    const note: Note = {
      id: generateId(),
      title,
      content,
      createdAt: new Date().toISOString(),
    };

    addNote(note);
    res.status(201).json(note);
  } catch (err) {
    console.error('createNoteHandler error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
