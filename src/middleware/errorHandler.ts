import { Request, Response, NextFunction } from 'express';

interface ErrorWithStatus extends Error {
  status?: number;
}

export const errorHandler = (
  err: ErrorWithStatus,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      stack: err.stack,
      status,
      type: 'error',
    })
  );

  res.status(status).json({
    status: 'error',
    error: message,
    code: status === 404 ? 'NOT_FOUND' : status === 500 ? 'INTERNAL_ERROR' : 'ERROR',
  });
};
