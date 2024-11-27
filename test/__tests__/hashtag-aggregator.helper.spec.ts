import 'reflect-metadata';
import Redis from 'ioredis';
import { DataSource, Repository } from 'typeorm';
import { TrendingRepository } from '@app/trending/trending.repository';
import { Hashtag } from '@app/database/entities/hashtag.entity';
import { TweetRepository } from '@app/tweet/tweet.repository';
import { mock } from 'jest-mock-extended';
import { performHashtagAggregation } from '@app/queues/helpers/hashtag-aggregator.helper'; // Jest-mock-extended to simplify mocks

jest.mock('ioredis');

describe('performHashtagAggregation', () => {
  let tweetRepositoryMock: jest.Mocked<TweetRepository>;
  let trendingRepositoryMock: jest.Mocked<TrendingRepository>;
  let mockDataSource: jest.Mocked<DataSource>;
  let redisClientMock: jest.Mocked<Redis>;
  let hashtagRepoMock: jest.Mocked<Repository<Hashtag>>;

  beforeEach(async () => {
    // Step 1: Mock Redis client
    redisClientMock = new Redis() as jest.Mocked<Redis>;
    redisClientMock.zincrby.mockResolvedValue('1');
    redisClientMock.zadd.mockResolvedValue('1');
    redisClientMock.zrevrange.mockResolvedValue([]);

    hashtagRepoMock = mock<Repository<Hashtag>>(); // Initialize using jest-mock-extended
    hashtagRepoMock.findOne.mockResolvedValue(null);
    hashtagRepoMock.save.mockResolvedValue({} as Hashtag);
    hashtagRepoMock.create.mockReturnValue({} as Hashtag);
    hashtagRepoMock.find.mockResolvedValue([]);

    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(hashtagRepoMock),
    } as unknown as jest.Mocked<DataSource>;

    trendingRepositoryMock = new TrendingRepository(
      mockDataSource,
    ) as jest.Mocked<TrendingRepository>;
    tweetRepositoryMock = new TweetRepository(
      mockDataSource,
      trendingRepositoryMock,
    ) as jest.Mocked<TweetRepository>;

    trendingRepositoryMock.getHashtagsUpdatedSince = jest.fn();
    trendingRepositoryMock.updateHashtagCount = jest.fn();
    trendingRepositoryMock.updateHashtagInRedis = jest.fn();

    trendingRepositoryMock['redisClient'] = redisClientMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should warn if no hashtags found for aggregation', async () => {
    trendingRepositoryMock.getHashtagsUpdatedSince.mockResolvedValue([]);
    await performHashtagAggregation(
      tweetRepositoryMock,
      trendingRepositoryMock,
    );
    expect(trendingRepositoryMock.getHashtagsUpdatedSince).toHaveBeenCalled();
  });

  describe('incrementHashtags', () => {
    it('should increment hashtag counts in Redis and PostgreSQL', async () => {
      const hashtags = ['#NestJS', '#TypeScript'];
      const hashtagEntityMock = { tag: '#NestJS', count: 5 } as Hashtag;

      hashtagRepoMock.findOne.mockResolvedValue(hashtagEntityMock);
      hashtagRepoMock.save.mockResolvedValue(hashtagEntityMock);

      await trendingRepositoryMock.incrementHashtags(hashtags);

      expect(redisClientMock.zincrby).toHaveBeenCalledTimes(2);
      expect(redisClientMock.zincrby).toHaveBeenCalledWith(
        'hashtags',
        1,
        '#NestJS',
      );
      expect(redisClientMock.zincrby).toHaveBeenCalledWith(
        'hashtags',
        1,
        '#TypeScript',
      );

      expect(hashtagRepoMock.findOne).toHaveBeenCalledWith({
        where: { tag: '#NestJS' },
      });
      expect(hashtagRepoMock.save).toHaveBeenCalledTimes(2);
    });

    it('should aggregate hashtags successfully if found', async () => {
      const mockHashtags = [
        { tag: '#NestJS', count: 5, updatedAt: new Date() } as Hashtag,
        { tag: '#JavaScript', count: 3, updatedAt: new Date() } as Hashtag,
      ];

      // Mock method responses
      trendingRepositoryMock.getHashtagsUpdatedSince.mockResolvedValue(
        mockHashtags,
      );

      // Call the function being tested
      await performHashtagAggregation(
        tweetRepositoryMock,
        trendingRepositoryMock,
      );

      // Verify the methods were called
      expect(trendingRepositoryMock.updateHashtagCount).toHaveBeenCalledTimes(
        2,
      );
      expect(trendingRepositoryMock.updateHashtagCount).toHaveBeenCalledWith(
        '#NestJS',
        5,
      );
      expect(trendingRepositoryMock.updateHashtagCount).toHaveBeenCalledWith(
        '#JavaScript',
        3,
      );
      expect(trendingRepositoryMock.updateHashtagInRedis).toHaveBeenCalledWith(
        '#NestJS',
        5,
      );
      expect(trendingRepositoryMock.updateHashtagInRedis).toHaveBeenCalledWith(
        '#JavaScript',
        3,
      );
    });
  });
});
