# Performance Testing with `wrk`

This is a brief guide on how to performance test the `trending-hashtag` system with the `wrk` tool. 
`wrk` is a powerful HTTP benchmarking tool capable of generating significant load with a few threads and connections.
It is available on macOS via Homebrew and can be installed using:

```sh
brew install wrk
```

## Basic Usage of `wrk`

Run a simple load test on the `/tweet` endpoint:

```bash
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
Here is a gradual load tests that increases connections with each execution:

```sh
wrk -t4 -c50 -d30s http://localhost:8080/tweet
wrk -t4 -c100 -d30s http://localhost:8080/tweet
wrk -t4 -c200 -d30s http://localhost:8080/tweet
```

Gradually increase the `-c` (concurrent connections) value to determine system scalability by viewing latency and requests/s times.
This also helps to determine the points at which the system starts to degrade in performance.

#### b. Varying Thread Counts
Vary the thread counts to determine optimal value and possible bottlenecks:

```sh
wrk -t2 -c100 -d30s http://localhost:8080/tweet
wrk -t8 -c100 -d30s http://localhost:8080/tweet
wrk -t16 -c100 -d30s http://localhost:8080/tweet
```

Experimenting with different `-t` values will help determine the optimal threads based on existing CPU resources.

### 2. **Custom Request Payloads with Lua**

`wrk` allows the use of Lua scripts for sending POST data. Please see the script below (`post.lua`) to send JSON data:

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

These calls will return a synopsis of system performance:
Please view performance results from the trending-hashtags service:
```sh
wrk -t4 -c50 -d30s http://localhost:8080/tweet
wrk -t4 -c100 -d30s http://localhost:8080/tweet
wrk -t4 -c200 -d30s http://localhost:8080/tweet
Running 30s test @ http://localhost:8080/tweet
  4 threads and 50 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    84.05ms   22.80ms 307.15ms   88.54%
    Req/Sec   144.96     33.35   222.00     68.91%
  17237 requests in 30.06s, 16.57MB read
Requests/sec:    573.50
Transfer/sec:    564.54KB
---
Running 30s test @ http://localhost:8080/tweet
  4 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency   212.94ms  114.10ms   1.74s    94.07%
    Req/Sec   122.47     30.70   353.00     69.22%
  14676 requests in 30.13s, 14.11MB read
Requests/sec:    487.12
Transfer/sec:    479.51KB
---
Running 30s test @ http://localhost:8080/tweet
  4 threads and 200 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency   530.86ms  194.39ms   1.99s    77.14%
    Req/Sec    88.55     34.21   220.00     71.60%
  10501 requests in 30.09s, 24.55MB read
  Socket errors: connect 0, read 70, write 0, timeout 124
Requests/sec:    349.01
Transfer/sec:    835.63KB
```

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


### 5. **Analyzing Results**

`wrk` outputs valuable metrics, including:
- **Requests per second**: How many requests your system can handle.
- **Latency**: Time taken for requests to be processed.
- **Transfer/sec**: Throughput in terms of bytes transferred.

## Prerequisites

- Install `wrk` using Homebrew:
  ```sh
  brew install wrk
  ```
- Make sure the service is running locally on `http://localhost:8080`.

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



