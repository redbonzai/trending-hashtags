import { Module } from '@nestjs/common';
import { TweetController } from './tweet.controller';
import { TweetRepository } from './tweet.repository';
import { TweetService } from './tweet.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tweet } from '../database/entities/tweet.entity';
import { Hashtag } from '../database/entities/hashtag.entity';
import { TweetQueueService } from '../queues/tweet-queue.service';
import { QueueModule } from '../queues/queues.module';
import { TrendingRepository } from '../trending/trending.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Tweet, Hashtag]), QueueModule],
  controllers: [TweetController],
  providers: [
    TweetService,
    TweetRepository,
    TweetQueueService,
    TrendingRepository,
  ],
  exports: [TweetService],
})
export class TweetModule {}
