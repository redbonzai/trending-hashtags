import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            level: 'debug',
            singleLine: true,
          },
        },
        serializers: {
          req: (req) => {
            return {
              method: req.method,
              url: req.url,
              headers: req.headers,
              file: req.file,
              // Add any other request properties you want to log
            };
          },
          res: (res) => {
            return {
              statusCode: res.statusCode,
              headers: res.headers,
              responseTime: res.responseTime,
              error: res.error,
              // Add any other response properties you want to log
            };
          },
          err: (err) => {
            return {
              type: err.type,
              message: err.message,
              stack: err.stack,
              name: err.name,
              code: err.code,
              signal: err.signal,
              additionalInfo: err.additionalInfo,
              // Add any other error properties you want to log
            };
          },
        },
      },
    }),
  ],
})
export class LoggerModule {}
// import { Module, Global } from '@nestjs/common';
// import { AppLogger } from './app.logger';
// import { LibLogger } from './lib.logger';
// import { BaseLogger } from './base.logger';
//
// @Global()
// @Module({
//   providers: [
//     {
//       provide: BaseLogger,
//       useFactory: () => {
//         const logLevel = process.env.BASE_LOG_LEVEL || 'debug';
//         return new BaseLogger(logLevel, 'BaseLogger');
//       },
//     },
//     {
//       provide: AppLogger,
//       useFactory: () => {
//         return new AppLogger('AppLogger');
//       },
//     },
//     {
//       provide: LibLogger,
//       useFactory: () => {
//         return new LibLogger('LibLogger');
//       },
//     },
//   ],
//   exports: [BaseLogger, AppLogger, LibLogger],
// })
// export class LoggerModule {}
