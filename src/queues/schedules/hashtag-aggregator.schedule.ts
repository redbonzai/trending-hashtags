import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TrendingRepository } from '../../trending/trending.repository';

@Injectable()
export class HashtagAggregatorSchedule {
  private readonly logger = new Logger(HashtagAggregatorSchedule.name);

  constructor(private readonly trendingRepository: TrendingRepository) {}

  @Cron('*/10 * * * *') // Runs every 10 minutes
  async aggregateHashtags() {
    this.logger.log('Starting automated hashtag aggregation...');
    await this.aggregateHashtagsCardinality();
    this.logger.log('Hashtag aggregation completed.');
  }

  private async aggregateHashtagsCardinality() {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const hashtags =
      await this.trendingRepository.getHashtagsUpdatedSince(oneHourAgo);

    if (hashtags.length === 0) {
      this.logger.warn('No hashtags found for aggregation.');
      return;
    }

    const hashtagCounts: { [key: string]: number } = {};
    for (const hashtag of hashtags) {
      if (hashtagCounts[hashtag.tag]) {
        hashtagCounts[hashtag.tag] += hashtag.count;
      } else {
        hashtagCounts[hashtag.tag] = hashtag.count;
      }
    }

    // Update Redis
    for (const [tag, count] of Object.entries(hashtagCounts)) {
      await this.trendingRepository.updateHashtagInRedis(tag, count);
    }
  }
}
