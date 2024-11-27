import { BaseLogger } from './base.logger';

const logLevel = process.env.APP_LOG_LEVEL || 'debug';

export class AppLogger extends BaseLogger {
  constructor(context: string) {
    super(logLevel, context);
  }
}

export const appLogger = (context: string): AppLogger => new AppLogger(context);
