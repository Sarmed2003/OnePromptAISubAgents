export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
}

export interface ErrorResponse {
  error: {
    message: string;
    code: string;
  };
}
