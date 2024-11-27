import { BaseLogger } from './base.logger';
import pino from 'pino';

const logLevel = process.env.LIB_LOG_LEVEL || 'info';

export class LibLogger extends BaseLogger {
  constructor(context: string) {
    super(logLevel, context);
    this.logger = pino({
      level: logLevel,
      base: { context },
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          singleLine: true,
          translateTime: 'SYS:standard',
        },
      },
    });
  }
}

export const libLogger = (context: string): LibLogger => new LibLogger(context);
