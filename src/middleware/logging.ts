import { Request, Response, NextFunction } from 'express';

export function loggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start: number = Date.now();
  const method: string = req.method;
  const path: string = req.path;

  res.on('finish', (): void => {
    const duration: number = Date.now() - start;
    const status: number = res.statusCode;
    const timestamp: string = new Date().toISOString();
    console.log(`[${timestamp}] ${method} ${path} ${status} ${duration}ms`);
  });

  next();
}
