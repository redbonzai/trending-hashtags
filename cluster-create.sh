#!/usr/bin/env bash

# Wait for Redis nodes to be ready
echo "Waiting for Redis nodes to be ready..."
sleep 5

# Get IP addresses of Redis nodes dynamically
REDIS1_IP=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' redis1)
REDIS2_IP=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' redis2)
REDIS3_IP=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' redis3)

echo "Redis node IPs:"
echo "Redis1: $REDIS1_IP:7001"
echo "Redis2: $REDIS2_IP:7002"
echo "Redis3: $REDIS3_IP:7003"

# Run cluster create command
echo "Creating Redis cluster..."
docker exec -it redis1 redis-cli --cluster create "$REDIS1_IP":7001 "$REDIS2_IP":7002 "$REDIS3_IP":7003 --cluster-replicas 0 --cluster-yes

# Optional: Wait a bit to make sure the cluster is created properly before adding slots
sleep 5

# Assign slots to each node explicitly
echo "Adding slots to Redis nodes..."
docker exec -it redis1 redis-cli -p 7001 cluster addslots {0..5460}
docker exec -it redis2 redis-cli -p 7002 cluster addslots {5461..10922}
docker exec -it redis3 redis-cli -p 7003 cluster addslots {10923..16383}

echo "Rebalancing cluster..."
docker exec -it redis1 redis-cli --cluster rebalance "$REDIS1_IP":7001
docker exec -it redis1 redis-cli --cluster rebalance "$REDIS2_IP":7002
docker exec -it redis1 redis-cli --cluster rebalance "$REDIS3_IP":7003

# Verify that all slots are assigned correctly and the nodes are part of the cluster
echo "====================="
docker exec -it redis1 redis-cli -p 7001 cluster meet "$REDIS2_IP" 7002
docker exec -it redis1 redis-cli -p 7001 cluster meet "$REDIS3_IP" 7003

docker exec -it redis2 redis-cli -p 7002 cluster meet "$REDIS1_IP" 7001
docker exec -it redis2 redis-cli -p 7002 cluster meet "$REDIS3_IP" 7003

docker exec -it redis3 redis-cli -p 7003 cluster meet "$REDIS1_IP" 7001
docker exec -it redis3 redis-cli -p 7003 cluster meet "$REDIS2_IP" 7002

# Check cluster status
echo "Checking cluster status..."
docker exec -it redis1 redis-cli -h redis2 -p 7002 ping
docker exec -it redis1 redis-cli -h redis3 -p 7003 ping
docker exec -it redis2 redis-cli -h redis1 -p 7001 ping
docker exec -it redis3 redis-cli -h redis1 -p 7001 ping
docker exec -it redis3 redis-cli -h redis2 -p 7002 ping

redis-cli -p 7001 cluster info
echo "====================="
redis-cli -p 7002 cluster info
echo "====================="
redis-cli -p 7003 cluster info
