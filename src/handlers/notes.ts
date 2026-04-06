import { Request, Response } from 'express';
import { Note } from '../types';
import { noteStore } from '../lib/noteStore';
import { generateId } from '../lib/utils';

export const notesHandler = (req: Request, res: Response): void => {
  try {
    const filter = req.query.filter as string | undefined;
    const limit = req.query.limit as string | undefined;

    let notes = noteStore.getAll();

    if (filter) {
      const filterLower = filter.toLowerCase();
      notes = notes.filter((note) =>
        note.title.toLowerCase().includes(filterLower) ||
        note.content.toLowerCase().includes(filterLower)
      );
    }

    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        notes = notes.slice(0, limitNum);
      }
    }

    res.status(200).json(notes);
  } catch (err) {
    console.error('notesHandler error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
};

export const getNotesHandler = (_req: Request, res: Response): void => {
  const notes = noteStore.getAll();
  res.status(200).json(notes);
};

export const createNoteHandler = (req: Request, res: Response): void => {
  const { title, content } = req.body;

  if (!title || !content) {
    res.status(400).json({ error: 'Title and content are required' });
    return;
  }

  const newNote: Note = {
    id: generateId(),
    title,
    content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  noteStore.create(newNote);
  res.status(201).json(newNote);
};

export const getNoteHandler = (req: Request, res: Response): void => {
  const { id } = req.params;
  const note = noteStore.getById(id);

  if (!note) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }

  res.status(200).json(note);
};

export const updateNoteHandler = (req: Request, res: Response): void => {
  const { id } = req.params;
  const { title, content } = req.body;

  const note = noteStore.getById(id);
  if (!note) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }

  const updatedNote: Note = {
    ...note,
    title: title || note.title,
    content: content || note.content,
    updatedAt: new Date().toISOString(),
  };

  noteStore.update(id, updatedNote);
  res.status(200).json(updatedNote);
};

export const deleteNoteHandler = (req: Request, res: Response): void => {
  const { id } = req.params;
  const note = noteStore.getById(id);

  if (!note) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }

  noteStore.delete(id);
  res.status(204).send();
};
