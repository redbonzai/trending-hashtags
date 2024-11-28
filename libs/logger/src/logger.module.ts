import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PinoLoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const logLevel = configService.get<string>('LOG_LEVEL', 'debug');
        console.log('LOG LEVEL', logLevel);
        return {
          pinoHttp: {
            level: logLevel,
            transport: {
              target: 'pino-pretty',
              options: {
                level: logLevel,
                singleLine: true,
              },
            },
            serializers: {
              req: (req) => ({
                method: req.method,
                url: req.url,
                headers: req.headers,
                file: req.file,
              }),
              res: (res) => ({
                statusCode: res.statusCode,
                headers: res.headers,
                responseTime: res.responseTime,
                error: res.error,
              }),
              err: (err) => ({
                type: err.type,
                message: err.message,
                stack: err.stack,
                name: err.name,
                code: err.code,
                signal: err.signal,
                additionalInfo: err.additionalInfo,
              }),
            },
          },
        };
      },
    }),
  ],
})
export class LoggerModule {}
