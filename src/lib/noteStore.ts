interface Note {
  id: string;
  content: string;
  createdAt: Date;
}

class NoteStore {
  private notes: Map<string, Note> = new Map();

  async create(content: string): Promise<Note> {
    const id = Math.random().toString(36).substring(7);
    const note: Note = {
      id,
      content,
      createdAt: new Date(),
    };
    this.notes.set(id, note);
    return note;
  }

  async get(id: string): Promise<Note | undefined> {
    return this.notes.get(id);
  }

  async list(): Promise<Note[]> {
    return Array.from(this.notes.values());
  }
}

export const noteStore = new NoteStore();
