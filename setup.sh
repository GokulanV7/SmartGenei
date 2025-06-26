#!/bin/bash

# SmartGeni Development Setup Script
# This script sets up the development environment for SmartGeni

set -e

echo "🧠 Setting up SmartGeni Development Environment..."
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/ or use nvm: https://github.com/nvm-sh/nvm"
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo "✅ Python $(python3 --version) detected"

# Setup Backend
echo ""
echo "🐍 Setting up Backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit backend/.env and add your API keys!"
fi

cd ..

# Setup Frontend
echo ""
echo "⚛️ Setting up Frontend..."
cd frontend

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit backend/.env and add your API keys:"
echo "   - GROQ_API_KEY (required): Get from https://console.groq.com"
echo "   - YOUTUBE_API_KEY (optional): Get from Google Cloud Console"
echo ""
echo "2. Start the development servers:"
echo "   Backend:  cd backend && source venv/bin/activate && python app.py"
echo "   Frontend: cd frontend && npm run dev"
echo ""
echo "3. Visit http://localhost:8080 to use SmartGeni!"
echo ""
echo "🔧 Alternative: Use Docker Compose"
echo "   docker-compose up --build"
echo ""
echo "📚 For more information, see README.md"
