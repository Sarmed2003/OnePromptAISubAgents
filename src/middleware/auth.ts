import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing authorization header',
    });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid authorization header format',
    });
    return;
  }

  const token = parts[1];

  if (!token || token.trim().length === 0) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing bearer token',
    });
    return;
  }

  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [userId] = decoded.split(':');

    if (!userId || userId.trim().length === 0) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token format',
      });
      return;
    }

    req.userId = userId;
    next();
  } catch (error) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token',
    });
  }
}
