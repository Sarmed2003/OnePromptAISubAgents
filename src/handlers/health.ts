import { HealthResponse } from '../types/index';

/**
 * GET /health endpoint handler
 * Returns system health status including uptime and timestamp
 * Pure function with no side effects beyond reading process.uptime()
 */
export async function health(): Promise<HealthResponse> {
  try {
    const uptime = process.uptime();
    const timestamp = new Date().toISOString();

    return {
      status: 'healthy',
      statusCode: 200,
      uptime,
      timestamp,
    };
  } catch (error) {
    console.error('Health check failed:', error);
    const message = error instanceof Error ? error.message : 'Health check failed';
    return {
      status: 'unhealthy',
      statusCode: 500,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      error: message,
    };
  }
}
