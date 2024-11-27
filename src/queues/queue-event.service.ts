import { Queue, QueueEvents } from 'bullmq';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { hashtagAggregatorWorker } from './workers/hashtag-aggregator.worker';
import { TweetRepository } from '../tweet/tweet.repository';
import { TrendingRepository } from '../trending/trending.repository';
import Redis from 'ioredis';

@Injectable()
export class QueueEventsService {
  private readonly logger = new Logger(QueueEventsService.name);
  private queueEvents: QueueEvents;

  constructor(
    @Inject('TWEET_GENERATION_QUEUE') private readonly tweetQueue: Queue,
    @Inject('HASHTAG_AGGREGATION_QUEUE')
    private readonly aggregationQueue: Queue,
    private readonly tweetRepo: TweetRepository,
    private readonly trendRepo: TrendingRepository,
  ) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const connection = new Redis(redisUrl, {
      maxRetriesPerRequest: null, // Must be null for BullMQ
    });

    // Create QueueEvents instance for the queue
    this.queueEvents = new QueueEvents('tweet-generation', {
      connection: connection,
    });
    this.initialize();
  }

  private initialize(): void {
    this.queueEvents.on('completed', async ({ jobId, returnvalue }) => {
      this.logger.log(`Job ${jobId} has been completed successfully.`);
      this.logger.log(`Job return value: ${returnvalue}.`);

      const waitingCount = await this.tweetQueue.getWaitingCount();
      const activeCount = await this.tweetQueue.getActiveCount();
      const delayedCount = await this.tweetQueue.getDelayedCount();

      if (waitingCount === 0 && activeCount === 0 && delayedCount === 0) {
        this.logger.log(
          'All jobs processed. Triggering hashtagAggregatorWorker...',
        );
        // Enqueue a job to the hashtag-aggregation queue
        await this.aggregationQueue.add('aggregateHashtags', {});
        await hashtagAggregatorWorker(this.tweetRepo, this.trendRepo);
      }
    });

    this.queueEvents.on('failed', ({ jobId, failedReason }) => {
      this.logger.error(`Job ${jobId} failed with reason: ${failedReason}`);
    });

    this.queueEvents.on('progress', ({ jobId, data }) => {
      this.logger.debug(
        `Job ${jobId} progress update: ${JSON.stringify(data)}`,
      );
    });

    this.queueEvents.on('error', (error) => {
      this.logger.error(`QueueEvents Error: ${error.message}`);
    });
  }
}
