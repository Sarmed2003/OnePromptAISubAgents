export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

export function generateId(): string {
  return 'note-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

export function formatError(message: string, code: string): { error: { message: string; code: string } } {
  return {
    error: {
      message,
      code,
    },
  };
}
