import express, { Express, Request, Response, NextFunction } from 'express';
import { loggingMiddleware } from './middleware/logging';
import { healthHandler } from './handlers/health';

interface AppFactoryOptions {
  port?: number;
}

export function createApp(options?: AppFactoryOptions): Express {
  const app = express();

  // Middleware: JSON body parsing
  app.use(express.json());

  // Middleware: Logging
  app.use(loggingMiddleware);

  // Routes
  app.get('/health', healthHandler);

  // Error handler middleware (must be last)
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled error:', err);
    const statusCode = (err as any).statusCode || 500;
    const message = err.message || 'Internal server error';
    res.status(statusCode).json({
      error: {
        message,
        code: 'INTERNAL_ERROR',
      },
    });
  });

  return app;
}

export default createApp();
