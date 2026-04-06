import { Note } from '../types/index';

const store: Note[] = [
  {
    id: '1',
    title: 'Sample Note',
    content: 'This is a demo note.',
    createdAt: new Date().toISOString(),
  },
];

export function getAllNotes(): Note[] {
  return store;
}

export function addNote(note: Note): void {
  store.push(note);
}

export function getNoteById(id: string): Note | undefined {
  return store.find((note) => note.id === id);
}
