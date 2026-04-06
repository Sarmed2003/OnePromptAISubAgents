import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { noteStore } from '../lib/noteStore';
import { formatError } from '../lib/utils';

export function getAllNotes(req: AuthenticatedRequest, res: Response): void {
  const notes = noteStore.getAllNotes();
  res.json(notes);
}

export function getNoteById(req: AuthenticatedRequest, res: Response): void {
  const { id } = req.params;
  const note = noteStore.getNoteById(id);
  if (!note) {
    res.status(404).json(formatError('Note not found', 'NOT_FOUND'));
    return;
  }
  res.json(note);
}

export function createNote(req: AuthenticatedRequest, res: Response): void {
  const { title, content } = req.body;
  if (!title || !content) {
    res.status(400).json(formatError('Title and content are required', 'INVALID_REQUEST'));
    return;
  }
  const userId = req.userId || 'anonymous';
  const note = noteStore.createNote(title, content, userId);
  res.status(201).json(note);
}

export function updateNote(req: AuthenticatedRequest, res: Response): void {
  const { id } = req.params;
  const { title, content } = req.body;
  if (!title || !content) {
    res.status(400).json(formatError('Title and content are required', 'INVALID_REQUEST'));
    return;
  }
  const note = noteStore.updateNote(id, title, content);
  if (!note) {
    res.status(404).json(formatError('Note not found', 'NOT_FOUND'));
    return;
  }
  res.json(note);
}

export function deleteNote(req: AuthenticatedRequest, res: Response): void {
  const { id } = req.params;
  const deleted = noteStore.deleteNote(id);
  if (!deleted) {
    res.status(404).json(formatError('Note not found', 'NOT_FOUND'));
    return;
  }
  res.status(204).send();
}
