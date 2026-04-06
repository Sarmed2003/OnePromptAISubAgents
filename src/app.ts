import express, { Express, Request, Response, NextFunction } from 'express';
import { getHealth } from './handlers/health';

const app: Express = express();

// Middleware: JSON body parser
app.use(express.json());

// Middleware: Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  console.log(`[${timestamp}] ${method} ${path}`);
  next();
});

// Routes
app.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await getHealth();
    res.status(200).json(health);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Health check failed:', err);
    res.status(500).json({ error: { message, code: 'HEALTH_CHECK_FAILED' } });
  }
});

// Middleware: Error handler (must be last)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  const message = err instanceof Error ? err.message : 'Internal server error';
  res.status(500).json({ error: { message, code: 'INTERNAL_ERROR' } });
});

export default app;
