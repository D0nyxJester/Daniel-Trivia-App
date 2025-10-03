#!/bin/bash

# Get the public IP of this EC2 instance
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

echo "Testing ports for EC2 instance: $PUBLIC_IP"
echo "============================================"

# Test if services are running locally
echo "Testing local services:"
echo -n "Port 3000 (Backend): "
if nc -z localhost 3000; then
    echo "✅ Open"
else
    echo "❌ Closed"
fi

echo -n "Port 5173 (Frontend): "
if nc -z localhost 5173; then
    echo "✅ Open"
else
    echo "❌ Closed"
fi

echo -n "Port 3306 (MySQL): "
if nc -z localhost 3306; then
    echo "✅ Open"
else
    echo "❌ Closed"
fi

echo ""
echo "Your application URLs:"
echo "Frontend: http://$PUBLIC_IP:5173"
echo "Backend:  http://$PUBLIC_IP:3000"
echo ""
echo "Note: Services need to be running (docker-compose up) to be accessible"
