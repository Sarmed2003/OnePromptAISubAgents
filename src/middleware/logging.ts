import { Request, Response, NextFunction } from 'express';

export function loggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const method = req.method;
  const path = req.path;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    console.log(`[${new Date().toISOString()}] ${method} ${path} ${status} ${duration}ms`);
  });

  next();
}
