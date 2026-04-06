import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { noteStore } from '../lib/noteStore';
import { formatError } from '../lib/utils';

export async function getAllNotes(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const notes = await noteStore.getAllNotes();
    res.json(notes);
  } catch (err) {
    console.error('getAllNotes handler failed:', err);
    const message = err instanceof Error ? err.message : 'Failed to retrieve notes';
    res.status(500).json(formatError(message, 'INTERNAL_ERROR'));
  }
}

export async function getNoteById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    if (!id || typeof id !== 'string') {
      res.status(400).json(formatError('Invalid note ID', 'INVALID_REQUEST'));
      return;
    }
    const note = await noteStore.getNoteById(id);
    if (!note) {
      res.status(404).json(formatError('Note not found', 'NOT_FOUND'));
      return;
    }
    res.json(note);
  } catch (err) {
    console.error('getNoteById handler failed:', err);
    const message = err instanceof Error ? err.message : 'Failed to retrieve note';
    res.status(500).json(formatError(message, 'INTERNAL_ERROR'));
  }
}

export async function createNote(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { title, content } = req.body as { title: unknown; content: unknown };
    if (!title || !content || typeof title !== 'string' || typeof content !== 'string') {
      res.status(400).json(formatError('Title and content are required', 'INVALID_REQUEST'));
      return;
    }
    const userId = req.userId || 'anonymous';
    const note = await noteStore.createNote(title, content, userId);
    res.status(201).json(note);
  } catch (err) {
    console.error('createNote handler failed:', err);
    const message = err instanceof Error ? err.message : 'Failed to create note';
    res.status(500).json(formatError(message, 'INTERNAL_ERROR'));
  }
}

export async function updateNote(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const { title, content } = req.body as { title: unknown; content: unknown };
    if (!id || typeof id !== 'string') {
      res.status(400).json(formatError('Invalid note ID', 'INVALID_REQUEST'));
      return;
    }
    if (!title || !content || typeof title !== 'string' || typeof content !== 'string') {
      res.status(400).json(formatError('Title and content are required', 'INVALID_REQUEST'));
      return;
    }
    const note = await noteStore.updateNote(id, title, content);
    if (!note) {
      res.status(404).json(formatError('Note not found', 'NOT_FOUND'));
      return;
    }
    res.json(note);
  } catch (err) {
    console.error('updateNote handler failed:', err);
    const message = err instanceof Error ? err.message : 'Failed to update note';
    res.status(500).json(formatError(message, 'INTERNAL_ERROR'));
  }
}

export async function deleteNote(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    if (!id || typeof id !== 'string') {
      res.status(400).json(formatError('Invalid note ID', 'INVALID_REQUEST'));
      return;
    }
    const deleted = await noteStore.deleteNote(id);
    if (!deleted) {
      res.status(404).json(formatError('Note not found', 'NOT_FOUND'));
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error('deleteNote handler failed:', err);
    const message = err instanceof Error ? err.message : 'Failed to delete note';
    res.status(500).json(formatError(message, 'INTERNAL_ERROR'));
  }
}
