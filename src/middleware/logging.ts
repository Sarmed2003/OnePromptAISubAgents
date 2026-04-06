import { Request, Response, NextFunction } from 'express';

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

const logLevels: { [key: string]: number } = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = logLevels[LOG_LEVEL] || 1;

function shouldLog(level: string): boolean {
  return logLevels[level] >= currentLevel;
}

export function loggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const originalSend = res.send;

  res.send = function (data: unknown): Response {
    const duration = Date.now() - start;
    if (shouldLog('info')) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    }
    return originalSend.call(this, data);
  };

  next();
}
