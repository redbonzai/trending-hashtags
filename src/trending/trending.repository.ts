import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { DataSource, MoreThanOrEqual, Repository } from 'typeorm';
import { Hashtag } from '../database/entities/hashtag.entity';

@Injectable()
export class TrendingRepository {
  private redisClient: Redis;
  private hashtagRepo: Repository<Hashtag>;

  constructor(private dataSource: DataSource) {
    // Initialize Redis client
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
    });

    // Initialize TypeORM repository for PostgreSQL
    this.hashtagRepo = this.dataSource.getRepository(Hashtag);
  }

  getRedisClient(): Redis {
    return this.redisClient;
  }

  /**
   * Increment the counts of given hashtags.
   * This method updates both Redis and PostgreSQL for durability and quick access.
   */
  async incrementHashtags(hashtags: string[]): Promise<void> {
    for (const tag of hashtags) {
      // Update Redis
      await this.redisClient.zincrby('hashtags', 1, tag);

      // Update PostgreSQL
      let hashtag = await this.hashtagRepo.findOne({ where: { tag } });

      if (hashtag) {
        // Increment count if hashtag exists
        hashtag.count++;
      } else {
        // Create a new hashtag if it doesn't exist
        hashtag = this.hashtagRepo.create({ tag, count: 1 });
      }

      await this.hashtagRepo.save(hashtag);
    }
  }

  /**
   * Get the most popular hashtags overall.
   * This method uses Redis for fast retrieval.
   */
  async getTopHashtags(limit: number = 25): Promise<string[]> {
    // Retrieve the top hashtags by count in descending order from Redis
    return this.redisClient.zrevrange('hashtags', 0, limit - 1);
  }

  /**
   * Get trending hashtags along with their cardinality in descending order.
   */
  async getTrendingHashtags(
    limit: number = 25,
  ): Promise<{ tag: string; count: number }[]> {
    const hashtags = await this.redisClient.zrevrange(
      'trending-hashtags',
      0,
      limit - 1,
      'WITHSCORES',
    );

    // Parse the Redis result into the desired format
    const result = [];
    for (let i = 0; i < hashtags.length; i += 2) {
      const tag = hashtags[i];
      const count = parseInt(hashtags[i + 1], 10);
      result.push({ tag, count });
    }
    return result;
  }

  /**
   * Method to update trending hashtags periodically, run by a background worker.
   * This method uses PostgreSQL data to determine recent trends and updates Redis.
   */
  async updateTrendingHashtags(): Promise<void> {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    // Get hashtags updated within the last hour from PostgreSQL
    const hashtags = await this.hashtagRepo.find({
      where: { updatedAt: MoreThanOrEqual(oneHourAgo) },
    });

    // Update Redis with trending hashtags
    for (const hashtag of hashtags) {
      await this.redisClient.zadd(
        'trending-hashtags',
        hashtag.count,
        hashtag.tag,
      );
    }
  }

  /**
   * Get hashtags updated since a specific time.
   * Used for aggregation purposes.
   */
  async getHashtagsUpdatedSince(since: Date): Promise<Hashtag[]> {
    return this.hashtagRepo.find({
      where: { updatedAt: MoreThanOrEqual(since) },
    });
  }

  /**
   * Update a hashtag's count in Redis.
   */
  async updateHashtagInRedis(tag: string, count: number): Promise<void> {
    await this.redisClient.zadd('trending-hashtags', count, tag);
  }

  /**
   * Update the count of a given hashtag in the PostgreSQL database.
   */
  async updateHashtagCount(tag: string, count: number): Promise<void> {
    let hashtag = await this.hashtagRepo.findOne({ where: { tag } });

    if (hashtag) {
      hashtag.count = count; // Update count
    } else {
      // Create a new hashtag if it doesn't exist
      hashtag = this.hashtagRepo.create({ tag, count });
    }

    await this.hashtagRepo.save(hashtag);
  }

  /**
   * Get all hashtags from PostgreSQL for backup or recovery purposes.
   */
  async getAllHashtagsFromDb(): Promise<Hashtag[]> {
    return this.hashtagRepo.find();
  }
}
