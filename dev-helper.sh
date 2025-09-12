#!/bin/bash

# Development Helper Script for Gnosis Chain wxHOPR Airdrop Service
# Quick shortcuts for common development tasks

set -e

CONTAINER_NAME="airdrop-service"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_help() {
    echo -e "${BLUE}Development Helper for Gnosis Chain wxHOPR Airdrop Service${NC}"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "COMMANDS:"
    echo "  start           Start development environment"
    echo "  stop            Stop development environment"
    echo "  restart         Restart development environment"
    echo "  logs            Show live logs"
    echo "  logs-error      Show only error/warning logs"
    echo "  shell           Access container shell"
    echo "  stats           Show container resource usage"
    echo "  debug           Show debug connection info"
    echo "  test            Run tests in development container"
    echo "  clean           Clean up containers and images"
    echo "  status          Show service status"
    echo "  help            Show this help message"
    echo ""
    echo "EXAMPLES:"
    echo "  $0 start        # Start development environment"
    echo "  $0 logs         # Follow logs in real-time"
    echo "  $0 shell        # Get shell access for debugging"
    echo "  $0 debug        # Show how to connect debugger"
}

case "${1:-help}" in
    start)
        echo -e "${GREEN}🚀 Starting development environment...${NC}"
        ./deploy.sh --dev
        ;;
    stop)
        echo -e "${YELLOW}🛑 Stopping development environment...${NC}"
        docker stop $CONTAINER_NAME 2>/dev/null || echo "Container not running"
        ;;
    restart)
        echo -e "${YELLOW}🔄 Restarting development environment...${NC}"
        docker restart $CONTAINER_NAME 2>/dev/null || {
            echo -e "${RED}Container not found. Starting fresh...${NC}"
            ./deploy.sh --dev
        }
        ;;
    logs)
        echo -e "${BLUE}📋 Following logs (Ctrl+C to exit)...${NC}"
        docker logs -f $CONTAINER_NAME
        ;;
    logs-error)
        echo -e "${BLUE}🔍 Following error/warning logs (Ctrl+C to exit)...${NC}"
        docker logs -f $CONTAINER_NAME | grep -E "(ERROR|WARN|error|warning)" --color=always
        ;;
    shell)
        echo -e "${BLUE}🐚 Accessing container shell...${NC}"
        docker exec -it $CONTAINER_NAME /bin/sh
        ;;
    stats)
        echo -e "${BLUE}📊 Container resource usage:${NC}"
        docker stats $CONTAINER_NAME --no-stream
        ;;
    debug)
        echo -e "${GREEN}🐛 Debug Connection Information:${NC}"
        echo ""
        echo "Node.js Debug Port: 9229"
        echo "Connection URL: localhost:9229"
        echo ""
        echo "VS Code launch.json configuration:"
        echo "{"
        echo '  "type": "node",'
        echo '  "request": "attach",'
        echo '  "name": "Attach to Docker",'
        echo '  "address": "localhost",'
        echo '  "port": 9229,'
        echo '  "localRoot": "${workspaceFolder}/src",'
        echo '  "remoteRoot": "/app/src",'
        echo '  "skipFiles": ["<node_internals>/**"]'
        echo "}"
        echo ""
        echo "Chrome DevTools: chrome://inspect"
        ;;
    test)
        echo -e "${BLUE}🧪 Running tests in development container...${NC}"
        docker exec $CONTAINER_NAME npm test
        ;;
    clean)
        echo -e "${YELLOW}🧹 Cleaning up containers and images...${NC}"
        docker stop $CONTAINER_NAME 2>/dev/null || true
        docker rm $CONTAINER_NAME 2>/dev/null || true
        docker rmi airdrop-service 2>/dev/null || true
        echo -e "${GREEN}✅ Cleanup complete${NC}"
        ;;
    status)
        echo -e "${BLUE}📊 Service Status:${NC}"
        echo ""
        if docker ps | grep -q $CONTAINER_NAME; then
            echo -e "${GREEN}✅ Container is running${NC}"
            echo ""
            echo "Container Info:"
            docker ps --filter name=$CONTAINER_NAME --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
            echo ""
            echo "Health Status:"
            if curl -f http://localhost:3000/api/airdrop/health &> /dev/null; then
                echo -e "${GREEN}✅ Service is healthy${NC}"
            else
                echo -e "${RED}❌ Service health check failed${NC}"
            fi
        else
            echo -e "${RED}❌ Container is not running${NC}"
        fi
        ;;
    help|--help|-h|"")
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
