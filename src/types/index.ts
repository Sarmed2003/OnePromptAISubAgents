export interface Note {
  id: string;
  content: string;
  createdAt: Date;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}
