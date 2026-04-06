import { APIGatewayProxyResult } from "aws-lambda";

/**
 * Represents a formatted API response structure
 */
export interface FormattedResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

/**
 * Maps HTTP status names to status codes
 */
const STATUS_CODE_MAP: Record<string, number> = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * Formats a response object into an API Gateway compatible response
 * @param data - The response data to be serialized
 * @param status - HTTP status name (e.g., 'OK', 'CREATED', 'BAD_REQUEST') or numeric status code
 * @returns Formatted API Gateway response
 */
export function formatResponse(
  data: unknown,
  status: string | number = "OK"
): FormattedResponse {
  let statusCode: number;

  if (typeof status === "number") {
    statusCode = status;
  } else {
    statusCode = STATUS_CODE_MAP[status.toUpperCase()] || 500;
  }

  const body = typeof data === "string" ? data : JSON.stringify(data);

  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    },
    body,
  };
}

/**
 * Gets the current timestamp in ISO 8601 format
 * @returns ISO 8601 formatted timestamp string
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Calculates uptime in milliseconds since process start
 * @returns Uptime in milliseconds
 */
export function getUptime(): number {
  return process.uptime() * 1000;
}
