import express from 'express';
import { errorHandler } from './middleware/errorHandler';
import { loggingMiddleware } from './middleware/logging';
import notesRoutes from './routes/notes';
import healthRoutes from './routes/health';

function createApp(): express.Application {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(loggingMiddleware);

  // Routes (before error handling middleware)
  app.use('/health', healthRoutes);
  app.use('/api/notes', notesRoutes);

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}

export { createApp };
export default createApp();
