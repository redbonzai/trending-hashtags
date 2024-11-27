import { Injectable, Logger } from '@nestjs/common';
import { TrendingRepository } from './trending.repository';

@Injectable()
export class TrendingService {
  readonly logger = new Logger(TrendingService.name);
  constructor(private readonly trendingRepository: TrendingRepository) {}

  async updateHashtags(tweet: string): Promise<void> {
    const hashtags = this.extractHashtags(tweet);
    await this.trendingRepository.incrementHashtags(hashtags);
  }

  async getTopHashtags(limit: number = 25): Promise<string[]> {
    return this.trendingRepository.getTopHashtags(limit);
  }

  async getTrendingHashtags(
    limit: number = 25,
  ): Promise<{ tag: string; count: number }[]> {
    return this.trendingRepository.getTrendingHashtags(limit);
  }

  private extractHashtags(tweet: string): string[] {
    const regex = /#[\w]+/g;
    return tweet.match(regex) || [];
  }

  async warmUpRedisCache() {
    const redisClient = this.trendingRepository.getRedisClient();

    try {
      this.logger.log('Warming up Redis cache...');
      const pipeline = redisClient.pipeline();
      const trendingHashtags =
        await this.trendingRepository.getAllHashtagsFromDb();

      for (const hashtag of trendingHashtags) {
        pipeline.zadd('trending-hashtags', hashtag.count, hashtag.tag);
      }

      await pipeline.exec();
      this.logger.log('Redis cache warmed up successfully.');
    } catch (error) {
      this.logger.error('Error warming up Redis cache:', error.message);
    }
  }
}
