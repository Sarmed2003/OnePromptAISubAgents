import express, { Express } from 'express';
import { loggingMiddleware } from './middleware/logging';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes/index';

const app: Express = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggingMiddleware);
app.use(authMiddleware);

// Routes
app.use(routes);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
