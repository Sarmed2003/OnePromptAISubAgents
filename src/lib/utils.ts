export interface ErrorResponse {
  error: {
    message: string;
    code: string;
  };
}

export function generateId(): string {
  return `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
