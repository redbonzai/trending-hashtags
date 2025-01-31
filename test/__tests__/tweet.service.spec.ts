import { Test, TestingModule } from '@nestjs/testing';
import { TweetService } from '@app/tweet/tweet.service';
import { TweetRepository } from '@app/tweet/tweet.repository';
import { Tweet as TweetEntity } from '../../src/database/entities/tweet.entity';
import { TweetResponse } from '@app/interfaces/tweet-response.interface';
import { TrendingRepository } from '@app/trending/trending.repository';

// const mockTweetRepository = {
//   saveTweet: jest.fn(),
//   saveBulkTweets: jest.fn(),
//   getTweetsWithHashtags: jest.fn(),
// };

describe('TweetService', () => {
  let service: TweetService;
  let tweetRepo: jest.Mocked<TweetRepository>;

  const mockTweetsWithHashtags: TweetEntity[] = [
    {
      id: '1',
      content: 'Hello #world',
      createdAt: new Date(),
      hashtags: [
        {
          id: '1',
          tag: '#world',
          count: 5,
          updatedAt: new Date(),
          tweets: [],
        },
      ],
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TweetService,
        {
          provide: TweetRepository,
          useValue: {
            saveTweet: jest.fn(),
            saveBulkTweets: jest.fn(),
            getTweetsWithHashtags: jest.fn(), // Properly mock the function
          },
        },
        {
          provide: TrendingRepository,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<TweetService>(TweetService);
    tweetRepo = module.get(TweetRepository);
  });

  describe('createTweet', () => {
    it('should call saveTweet on the repository', async () => {
      const content = 'Test tweet content';
      await service.createTweet(content);
      expect(tweetRepo.saveTweet).toHaveBeenCalledWith(content);
    });
  });

  describe('createBulkTweets', () => {
    it('should call saveBulkTweets on the repository', async () => {
      const tweets: Partial<TweetEntity>[] = [
        { content: 'Bulk tweet 1' },
        { content: 'Bulk tweet 2' },
      ];
      await service.createBulkTweets(tweets);
      expect(tweetRepo.saveBulkTweets).toHaveBeenCalledWith(tweets);
    });
  });

  describe('getAllTweets', () => {
    it('should return all tweets with their hashtags', async () => {
      tweetRepo.getTweetsWithHashtags.mockResolvedValue(mockTweetsWithHashtags);

      const result: TweetResponse[] = await service.getAllTweets();

      expect(result).toEqual([
        {
          id: '1',
          content: 'Hello #world',
          createdAt: mockTweetsWithHashtags[0].createdAt.toISOString(),
          hashtags: [
            {
              id: '1',
              tag: '#world',
              count: 5,
              updatedAt:
                mockTweetsWithHashtags[0].hashtags[0].updatedAt.toISOString(),
            },
          ],
        },
      ]);
    });
  });
});
