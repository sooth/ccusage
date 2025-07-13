#!/bin/bash

# Parse ccusage sync success messages from logs
echo "=== ccusage Sync History ==="
echo

# Check if log file exists
if [ ! -f /tmp/ccusage-sync.log ]; then
    echo "No sync log found at /tmp/ccusage-sync.log"
    exit 1
fi

# Extract successful sync entries
echo "Recent Successful Syncs:"
echo "------------------------"

# Look for success messages and get timestamps from macOS unified log
# First, let's check the basic log
grep -E "Successfully synced|Loaded pricing" /tmp/ccusage-sync.log | tail -20 | while read -r line; do
    # Since our log doesn't have timestamps, we'll use file modification times
    echo "  • $line"
done

echo
echo "Log File Stats:"
echo "---------------"
echo "File: /tmp/ccusage-sync.log"
echo "Size: $(ls -lh /tmp/ccusage-sync.log | awk '{print $5}')"
echo "Last modified: $(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" /tmp/ccusage-sync.log)"
echo "Total sync entries: $(grep -c "Successfully synced" /tmp/ccusage-sync.log 2>/dev/null || echo 0)"

# Check macOS unified logs for our service
echo
echo "System Log Entries (last 1 hour):"
echo "---------------------------------"
log show --predicate 'process == "ccusage-macos-arm64"' --last 1h 2>/dev/null | grep -E "sync|token" | tail -10 || echo "No system log entries found"

# Alternative: Check launchd logs
echo
echo "LaunchAgent Activity:"
echo "--------------------"
log show --predicate 'subsystem == "com.apple.launchd" AND message CONTAINS "com.ccusage.sync"' --last 1h 2>/dev/null | tail -5 || echo "No launchd activity found"