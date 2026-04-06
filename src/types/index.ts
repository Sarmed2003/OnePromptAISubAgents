export interface HealthResponse {
  status: 'ok';
  timestamp: string;
}

export interface Note {
  id: number;
  title: string;
  content: string;
}

export interface NotesListResponse {
  items: Note[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
