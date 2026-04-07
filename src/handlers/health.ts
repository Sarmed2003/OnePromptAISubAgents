import { Request, Response } from 'express';
import { logger } from '../lib/utils';

export const healthHandler = (req: Request, res: Response): void => {
  logger.info('Health check requested');
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
};
