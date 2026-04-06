import { Request, Response } from 'express';

const startTime = Date.now();

export function getHealth(req: Request, res: Response): void {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime,
  });
}
