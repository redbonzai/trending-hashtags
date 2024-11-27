import Redis from 'ioredis';
import { Logger } from '@nestjs/common';
import { TweetRepository } from '../../tweet/tweet.repository';
import { TrendingRepository } from '../../trending/trending.repository';

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
  const redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
  });

  try {
    redisClientSubscriber.subscribe('tweet-created', async (error, count) => {
      if (error) {
        logger.error('Failed to subscribe to tweet-created channel');
      } else {
        logger.log(`Subscribed successfully to ${count} channel(s)`);
        // Step 1: Retrieve all tweets with associated hashtags
        const tweets = await tweetRepository.getTweetsWithHashtags();

        // Step 2: Calculate hashtag cardinality
        const hashtagCounts: { [key: string]: number } = {};
        for (const tweet of tweets) {
          logger.debug('TWEET under aggregation: ', tweet.content);
          for (const hashtag of tweet.hashtags) {
            logger.debug('HASHTAG under aggregation: ', hashtag.tag);
            if (hashtagCounts[hashtag.tag]) {
              hashtagCounts[hashtag.tag]++;
            } else {
              hashtagCounts[hashtag.tag] = 1;
            }
          }
        }

        // Step 3: Update the hashtag counts in PostgreSQL
        logger.debug('Updating hashtag counts in the database...');
        for (const [tag, count] of Object.entries(hashtagCounts)) {
          await trendingRepository.updateHashtagCount(tag, count);
        }

        // Step 4: Update the hashtag counts in Redis
        logger.debug('Updating hashtag counts in Redis...');
        for (const [tag, count] of Object.entries(hashtagCounts)) {
          await redisClient.zadd('trending-hashtags', count, tag);
        }

        logger.debug('Hashtag cardinality calculation completed successfully.');
      }
    });

    logger.log(
      'Hashtag aggregator worker initialized successfully and is waiting for events.',
    );
  } catch (error) {
    logger.error('Failed to initialize the HashtagAggregatorWorker:', error);
  }
}
