#!/bin/bash

# Wedding Countdown App Starter Script

echo "🌟 Wedding Countdown App Starter 🌟"
echo "====================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit https://nodejs.org to download and install."
    exit 1
fi

echo "✅ Node.js is installed: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm is installed: $(npm -v)"

# Check if .env file exists, if not create it from example
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env file from .env.example"
        echo "⚠️  Please edit .env file to add your email credentials"
    else
        echo "❌ .env.example file not found. Creating basic .env file..."
        echo "PORT=3000" > .env
        echo "# Add your VAPID keys and email credentials here" >> .env
        echo "⚠️  Please edit .env file to add your credentials"
    fi
else
    echo "✅ .env file already exists"
fi

# Create images directory if it doesn't exist
if [ ! -d "public/images" ]; then
    mkdir -p public/images
    echo "✅ Created images directory"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Start the server
echo "🚀 Starting the Wedding Countdown App..."
echo "💻 Open http://localhost:3000 in your browser"
echo "💌 Remember to set up your email notifications!"
echo "====================================="
npm start
