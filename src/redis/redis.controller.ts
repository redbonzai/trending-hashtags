import { Controller, Get, Query, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

@Controller('redis')
export class RedisController {
  private readonly logger = new Logger(RedisController.name);
  constructor(private readonly redisService: RedisService) {}

  @Get('set')
  async setValue(
    @Query('key') key: string,
    @Query('value') value: string,
  ): Promise<string> {
    console.log('Setting key:', key, 'to value:', value);
    await this.redisService.setValue(key, value);
    return `Key ${key} set to ${value}`;
  }

  @Get('get')
  async getValue(@Query('key') key: string): Promise<string | null> {
    return await this.redisService.getValue(key);
  }
}
