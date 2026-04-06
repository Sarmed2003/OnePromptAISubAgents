import { Request, Response, NextFunction } from 'express';

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const apiKeyEnv = process.env.API_KEY;

  // If no API_KEY is configured, allow all requests
  if (!apiKeyEnv) {
    next();
    return;
  }

  // Extract API key from Authorization header (Bearer token) or x-api-key header
  let providedKey: string | undefined;

  const authHeader = req.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    providedKey = authHeader.slice(7); // Remove 'Bearer ' prefix
  } else {
    providedKey = req.get('x-api-key');
  }

  // Validate the API key
  if (!providedKey || providedKey !== apiKeyEnv) {
    res.status(401).json({
      error: {
        message: 'Unauthorized: Invalid or missing API key',
        code: 'INVALID_API_KEY'
      }
    });
    return;
  }

  // API key is valid, proceed to next middleware
  next();
};
