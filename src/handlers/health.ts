import { Request, Response } from 'express';
import { HealthResponse } from '../types/index';

export function healthHandler(req: Request, res: Response<HealthResponse>): void {
  const response: HealthResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
  };
  res.json(response);
}
