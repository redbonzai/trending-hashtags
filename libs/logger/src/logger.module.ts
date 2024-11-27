import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Make ConfigModule global if it's not already imported
    PinoLoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        pinoHttp: {
          transport: {
            target: 'pino-pretty',
            options: {
              level: configService.get<string>('LOG_LEVEL', 'debug'),
              singleLine: true,
            },
          },
          serializers: {
            req: (req) => ({
              method: req.method,
              url: req.url,
              headers: req.headers,
              file: req.file,
              // Add any other request properties you want to log
            }),
            res: (res) => ({
              statusCode: res.statusCode,
              headers: res.headers,
              responseTime: res.responseTime,
              error: res.error,
              // Add any other response properties you want to log
            }),
            err: (err) => ({
              type: err.type,
              message: err.message,
              stack: err.stack,
              name: err.name,
              code: err.code,
              signal: err.signal,
              additionalInfo: err.additionalInfo,
              // Add any other error properties you want to log
            }),
          },
        },
      }),
    }),
  ],
})
export class LoggerModule {}
