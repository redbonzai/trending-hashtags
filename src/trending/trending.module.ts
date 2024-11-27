import { Module } from '@nestjs/common';
import { TrendingService } from './trending.service';
import { TrendingRepository } from './trending.repository';
import { TrendingController } from './trending.controller';
import { Hashtag } from '../database/entities/hashtag.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tweet } from '../database/entities/tweet.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tweet, Hashtag])],
  providers: [TrendingService, TrendingRepository],
  controllers: [TrendingController],
  exports: [TrendingService],
})
export class TrendingModule {}
