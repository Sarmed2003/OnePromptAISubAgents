import { Request, Response, NextFunction } from 'express';

export function loggingMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const ip = req.ip || req.socket.remoteAddress;
  
  console.log(JSON.stringify({
    timestamp,
    level: 'info',
    method,
    path,
    ip,
    userAgent: req.get('user-agent'),
  }));
  
  next();
}
