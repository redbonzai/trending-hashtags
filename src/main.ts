import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { QueueModule } from './queues/queues.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  // Disable NestJS internal logs
  const app = await NestFactory.create(AppModule);

  app.useLogger(logger);

  // Get the ConfigService instance
  const configService = app.get(ConfigService);

  // Retrieve the PORT value
  const port = configService.get<number>('PORT', 8080);

  await app.listen(port);
  // Manually initialize the queue after the application is started
  const queueModule = app.get(QueueModule);
  await queueModule.initQueue();

  logger.debug('Application is bootstrapped');
}
bootstrap();
