import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { TweetService } from '../../tweet/tweet.service';
import { Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { Tweet } from '../../database/entities/tweet.entity';

export async function tweetGeneratorWorker(tweetService: TweetService) {
  const logger = new Logger('TweetGeneratorWorker');
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null, // Must be null for BullMQ
  });

  try {
    const worker = new Worker(
      'tweet-generation',
      async (job: Job) => {
        try {
          const tweets: Partial<Tweet>[] = [];
          const bulkTweetData = Array.isArray(job.data) ? job.data : [job.data]; // Ensure bulk or single jobs can be processed

          for (const data of bulkTweetData) {
            const { content } = data;
            const tweetId = generateTweetId(content);

            // Use Redis to check for duplicates
            const isDuplicate = await connection.get(tweetId);
            if (isDuplicate) {
              logger.debug(`Skipping already processed tweet: ${content}`);
              continue;
            }

            tweets.push({
              content,
            });

            // Mark tweet as processed in Redis (this is optional, could be removed if processing is handled as bulk)
            await connection.set(tweetId, 'processed', 'EX', 86400);
          }

          // If there are any new tweets to save, save them in bulk
          if (tweets.length > 0) {
            logger.debug('Creating bulk tweets in database...');
            await tweetService.createBulkTweets(tweets);
            // Publish an event to notify listeners that a tweet has been created
            connection.publish('tweet-created', JSON.stringify({ tweets }));
          }

          logger.debug('Bulk tweet processing completed successfully.');
        } catch (error) {
          logger.error(`Error processing bulk tweets: ${error.message}`);
          throw error; // Allow BullMQ to handle retries
        }
      },
      {
        connection: connection,
        concurrency: 20, // Increase concurrency for better bulk processing
        autorun: true,
        removeOnComplete: {
          age: 3600,
          count: 100,
        },
      },
    );

    worker.on('active', (job) => {
      logger.debug(`Job ${job.id} is now active!`);
    });

    worker.on('completed', (job) => {
      logger.debug(`Job ${job.id} has completed!`);
    });

    worker.on('failed', (job, err) => {
      logger.error(`Job ${job?.id} has failed with error: ${err.message}`);
    });

    worker.on('ready', () => {
      logger.log('Worker is ready and polling for jobs.');
    });

    worker.on('closing', () => {
      logger.log(
        'Worker is closing. Attempting to complete in-progress jobs...',
      );
    });

    connection.on('connect', () => {
      logger.log('Worker successfully connected to Redis.');
    });

    connection.on('error', (err) => {
      logger.error('Redis Error:', err.message);
    });

    logger.log('Tweet generation worker initialized successfully.');
    await worker.run();
  } catch (error) {
    logger.error('Failed to initialize the TweetGeneratorWorker:', error);
  }
}

function generateTweetId(content: string): string {
  return createHash('sha256')
    .update(content.trim().toLowerCase())
    .digest('hex');
}
