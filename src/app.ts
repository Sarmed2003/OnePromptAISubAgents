import express from 'express';
import { errorHandler } from './middleware/errorHandler';
import { loggingMiddleware } from './middleware/logging';
import { authMiddleware } from './middleware/auth';
import notesRoutes from './routes/notes';
import healthRoutes from './routes/health';

function createApp(): express.Application {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(loggingMiddleware);

  // Routes (before auth middleware so public routes work)
  app.use('/health', healthRoutes);
  app.use('/api/notes', notesRoutes);

  // Auth middleware (after routes, or selectively apply)
  app.use(authMiddleware);

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}

export { createApp };
export default createApp();
