import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(public message: string, public code: string, public statusCode: number) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandlerMiddleware(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
      },
    });
    return;
  }

  console.error('Unexpected error:', err);
  res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
    },
  });
}
