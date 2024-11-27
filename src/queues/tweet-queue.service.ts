import { Inject, Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { Tweet } from '../database/entities/tweet.entity';

@Injectable()
export class TweetQueueService {
  private readonly logger = new Logger(TweetQueueService.name);

  constructor(
    @Inject('TWEET_GENERATION_QUEUE')
    private readonly tweetQueue: Queue,
  ) {}

  async addTweetGenerationJob(tweetContent: string) {
    this.logger.log('Adding tweet generation job to the queue: ', tweetContent);

    try {
      // Add retry options and log on add
      await this.tweetQueue.add(
        'tweet-generation',
        { content: tweetContent },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000, // Retry delay in ms
          },
        },
      );
      this.logger.log('Tweet generation job added successfully.');
      // Debugging: Check current jobs in the queue
      const jobs = await this.tweetQueue.getJobs([
        'waiting',
        'active',
        'completed',
        'failed',
      ]);
      this.logger.debug('Current Jobs in Queue:', JSON.stringify(jobs));
    } catch (error) {
      this.logger.error(
        'Failed to add tweet generation job to the queue:',
        error,
      );
    }
  }

  async addBulkTweetGenerationJobs(tweets: Partial<Tweet>[]): Promise<void> {
    this.logger.log(
      `Adding ${tweets.length} bulk tweet generation jobs to the queue.`,
    );

    try {
      const jobs = tweets.map((tweet, index) => ({
        name: `tweet-generation-${index}`,
        data: { content: tweet.content },
        options: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      }));

      // Add multiple jobs to the queue at once
      await this.tweetQueue.addBulk(jobs);
      this.logger.log('Bulk tweet generation jobs added successfully.');
    } catch (error) {
      this.logger.error(
        'Failed to add bulk tweet generation jobs to the queue:',
        error,
      );
    }
  }
}
