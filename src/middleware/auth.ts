import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/utils';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const extractUserId = (req: AuthenticatedRequest): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return null;
  }
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    logger.warn('Invalid authorization header format');
    return null;
  }
  
  const token = parts[1];
  if (!token || token.length === 0) {
    logger.warn('Empty bearer token');
    return null;
  }
  
  return token;
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authenticatedReq = req as AuthenticatedRequest;
  const authHeader = authenticatedReq.headers.authorization;
  
  if (authHeader) {
    logger.debug(`Auth header present: ${authHeader.substring(0, 10)}...`);
    const userId = extractUserId(authenticatedReq);
    if (userId) {
      authenticatedReq.userId = userId;
      logger.debug(`User authenticated: ${userId}`);
    }
  }
  
  next();
};
