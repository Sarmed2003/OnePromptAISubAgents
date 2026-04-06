import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authEnabled = process.env.AUTH_ENABLED === 'true';
  if (!authEnabled) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: { message: 'Missing authorization header', code: 'UNAUTHORIZED' } });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({ error: { message: 'Invalid authorization header format', code: 'UNAUTHORIZED' } });
    return;
  }

  const token = parts[1];
  if (!token || token.length === 0) {
    res.status(401).json({ error: { message: 'Missing bearer token', code: 'UNAUTHORIZED' } });
    return;
  }

  try {
    const decoded = parseToken(token);
    if (!decoded.userId) {
      res.status(401).json({ error: { message: 'Invalid token: missing userId', code: 'UNAUTHORIZED' } });
      return;
    }
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: { message: 'Invalid or expired token', code: 'UNAUTHORIZED' } });
  }
}

export function resourceOwnershipMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authEnabled = process.env.AUTH_ENABLED === 'true';
  if (!authEnabled) {
    next();
    return;
  }

  const { id } = req.params;
  if (!id) {
    res.status(400).json({ error: { message: 'Missing resource ID', code: 'INVALID_REQUEST' } });
    return;
  }

  const resourceOwnerId = extractOwnerIdFromResource(id);
  if (!resourceOwnerId) {
    res.status(400).json({ error: { message: 'Invalid resource ID format', code: 'INVALID_REQUEST' } });
    return;
  }

  if (req.userId !== resourceOwnerId) {
    res.status(403).json({ error: { message: 'Forbidden: you do not own this resource', code: 'FORBIDDEN' } });
    return;
  }

  next();
}

function parseToken(token: string): { userId: string } {
  const payload = token.split('.')[1];
  if (!payload) {
    throw new Error('Invalid token structure');
  }
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
    return decoded;
  } catch (err) {
    throw new Error('Failed to parse token');
  }
}

function extractOwnerIdFromResource(id: string): string | null {
  const parts = id.split('-');
  if (parts.length >= 2) {
    return parts[0];
  }
  return null;
}
