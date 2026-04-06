import express from 'express';
import { setupRoutes } from './routes/index';
import { loggingMiddleware } from './middleware/logging';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(loggingMiddleware);

// Routes
setupRoutes(app);

// Error handling (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;