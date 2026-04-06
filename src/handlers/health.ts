import { Request, Response } from 'express';
import { HealthResponse } from '../types/index';
import { getCurrentTimestamp } from '../lib/utils';

export function healthHandler(req: Request, res: Response): void {
  const response: HealthResponse = {
    status: 'healthy',
    timestamp: getCurrentTimestamp()
  };
  res.json(response);
}
