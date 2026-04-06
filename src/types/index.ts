export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface CreateNoteRequest {
  title: string;
  content: string;
}

export interface NotesListResponse {
  notes: Note[];
}

export interface HealthResponse {
  status: string;
  timestamp: string;
}
