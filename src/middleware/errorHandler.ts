import { Request, Response, NextFunction } from 'express';
import { formatError } from '../lib/utils';

interface RateLimitStore {
  [userId: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute

export function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const userId = (req as any).userId || req.ip || 'anonymous';
  const now = Date.now();

  // Initialize or reset user's rate limit counter
  if (!rateLimitStore[userId]) {
    rateLimitStore[userId] = {
      count: 0,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    };
  }

  const userLimit = rateLimitStore[userId];

  // Reset counter if window has expired
  if (now >= userLimit.resetTime) {
    userLimit.count = 0;
    userLimit.resetTime = now + RATE_LIMIT_WINDOW_MS;
  }

  // Increment request count
  userLimit.count += 1;

  // Calculate remaining requests and reset time
  const remaining = Math.max(0, RATE_LIMIT_MAX_REQUESTS - userLimit.count);
  const resetTime = userLimit.resetTime;
  const retryAfter = Math.ceil((resetTime - now) / 1000);

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', remaining);
  res.setHeader('X-RateLimit-Reset', resetTime);

  // Check if rate limit exceeded
  if (userLimit.count > RATE_LIMIT_MAX_REQUESTS) {
    res.setHeader('Retry-After', retryAfter);
    res.status(429).json(
      formatError(
        `Rate limit exceeded. Maximum ${RATE_LIMIT_MAX_REQUESTS} requests per minute allowed.`,
        'RATE_LIMIT_EXCEEDED'
      )
    );
    return;
  }

  next();
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', err);
  res.status(500).json(formatError('Internal server error', 'INTERNAL_ERROR'));
}
