# Trending Hashtags Application - README

## 1. Overview
The Trending Hashtags Application is a robust, distributed system designed to collect tweets, calculate the cardinality of hashtags, and provide trending hashtags in real-time. It leverages Redis for quick access, PostgreSQL for durable storage, and NestJS for managing the API and worker processes.

## 2. User Guide
The application provides the following functionality:

- **Create Tweets**: Users can create tweets through the API, which may include hashtags.
- **Trending Hashtags**: The API allows users to retrieve the top trending hashtags, with counts, based on recent activity.

### Available Endpoints
- **POST /tweets**: Create a new tweet with content and hashtags.
- **GET /trending-hashtags**: Retrieve the list of trending hashtags with their counts.

## 3. Prerequisites
To run the application, you need:

- **Node.js**: Version 20.x or later.
- **PostgreSQL**: Version 14 or later.
- **Redis**: Version 6.x or later.
- **Docker** (Optional): For containerized deployment.

## 4. Developer Guide
This section will help developers set up, configure, and understand the inner workings of the application.

### 4.1 Setup and Configuration

#### Clone the Codebase
```bash
git clone https://github.com/your-repository/trending-hashtags-app.git
cd trending-hashtags-app
```

#### Install Dependencies
Ensure you have Node.js installed, then run:
```bash
npm install
```

#### Update Environment Variables
The application requires certain environment variables to be set up. Update the `.env` file with the required variables.

| Environment Variable | Description                             | Example                  |
|----------------------|-----------------------------------------|--------------------------|
| `REDIS_URL`          | The URL of the Redis server             | `redis://localhost:6379` |
| `POSTGRES_HOST`      | The hostname of the PostgreSQL database | `localhost`              |
| `POSTGRES_PORT`      | The port number for PostgreSQL          | `5432`                   |
| `POSTGRES_USER`      | Username for PostgreSQL                 | `postgres`               |
| `POSTGRES_PASSWORD`  | Password for the PostgreSQL user        | `your_password`          |
| `POSTGRES_DB`        | Name of the PostgreSQL database         | `trending_db`            |
| `NODE_ENV`           | Environment (development, production)   | `development`            |
| `APP_LOG_LEVEL`      | Log level for application logs          | `debug`                  |

### 4.2 Testing
The application uses Jest for unit testing. To run the tests, execute:
```bash
npm test
```
To run tests in watch mode for development:
```bash
npm run test:watch
```
Ensure all tests are passing before making a PR or deploying changes.

### 4.3 Chain of Events When the Application Loads

#### When a Tweet is Created
1. **Tweet Submission**: The user submits a tweet via the API (`POST /tweets`). The tweet may contain multiple hashtags.
2. **Tweet Repository Processing**: The tweet is saved in the PostgreSQL database, and associated hashtags are extracted and saved or updated accordingly.
3. **Hashtag Cardinality Increment**: For each hashtag in the tweet, the count is incremented both in PostgreSQL and in Redis.
4. **Background Worker Updates**: A `tweet-created` event is emitted, which is picked up by the hashtag aggregator worker. The worker processes hashtag cardinalities and updates Redis for fast access.
5. **Trending Update**: Every 10 minutes, a cron job runs to recalculate the trending hashtags based on the latest data, ensuring the Redis cache is updated with the most recent trends.

These chain of events ensure that every new tweet is properly handled, stored, and that the trending hashtags are always kept up-to-date.

