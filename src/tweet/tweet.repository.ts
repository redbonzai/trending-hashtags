import { Injectable, Logger } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { Tweet } from '../database/entities/tweet.entity';
import { Hashtag } from '../database/entities/hashtag.entity';
import { TrendingRepository } from '../trending/trending.repository'; // Import TrendingRepository

@Injectable()
export class TweetRepository {
  private tweetRepo: Repository<Tweet>;
  private hashtagRepo: Repository<Hashtag>;
  private readonly logger = new Logger(TweetRepository.name);

  constructor(
    private dataSource: DataSource,
    private trendingRepository: TrendingRepository, // Inject TrendingRepository
  ) {
    this.tweetRepo = this.dataSource.getRepository(Tweet);
    this.hashtagRepo = this.dataSource.getRepository(Hashtag);
  }

  /**
   * Save a new tweet and associate it with hashtags.
   */
  async saveTweet(content: string): Promise<Tweet> {
    // Extract hashtags from the tweet content
    const hashtags = this.extractHashtags(content);

    // Ensure hashtags exist in the database and fetch their entities
    const hashtagEntities = await this.createOrUpdateHashtags(hashtags);

    // Create and save the tweet with associated hashtags
    const tweet = this.tweetRepo.create({ content, hashtags: hashtagEntities });

    const response = this.tweetRepo.save(tweet);
    this.logger.debug('Tweet Saved with response : ', response);

    // Update hashtag counts in TrendingRepository (Redis + PostgreSQL)
    await this.trendingRepository.incrementHashtags(hashtags);

    return response;
  }

  async saveBulkTweets(tweets: Partial<Tweet>[]): Promise<void> {
    await this.tweetRepo.save(tweets, { chunk: 100 });
  }

  /**
   * Get all tweets with their associated hashtags.
   */
  async getTweetsWithHashtags(): Promise<Tweet[]> {
    return this.tweetRepo.find({ relations: ['hashtags'] });
  }

  /**
   * Extract hashtags from a tweet's content.
   */
  private extractHashtags(content: string): string[] {
    const regex = /#[\w]+/g; // Matches hashtags (e.g., #example)
    return content.match(regex) || [];
  }

  /**
   * Create or update hashtags in the database.
   */
  private async createOrUpdateHashtags(hashtags: string[]): Promise<Hashtag[]> {
    const hashtagEntities: Hashtag[] = [];
    for (const tag of hashtags) {
      let hashtag = await this.hashtagRepo.findOne({ where: { tag } });
      if (!hashtag) {
        hashtag = this.hashtagRepo.create({ tag, count: 1 }); // New hashtag
      } else {
        hashtag.count++; // Increment count for existing hashtag
      }
      hashtagEntities.push(await this.hashtagRepo.save(hashtag));
    }
    return hashtagEntities;
  }
}
