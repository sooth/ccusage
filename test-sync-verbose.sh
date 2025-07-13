#!/bin/bash

# Run sync command with timestamp and verbose output
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Running ccusage sync..."

# Run sync without --quiet to see what it's doing
/Users/dmalson/GitHub/ccusage/binaries/ccusage-macos-arm64 sync

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Sync completed with exit code: $?"