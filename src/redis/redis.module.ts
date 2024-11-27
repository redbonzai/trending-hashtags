import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisController } from './redis.controller';
import { createClient } from 'redis';

@Module({
  providers: [
    RedisService,
    {
      provide: 'REDIS_CLIENT',
      useFactory: async () => {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        const client = createClient({ url: redisUrl });

        client.on('connect', () => {
          console.log('Redis connection established');
        });

        client.on('ready', () => {
          console.log('Redis connection is ready');
        });

        client.on('error', (err) => {
          console.error('Redis connection error:', err);
        });

        await client.connect();
        return client;
      },
    },
  ],
  controllers: [RedisController],
  exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule {}
