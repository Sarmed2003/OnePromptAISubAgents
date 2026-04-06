import { Request, Response, NextFunction } from 'express';
import { formatError } from '../lib/utils';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', err);
  res.status(500).json(formatError('Internal server error', 'INTERNAL_ERROR'));
}
