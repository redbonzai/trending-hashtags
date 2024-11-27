import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { LoggerModule as PinoLogger } from '@app/logger';
import { ConfigModule } from '@nestjs/config';
import { TrendingModule } from './trending/trending.module';
import { TweetModule } from './tweet/tweet.module';
import { RedisModule } from './redis/redis.module';
import Joi from 'joi';
import { DatabaseModule } from './database/database.module';
import { QueueModule } from './queues/queues.module';
import { TrendingService } from '@app/trending/trending.service';

@Module({
  imports: [
    PinoLogger,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test', 'provision')
          .default('development'),
        LOG_LEVEL: Joi.string().required(),
        PORT: Joi.number().default(8080),
      }),
    }),
    TrendingModule,
    TweetModule,
    RedisModule,
    DatabaseModule,
    QueueModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements OnModuleInit {
  private readonly logger = new Logger(AppModule.name);
  constructor(private readonly trendingService: TrendingService) {}

  async onModuleInit() {
    await this.trendingService.warmUpRedisCache();
    this.logger.log('App Module Initialized the Warmup of Redis Cache');
  }
}
