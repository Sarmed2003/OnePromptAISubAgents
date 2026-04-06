import express from 'express';
import { loggingMiddleware } from './middleware/logging';
import { healthHandler } from './handlers/health';

const app = express();

app.use(express.json());
app.use(loggingMiddleware);

app.get('/health', healthHandler);

export default app;
