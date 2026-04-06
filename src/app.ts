import express, { Express } from 'express';
import { loggingMiddleware } from './middleware/logging';
import { authMiddleware } from './middleware/auth';
import { errorHandlerMiddleware } from './middleware/errorHandler';
import { healthHandler } from './handlers/health';
import { router } from './routes/index';

export function createApp(): Express {
  const app = express();

  // Body parsing middleware
  app.use(express.json());

  // Logging middleware
  app.use(loggingMiddleware);

  // Authentication middleware
  app.use(authMiddleware);

  // Health check endpoint
  app.get('/health', healthHandler);

  // API routes
  app.use('/api', router);

  // Error handling middleware (must be last)
  app.use(errorHandlerMiddleware);

  return app;
}
