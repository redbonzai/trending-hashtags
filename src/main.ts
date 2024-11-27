import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
// import { Logger } from '@nestjs/common';
import { Logger as PinoLogger } from 'nestjs-pino';
import { QueueModule } from './queues/queues.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const logger = app.get(PinoLogger);
  app.useLogger(logger);

  const port = configService.get<number>('PORT', 8080);

  await app.listen(port);
  const queueModule = app.get(QueueModule);
  await queueModule.initQueue();

  logger.debug('Application is bootstrapped');
}
bootstrap();
