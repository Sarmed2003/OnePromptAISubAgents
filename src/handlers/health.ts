export function healthHandler(): { status: string; timestamp: string } {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
  };
}
