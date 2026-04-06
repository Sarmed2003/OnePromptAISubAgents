import { Note } from '../types/index';
import { generateId } from './utils';

class NoteStore {
  private notes: Map<string, Note> = new Map();
  
  getAll(): Note[] {
    return Array.from(this.notes.values());
  }
  
  getById(id: string): Note | undefined {
    return this.notes.get(id);
  }
  
  create(data: Omit<Note, 'id' | 'createdAt'>): Note {
    const note: Note = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      ...data,
    };
    this.notes.set(note.id, note);
    return note;
  }
  
  update(id: string, data: Partial<Note>): Note | undefined {
    const note = this.notes.get(id);
    if (!note) return undefined;
    
    const updated = { ...note, ...data, id: note.id, createdAt: note.createdAt };
    this.notes.set(id, updated);
    return updated;
  }
  
  delete(id: string): boolean {
    return this.notes.delete(id);
  }
}

export const noteStore = new NoteStore();
