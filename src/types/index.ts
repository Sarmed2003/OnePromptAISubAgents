export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId?: string;
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

export interface AuthenticatedRequest {
  userId: string;
  email: string;
  iat: number;
}

export interface TokenPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export type ApiResponse<T> = {
  data?: T;
  error?: ErrorResponse['error'];
  statusCode: number;
};

export type CreateNoteRequest = Omit<Note, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateNoteRequest = Partial<Omit<Note, 'id' | 'createdAt' | 'updatedAt'>>;
