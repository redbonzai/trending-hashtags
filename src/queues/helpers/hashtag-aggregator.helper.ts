import { Logger } from '@nestjs/common';
import { TweetRepository } from '@app/tweet/tweet.repository';
import { TrendingRepository } from '@app/trending/trending.repository';

export async function performHashtagAggregation(
  tweetRepository: TweetRepository,
  trendingRepository: TrendingRepository,
) {
  const logger = new Logger('HashtagAggregatorHelper');

  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  const hashtags = await trendingRepository.getHashtagsUpdatedSince(oneHourAgo);

  if (hashtags.length === 0) {
    logger.warn('No hashtags found for aggregation.');
    return;
  }

  const hashtagCounts: { [key: string]: number } = {};
  for (const hashtag of hashtags) {
    hashtagCounts[hashtag.tag] =
      (hashtagCounts[hashtag.tag] || 0) + hashtag.count;
  }

  // Step 3: Update the hashtag counts in PostgreSQL in parallel using Promise.all
  logger.debug('Updating hashtag counts in the database...');
  const updatePostgresPromises = Object.entries(hashtagCounts).map(
    ([tag, count]) => trendingRepository.updateHashtagCount(tag, count),
  );
  await Promise.all(updatePostgresPromises);

  // Step 4: Update the hashtag counts in Redis in parallel using Promise.all
  logger.debug('Updating hashtag counts in Redis...');
  const updateRedisPromises = Object.entries(hashtagCounts).map(
    ([tag, count]) => trendingRepository.updateHashtagInRedis(tag, count),
  );
  await Promise.all(updateRedisPromises);

  logger.debug('Hashtag cardinality calculation completed successfully.');
}
