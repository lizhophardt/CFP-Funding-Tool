#!/bin/bash

# CFP Funding Tool Development Helper
# Provides convenient commands for development workflow

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Container names
API_CONTAINER="cfp-api"
DB_CONTAINER="cfp-postgres"
SIMPLE_CONTAINER="airdrop-service"

print_usage() {
    echo -e "${BLUE}CFP Funding Tool Development Helper${NC}"
    echo ""
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo -e "  ${GREEN}start${NC}    Start development environment (docker-compose)"
    echo -e "  ${GREEN}stop${NC}     Stop development environment"
    echo -e "  ${GREEN}restart${NC}  Restart development environment"
    echo -e "  ${GREEN}logs${NC}     Follow application logs"
    echo -e "  ${GREEN}shell${NC}    Access container shell"
    echo -e "  ${GREEN}debug${NC}    Show debugger connection info"
    echo -e "  ${GREEN}status${NC}   Show service status"
    echo -e "  ${GREEN}clean${NC}    Clean up containers and volumes"
    echo -e "  ${GREEN}db${NC}       Database operations (shell, migrate, seed)"
    echo -e "  ${GREEN}test${NC}     Run tests with coverage"
    echo ""
    echo "Examples:"
    echo "  $0 start          # Start development environment"
    echo "  $0 logs           # Follow logs"
    echo "  $0 shell          # Access API container shell"
    echo "  $0 db shell       # Access database shell"
    echo "  $0 db migrate     # Run database migrations"
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed or not in PATH${NC}"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose is not installed or not in PATH${NC}"
        exit 1
    fi
}

wait_for_service() {
    echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
    
    # Wait for database
    local retries=30
    while [ $retries -gt 0 ]; do
        if docker-compose exec -T postgres pg_isready -U postgres -d cfp_funding_tool &> /dev/null; then
            echo -e "${GREEN}✅ Database is ready${NC}"
            break
        fi
        retries=$((retries - 1))
        sleep 1
    done
    
    if [ $retries -eq 0 ]; then
        echo -e "${RED}❌ Database failed to start${NC}"
        return 1
    fi
    
    # Wait for API
    retries=30
    while [ $retries -gt 0 ]; do
        if curl -f http://localhost:3000/api/airdrop/health &> /dev/null; then
            echo -e "${GREEN}✅ API is ready${NC}"
            break
        fi
        retries=$((retries - 1))
        sleep 1
    done
    
    if [ $retries -eq 0 ]; then
        echo -e "${RED}❌ API failed to start${NC}"
        return 1
    fi
}

start_dev() {
    echo -e "${BLUE}🚀 Starting CFP Funding Tool development environment...${NC}"
    
    # Check if .env exists
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}⚠️  No .env file found. Copying from env.example...${NC}"
        if [ -f "env.example" ]; then
            cp env.example .env
            echo -e "${YELLOW}📝 Please edit .env with your configuration before starting${NC}"
            return 1
        else
            echo -e "${RED}❌ No env.example file found${NC}"
            return 1
        fi
    fi
    
    # Start services
    docker-compose up -d
    
    if wait_for_service; then
        echo ""
        echo -e "${GREEN}✅ Development environment is running!${NC}"
        echo ""
        echo -e "${BLUE}📡 Services:${NC}"
        echo "  • API: http://localhost:3000"
        echo "  • Database: postgresql://localhost:5432/cfp_funding_tool"
        echo "  • Health Check: http://localhost:3000/api/airdrop/health"
        echo ""
        echo -e "${BLUE}🛠️  Development Tools:${NC}"
        echo "  • Debug Port: localhost:9229 (attach your debugger)"
        echo "  • Hot Reload: Enabled (code changes trigger restart)"
        echo ""
        echo -e "${BLUE}📝 Useful Commands:${NC}"
        echo "  • View logs: $0 logs"
        echo "  • Access shell: $0 shell"
        echo "  • Stop services: $0 stop"
        echo "  • Database shell: $0 db shell"
    else
        echo -e "${RED}❌ Failed to start development environment${NC}"
        echo "Check logs with: $0 logs"
        return 1
    fi
}

stop_dev() {
    echo -e "${BLUE}🛑 Stopping development environment...${NC}"
    docker-compose down
    echo -e "${GREEN}✅ Development environment stopped${NC}"
}

restart_dev() {
    echo -e "${BLUE}🔄 Restarting development environment...${NC}"
    stop_dev
    start_dev
}

show_logs() {
    echo -e "${BLUE}📝 Following application logs...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop following logs${NC}"
    echo ""
    
    # Check if container is running
    if docker-compose ps api | grep -q "Up"; then
        docker-compose logs -f api
    elif docker ps | grep -q "$SIMPLE_CONTAINER"; then
        echo -e "${YELLOW}Using simple deployment logs...${NC}"
        docker logs -f "$SIMPLE_CONTAINER"
    else
        echo -e "${RED}❌ No running containers found${NC}"
        echo "Start the development environment with: $0 start"
        return 1
    fi
}

access_shell() {
    echo -e "${BLUE}🐚 Accessing container shell...${NC}"
    
    # Check docker-compose first
    if docker-compose ps api | grep -q "Up"; then
        echo -e "${GREEN}Accessing API container shell...${NC}"
        docker-compose exec api /bin/bash
    elif docker ps | grep -q "$SIMPLE_CONTAINER"; then
        echo -e "${GREEN}Accessing simple deployment shell...${NC}"
        docker exec -it "$SIMPLE_CONTAINER" /bin/bash
    else
        echo -e "${RED}❌ No running containers found${NC}"
        echo "Start the development environment with: $0 start"
        return 1
    fi
}

show_debug_info() {
    echo -e "${BLUE}🐛 Debug Connection Information${NC}"
    echo ""
    
    # Check if services are running
    if docker-compose ps api | grep -q "Up" || docker ps | grep -q "$SIMPLE_CONTAINER"; then
        echo -e "${GREEN}✅ Debug port is available on localhost:9229${NC}"
        echo ""
        echo -e "${BLUE}VS Code Setup:${NC}"
        echo "1. Go to Run and Debug (Ctrl+Shift+D)"
        echo "2. Select 'Attach to Docker (Development)' configuration"
        echo "3. Set breakpoints in your TypeScript source files"
        echo ""
        echo -e "${BLUE}Chrome DevTools Setup:${NC}"
        echo "1. Open Chrome and navigate to: chrome://inspect"
        echo "2. Click 'Open dedicated DevTools for Node'"
        echo "3. The debugger will connect automatically"
        echo ""
        echo -e "${BLUE}Manual Connection:${NC}"
        echo "Host: localhost"
        echo "Port: 9229"
        echo "Protocol: Inspector Protocol"
    else
        echo -e "${RED}❌ No development containers running${NC}"
        echo "Start the development environment with: $0 start"
        return 1
    fi
}

show_status() {
    echo -e "${BLUE}📊 Service Status${NC}"
    echo ""
    
    # Docker Compose services
    if docker-compose ps &> /dev/null; then
        echo -e "${BLUE}Docker Compose Services:${NC}"
        docker-compose ps
        echo ""
    fi
    
    # Simple deployment
    if docker ps | grep -q "$SIMPLE_CONTAINER"; then
        echo -e "${BLUE}Simple Deployment:${NC}"
        docker ps --filter "name=$SIMPLE_CONTAINER" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo ""
    fi
    
    # Health check
    echo -e "${BLUE}Health Check:${NC}"
    if curl -f http://localhost:3000/api/airdrop/health &> /dev/null; then
        echo -e "${GREEN}✅ API is healthy${NC}"
        
        # Get status info
        echo ""
        echo -e "${BLUE}Service Status:${NC}"
        curl -s http://localhost:3000/api/airdrop/status | jq . 2>/dev/null || curl -s http://localhost:3000/api/airdrop/status
    else
        echo -e "${RED}❌ API is not responding${NC}"
    fi
}

clean_environment() {
    echo -e "${BLUE}🧹 Cleaning up development environment...${NC}"
    
    # Stop and remove containers, networks, and volumes
    docker-compose down -v --remove-orphans
    
    # Remove simple deployment container if exists
    docker stop "$SIMPLE_CONTAINER" 2>/dev/null || true
    docker rm "$SIMPLE_CONTAINER" 2>/dev/null || true
    
    # Remove images (optional)
    read -p "Remove Docker images as well? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker rmi airdrop-service 2>/dev/null || true
        docker-compose down --rmi all 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✅ Environment cleaned up${NC}"
}

database_operations() {
    local operation=$1
    
    case $operation in
        "shell")
            echo -e "${BLUE}🗄️  Accessing database shell...${NC}"
            if docker-compose ps postgres | grep -q "Up"; then
                docker-compose exec postgres psql -U postgres -d cfp_funding_tool
            else
                echo -e "${RED}❌ Database container is not running${NC}"
                echo "Start the development environment with: $0 start"
                return 1
            fi
            ;;
        "migrate")
            echo -e "${BLUE}🗄️  Running database migrations...${NC}"
            if docker-compose ps postgres | grep -q "Up"; then
                docker-compose exec postgres psql -U postgres -d cfp_funding_tool -f /docker-entrypoint-initdb.d/01-schema.sql
                echo -e "${GREEN}✅ Database migrations completed${NC}"
            else
                echo -e "${RED}❌ Database container is not running${NC}"
                echo "Start the development environment with: $0 start"
                return 1
            fi
            ;;
        "seed")
            echo -e "${BLUE}🗄️  Seeding database...${NC}"
            if docker-compose ps api | grep -q "Up"; then
                docker-compose exec api npm run db:seed
                echo -e "${GREEN}✅ Database seeded${NC}"
            else
                echo -e "${RED}❌ API container is not running${NC}"
                echo "Start the development environment with: $0 start"
                return 1
            fi
            ;;
        *)
            echo -e "${BLUE}Database Operations:${NC}"
            echo "  $0 db shell    - Access database shell"
            echo "  $0 db migrate  - Run database migrations"
            echo "  $0 db seed     - Seed database with initial data"
            ;;
    esac
}

run_tests() {
    echo -e "${BLUE}🧪 Running tests with coverage...${NC}"
    
    if [ -f "package.json" ]; then
        npm run test:coverage
    else
        echo -e "${RED}❌ package.json not found${NC}"
        return 1
    fi
}

# Main script logic
check_docker

case ${1:-""} in
    "start")
        start_dev
        ;;
    "stop")
        stop_dev
        ;;
    "restart")
        restart_dev
        ;;
    "logs")
        show_logs
        ;;
    "shell")
        access_shell
        ;;
    "debug")
        show_debug_info
        ;;
    "status")
        show_status
        ;;
    "clean")
        clean_environment
        ;;
    "db")
        database_operations $2
        ;;
    "test")
        run_tests
        ;;
    "help"|"--help"|"-h")
        print_usage
        ;;
    "")
        echo -e "${RED}❌ No command specified${NC}"
        echo ""
        print_usage
        exit 1
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo ""
        print_usage
        exit 1
        ;;
esac
