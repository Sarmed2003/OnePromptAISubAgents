interface Note {
  id: string;
  title: string;
  content: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

class NoteStore {
  private notes: Map<string, Note> = new Map();

  async createNote(title: string, content: string, userId: string): Promise<Note> {
    if (!title || !content || !userId) {
      throw new Error('Title, content, and userId are required');
    }
    
    const id = Math.random().toString(36).substring(7);
    const now = new Date();
    const note: Note = {
      id,
      title,
      content,
      userId,
      createdAt: now,
      updatedAt: now,
    };
    this.notes.set(id, note);
    return note;
  }

  async get(id: string): Promise<Note | undefined> {
    if (!id) {
      throw new Error('Note ID is required');
    }
    return this.notes.get(id);
  }

  async list(): Promise<Note[]> {
    return Array.from(this.notes.values());
  }

  async updateNote(id: string, title?: string, content?: string): Promise<Note> {
    if (!id) {
      throw new Error('Note ID is required');
    }
    
    const note = this.notes.get(id);
    if (!note) {
      throw new Error('Note not found');
    }
    
    const updatedNote: Note = {
      ...note,
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      updatedAt: new Date(),
    };
    
    this.notes.set(id, updatedNote);
    return updatedNote;
  }

  async deleteNote(id: string): Promise<void> {
    if (!id) {
      throw new Error('Note ID is required');
    }
    
    if (!this.notes.has(id)) {
      throw new Error('Note not found');
    }
    
    this.notes.delete(id);
  }
}

export const noteStore = new NoteStore();
