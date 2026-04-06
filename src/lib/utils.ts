export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

export function formatResponse<T>(success: boolean, data?: T, error?: string) {
  return {
    success,
    data,
    error
  };
}
