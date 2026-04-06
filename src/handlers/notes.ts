import { noteStore } from '../lib/noteStore';
import { Note } from '../types/index';

export const notesHandler = {
  getAll(): Note[] {
    return noteStore.getAll();
  },
  
  create(data: Partial<Note>): Note {
    if (!data.title) {
      throw new Error('Title is required');
    }
    return noteStore.create(data as Omit<Note, 'id' | 'createdAt'>);
  },
  
  getById(id: string): Note | undefined {
    return noteStore.getById(id);
  },
  
  update(id: string, data: Partial<Note>): Note | undefined {
    return noteStore.update(id, data);
  },
  
  delete(id: string): boolean {
    return noteStore.delete(id);
  },
};
