export interface ErrorResponse {
  error: {
    message: string;
    code: string;
  };
}

export function generateId(): string {
  return `note-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

export function formatError(message: string, code: string): ErrorResponse {
  return {
    error: {
      message,
      code,
    },
  };
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateNote(note: unknown): note is { id: string; title: string; content: string; createdAt: string; updatedAt: string } {
  if (typeof note !== 'object' || note === null) {
    return false;
  }
  const n = note as Record<string, unknown>;
  return (
    typeof n.id === 'string' &&
    typeof n.title === 'string' &&
    typeof n.content === 'string' &&
    typeof n.createdAt === 'string' &&
    typeof n.updatedAt === 'string'
  );
}
