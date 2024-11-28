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
    maxRetriesPerRequest: null,
  });

  try {
    logger.log('Attempting to initialize TweetGeneratorWorker...');

    const worker = new Worker(
      'tweet-generation',
      async (job: Job) => {
        try {
          const tweets: Partial<Tweet>[] = [];
          const bulkTweetData = Array.isArray(job.data) ? job.data : [job.data];

          logger.debug(
            `Processing job with data: ${JSON.stringify(bulkTweetData)}`,
          );

          for (const data of bulkTweetData) {
            const { content } = data;
            const tweetId = generateTweetId(content);

            // Use Redis to check for duplicates
            const isDuplicate = await connection.get(tweetId);
            if (isDuplicate) {
              logger.debug(`Skipping already processed tweet: ${content}`);
              continue;
            }

            tweets.push({ content });

            // Mark tweet as processed in Redis
            await connection.set(tweetId, 'processed', 'EX', 86400);
          }

          if (tweets.length > 0) {
            logger.debug('Creating bulk tweets in database...');
            await tweetService.createBulkTweets(tweets);
            connection.publish('tweet-created', JSON.stringify({ tweets }));
          }

          logger.debug('Bulk tweet processing completed successfully.');
        } catch (error) {
          logger.error(`Error processing bulk tweets: ${error.message}`);
          if (error.stack) {
            logger.error(error.stack);
          }
          throw error;
        }
      },
      {
        connection: connection,
        concurrency: 20,
        autorun: true,
        removeOnComplete: {
          age: 3600,
          count: 100,
        },
      },
    );

    worker.on('ready', () => {
      logger.log('Worker is ready and polling for jobs.');
    });

    worker.on('error', (err) => {
      logger.error(`Worker initialization failed: ${err.message}`);
      if (err.stack) {
        logger.error(err.stack);
      }
    });

    logger.log('Tweet generation worker initialized successfully.');
  } catch (error) {
    logger.error(
      `Failed to initialize the TweetGeneratorWorker: ${error.message}`,
    );
    if (error.stack) {
      logger.error(error.stack);
    }
  }
}

function generateTweetId(content: string): string {
  return createHash('sha256')
    .update(content.trim().toLowerCase())
    .digest('hex');
}
