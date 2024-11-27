import { Controller, Get, Logger } from '@nestjs/common';
import { TrendingService } from './trending.service';

@Controller('trending-hashtags')
export class TrendingController {
  readonly logger = new Logger(TrendingController.name);
  constructor(private readonly trendingService: TrendingService) {}

  @Get()
  async getTrendingHashtags() {
    this.logger.log('Fetching trending hashtags');
    return this.trendingService.getTrendingHashtags();
  }
}
