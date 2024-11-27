import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import Redis from 'ioredis';
import { DataSource, Repository, MoreThanOrEqual } from 'typeorm';
import { TrendingRepository } from '@app/trending/trending.repository';
import { Hashtag } from '@app/database/entities/hashtag.entity';
import { mock } from 'jest-mock-extended';

jest.mock('ioredis');

describe('TrendingRepository', () => {
  let trendingRepository: TrendingRepository;
  let redisClientMock: jest.Mocked<Redis>;
  let hashtagRepoMock: jest.Mocked<Repository<Hashtag>>;
  let mockDataSource: DataSource;

  beforeEach(async () => {
    // Mock Redis client
    redisClientMock = new Redis() as jest.Mocked<Redis>;
    redisClientMock.zincrby.mockResolvedValue('1');
    redisClientMock.zadd.mockResolvedValue('1');
    redisClientMock.zrevrange.mockResolvedValue([]);

    // Use jest-mock-extended to create a mock of TypeORM repository
    hashtagRepoMock = mock<Repository<Hashtag>>();

    // Mock DataSource
    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(hashtagRepoMock),
    } as unknown as DataSource;

    // Create the testing module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrendingRepository,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    trendingRepository = module.get<TrendingRepository>(TrendingRepository);
    trendingRepository['redisClient'] = redisClientMock; // Inject mocked Redis client
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('incrementHashtags', () => {
    it('should increment hashtag counts in Redis and PostgreSQL', async () => {
      const hashtags = ['#NestJS', '#TypeScript'];
      const hashtagEntityMock = { tag: '#NestJS', count: 5 } as Hashtag;

      hashtagRepoMock.findOne.mockResolvedValue(hashtagEntityMock);
      hashtagRepoMock.save.mockResolvedValue(hashtagEntityMock);

      await trendingRepository.incrementHashtags(hashtags);

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
  });

  describe('getTopHashtags', () => {
    it('should retrieve top hashtags from Redis', async () => {
      redisClientMock.zrevrange.mockResolvedValue(['#NestJS', '#JavaScript']);

      const result = await trendingRepository.getTopHashtags(5);

      expect(redisClientMock.zrevrange).toHaveBeenCalledWith('hashtags', 0, 4);
      expect(result).toEqual(['#NestJS', '#JavaScript']);
    });
  });

  describe('getTrendingHashtags', () => {
    it('should return trending hashtags with their counts', async () => {
      redisClientMock.zrevrange.mockResolvedValue([
        '#NestJS',
        '5',
        '#JavaScript',
        '3',
      ]);

      const result = await trendingRepository.getTrendingHashtags(2);

      expect(redisClientMock.zrevrange).toHaveBeenCalledWith(
        'trending-hashtags',
        0,
        1,
        'WITHSCORES',
      );
      expect(result).toEqual([
        { tag: '#NestJS', count: 5 },
        { tag: '#JavaScript', count: 3 },
      ]);
    });
  });

  describe('updateTrendingHashtags', () => {
    it('should update trending hashtags in Redis from PostgreSQL data', async () => {
      const hashtagEntity = {
        tag: '#NestJS',
        count: 5,
        updatedAt: new Date(),
      } as Hashtag;

      hashtagRepoMock.find.mockResolvedValue([hashtagEntity]);

      await trendingRepository.updateTrendingHashtags();

      expect(hashtagRepoMock.find).toHaveBeenCalled();
      expect(redisClientMock.zadd).toHaveBeenCalledWith(
        'trending-hashtags',
        5,
        '#NestJS',
      );
    });
  });

  describe('getHashtagsUpdatedSince', () => {
    it('should get hashtags updated since a specific date', async () => {
      const since = new Date();
      const hashtagEntity = {
        tag: '#NestJS',
        count: 5,
        updatedAt: since,
      } as Hashtag;

      hashtagRepoMock.find.mockResolvedValue([hashtagEntity]);

      const result = await trendingRepository.getHashtagsUpdatedSince(since);

      expect(hashtagRepoMock.find).toHaveBeenCalledWith({
        where: { updatedAt: MoreThanOrEqual(since) },
      });
      expect(result).toEqual([hashtagEntity]);
    });
  });

  describe('updateHashtagInRedis', () => {
    it('should update hashtag count in Redis', async () => {
      await trendingRepository.updateHashtagInRedis('#NestJS', 10);

      expect(redisClientMock.zadd).toHaveBeenCalledWith(
        'trending-hashtags',
        10,
        '#NestJS',
      );
    });
  });

  describe('updateHashtagCount', () => {
    it('should update the count of a given hashtag in PostgreSQL', async () => {
      const hashtagEntity = { tag: '#NestJS', count: 5 } as Hashtag;

      hashtagRepoMock.findOne.mockResolvedValue(hashtagEntity);
      hashtagRepoMock.save.mockResolvedValue(hashtagEntity);

      await trendingRepository.updateHashtagCount('#NestJS', 10);

      expect(hashtagRepoMock.findOne).toHaveBeenCalledWith({
        where: { tag: '#NestJS' },
      });
      expect(hashtagEntity.count).toEqual(10);
      expect(hashtagRepoMock.save).toHaveBeenCalledWith(hashtagEntity);
    });

    it('should create a new hashtag if it does not exist', async () => {
      hashtagRepoMock.findOne.mockResolvedValue(null);
      const hashtagEntity = { tag: '#NestJS', count: 10 } as Hashtag;

      hashtagRepoMock.create.mockReturnValue(hashtagEntity);
      hashtagRepoMock.save.mockResolvedValue(hashtagEntity);

      await trendingRepository.updateHashtagCount('#NestJS', 10);

      expect(hashtagRepoMock.findOne).toHaveBeenCalledWith({
        where: { tag: '#NestJS' },
      });
      expect(hashtagRepoMock.create).toHaveBeenCalledWith({
        tag: '#NestJS',
        count: 10,
      });
      expect(hashtagRepoMock.save).toHaveBeenCalledWith(hashtagEntity);
    });
  });

  describe('getAllHashtagsFromDb', () => {
    it('should return all hashtags from PostgreSQL', async () => {
      const hashtagEntity = {
        tag: '#NestJS',
        count: 5,
        updatedAt: new Date(),
      } as Hashtag;

      hashtagRepoMock.find.mockResolvedValue([hashtagEntity]);

      const result = await trendingRepository.getAllHashtagsFromDb();

      expect(hashtagRepoMock.find).toHaveBeenCalled();
      expect(result).toEqual([hashtagEntity]);
    });
  });
});
