import { Injectable } from '@nestjs/common';
import { TweetRepository } from './tweet.repository';
import { Tweet as TweetResponse } from '../interfaces/tweet-response.interface';
import { Tweet as TweetEntity } from '../database/entities/tweet.entity';

@Injectable()
export class TweetService {
  constructor(private readonly tweetRepo: TweetRepository) {}

  async createTweet(content: string): Promise<void> {
    await this.tweetRepo.saveTweet(content);
  }

  async createBulkTweets(tweets: Partial<TweetEntity>[]): Promise<void> {
    await this.tweetRepo.saveBulkTweets(tweets);
  }

  async getAllTweets(): Promise<TweetResponse[]> {
    const tweets = await this.tweetRepo.getTweetsWithHashtags();

    // Convert the entity to match the interface
    return tweets.map((tweet: TweetEntity) => ({
      id: tweet.id,
      content: tweet.content,
      createdAt: tweet.createdAt.toISOString(), // Convert Date to string
      hashtags: tweet.hashtags.map((hashtag) => ({
        id: hashtag.id,
        tag: hashtag.tag,
        count: hashtag.count,
        updatedAt: hashtag.updatedAt.toISOString(), // Convert Date to string
      })),
    }));
  }
}
