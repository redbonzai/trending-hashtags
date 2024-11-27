import { Inject, Injectable } from '@nestjs/common';
import { RedisClientType } from 'redis';

@Injectable()
export class RedisService {
  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redisClient: RedisClientType,
  ) {}

  async setValue(key: string, value: string): Promise<void> {
    console.log('redisService: Setting key:', key, 'to value:', value);
    try {
      const response = await this.redisClient.set(key, value);
      console.log('SETTING KEY IN REDIS CLIENT:', response);
    } catch (error) {
      console.error('Error setting key in Redis:', error);
    }
  }

  async getValue(key: string): Promise<string | null> {
    try {
      return await this.redisClient.get(key);
    } catch (error) {
      console.error('Error getting key from Redis:', error);
      return null;
    }
  }
}
