import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export interface HealthResponse {
  status: string;
  timestamp: string;
}

export const healthHandler = (
  _event: APIGatewayProxyEvent
): APIGatewayProxyResult => {
  const response: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(response),
  };
};
