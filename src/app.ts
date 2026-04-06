import express, { Express } from 'express';
import { loggingMiddleware } from './middleware/logging';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';

const app: Express = express();

// Middleware
app.use(loggingMiddleware);
app.use(express.json());

// Routes
app.use(routes);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
