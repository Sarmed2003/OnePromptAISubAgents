import { Note } from '../types/index';
import { generateId, getCurrentTimestamp } from './utils';

const notes: Map<string, Note> = new Map();

// Initialize with sample data
notes.set('note-001', {
  id: 'note-001',
  title: 'Welcome to DemoPulse',
  content: 'This is a sample note.',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
});

notes.set('note-002', {
  id: 'note-002',
  title: 'API Documentation',
  content: 'Comprehensive REST API endpoints.',
  createdAt: '2024-01-15T10:15:00Z',
  updatedAt: '2024-01-15T10:15:00Z',
});

export function getAllNotes(): Note[] {
  return Array.from(notes.values());
}

export function getNoteById(id: string): Note | undefined {
  return notes.get(id);
}

export function createNote(title: string, content: string): Note {
  const id = generateId();
  const now = getCurrentTimestamp();
  const note: Note = {
    id,
    title,
    content,
    createdAt: now,
    updatedAt: now,
  };
  notes.set(id, note);
  return note;
}

export function updateNote(id: string, title: string, content: string): Note | undefined {
  const note = notes.get(id);
  if (!note) return undefined;
  const updated: Note = {
    ...note,
    title,
    content,
    updatedAt: getCurrentTimestamp(),
  };
  notes.set(id, updated);
  return updated;
}

export function deleteNote(id: string): boolean {
  return notes.delete(id);
}
