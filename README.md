# Trending Hashtags App

## 1. Overview

The Trending Hashtags App allows users to create tweets and determine the most trending hashtags. It is built with NestJS and uses Redis for fast data retrieval and PostgreSQL for persistence. The application is designed to handle a load of up to 1 request per second and aims to support significantly higher loads. Tweets and hashtags are managed through RESTful API endpoints, and hashtag cardinality is calculated regularly to keep trending information updated.

## 2. User Guide

The application exposes the following endpoints:

### Create Tweet
- **POST** `/tweet`

  Payload:
  ```json
  {
      "tweet": "<tweet>"
  }
  ```

### Trending Hashtags
- **GET** `/trending-hashtags`

  Response:
  ```json
  {
      "hashtags": [
          {"tag": "<hashtag1>", "count": <count1>},
          {"tag": "<hashtag2>", "count": <count2>},
          "...",
          {"tag": "<hashtag25>", "count": <count25>}
      ]
  }
  ```

  This endpoint returns the top 25 trending hashtags along with their cardinality, sorted in descending order.

## 3. Prerequisites

- **Node.js** (v16 or above)
- **Docker** and **Docker Compose**
- **Redis** and **PostgreSQL** containers are required for the application to work correctly.

## 4. Developer Guide

### 4.1 Setup and Configuration

1. **Clone the repository**:
   ```sh
   git clone <repository_url>
   cd trending-hashtags-app
   ```

2. **Install dependencies**:
   ```sh
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Ensure Docker Desktop is installed**. Then run:
   ```sh
   docker compose up --build
   ```
   This command will build the containers and start the application along with the necessary services.

4. **Environment Variables**:
   Update the `.env` file with the following environment variables:

   | Variable         | Description                           | Example                |
      |------------------|---------------------------------------|------------------------|
   | `REDIS_URL`      | Redis connection string               | `redis://localhost:6379`|
   | `DATABASE_URL`   | PostgreSQL connection string          | `postgres://user:pass@localhost:5432/db` |
   | `NODE_ENV`       | Environment type (development/production) | `development`      |
   | `PORT`           | Port on which the application runs    | `8080`                 |

### 4.2 Testing

- **Run Unit Tests**:
  ```sh
  npm run test
  ```

- **Run Performance Tests**:
  Reference the [PerformanceTesting.md](./PerformanceTesting.md) file for details on running performance tests with `wrk`. This file explains how to benchmark the application, covering different load scenarios.

  Here's a simple load test using `wrk`:
  ```sh
  wrk -t10 -c200 -d30s -s post.lua http://localhost:8080/tweet
  ```
  For more comprehensive performance tests, including longer durations and various scenarios, see the detailed documentation.

### 4.3 Chain of Events when Application Loads

- **When a Tweet is Created**:
    1. The tweet is processed by `tweet-generator.worker.ts`.
    2. Hashtags are extracted and stored in PostgreSQL, while counts are updated in Redis for quick access.
    3. Hashtag counts are periodically aggregated by `hashtag-aggregator.worker.ts` to ensure trending information is up-to-date.

## 5. Automated Background Processes

The application runs several automated background processes to keep hashtag information updated and optimized for performance. Below are the details:

### 5.1 Bulk Tweet Generation

A scheduled task is set up to generate bulk tweets every 10 minutes:

- **Cron Schedule** (`tweet-generator.schedule.ts`):
  ```typescript
  import { Injectable, Logger } from '@nestjs/common';
  import { Cron } from '@nestjs/schedule';
  import { TweetGeneratorService } from './tweet-generator.service';

  @Injectable()
  export class TweetGeneratorSchedule {
    private readonly logger = new Logger(TweetGeneratorSchedule.name);

    constructor(private readonly tweetGeneratorService: TweetGeneratorService) {}

    @Cron('*/10 * * * *') // Runs every 10 minutes
    async generateBulkTweets() {
      this.logger.log('Starting bulk tweet generation...');
      await this.tweetGeneratorService.generateBulkTweets(4);
      this.logger.log('Bulk tweets generation completed.');
    }
  }
  ```

This automated process uses the `TweetGeneratorService` to generate tweets at regular intervals to test the trending hashtag feature.

### 5.2 Hashtag Aggregation

The system aggregates hashtag cardinality every 10 minutes to ensure trending data is up-to-date:

- **Cron Schedule** (`hashtag-aggregator.schedule.ts`):
  ```typescript
  import { Injectable, Logger } from '@nestjs/common';
  import { Cron } from '@nestjs/schedule';
  import { TrendingRepository } from '../../trending/trending.repository';

  @Injectable()
  export class HashtagAggregatorSchedule {
    private readonly logger = new Logger(HashtagAggregatorSchedule.name);

    constructor(private readonly trendingRepository: TrendingRepository) {}

    @Cron('*/10 * * * *') // Runs every 10 minutes
    async aggregateHashtags() {
      this.logger.log('Starting automated hashtag aggregation...');
      await this.trendingRepository.updateTrendingHashtags();
      this.logger.log('Hashtag aggregation completed.');
    }
  }
  ```

This task is responsible for updating the hashtag counts in both PostgreSQL and Redis.

## 6. API Specifications and Technical Details

### API Endpoints

1. **POST /tweet**: Creates a new tweet with the given content.
    - Expected load: Up to 1 request per second.
    - To handle higher loads, use Redis to cache data and workers to process incoming requests.

2. **GET /trending-hashtags**: Retrieves trending hashtags with their cardinality in descending order.
    - Bonus: The trending data is cached in Redis for faster access, and updates are processed asynchronously to support high cardinality.

### Handling Duplicate Tweets

- Duplicate tweets are identified and filtered out to avoid processing the same tweet multiple times. This helps in saving resources and improving the accuracy of hashtag trends.

### Durability

- Data is stored in both Redis and PostgreSQL, ensuring durability. On service restart, data is reloaded from PostgreSQL, while Redis serves as a high-performance cache.

## 7. Conclusion

This application is designed to handle the requirements outlined in the prompt, providing a scalable and durable solution for managing trending hashtags based on tweet activity. The automated processes running in the background ensure the system remains performant and that data is consistently updated.

For further questions or additional documentation, refer to the included files or contact the repository maintainer.

