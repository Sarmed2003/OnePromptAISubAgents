import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/utils';

export const authMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    logger.debug(`Auth header present: ${authHeader.substring(0, 10)}...`);
  }
  next();
};
