import { Note } from '../types';

class NoteStore {
  private notes: Map<string, Note> = new Map();

  constructor() {
    this.initializeSeedData();
  }

  private initializeSeedData(): void {
    const seedNotes: Note[] = [
      {
        id: '1',
        title: 'Project Planning',
        content: 'Outline the key milestones and deliverables for Q1. Consider resource allocation and timeline.',
        createdAt: new Date('2024-01-15T10:30:00Z'),
        updatedAt: new Date('2024-01-15T10:30:00Z'),
      },
      {
        id: '2',
        title: 'Meeting Notes - Team Sync',
        content: 'Discussed API architecture improvements. Action items: review database schema, benchmark query performance, document endpoints.',
        createdAt: new Date('2024-01-18T14:00:00Z'),
        updatedAt: new Date('2024-01-18T14:00:00Z'),
      },
      {
        id: '3',
        title: 'Code Review Checklist',
        content: 'Remember to check: type safety, error handling, test coverage, documentation, performance implications, security considerations.',
        createdAt: new Date('2024-01-20T09:15:00Z'),
        updatedAt: new Date('2024-01-20T09:15:00Z'),
      },
      {
        id: '4',
        title: 'Learning Resources',
        content: 'Bookmark: TypeScript handbook, AWS SDK v3 documentation, React best practices guide. Schedule time for weekly learning.',
        createdAt: new Date('2024-01-22T16:45:00Z'),
        updatedAt: new Date('2024-01-22T16:45:00Z'),
      },
    ];

    seedNotes.forEach((note) => {
      this.notes.set(note.id, note);
    });
  }

  create(note: Note): Note {
    this.notes.set(note.id, note);
    return note;
  }

  getAll(): Note[] {
    return Array.from(this.notes.values());
  }

  getById(id: string): Note | null {
    const note = this.notes.get(id);
    return note || null;
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
