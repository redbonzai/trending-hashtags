# Performance Testing with `wrk`

This guide will show you how to perform thorough and comprehensive performance testing of your system using the `wrk` tool. `wrk` is a powerful HTTP benchmarking tool capable of generating significant load with a few threads and connections. It is available on macOS via Homebrew and can be installed using:

```sh
brew install wrk
```

Below, we will go step-by-step through various test scenarios, allowing you to gain in-depth insight into the performance and behavior of your system.

## Basic Usage of `wrk`

To begin, let's cover the command you have already executed:

```sh
wrk -t10 -c200 -d30s -s post.lua http://localhost:8080/tweet
```

Explanation:
- `-t10`: Number of threads to use.
- `-c200`: Number of concurrent connections.
- `-d30s`: Duration of the test (30 seconds).
- `-s post.lua`: A Lua script to customize HTTP requests, for example, sending POST data.
- `http://localhost:8080/tweet`: The URL to test.

## Step-by-Step to Thorough Testing

### 1. **Testing with Different Load Scenarios**

#### a. Increasing Connections Gradually
Start by testing your system's response to a gradual increase in connections:

```sh
wrk -t4 -c50 -d30s http://localhost:8080/tweet
wrk -t4 -c100 -d30s http://localhost:8080/tweet
wrk -t4 -c200 -d30s http://localhost:8080/tweet
```

Gradually increase the `-c` (concurrent connections) value to understand how your system scales and identify the point at which performance starts to degrade.

#### b. Varying Thread Counts
Use different thread counts to find the optimal value for your system:

```sh
wrk -t2 -c100 -d30s http://localhost:8080/tweet
wrk -t8 -c100 -d30s http://localhost:8080/tweet
wrk -t16 -c100 -d30s http://localhost:8080/tweet
```

Experimenting with different `-t` values will help you determine the right number of threads based on your CPU resources.

### 2. **Custom Request Payloads with Lua**

`wrk` allows you to use Lua scripts for more complex requests, such as sending POST data. Below is an example of a Lua script (`post.lua`) to send JSON data:

```lua
wrk.method = "POST"
wrk.body   = '{"content":"This is a test tweet"}'
wrk.headers['Content-Type'] = "application/json"
```

Run the test with the script:

```sh
wrk -t4 -c100 -d1m -s post.lua http://localhost:8080/tweet
```

### 3. **Longer Duration Testing**

To observe how your system performs over extended periods, run longer tests:

```sh
wrk -t8 -c200 -d5m http://localhost:8080/tweet
wrk -t8 -c200 -d10m http://localhost:8080/tweet
```

This helps in detecting memory leaks, throttling, and other issues that may not appear during shorter runs.

### 4. **Testing with Headers and Query Parameters**

You can modify requests to include headers and query parameters:

```lua
-- headers.lua
wrk.method = "GET"
wrk.headers['Authorization'] = "Bearer your_token_here"
wrk.path = "/tweet?userId=123"
```

Run the test:

```sh
wrk -t4 -c100 -d1m -s headers.lua http://localhost:8080
```

### 5. **Benchmarking Different Endpoints**

Run tests for all your key endpoints:

```sh
wrk -t4 -c50 -d30s http://localhost:8080/tweet
wrk -t4 -c50 -d30s http://localhost:8080/user
wrk -t4 -c50 -d30s http://localhost:8080/comment
```

This will give you insight into the performance of different parts of your system and help identify any weak points.

### 6. **Analyzing Results**

`wrk` outputs valuable metrics, including:
- **Requests per second**: How many requests your system can handle.
- **Latency**: Time taken for requests to be processed.
- **Transfer/sec**: Throughput in terms of bytes transferred.

Pay special attention to latency and throughput as you increase concurrency to spot bottlenecks and identify areas for optimization.

### 7. **Documenting Your Tests**

Document each test run, including:
- Configuration (`-t`, `-c`, `-d`, etc.).
- Results: Requests/sec, latency, transfer/sec.
- Observations: Any errors, increasing latency, etc.

This will help build a thorough record of how your system performs under different load conditions.

## Example README.md for `wrk` Tests

Create a `README.md` to document your testing methodology and guide others on how to run similar tests.

```markdown
# Load Testing with `wrk`

This document describes how to use `wrk` to perform load testing on the tweet service.

## Prerequisites

- Install `wrk` using Homebrew:
  ```sh
  brew install wrk
  ```
- Make sure your service is running locally on `http://localhost:8080`.

## Basic Command

To perform a simple load test:

```sh
wrk -t4 -c100 -d30s http://localhost:8080/tweet
```

## Load Test Scenarios

### 1. Gradual Increase in Load

Start with a lower number of connections and gradually increase:

```sh
wrk -t4 -c50 -d30s http://localhost:8080/tweet
wrk -t4 -c100 -d30s http://localhost:8080/tweet
wrk -t4 -c200 -d30s http://localhost:8080/tweet
```

### 2. Using Lua Scripts for POST Requests

Create a Lua script (`post.lua`) to send POST data:

```lua
wrk.method = "POST"
wrk.body   = '{"content":"This is a test tweet"}'
wrk.headers['Content-Type'] = "application/json"
```

Run the test with the script:

```sh
wrk -t4 -c100 -d1m -s post.lua http://localhost:8080/tweet
```

### 3. Long Duration Testing

To test system stability over time:

```sh
wrk -t8 -c200 -d5m http://localhost:8080/tweet
```

## Results Analysis

- **Requests per second**: The number of requests handled by the server.
- **Latency**: The average response time.
- **Transfer/sec**: The amount of data transferred.

Document each test and any observed bottlenecks or failures.

## Notes

- Ensure your system's logging level is appropriate to avoid performance impacts during testing.
- Monitor system metrics (CPU, Memory) alongside the `wrk` output for more comprehensive analysis.
```

By following these steps, you can thoroughly test your system, identify potential bottlenecks, and document the entire testing process effectively. This will help in keeping track of system improvements and ensuring stability under various load conditions.

