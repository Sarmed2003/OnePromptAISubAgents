import { Request, Response, NextFunction } from 'express';

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;

  console.log(JSON.stringify({
    timestamp,
    level: 'info',
    method,
    path,
    type: 'request',
  }));

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      method,
      path,
      status: res.statusCode,
      duration,
      type: 'response',
    }));
  });

  next();
};
