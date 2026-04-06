import { Request, Response } from 'express';

export async function healthHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json({ ok: true });
}
