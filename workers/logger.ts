export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  userId?: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;

  constructor(logLevel: LogLevel = LogLevel.INFO) {
    this.logLevel = logLevel;
  }

  static getInstance(logLevel?: LogLevel): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(logLevel);
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, userId, requestId, userAgent, ip, data } = entry;
    const levelName = LogLevel[level];

    let logMessage = `[${timestamp}] ${levelName}: ${message}`;

    if (requestId) logMessage += ` | RequestId: ${requestId}`;
    if (userId) logMessage += ` | UserId: ${userId}`;
    if (ip) logMessage += ` | IP: ${ip}`;
    if (userAgent) logMessage += ` | UserAgent: ${userAgent}`;
    if (data) logMessage += ` | Data: ${JSON.stringify(data)}`;

    return logMessage;
  }

  private log(level: LogLevel, message: string, data?: any, context?: Partial<LogEntry>): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      ...context,
    };

    const formattedLog = this.formatLog(entry);

    // Use appropriate console method based on level
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedLog);
        break;
      case LogLevel.INFO:
        console.info(formattedLog);
        break;
      case LogLevel.WARN:
        console.warn(formattedLog);
        break;
      case LogLevel.ERROR:
        console.error(formattedLog);
        break;
    }
  }

  debug(message: string, data?: any, context?: Partial<LogEntry>): void {
    this.log(LogLevel.DEBUG, message, data, context);
  }

  info(message: string, data?: any, context?: Partial<LogEntry>): void {
    this.log(LogLevel.INFO, message, data, context);
  }

  warn(message: string, data?: any, context?: Partial<LogEntry>): void {
    this.log(LogLevel.WARN, message, data, context);
  }

  error(message: string, data?: any, context?: Partial<LogEntry>): void {
    this.log(LogLevel.ERROR, message, data, context);
  }

  // Security-specific logging methods
  securityEvent(event: string, data?: any, context?: Partial<LogEntry>): void {
    this.error(`SECURITY_EVENT: ${event}`, data, context);
  }

  authEvent(event: string, data?: any, context?: Partial<LogEntry>): void {
    this.info(`AUTH_EVENT: ${event}`, data, context);
  }

  rateLimitHit(identifier: string, context?: Partial<LogEntry>): void {
    this.warn(`RATE_LIMIT_HIT: ${identifier}`, undefined, context);
  }
}

// Request context helper
export function getRequestContext(request: Request): Partial<LogEntry> {
  return {
    requestId: crypto.randomUUID(),
    userAgent: request.headers.get('user-agent') || undefined,
    ip: request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown',
  };
}

// Export default logger instance
export const logger = Logger.getInstance(process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG);
