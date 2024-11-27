import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TweetGeneratorService } from '../tweet-generator.service';

@Injectable()
export class TweetGeneratorSchedule {
  private readonly logger = new Logger(TweetGeneratorSchedule.name);

  constructor(private readonly tweetGeneratorService: TweetGeneratorService) {}

  @Cron('*/2 * * * *') // Runs every 2 minutes
  async generateBulkTweets() {
    this.logger.log('Starting automated bulk tweet generation...');
    await this.tweetGeneratorService.generateBulkTweets(10);
    this.logger.log('Bulk tweet generation completed.');
  }
}
