import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { TweetQueueService } from './tweet-queue.service';
import { TweetGeneratorService } from './tweet-generator.service';
import { tweetGeneratorWorker } from './workers/tweet-generator.worker';
import { TweetService } from '../tweet/tweet.service';
import { TweetRepository } from '../tweet/tweet.repository';
import { TrendingRepository } from '../trending/trending.repository';
import { QueueEventsService } from './queue-event.service';
import { HashtagAggregatorSchedule } from './schedules/hashtag-aggregator.schedule';
import { TweetGeneratorSchedule } from './schedules/tweet-generator.schedule';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [
    TweetService,
    TweetRepository,
    TrendingRepository,
    TweetQueueService,
    TweetGeneratorService,
    TweetGeneratorSchedule,
    HashtagAggregatorSchedule,
    QueueEventsService,
    {
      provide: 'TWEET_GENERATION_QUEUE',
      useFactory: (configService: ConfigService) => {
        const redisUrl =
          configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
        const connection = new Redis(redisUrl);
        return new Queue('tweet-generation', {
          connection: connection,
        });
      },
      inject: [ConfigService],
    },
    {
      provide: 'HASHTAG_AGGREGATION_QUEUE',
      useFactory: (configService: ConfigService) => {
        const redisUrl =
          configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
        const connection = new Redis(redisUrl);
        return new Queue('hashtag-aggregation', {
          connection: connection,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [
    'TWEET_GENERATION_QUEUE',
    'HASHTAG_AGGREGATION_QUEUE',
    TweetQueueService,
  ],
})
export class QueueModule {
  private readonly logger = new Logger(QueueModule.name);

  constructor(
    private readonly tweetService: TweetService,
    private readonly tweetGeneratorService: TweetGeneratorService,
  ) {}

  async initQueue() {
    this.logger.log('Initializing the queue...');

    try {
      // Initialize worker
      this.logger.log('Starting tweetGeneratorWorker...');
      await tweetGeneratorWorker(this.tweetService);
      this.logger.log('tweetGeneratorWorker started successfully.');

      // Generate bulk tweets
      this.logger.log('Generating bulk tweets...');
      await this.tweetGeneratorService.generateBulkTweets(4);
      this.logger.log('Bulk tweets generation completed successfully.');
    } catch (error) {
      this.logger.error('Failed to initialize the Queue:', error);
    }
  }
}
