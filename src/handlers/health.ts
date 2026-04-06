import { Request, Response } from 'express';
import { HealthResponse } from '../types/index';

const startTime = Date.now();

export function healthHandler(req: Request, res: Response): void {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const response: HealthResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime,
  };
  res.status(200).json(response);
}
