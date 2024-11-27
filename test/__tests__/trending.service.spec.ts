import { Test, TestingModule } from '@nestjs/testing';
import { TrendingService } from '@app/trending/trending.service';
import { TrendingRepository } from '@app/trending/trending.repository';

describe('TrendingService', () => {
  let service: TrendingService;
  let trendingRepositoryMock: jest.Mocked<TrendingRepository>;

  beforeEach(async () => {
    // Create a mock of the TrendingRepository
    trendingRepositoryMock = {
      incrementHashtags: jest.fn().mockResolvedValue(undefined),
      getTopHashtags: jest.fn().mockResolvedValue(['#example', '#test']),
      getTrendingHashtags: jest.fn().mockResolvedValue([
        { tag: '#example', count: 10 },
        { tag: '#test', count: 5 },
      ]),
      updateTrendingHashtags: jest.fn().mockResolvedValue(undefined),
      getHashtagsUpdatedSince: jest.fn().mockResolvedValue([]),
      updateHashtagCount: jest.fn().mockResolvedValue(undefined),
      getAllHashtagsFromDb: jest.fn().mockResolvedValue([]),
      updateHashtagInRedis: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<TrendingRepository>;

    // Create the testing module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrendingService,
        { provide: TrendingRepository, useValue: trendingRepositoryMock },
      ],
    }).compile();

    service = module.get<TrendingService>(TrendingService);
  });

  describe('updateHashtags', () => {
    it('should call incrementHashtags on TrendingRepository with extracted hashtags', async () => {
      const tweet = 'Hello #world #NestJS';
      await service.updateHashtags(tweet);

      expect(trendingRepositoryMock.incrementHashtags).toHaveBeenCalledWith([
        '#world',
        '#NestJS',
      ]);
    });

    it('should handle tweets without hashtags', async () => {
      const tweet = 'Hello world';
      await service.updateHashtags(tweet);

      expect(trendingRepositoryMock.incrementHashtags).toHaveBeenCalledWith([]);
    });
  });

  describe('getTopHashtags', () => {
    it('should return top hashtags', async () => {
      const limit = 2;
      const result = await service.getTopHashtags(limit);

      expect(trendingRepositoryMock.getTopHashtags).toHaveBeenCalledWith(limit);
      expect(result).toEqual(['#example', '#test']);
    });

    it('should use the default limit of 25 if no limit is provided', async () => {
      await service.getTopHashtags();

      expect(trendingRepositoryMock.getTopHashtags).toHaveBeenCalledWith(25);
    });
  });

  describe('getTrendingHashtags', () => {
    it('should return trending hashtags with their counts', async () => {
      const limit = 2;
      const result = await service.getTrendingHashtags(limit);

      expect(trendingRepositoryMock.getTrendingHashtags).toHaveBeenCalledWith(
        limit,
      );
      expect(result).toEqual([
        { tag: '#example', count: 10 },
        { tag: '#test', count: 5 },
      ]);
    });

    it('should use the default limit of 25 if no limit is provided', async () => {
      await service.getTrendingHashtags();

      expect(trendingRepositoryMock.getTrendingHashtags).toHaveBeenCalledWith(
        25,
      );
    });
  });

  describe('extractHashtags (indirectly tested)', () => {
    it('should extract hashtags from tweet', async () => {
      const tweet = 'Check out #NestJS and #JavaScript';
      await service.updateHashtags(tweet);

      expect(trendingRepositoryMock.incrementHashtags).toHaveBeenCalledWith([
        '#NestJS',
        '#JavaScript',
      ]);
    });

    it('should return an empty array if no hashtags are found', async () => {
      const tweet = 'No hashtags here!';
      await service.updateHashtags(tweet);

      expect(trendingRepositoryMock.incrementHashtags).toHaveBeenCalledWith([]);
    });
  });
});
