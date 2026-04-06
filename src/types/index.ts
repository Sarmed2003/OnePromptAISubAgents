/**
 * Shared TypeScript types and interfaces for DemoPulse.
 * These types define the contract for all handlers, middleware, and API responses.
 */

/**
 * Health check response type.
 * Indicates the status of the service and the timestamp of the check.
 */
export interface Health {
  status: 'ok' | 'error';
  timestamp: string;
}

/**
 * Note type representing a single note in the system.
 * Includes metadata for tracking creation and updates.
 */
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * NoteStore interface defining the contract for note persistence.
 * Implementations handle reading and writing notes to storage.
 */
export interface NoteStore {
  get(id: string): Promise<Note | null>;
  list(): Promise<Note[]>;
  create(note: Omit<Note, 'id' | 'updatedAt'>): Promise<Note>;
  update(id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>): Promise<Note | null>;
  delete(id: string): Promise<boolean>;
}

/**
 * Generic API response wrapper for all endpoints.
 * Provides consistent response structure across the application.
 */
export interface ApiResponse<T> {
  status: 'ok' | 'error';
  data?: T;
  error?: string;
}
