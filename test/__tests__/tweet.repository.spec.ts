import { Test, TestingModule } from '@nestjs/testing';
import { TweetRepository } from '@app/tweet/tweet.repository';
import { DataSource, Repository } from 'typeorm';
import { Tweet } from '@app/database/entities/tweet.entity';
import { Hashtag } from '@app/database/entities/hashtag.entity';
import { TrendingRepository } from '@app/trending/trending.repository';

jest.mock('@nestjs/common/services/logger.service'); // Mock logger

describe('TweetRepository', () => {
  let redisClientMock: { get: jest.Mock; set: jest.Mock };
  let tweetRepository: TweetRepository;
  let tweetRepoMock: Repository<Tweet>;
  let hashtagRepoMock: Repository<Hashtag>;
  let trendingRepositoryMock: jest.Mocked<TrendingRepository>;

  beforeEach(async () => {
    // Step 1: Mock Redis client manually
    redisClientMock = {
      get: jest.fn().mockResolvedValue(null), // Assume no duplicate by default
      set: jest.fn().mockResolvedValue('OK'),
    };

    // Step 2: Mock DataSource and Repositories
    const mockDataSource = {
      getRepository: jest.fn(),
    };

    tweetRepoMock = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    } as unknown as Repository<Tweet>;

    hashtagRepoMock = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as Repository<Hashtag>;

    // Step 3: Mock TrendingRepository
    trendingRepositoryMock = {
      incrementHashtags: jest.fn().mockResolvedValue(undefined),
      getTopHashtags: jest.fn().mockResolvedValue([]),
      getTrendingHashtags: jest.fn().mockResolvedValue([]),
      updateTrendingHashtags: jest.fn().mockResolvedValue(undefined),
      getHashtagsUpdatedSince: jest.fn().mockResolvedValue([]),
      updateHashtagCount: jest.fn().mockResolvedValue(undefined),
      getAllHashtagsFromDb: jest.fn().mockResolvedValue([]),
      updateHashtagInRedis: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<TrendingRepository>;

    // Step 4: Set up getRepository to return mocked repositories
    mockDataSource.getRepository.mockReturnValueOnce(tweetRepoMock);
    mockDataSource.getRepository.mockReturnValueOnce(hashtagRepoMock);

    // Step 5: Create Testing Module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TweetRepository,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: TrendingRepository,
          useValue: trendingRepositoryMock,
        },
      ],
    }).compile();

    // Step 6: Inject instances
    tweetRepository = module.get<TweetRepository>(TweetRepository);
    // Inject mocked Redis client into TweetRepository instance
    // unknown prevents TypeScript from throwing type errors while avoiding any.
    //   typeof redisClientMock ensures that the structure matches the expected Redis client, maintaining type safety.
    (
      tweetRepository as unknown as { redisClient: typeof redisClientMock }
    ).redisClient = redisClientMock;
  });

  describe('saveTweet', () => {
    it('should save a tweet and update hashtag counts', async () => {
      const content = 'Hello #world';
      const mockTweet = { id: '1', content, hashtags: [] } as Tweet;

      const mockHashtag = { id: '1', tag: '#world', count: 1 } as Hashtag;

      // Step 1: Mock Redis client to simulate no duplicate
      redisClientMock.get.mockResolvedValue(null);

      // Step 2: Mock Tweet repository methods
      jest.spyOn(tweetRepoMock, 'create').mockReturnValue(mockTweet);
      jest.spyOn(tweetRepoMock, 'save').mockResolvedValue(mockTweet);

      // Step 3: Mock Hashtag repository methods
      jest.spyOn(hashtagRepoMock, 'findOne').mockResolvedValue(null); // Hashtag doesn't exist initially
      jest.spyOn(hashtagRepoMock, 'create').mockReturnValue(mockHashtag);
      jest.spyOn(hashtagRepoMock, 'save').mockResolvedValue(mockHashtag); // Return the created hashtag

      // Execute the method
      await tweetRepository.saveTweet(content);

      // Assertions to check if the methods are called with the expected values
      expect(redisClientMock.get).toHaveBeenCalledWith(expect.any(String)); // Expect the hash of the content to be checked
      expect(tweetRepoMock.create).toHaveBeenCalledWith({
        content,
        hashtags: [mockHashtag],
      });
      expect(tweetRepoMock.save).toHaveBeenCalledWith(mockTweet);
      expect(trendingRepositoryMock.incrementHashtags).toHaveBeenCalledWith([
        '#world',
      ]);
    });
  });

  describe('saveBulkTweets', () => {
    it('should save multiple tweets in bulk', async () => {
      const tweets: Partial<Tweet>[] = [
        { content: 'First tweet' },
        { content: 'Second tweet' },
      ];

      tweetRepoMock.save = jest.fn().mockResolvedValue(tweets);

      await tweetRepository.saveBulkTweets(tweets);

      expect(tweetRepoMock.save).toHaveBeenCalledWith(tweets, { chunk: 100 });
    });
  });

  describe('getTweetsWithHashtags', () => {
    it('should get all tweets with their associated hashtags', async () => {
      const mockTweet = {
        id: '1',
        content: 'Hello #world',
        hashtags: [{ id: '1', tag: '#world', count: 5 }],
      } as Tweet;

      jest.spyOn(tweetRepoMock, 'find').mockResolvedValue([mockTweet]);

      const result = await tweetRepository.getTweetsWithHashtags();

      expect(tweetRepoMock.find).toHaveBeenCalledWith({
        relations: ['hashtags'],
      });
      expect(result).toEqual([mockTweet]);
    });
  });

  describe('extractHashtags', () => {
    it('should extract hashtags from content', () => {
      const content = 'Hello #world, this is #NestJS!';
      const result = tweetRepository['extractHashtags'](content);

      expect(result).toEqual(['#world', '#NestJS']);
    });

    it('should return an empty array if no hashtags are present', () => {
      const content = 'Hello world, this is NestJS!';
      const result = tweetRepository['extractHashtags'](content);

      expect(result).toEqual([]);
    });
  });

  describe('createOrUpdateHashtags', () => {
    it('should create new hashtags if they do not exist', async () => {
      const hashtags = ['#newHashtag'];
      const mockHashtag = { id: '1', tag: '#newHashtag', count: 1 } as Hashtag;

      jest.spyOn(hashtagRepoMock, 'findOne').mockResolvedValue(null);
      jest.spyOn(hashtagRepoMock, 'create').mockReturnValue(mockHashtag);
      jest.spyOn(hashtagRepoMock, 'save').mockResolvedValue(mockHashtag);

      const result = await tweetRepository['createOrUpdateHashtags'](hashtags);

      expect(hashtagRepoMock.findOne).toHaveBeenCalledWith({
        where: { tag: '#newHashtag' },
      });
      expect(hashtagRepoMock.create).toHaveBeenCalledWith({
        tag: '#newHashtag',
        count: 1,
      });
      expect(hashtagRepoMock.save).toHaveBeenCalledWith(mockHashtag);
      expect(result).toEqual([mockHashtag]);
    });

    it('should update the count of existing hashtags', async () => {
      const hashtags = ['#existingHashtag'];
      const mockHashtag = {
        id: '1',
        tag: '#existingHashtag',
        count: 1,
      } as Hashtag;

      jest.spyOn(hashtagRepoMock, 'findOne').mockResolvedValue(mockHashtag);
      jest.spyOn(hashtagRepoMock, 'save').mockResolvedValue({
        ...mockHashtag,
        count: 2,
      });

      const result = await tweetRepository['createOrUpdateHashtags'](hashtags);

      expect(hashtagRepoMock.findOne).toHaveBeenCalledWith({
        where: { tag: '#existingHashtag' },
      });
      expect(mockHashtag.count).toBe(2);
      expect(hashtagRepoMock.save).toHaveBeenCalledWith(mockHashtag);
      expect(result).toEqual([{ ...mockHashtag, count: 2 }]);
    });
  });
});
