import { Request, Response } from 'express';
import { Note, NotesListResponse, CreateNoteRequest } from '../types/index';
import { getAllNotes, addNote } from '../lib/noteStore';
import { generateId } from '../lib/utils';

export function getNotesHandler(req: Request, res: Response<NotesListResponse>): void {
  const notes = getAllNotes();
  res.json({ notes });
}

export function createNoteHandler(req: Request, res: Response<Note | { error: string }>): void {
  const { title, content } = req.body as CreateNoteRequest;

  if (!title || !content) {
    res.status(400).json({ error: 'Missing required fields: title and content' });
    return;
  }

  const note: Note = {
    id: generateId(),
    title,
    content,
    createdAt: new Date().toISOString(),
  };

  addNote(note);
  res.status(201).json(note);
}
