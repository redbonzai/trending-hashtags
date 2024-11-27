# Trending Hashtags App

- [Overview](#1-overview)
- [User Guide](#2-user-guide)
- [Prerequisites](#3-prerequisites)
- [Developer Guide](#4-developer-guide)
  - [Setup and Configuration](#41-setup-and-configuration)
  - [Testing](#42-testing)
  - [Chain of Events when Application Loads](#43-chain-of-events-when-application-loads)
  - [Automated Background Processes](#5-automated-background-processes)
    - [Bulk Tweet Generation](#51-bulk-tweet-generation)
    - [Hashtag Aggregation](#52-hashtag-aggregation)
  - [API Specifications and Acceptance Criteria](#6-api-specifications-and-acceptance-criteria)
    - [Technical Details](#61-technical-details)
    - [Handling API Load](#611-post-tweet-creates-a-new-tweet-with-the-given-content)
    - [Tweets Might Repeat Themselves - Handling Duplicates](#62-tweets-might-repeat-themselves---handling-duplicates)
    - [Durability](#63-durability)
    - [Scalability - Large Cardinality of Hashtags](#64-scalability---large-cardinality-of-hashtags)
  - [Conclusion](#7-conclusion)

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

   | Variable            | Description                          | Example                                                    |
   |---------------------|--------------------------------------|------------------------------------------------------------|
   | `REDIS_URL`         | Redis connection string              | `redis://localhost:6379`                                   |
   | `DB_PORT`           | Port the DB operates on              | `5432`                                                     |
   | `PORT`              | Default application port             | `8080`                                                     |
   | `DB_HOST`           | current hostname for the application | `localhost` (`postgres` the docker container is also used) |
   | `POSTGRES_USER`     | database username                    | `postgres`                                                 |
   | `POSTGRES_PASSWORD` | database password                    | `local`                                                    |
   | `POSTGRES_DB`       | database name                        | `local`                                                    |
   | `LOG_LEVEL`         | Log level for application logs       | `debug`, `info`, `warn`, `error`                           |

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

## 6. API Specifications and Acceptance Criteria

### 6.1 Technical Details
#### Handling API Load
#### 6.1.1. POST /tweet: Creates a new tweet with the given content.
    - The expectation was to assume that the load of the requests is about 1/second.
    - To handle higher loads, use Redis to cache data and workers to process incoming requests.
    - Here is a sample benchmarking test using `wrk`:
  ```bash
    wrk -t10 -c200 -d1m -s post.lua http://localhost:8080/tweet
  ```
    Explanation:
     `-t10`: Number of threads to use.
     `-c200`: Number of concurrent connections.
     `-d1m`: Duration of the test (1 minute).
     `-s post.lua`: A Lua script to customize HTTP requests, for example, sending POST data.
     `http://localhost:8080/tweet`: The URL to test.
##### Load Result:
```terminal
    Running 1m test @ http://localhost:8080/tweet
    10 threads and 200 connections
    Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     1.49s   226.09ms   2.00s    70.80%
    Req/Sec    16.80     14.59   100.00     79.42%
    6483 requests in 1.00m, 1.73MB read
    Socket errors: connect 0, read 69, write 0, timeout 2253
    Requests/sec:    107.97
    Transfer/sec:     29.52KB
```    

### 6.2. Tweets Might Repeat Themselves - Handling Duplicates:
- Hashing Tweet Content for a Unique Check
  - Before saving a tweet in `saveTweet(content: string)`, the `TweetRepository` generates a unique hash of the tweet content.
  - The system then stores this hash in Redis as a unique identifier for each tweet.
  - Before saving, the system checks whether a hash already exists in Redis. If it does, skip the save operation and return an appropriate response.

### 6.3 Durability
- On Application Start, re-fetch tweets, and hashtag counts from Postgres for re-initializing trends in Redis.  
  - This helps wamp-up the Redis cache, which is beneficial for performance if Redis was restarted, or flushed.
- Warm Up Redis Cache: 
  - When the application restarts, [warmUpRedisCache](src/trending/trending.repository.ts) is executed to repopulate the Redis cache with trending hashtags from a durable data source—PostgreSQL.
  - Fetching Hashtags: The method retrieves all hashtags along with their counts from the database. This ensures that the cache is fully repopulated, making the system ready to respond to queries immediately after initialization.
  - Using Pipelining for Efficiency: To efficiently update Redis, the process uses pipelining, a technique that batches multiple Redis commands to reduce the number of round-trip calls between the application and Redis. This reduces the overall latency and network overhead, allowing hashtags to be updated in Redis quickly and efficiently.

### 6.4 Scalability - Large Cardinality of Hashtags
## 7. Conclusion

This application is designed to handle the requirements outlined in the prompt, providing a scalable and durable solution for managing trending hashtags based on tweet activity. The automated processes running in the background ensure the system remains performant and that data is consistently updated.

For further questions or additional documentation, refer to the included files or contact the repository maintainer.

