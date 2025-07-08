#!/bin/bash
set -e

echo "ccusage macOS Service Installer"
echo "================================"
echo ""

# Check if running on macOS
if [[ "$(uname)" != "Darwin" ]]; then
    echo "Error: This script is for macOS only"
    exit 1
fi

# Check architecture
ARCH=$(uname -m)
if [[ "$ARCH" == "arm64" ]]; then
    BINARY="ccusage-macos-arm64"
elif [[ "$ARCH" == "x86_64" ]]; then
    BINARY="ccusage-macos-x64"
else
    echo "Error: Unsupported architecture: $ARCH"
    exit 1
fi

# Check if binary exists
if [[ ! -f "binaries/$BINARY" ]]; then
    echo "Error: Binary not found: binaries/$BINARY"
    echo "Please run ./build-binaries.sh first"
    exit 1
fi

# Step 1: Install binary
echo "Step 1: Installing ccusage binary to /usr/local/bin..."
echo "This requires sudo access."
sudo cp "binaries/$BINARY" /usr/local/bin/ccusage
sudo chmod +x /usr/local/bin/ccusage

# Verify installation
if /usr/local/bin/ccusage --version >/dev/null 2>&1; then
    echo "✓ ccusage installed successfully"
    /usr/local/bin/ccusage --version
else
    echo "✗ Installation failed"
    exit 1
fi

# Step 2: Install launchd service
echo ""
echo "Step 2: Installing launchd service..."
PLIST_SRC="system-services/com.ccusage.sync.plist"
PLIST_DEST="$HOME/Library/LaunchAgents/com.ccusage.sync.plist"

# Create LaunchAgents directory if it doesn't exist
mkdir -p "$HOME/Library/LaunchAgents"

# Copy plist file
cp "$PLIST_SRC" "$PLIST_DEST"
echo "✓ Service file copied to $PLIST_DEST"

# Step 3: Load the service
echo ""
echo "Step 3: Loading the service..."

# Unload if already loaded (ignore errors)
launchctl unload "$PLIST_DEST" 2>/dev/null || true

# Load the service
if launchctl load "$PLIST_DEST"; then
    echo "✓ Service loaded successfully"
else
    echo "✗ Failed to load service"
    exit 1
fi

# Step 4: Verify service is running
echo ""
echo "Step 4: Verifying service..."
sleep 2  # Give it a moment to start

if launchctl list | grep -q "com.ccusage.sync"; then
    echo "✓ Service is loaded"
    launchctl list | grep "com.ccusage.sync"
else
    echo "✗ Service not found in launchctl list"
fi

# Step 5: Check logs
echo ""
echo "Step 5: Checking logs..."
echo "Standard output log: /tmp/ccusage-sync.log"
echo "Error log: /tmp/ccusage-sync.error.log"
echo ""

if [[ -f "/tmp/ccusage-sync.log" ]]; then
    echo "Recent output:"
    tail -n 5 /tmp/ccusage-sync.log
else
    echo "No output log found yet (service may not have run yet)"
fi

if [[ -f "/tmp/ccusage-sync.error.log" ]] && [[ -s "/tmp/ccusage-sync.error.log" ]]; then
    echo ""
    echo "Error log:"
    tail -n 5 /tmp/ccusage-sync.error.log
fi

# Step 6: Manual test
echo ""
echo "Step 6: Running manual sync test..."
if /usr/local/bin/ccusage sync; then
    echo "✓ Manual sync successful"
else
    echo "✗ Manual sync failed"
fi

echo ""
echo "Installation complete!"
echo ""
echo "The ccusage sync service is now running and will sync every 5 minutes."
echo ""
echo "To monitor the service:"
echo "  - View logs: tail -f /tmp/ccusage-sync.log"
echo "  - Check status: launchctl list | grep ccusage"
echo ""
echo "To uninstall:"
echo "  - launchctl unload ~/Library/LaunchAgents/com.ccusage.sync.plist"
echo "  - rm ~/Library/LaunchAgents/com.ccusage.sync.plist"
echo "  - sudo rm /usr/local/bin/ccusage"