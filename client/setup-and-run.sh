#!/bin/bash

set -e

echo "======================================"
echo "Slotmachine Client Docker Setup"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    echo "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    echo "Please install Docker Compose first: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose are installed${NC}"
echo ""

# Check if SSL certificates exist
if [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
    echo -e "${YELLOW}SSL certificates not found. Generating self-signed certificates...${NC}"
    ./generate-ssl.sh
    echo -e "${GREEN}✓ SSL certificates generated${NC}"
    echo ""
else
    echo -e "${GREEN}✓ SSL certificates found${NC}"
    echo ""
fi

# Stop any existing containers
echo "Stopping existing containers..."
docker-compose down 2>/dev/null || true
echo ""

# Build and start containers
echo "Building and starting Docker containers..."
echo "This may take a few minutes on first run..."
echo ""
docker-compose up -d --build

# Wait for container to be ready
echo ""
echo "Waiting for container to be ready..."
sleep 5

# Check if container is running
if [ "$(docker-compose ps -q slotmachine-client)" ]; then
    echo -e "${GREEN}✓ Container is running${NC}"
    echo ""

    # Get container status
    docker-compose ps

    echo ""
    echo "======================================"
    echo -e "${GREEN}Deployment successful!${NC}"
    echo "======================================"
    echo ""
    echo "Access your application at:"
    echo -e "${GREEN}https://158.160.195.111${NC}"
    echo ""
    echo "Note: If using self-signed certificate, your browser will show a security warning."
    echo "This is normal - click 'Advanced' and 'Accept the Risk' to continue."
    echo ""
    echo "Useful commands:"
    echo "  View logs:        docker-compose logs -f"
    echo "  Stop container:   docker-compose down"
    echo "  Restart:          docker-compose restart"
    echo ""
else
    echo -e "${RED}Error: Container failed to start${NC}"
    echo "Check logs with: docker-compose logs"
    exit 1
fi
