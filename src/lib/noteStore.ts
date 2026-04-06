import { Note } from '../types';

class NoteStore {
  private notes: Map<string, Note> = new Map();

  create(note: Note): Note {
    this.notes.set(note.id, note);
    return note;
  }

  getAll(): Note[] {
    return Array.from(this.notes.values());
  }

  getById(id: string): Note | undefined {
    return this.notes.get(id);
  }

  update(id: string, note: Note): Note | undefined {
    if (this.notes.has(id)) {
      this.notes.set(id, note);
      return note;
    }
    return undefined;
  }

  delete(id: string): boolean {
    return this.notes.delete(id);
  }
}

export const noteStore = new NoteStore();
