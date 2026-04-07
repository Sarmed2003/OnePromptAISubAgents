import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/utils';

interface CustomError extends Error {
  status?: number;
}

export const errorHandler = (err: CustomError, req: Request, res: Response, _next: NextFunction): void => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  logger.error(`Error: ${message}`, err);
  res.status(status).json({ error: message });
};
