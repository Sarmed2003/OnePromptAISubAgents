/**
 * Shared type definitions and interfaces for the API platform.
 * This file serves as the contract for all handlers and services.
 */

/**
 * Health status enum
 */
export enum HealthStatus {
  HEALTHY = "healthy",
  DEGRADED = "degraded",
  UNHEALTHY = "unhealthy",
}

/**
 * Error codes for structured error responses
 */
export enum ErrorCode {
  INTERNAL_ERROR = "INTERNAL_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  CONFLICT = "CONFLICT",
  BAD_REQUEST = "BAD_REQUEST",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
}

/**
 * Standard health response envelope
 */
export interface HealthResponse {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  message?: string;
}

/**
 * Error details in error response
 */
export interface ErrorDetail {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Standard error response envelope
 */
export interface ErrorResponse {
  error: ErrorDetail;
}

/**
 * Generic API response envelope for successful responses
 */
export interface ApiResponse<T = unknown> {
  data: T;
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Paginated response envelope
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Lambda handler response format (API Gateway v1)
 */
export interface LambdaResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

/**
 * Standard CORS headers
 */
export const CORS_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};
