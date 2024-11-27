import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { performHashtagAggregation } from '@app/queues/helpers/hashtag-aggregator.helper';
import { TrendingRepository } from '@app/trending/trending.repository';
import { TweetRepository } from '@app/tweet/tweet.repository';

@Injectable()
export class HashtagAggregatorSchedule {
  private readonly logger = new Logger(HashtagAggregatorSchedule.name);

  constructor(
    private readonly tweetRepository: TweetRepository,
    private readonly trendingRepository: TrendingRepository,
  ) {}

  @Cron('*/2 * * * *') // Runs every 10 minutes
  async aggregateHashtags() {
    this.logger.log('Starting automated hashtag aggregation...');
    await performHashtagAggregation(
      this.tweetRepository,
      this.trendingRepository,
    );

    this.logger.log('Hashtag aggregation completed.');
  }
}
