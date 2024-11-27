import { Controller, Post, Body, Get } from '@nestjs/common';
import { TweetService } from './tweet.service';

@Controller('tweet')
export class TweetController {
  constructor(private readonly tweetService: TweetService) {}

  @Post()
  async createTweet(@Body('tweet') tweetContent: string) {
    try {
      await this.tweetService.createTweet(tweetContent);
      return { message: 'Tweet created successfully' };
    } catch (error) {
      console.error('Error while creating tweet:', error);
      throw error; // Rethrow error for NestJS to handle
    }
  }

  @Get()
  async getTweets() {
    return this.tweetService.getAllTweets();
  }
  // @Get('generate-test-tweet')
  // async generateTestTweet() {
  //   await this.tweetQueueService.addTweetGenerationJob(
  //     'Test tweet content here. #test',
  //   );
  //   return { message: 'Test tweet job added to the queue.' };
  // }

  @Get('healthcheck')
  async healthCheck() {
    return { status: 'healthy', message: 'Tweet service is running!' };
  }
}
