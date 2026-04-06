import { z } from 'zod';

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

export const createNoteRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must not exceed 255 characters').trim(),
  content: z.string().min(1, 'Content is required').max(10000, 'Content must not exceed 10000 characters').trim(),
});
