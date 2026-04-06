export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
}

export interface ErrorResponse {
  error: {
    message: string;
    code: string;
  };
}

export type ApiResponse<T> = {
  data?: T;
  error?: ErrorResponse['error'];
  statusCode: number;
};

export type CreateNoteRequest = Omit<Note, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateNoteRequest = Partial<Omit<Note, 'id' | 'createdAt' | 'updatedAt'>>;
