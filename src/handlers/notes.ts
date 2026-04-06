import { Request, Response } from 'express';

interface Note {
  id: string;
  title: string;
  content: string;
}

interface NotesListResponse {
  items: Note[];
}

interface NoteStore {
  getAll(): Promise<Note[]>;
}

let noteStore: NoteStore;

export function setNoteStore(store: NoteStore): void {
  noteStore = store;
}

export async function getNotes(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!noteStore) {
      res.status(500).json({
        error: {
          message: 'Note store not initialized',
          code: 'STORE_NOT_INITIALIZED'
        }
      });
      return;
    }

    const notes = await noteStore.getAll();

    // Validate that notes is an array
    if (!Array.isArray(notes)) {
      res.status(500).json({
        error: {
          message: 'Invalid store response: expected array',
          code: 'INVALID_STORE_RESPONSE'
        }
      });
      return;
    }

    // Validate each note has required fields
    for (const note of notes) {
      if (
        typeof note !== 'object' ||
        note === null ||
        typeof note.id !== 'string' ||
        typeof note.title !== 'string' ||
        typeof note.content !== 'string'
      ) {
        res.status(500).json({
          error: {
            message: 'Invalid note object in store response',
            code: 'INVALID_NOTE_OBJECT'
          }
        });
        return;
      }
    }

    const response: NotesListResponse = {
      items: notes
    };

    res.status(200).json(response);
  } catch (err) {
    console.error('getNotes handler error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(500).json({
      error: {
        message,
        code: 'INTERNAL_ERROR'
      }
    });
  }
}
