import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule as PinoLogger } from '@app/logger';
import { ConfigModule } from '@nestjs/config';
import { TrendingModule } from './trending/trending.module';
import { TweetModule } from './tweet/tweet.module';
import { RedisModule } from './redis/redis.module';
import Joi from 'joi';
import { DatabaseModule } from './database/database.module';
import { QueueModule } from './queues/queues.module';

@Module({
  imports: [
    PinoLogger,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test', 'provision')
          .default('development'),
        APP_LOG_LEVEL: Joi.string().required(),
        LIB_LOG_LEVEL: Joi.string().required(),
        PORT: Joi.number().default(8080),
      }),
    }),
    TrendingModule,
    TweetModule,
    RedisModule,
    DatabaseModule,
    QueueModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
