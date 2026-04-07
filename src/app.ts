import express from 'express';
import { errorHandler } from './middleware/errorHandler';
import { loggingMiddleware } from './middleware/logging';
import { authMiddleware } from './middleware/auth';
import routes from './routes';

const app = express();

// Middleware
app.use(express.json());
app.use(loggingMiddleware);
app.use(authMiddleware);

// Routes
app.use('/', routes);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
