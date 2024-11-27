import { Injectable } from '@nestjs/common';
import { TrendingRepository } from './trending.repository';

@Injectable()
export class TrendingService {
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
}
