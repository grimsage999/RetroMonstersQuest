export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

interface LogConfig {
  level: LogLevel;
  enableTimestamps: boolean;
  enableStackTrace: boolean;
}

class Logger {
  private static instance: Logger;
  private config: LogConfig;
  private isDevelopment: boolean;

  private constructor() {
    this.isDevelopment = import.meta.env.DEV || false;
    
    this.config = {
      level: this.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN,
      enableTimestamps: this.isDevelopment,
      enableStackTrace: false
    };
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public setLogLevel(level: LogLevel): void {
    this.config.level = level;
  }

  public debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  public info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  public warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  public error(message: string, error?: Error | any, ...args: any[]): void {
    if (error instanceof Error && this.config.enableStackTrace) {
      this.log(LogLevel.ERROR, message, error.stack, ...args);
    } else {
      this.log(LogLevel.ERROR, message, error, ...args);
    }
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    // All logging disabled for clean player experience
    return;
  }

  private getLevelString(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '[DEBUG]';
      case LogLevel.INFO: return '[INFO]';
      case LogLevel.WARN: return '[WARN]';
      case LogLevel.ERROR: return '[ERROR]';
      default: return '';
    }
  }

  private sanitizeArgs(args: any[]): any[] {
    return args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        const sanitized: any = {};
        for (const key in arg) {
          if (this.isSensitiveKey(key)) {
            sanitized[key] = '[REDACTED]';
          } else {
            sanitized[key] = arg[key];
          }
        }
        return sanitized;
      }
      return arg;
    });
  }

  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = ['password', 'token', 'secret', 'apikey', 'api_key', 'auth'];
    return sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive));
  }
}

export const logger = Logger.getInstance();
