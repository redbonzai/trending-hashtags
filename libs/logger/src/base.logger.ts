import pino, { Logger } from 'pino';
import { LoggerService } from '@nestjs/common';

export class BaseLogger implements LoggerService {
  protected logger: Logger;

  constructor(logLevel: string, context: string) {
    this.logger = pino({
      level: logLevel,
      base: { context },
      messageKey: 'msg', // Explicitly set the key for log messages
      redact: ['req.headers.authorization', 'req.headers.cookie'],
      serializers: {
        err: (error) => ({
          type: error.name,
          message: error.message,
          stack: error.stack,
          fileName: error.fileName || 'unknown',
          lineNumber: error.lineNumber || 'unknown',
          statusCode: error.statusCode,
        }),
      },
    });
  }

  debug(message: string, data?: Record<string, unknown>): void {
    if (typeof message === 'string') {
      this.logger.debug(data ? { ...data, message } : message);
    } else {
      this.logger.debug({ message: JSON.stringify(message), ...data });
    }
  }

  log(message: string, data?: Record<string, unknown>): void {
    if (typeof message === 'string') {
      this.logger.info(data ? { ...data, message } : message);
    } else {
      this.logger.info({ message: JSON.stringify(message), ...data });
    }
  }

  warn(message: string, data?: Record<string, unknown>): void {
    if (typeof message === 'string') {
      this.logger.warn(data ? { ...data, message } : message);
    } else {
      this.logger.warn({ message: JSON.stringify(message), ...data });
    }
  }

  error(message: string, data?: Record<string, unknown>): void {
    if (typeof message === 'string') {
      this.logger.error(data ? { ...data, message } : message);
    } else {
      this.logger.error({ message: JSON.stringify(message), ...data });
    }
  }

  fatal(message: string, data?: Record<string, unknown>): void {
    if (typeof message === 'string') {
      this.logger.fatal(data ? { ...data, message } : message);
    } else {
      this.logger.fatal({ message: JSON.stringify(message), ...data });
    }
  }

  // Add a child method to conform to Fastify logger requirements
  child(bindings: object): BaseLogger {
    const childLogger = this.logger.child(bindings);
    const newInstance = new BaseLogger(this.logger.level, 'ChildContext');
    newInstance.logger = childLogger;
    return newInstance;
  }
}
