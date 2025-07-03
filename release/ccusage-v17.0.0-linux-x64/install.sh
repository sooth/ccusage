#!/bin/bash
# Installation script for ccusage v17.0.0

echo "Installing ccusage v17.0.0..."

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is required but not installed."
    echo "Please install Node.js >= 20.19.3 first."
    exit 1
fi

# Check node version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="20.19.3"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "Error: Node.js version $NODE_VERSION is installed, but version >= $REQUIRED_VERSION is required."
    exit 1
fi

# Install globally
echo "Installing ccusage globally..."
npm install -g .

echo "✓ Installation complete!"
echo ""
echo "Usage:"
echo "  ccusage daily          - Show daily usage report"
echo "  ccusage monthly        - Show monthly usage report"
echo "  ccusage session        - Show session-based usage report"
echo "  ccusage blocks         - Show 5-hour billing blocks usage report"
echo "  ccusage blocks-monitor - Monitor active block usage in real-time (CLI)"
echo ""
echo "For more information, run: ccusage --help"