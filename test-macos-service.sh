#!/bin/bash

echo "ccusage macOS Service Test"
echo "=========================="
echo ""

# Check if ccusage is installed
echo "1. Checking ccusage binary..."
CCUSAGE_BIN="/Users/dmalson/GitHub/ccusage/binaries/ccusage-macos-arm64"
if [[ -x "$CCUSAGE_BIN" ]]; then
    echo "✓ ccusage binary exists at: $CCUSAGE_BIN"
    echo "  Version: $("$CCUSAGE_BIN" --version)"
else
    echo "✗ ccusage binary not found at $CCUSAGE_BIN"
    echo "  Please run: ./build-binaries.sh"
    exit 1
fi

# Check if service is loaded
echo ""
echo "2. Checking launchd service..."
if launchctl list | grep -q "com.ccusage.sync"; then
    echo "✓ Service is loaded"
    SERVICE_INFO=$(launchctl list | grep "com.ccusage.sync")
    echo "  Status: $SERVICE_INFO"
    
    # Extract PID and last exit status
    PID=$(echo "$SERVICE_INFO" | awk '{print $1}')
    EXIT_CODE=$(echo "$SERVICE_INFO" | awk '{print $2}')
    
    if [[ "$PID" != "-" ]]; then
        echo "  Process is currently running (PID: $PID)"
    else
        echo "  Process is not running"
        if [[ "$EXIT_CODE" == "0" ]]; then
            echo "  Last run was successful"
        else
            echo "  Last run failed with exit code: $EXIT_CODE"
        fi
    fi
else
    echo "✗ Service not loaded"
    echo "  Install with: cp system-services/com.ccusage.sync.plist ~/Library/LaunchAgents/"
    echo "  Load with: launchctl load ~/Library/LaunchAgents/com.ccusage.sync.plist"
    exit 1
fi

# Check logs
echo ""
echo "3. Checking logs..."
LOG_FILE="/tmp/ccusage-sync.log"
ERROR_LOG="/tmp/ccusage-sync.error.log"

if [[ -f "$LOG_FILE" ]]; then
    echo "✓ Output log exists"
    echo "  Last modified: $(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$LOG_FILE")"
    echo "  Size: $(wc -c < "$LOG_FILE") bytes"
    echo ""
    echo "  Last 10 lines:"
    tail -n 10 "$LOG_FILE" | sed 's/^/    /'
else
    echo "⚠ No output log found at $LOG_FILE"
fi

echo ""
if [[ -f "$ERROR_LOG" ]] && [[ -s "$ERROR_LOG" ]]; then
    echo "⚠ Error log has content:"
    echo "  Last 10 lines:"
    tail -n 10 "$ERROR_LOG" | sed 's/^/    /'
else
    echo "✓ No errors in error log"
fi

# Check sync timing
echo ""
echo "4. Service schedule..."
echo "The service runs every 5 minutes (300 seconds)"

# Calculate next run time
if [[ -f "$LOG_FILE" ]]; then
    LAST_MOD=$(stat -f "%m" "$LOG_FILE")
    NOW=$(date +%s)
    ELAPSED=$((NOW - LAST_MOD))
    NEXT_RUN=$((300 - ELAPSED))
    
    if [[ $NEXT_RUN -gt 0 ]]; then
        echo "Next sync in approximately $NEXT_RUN seconds"
    else
        echo "Next sync should happen any moment"
    fi
fi

# Test manual sync
echo ""
echo "5. Testing manual sync..."
CCUSAGE_BIN="/Users/dmalson/GitHub/ccusage/binaries/ccusage-macos-arm64"
if [[ -x "$CCUSAGE_BIN" ]]; then
    if "$CCUSAGE_BIN" sync --quiet; then
        echo "✓ Manual sync successful"
    else
        echo "✗ Manual sync failed"
    fi
else
    echo "✗ ccusage binary not found at $CCUSAGE_BIN"
fi

# Check server connectivity
echo ""
echo "6. Checking server connectivity..."
GUID_FILE="$HOME/.ccusage-guid"
if [[ -f "$GUID_FILE" ]]; then
    GUID=$(cat "$GUID_FILE")
    echo "Your GUID: $GUID"
    
    SERVER_URL="${CCUSAGE_SERVER_URL:-https://soothaa.pythonanywhere.com}"
    if curl -s -f "$SERVER_URL/v2/status/$GUID" >/dev/null 2>&1; then
        echo "✓ Server is reachable and has your data"
    else
        echo "⚠ Server not reachable or no data yet"
    fi
else
    echo "⚠ No GUID file found - sync will create one on first run"
fi

echo ""
echo "Test complete!"