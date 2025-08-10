#!/bin/bash

# Jasper Designer V2.0 - Debug Build Script
echo "🔧 Building Jasper Designer V2.0 in Debug Mode..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build frontend
echo "🎨 Building frontend..."
npm run build

# Build Tauri in debug mode with DevTools
echo "🦀 Building Tauri application in debug mode..."
cd src-tauri
cargo build --features devtools

echo "✅ Debug build completed!"
echo "💡 DevTools will be automatically opened in debug mode"
echo "🚀 You can also use F12 or the debug button in toolbar to toggle DevTools"