import { Request, Response, NextFunction } from 'express';

interface ErrorResponse {
  error: string;
  status: number;
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  const errorResponse: ErrorResponse = {
    error: 'Internal Server Error',
    status: 500,
  };

  res.status(500).json(errorResponse);
};
