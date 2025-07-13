#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== ccusage Sync Service Monitor ===${NC}\n"

# Check service status
echo -e "${YELLOW}Service Status:${NC}"
if launchctl list | grep -q "com.ccusage.sync"; then
    STATUS=$(launchctl list | grep "com.ccusage.sync")
    PID=$(echo "$STATUS" | awk '{print $1}')
    EXIT_CODE=$(echo "$STATUS" | awk '{print $2}')
    
    if [ "$PID" != "-" ]; then
        echo "✅ Service is running (PID: $PID)"
    else
        echo "⏸️  Service is not currently running (last exit code: $EXIT_CODE)"
    fi
    
    # Get detailed info
    echo -e "\n${YELLOW}Detailed Status:${NC}"
    launchctl print gui/$(id -u)/com.ccusage.sync | grep -E "state|pid|last exit|next fire" | sed 's/^/  /'
else
    echo -e "${RED}❌ Service is not loaded${NC}"
    exit 1
fi

# Check when service last ran
echo -e "\n${YELLOW}Last Run Information:${NC}"
if [ -f /tmp/ccusage-sync.log ]; then
    LAST_MODIFIED=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" /tmp/ccusage-sync.log)
    echo "  Last activity: $LAST_MODIFIED"
    
    # Check for successful submissions in the last hour
    echo -e "\n${YELLOW}Recent Submissions (last hour):${NC}"
    # Since we're using --quiet, we won't see submission messages, but we can check for activity
    RECENT_LINES=$(find /tmp/ccusage-sync.log -mmin -60 2>/dev/null | wc -l)
    if [ "$RECENT_LINES" -gt 0 ]; then
        echo "  ✅ Service has been active in the last hour"
    else
        echo "  ⚠️  No activity in the last hour"
    fi
fi

# Check for errors
echo -e "\n${YELLOW}Recent Errors:${NC}"
if [ -f /tmp/ccusage-sync.error.log ] && [ -s /tmp/ccusage-sync.error.log ]; then
    # Count non-warning lines in the error log
    ERROR_COUNT=$(grep -v "WARN" /tmp/ccusage-sync.error.log 2>/dev/null | grep -v "^$" | wc -l)
    if [ "$ERROR_COUNT" -gt 0 ]; then
        echo -e "  ${RED}❌ Found $ERROR_COUNT errors${NC}"
        echo "  Recent errors (excluding warnings):"
        grep -v "WARN" /tmp/ccusage-sync.error.log | grep -v "^$" | tail -5 | sed 's/^/    /'
    else
        echo "  ✅ No errors found (only warnings about fetching pricing)"
    fi
else
    echo "  ✅ No error log found or it's empty"
fi

# Show log file sizes
echo -e "\n${YELLOW}Log File Information:${NC}"
if [ -f /tmp/ccusage-sync.log ]; then
    LOG_SIZE=$(ls -lh /tmp/ccusage-sync.log | awk '{print $5}')
    echo "  Standard log: /tmp/ccusage-sync.log ($LOG_SIZE)"
fi
if [ -f /tmp/ccusage-sync.error.log ]; then
    ERROR_SIZE=$(ls -lh /tmp/ccusage-sync.error.log | awk '{print $5}')
    echo "  Error log: /tmp/ccusage-sync.error.log ($ERROR_SIZE)"
fi

# Show how to tail logs
echo -e "\n${YELLOW}To monitor logs in real-time:${NC}"
echo "  tail -f /tmp/ccusage-sync.log         # Watch standard output"
echo "  tail -f /tmp/ccusage-sync.error.log   # Watch errors"

# Show how to restart service
echo -e "\n${YELLOW}Service Control Commands:${NC}"
echo "  launchctl stop com.ccusage.sync       # Stop the service"
echo "  launchctl start com.ccusage.sync      # Start the service"
echo "  launchctl unload ~/Library/LaunchAgents/com.ccusage.sync.plist  # Disable"
echo "  launchctl load ~/Library/LaunchAgents/com.ccusage.sync.plist    # Enable"