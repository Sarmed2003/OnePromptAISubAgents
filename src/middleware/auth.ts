import { Request, Response, NextFunction } from 'express';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authEnabled = process.env.AUTH_ENABLED === 'true';
  if (!authEnabled) {
    next();
    return;
  }
  // Placeholder for auth logic
  next();
}
