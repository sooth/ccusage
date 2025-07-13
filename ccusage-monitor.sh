#!/bin/bash

# Comprehensive ccusage sync monitoring tool

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

clear

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                   ccusage Sync Service Monitor                   ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo

# 1. Service Status
echo -e "${YELLOW}📊 Service Status${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if launchctl list | grep -q "com.ccusage.sync"; then
    STATUS_LINE=$(launchctl list | grep "com.ccusage.sync")
    PID=$(echo "$STATUS_LINE" | awk '{print $1}')
    EXIT_CODE=$(echo "$STATUS_LINE" | awk '{print $2}')
    
    if [ "$PID" != "-" ]; then
        echo -e "  Status: ${GREEN}● Running${NC} (PID: $PID)"
    else
        echo -e "  Status: ${YELLOW}○ Waiting${NC} (Last exit: $EXIT_CODE)"
    fi
    
    # Next run time calculation (every 5 minutes)
    if [ -f /tmp/ccusage-sync.log ]; then
        LAST_MOD_EPOCH=$(stat -f "%m" /tmp/ccusage-sync.log)
        CURRENT_EPOCH=$(date +%s)
        ELAPSED=$((CURRENT_EPOCH - LAST_MOD_EPOCH))
        NEXT_RUN=$((300 - ELAPSED))
        
        if [ $NEXT_RUN -gt 0 ]; then
            NEXT_MIN=$((NEXT_RUN / 60))
            NEXT_SEC=$((NEXT_RUN % 60))
            echo -e "  Next run: ${BLUE}${NEXT_MIN}m ${NEXT_SEC}s${NC}"
        else
            echo -e "  Next run: ${YELLOW}Any moment${NC}"
        fi
    fi
else
    echo -e "  Status: ${RED}✗ Not loaded${NC}"
fi

# 2. Recent Sync Activity
echo
echo -e "${YELLOW}📈 Recent Sync Activity${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f /tmp/ccusage-sync.log ]; then
    # Get last 5 successful syncs
    SYNCS=$(grep "Successfully synced" /tmp/ccusage-sync.log | tail -5)
    
    if [ -n "$SYNCS" ]; then
        echo "$SYNCS" | while IFS= read -r line; do
            # Extract projects and tokens
            PROJECTS=$(echo "$line" | grep -oE '[0-9]+ project' | awk '{print $1}')
            TOKENS=$(echo "$line" | grep -oE '[0-9,]+ total tokens' | awk '{print $1}')
            echo -e "  ${GREEN}✓${NC} Synced ${BLUE}$PROJECTS${NC} projects with ${BLUE}$TOKENS${NC} tokens"
        done
    else
        echo -e "  ${YELLOW}No recent sync activity found${NC}"
    fi
    
    # Last sync time
    LAST_SYNC=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" /tmp/ccusage-sync.log)
    echo -e "  Last sync: ${BLUE}$LAST_SYNC${NC}"
else
    echo -e "  ${RED}No sync log found${NC}"
fi

# 3. Error Summary
echo
echo -e "${YELLOW}⚠️  Error Summary${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f /tmp/ccusage-sync.error.log ]; then
    # Count real errors (exclude warnings)
    REAL_ERRORS=$(grep -v -E "WARN|^$" /tmp/ccusage-sync.error.log | wc -l | tr -d ' ')
    
    if [ "$REAL_ERRORS" -gt 0 ]; then
        echo -e "  ${RED}Errors found: $REAL_ERRORS${NC}"
        echo "  Recent errors:"
        grep -v -E "WARN|^$" /tmp/ccusage-sync.error.log | tail -3 | sed 's/^/    /'
    else
        echo -e "  ${GREEN}✓ No errors${NC} (only pricing fetch warnings)"
    fi
else
    echo -e "  ${GREEN}✓ No error log${NC}"
fi

# 4. Server Connection
echo
echo -e "${YELLOW}🌐 Server Connection${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check GUID
if [ -f ~/.ccusage-guid ]; then
    GUID=$(cat ~/.ccusage-guid)
    echo -e "  GUID: ${BLUE}${GUID:0:8}...${GUID: -8}${NC}"
    echo -e "  Dashboard: ${BLUE}https://soothaa.pythonanywhere.com/$GUID${NC}"
else
    echo -e "  ${RED}No GUID found${NC}"
fi

# 5. Quick Actions
echo
echo -e "${YELLOW}🎯 Quick Actions${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  View logs:     tail -f /tmp/ccusage-sync.log"
echo "  View errors:   tail -f /tmp/ccusage-sync.error.log"
echo "  Force sync:    launchctl start com.ccusage.sync"
echo "  Stop service:  launchctl stop com.ccusage.sync"
echo "  Restart:       launchctl stop com.ccusage.sync && launchctl start com.ccusage.sync"
echo

# Show if we're in live mode
if [ "$1" == "--live" ]; then
    echo -e "${GREEN}Live mode: Refreshing every 5 seconds... (Press Ctrl+C to exit)${NC}"
    sleep 5
    exec "$0" --live
fi