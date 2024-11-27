import Redis from 'ioredis';
import { Logger } from '@nestjs/common';
import { TweetRepository } from '@app/tweet/tweet.repository';
import { TrendingRepository } from '@app/trending/trending.repository';
import { performHashtagAggregation } from '@app/queues/helpers/hashtag-aggregator.helper';

export async function hashtagAggregatorWorker(
  tweetRepository: TweetRepository,
  trendingRepository: TrendingRepository,
) {
  const logger = new Logger('HashtagAggregatorWorker');
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  // Create separate Redis clients for different purposes
  const redisClientSubscriber = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
  });

  try {
    redisClientSubscriber.subscribe('tweet-created', async (error, count) => {
      if (error) {
        logger.error('Failed to subscribe to tweet-created channel');
      } else {
        logger.log(`Subscribed successfully to ${count} channel(s)`);
        await performHashtagAggregation(tweetRepository, trendingRepository);
      }
    });

    logger.log(
      'Hashtag aggregator worker initialized successfully and is waiting for events.',
    );
  } catch (error) {
    logger.error('Failed to initialize the HashtagAggregatorWorker:', error);
  }
}
