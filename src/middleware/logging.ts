import { Request, Response, NextFunction } from 'express';

/**
 * Express middleware for logging incoming HTTP requests.
 * Logs the timestamp, HTTP method, and request path without modifying request/response objects.
 * Non-blocking and safe for production use.
 */
export function loggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  
  console.log(`[${timestamp}] ${method} ${path}`);
  
  next();
}
