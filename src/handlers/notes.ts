import { Request, Response } from 'express';
import { Note } from '../types';
import { noteStore } from '../lib/noteStore';
import { generateId } from '../lib/utils';

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
