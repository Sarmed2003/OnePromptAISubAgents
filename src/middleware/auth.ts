import { Request, Response, NextFunction } from 'express';

export const authMiddleware = (_req: Request, _res: Response, next: NextFunction): void => {
  // Placeholder auth middleware - implement based on your auth strategy
  next();
};
