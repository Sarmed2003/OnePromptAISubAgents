interface LoggerInterface {
  info(message: string, meta?: unknown): void;
  error(message: string, error?: unknown): void;
  warn(message: string, meta?: unknown): void;
  debug(message: string, meta?: unknown): void;
}

class Logger implements LoggerInterface {
  private logLevel: string;

  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
  }

  info(message: string, meta?: unknown): void {
    console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta) : '');
  }

  error(message: string, error?: unknown): void {
    console.error(`[ERROR] ${message}`, error ? JSON.stringify(error) : '');
  }

  warn(message: string, meta?: unknown): void {
    console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta) : '');
  }

  debug(message: string, meta?: unknown): void {
    if (this.logLevel === 'debug') {
      console.log(`[DEBUG] ${message}`, meta ? JSON.stringify(meta) : '');
    }
  }
}

export const logger = new Logger();
