import { Note } from '../types/index';
import { generateId, getCurrentTimestamp } from './utils';

class NoteStore {
  private notes: Map<string, Note> = new Map();

  constructor(): void {
    // Initialize with sample notes
    const sampleNote1: Note = {
      id: 'note-001',
      title: 'Welcome to DemoPulse',
      content: 'This is a sample note.',
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };
    const sampleNote2: Note = {
      id: 'note-002',
      title: 'API Documentation',
      content: 'Comprehensive REST API endpoints.',
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };
    this.notes.set(sampleNote1.id, sampleNote1);
    this.notes.set(sampleNote2.id, sampleNote2);
  }

  getAllNotes(): Note[] {
    return Array.from(this.notes.values());
  }

  getNoteById(id: string): Note | undefined {
    return this.notes.get(id);
  }

  createNote(title: string, content: string): Note {
    const id: string = generateId();
    const now: string = getCurrentTimestamp();
    const note: Note = {
      id,
      title,
      content,
      createdAt: now,
      updatedAt: now,
    };
    this.notes.set(id, note);
    return note;
  }

  updateNote(id: string, title: string, content: string): Note | undefined {
    const note: Note | undefined = this.notes.get(id);
    if (!note) return undefined;
    const updated: Note = {
      ...note,
      title,
      content,
      updatedAt: getCurrentTimestamp(),
    };
    this.notes.set(id, updated);
    return updated;
  }

  deleteNote(id: string): boolean {
    return this.notes.delete(id);
  }
}

export const noteStore: NoteStore = new NoteStore();
