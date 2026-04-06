import { Request, Response, NextFunction } from 'express';

const API_KEY = process.env.API_KEY;

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!API_KEY) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: {
        message: 'Missing or invalid Authorization header',
        code: 'UNAUTHORIZED',
      },
    });
    return;
  }

  const token = authHeader.substring(7);
  if (token !== API_KEY) {
    res.status(403).json({
      error: {
        message: 'Invalid API key',
        code: 'FORBIDDEN',
      },
    });
    return;
  }

  next();
}
