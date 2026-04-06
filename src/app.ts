import express, { Express } from 'express';
import { loggingMiddleware } from './middleware/logging';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';

const app: Express = express();

// Middleware stack in order
app.use(loggingMiddleware);
app.use(authMiddleware);
app.use(express.json());

// Routes
app.use(routes);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
