import { Injectable, Logger } from '@nestjs/common';
import { TweetQueueService } from './tweet-queue.service';
import { faker } from '@faker-js/faker';
import { Tweet } from '../database/entities/tweet.entity';

@Injectable()
export class TweetGeneratorService {
  private readonly logger = new Logger(TweetGeneratorService.name);
  constructor(private readonly tweetQueueService: TweetQueueService) {}

  async generateBulkTweets(count: number) {
    const tweets: Partial<Tweet>[] = [];

    for (let i = 0; i < count; i++) {
      console.log('Generating tweet', i + 1);
      const tweetContent = this.generateRandomTweet();
      tweets.push({
        content: tweetContent,
      });

      this.logger.log('Random Tweet Content: ', tweetContent);
    }

    await this.tweetQueueService.addBulkTweetGenerationJobs(tweets);
  }

  private generateRandomTweet(): string {
    // Generate multiple random hashtags
    const hashtagCount = faker.number.int({ min: 1, max: 3 }); // Choose between 1 and 3 hashtags for each tweet
    const hashtags = Array.from({ length: hashtagCount }).map(() =>
      this.generateRandomHashtag(),
    );

    const action = faker.hacker.verb();
    const noun = faker.hacker.noun();
    const phrase = faker.company.catchPhrase();

    // Construct a fake tweet
    return `${faker.internet.displayName()} is ${action} ${noun}. ${phrase} ${hashtags.join(' ')}`;
  }

  private generateRandomHashtag(): string {
    // Generate a random hashtag with a realistic tag format
    return `#${faker.word.noun()}${faker.number.int({ min: 0, max: 999 })}`; // Random hashtag like #developer123
  }
}
