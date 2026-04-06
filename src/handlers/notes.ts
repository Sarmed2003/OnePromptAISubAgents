import { Request, Response } from 'express';
import { Note } from '../types/index';
import * as noteStore from '../lib/noteStore';
import { AppError } from '../middleware/errorHandler';

export function getNotesHandler(req: Request, res: Response): void {
  const notes = noteStore.getAllNotes();
  res.status(200).json(notes);
}

export function getNoteByIdHandler(req: Request, res: Response): void {
  const { id } = req.params;
  const note = noteStore.getNoteById(id);
  if (!note) {
    res.status(404).json({
      error: {
        message: 'Note not found',
        code: 'NOT_FOUND',
      },
    });
    return;
  }
  res.status(200).json(note);
}

export function createNoteHandler(req: Request, res: Response): void {
  const { title, content } = req.body;

  if (!title || typeof title !== 'string') {
    res.status(400).json({
      error: {
        message: 'Title is required and must be a string',
        code: 'INVALID_REQUEST',
      },
    });
    return;
  }

  if (!content || typeof content !== 'string') {
    res.status(400).json({
      error: {
        message: 'Content is required and must be a string',
        code: 'INVALID_REQUEST',
      },
    });
    return;
  }

  const note = noteStore.createNote(title, content);
  res.status(201).json(note);
}

export function updateNoteHandler(req: Request, res: Response): void {
  const { id } = req.params;
  const { title, content } = req.body;

  if (!title || typeof title !== 'string') {
    res.status(400).json({
      error: {
        message: 'Title is required and must be a string',
        code: 'INVALID_REQUEST',
      },
    });
    return;
  }

  if (!content || typeof content !== 'string') {
    res.status(400).json({
      error: {
        message: 'Content is required and must be a string',
        code: 'INVALID_REQUEST',
      },
    });
    return;
  }

  const note = noteStore.updateNote(id, title, content);
  if (!note) {
    res.status(404).json({
      error: {
        message: 'Note not found',
        code: 'NOT_FOUND',
      },
    });
    return;
  }
  res.status(200).json(note);
}

export function deleteNoteHandler(req: Request, res: Response): void {
  const { id } = req.params;
  const deleted = noteStore.deleteNote(id);
  if (!deleted) {
    res.status(404).json({
      error: {
        message: 'Note not found',
        code: 'NOT_FOUND',
      },
    });
    return;
  }
  res.status(204).send();
}
