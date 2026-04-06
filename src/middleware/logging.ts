import { Request, Response, NextFunction } from 'express';

export interface ErrorResponse {
  error: {
    message: string;
    code: string;
    timestamp: string;
  };
}

/**
 * Request logger middleware
 * Logs incoming requests with timestamp, method, path, and query parameters
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const query = Object.keys(req.query).length > 0 ? JSON.stringify(req.query) : '';
  
  const logMessage = query
    ? `[${timestamp}] ${method} ${path} ${query}`
    : `[${timestamp}] ${method} ${path}`;
  
  console.log(logMessage);
  next();
}

/**
 * Error handler middleware
 * Catches errors and returns standardized error responses with 500 status
 * Must be registered last in middleware chain
 */
export function errorHandler(
  err: Error | unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const timestamp = new Date().toISOString();
  const message = err instanceof Error ? err.message : 'Internal server error';
  const code = err instanceof Error && (err as any).code ? (err as any).code : 'INTERNAL_ERROR';
  
  console.error(`[${timestamp}] Error:`, err);
  
  const errorResponse: ErrorResponse = {
    error: {
      message,
      code,
      timestamp,
    },
  };
  
  res.status(500).json(errorResponse);
}
