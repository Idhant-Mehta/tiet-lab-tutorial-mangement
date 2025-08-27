#!/bin/bash

# CodeGrade Deployment Script
# This script helps deploy CodeGrade application in different environments

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to setup environment
setup_environment() {
    print_status "Setting up environment..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_warning ".env file created from .env.example. Please update it with your configuration."
        else
            print_error ".env.example file not found. Please create a .env file with required variables."
            exit 1
        fi
    else
        print_success "Environment file already exists"
    fi
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm ci
    print_success "Dependencies installed"
}

# Function to build application
build_application() {
    print_status "Building application..."
    npm run build
    print_success "Application built successfully"
}

# Function to setup database
setup_database() {
    print_status "Setting up database..."
    
    if ! grep -q "DATABASE_URL" .env; then
        print_error "DATABASE_URL not found in .env file. Please configure your database."
        exit 1
    fi
    
    npm run db:push
    print_success "Database setup completed"
}

# Function for development deployment
deploy_development() {
    print_status "Starting development deployment..."
    
    check_prerequisites
    setup_environment
    install_dependencies
    setup_database
    
    print_success "Development environment ready!"
    print_status "Starting development server..."
    npm run dev
}

# Function for production deployment
deploy_production() {
    print_status "Starting production deployment..."
    
    check_prerequisites
    setup_environment
    install_dependencies
    build_application
    setup_database
    
    print_success "Production build completed!"
    print_status "Starting production server..."
    npm start
}

# Function for Docker deployment
deploy_docker() {
    print_status "Starting Docker deployment..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if .env exists for docker-compose
    if [ ! -f "../.env" ]; then
        print_warning "No .env file found in parent directory. Using default values."
    fi
    
    print_status "Building and starting containers..."
    cd ..
    docker-compose up --build -d
    
    print_success "Docker deployment completed!"
    print_status "Application is running on http://localhost:5000"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  dev         Deploy for development"
    echo "  prod        Deploy for production"
    echo "  docker      Deploy with Docker"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 dev      # Start development server"
    echo "  $0 prod     # Build and start production server"
    echo "  $0 docker   # Deploy with Docker Compose"
}

# Main script logic
case "${1:-}" in
    "dev")
        deploy_development
        ;;
    "prod")
        deploy_production
        ;;
    "docker")
        deploy_docker
        ;;
    "help"|"-h"|"--help")
        show_usage
        ;;
    *)
        print_error "Invalid option: ${1:-}"
        echo ""
        show_usage
        exit 1
        ;;
esac