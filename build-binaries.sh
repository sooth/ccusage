#!/bin/bash
set -e

echo "Building platform-specific binaries..."

# Ensure bun is in PATH
export PATH="$HOME/.bun/bin:$PATH"

# Build the project first
echo "Building project..."
bun run build

# Create binaries directory
mkdir -p binaries

# Build Linux x64 binary
echo "Building Linux x64 binary..."
bun build ./dist/index.js --compile --target=bun-linux-x64 --outfile binaries/ccusage-linux-x64

# Build macOS x64 binary
echo "Building macOS x64 binary..."
bun build ./dist/index.js --compile --target=bun-darwin-x64 --outfile binaries/ccusage-macos-x64

# Build macOS arm64 binary
echo "Building macOS arm64 binary..."
bun build ./dist/index.js --compile --target=bun-darwin-arm64 --outfile binaries/ccusage-macos-arm64

# Build Windows x64 binary
echo "Building Windows x64 binary..."
bun build ./dist/index.js --compile --target=bun-windows-x64 --outfile binaries/ccusage-windows-x64.exe

# Make binaries executable
chmod +x binaries/ccusage-*

# List generated binaries
echo ""
echo "Generated binaries:"
ls -lh binaries/

echo ""
echo "Build complete!"