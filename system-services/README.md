# ccusage Automatic Sync Services

This directory contains system service files for automatically syncing Claude Code usage data to the server every 5 minutes.

## Overview

The `sync` command submits your current token usage to the ccusage server without the interactive monitoring UI. This is ideal for:
- Background synchronization across multiple machines
- Automated usage tracking without manual intervention
- Reducing resource usage compared to the full monitoring interface

## Installation

### Prerequisites

1. Install ccusage binary in `/usr/local/bin/`:
```bash
# Download the appropriate binary from releases
# For Linux:
wget https://github.com/ryoppippi/ccusage/releases/latest/download/ccusage-linux-x64.tar.gz
tar -xzf ccusage-linux-x64.tar.gz
sudo mv ccusage-linux-x64 /usr/local/bin/ccusage
sudo chmod +x /usr/local/bin/ccusage

# For macOS (Intel):
wget https://github.com/ryoppippi/ccusage/releases/latest/download/ccusage-macos-x64.tar.gz
tar -xzf ccusage-macos-x64.tar.gz
sudo mv ccusage-macos-x64 /usr/local/bin/ccusage
sudo chmod +x /usr/local/bin/ccusage

# For macOS (Apple Silicon):
wget https://github.com/ryoppippi/ccusage/releases/latest/download/ccusage-macos-arm64.tar.gz
tar -xzf ccusage-macos-arm64.tar.gz
sudo mv ccusage-macos-arm64 /usr/local/bin/ccusage
sudo chmod +x /usr/local/bin/ccusage
```

2. Verify installation:
```bash
ccusage --version
```

### Linux (systemd)

1. Copy the service files:
```bash
sudo cp ccusage-sync.service /etc/systemd/user/
sudo cp ccusage-sync.timer /etc/systemd/user/
```

2. Enable and start the timer for your user:
```bash
systemctl --user daemon-reload
systemctl --user enable ccusage-sync.timer
systemctl --user start ccusage-sync.timer
```

3. Check status:
```bash
systemctl --user status ccusage-sync.timer
systemctl --user status ccusage-sync.service
```

4. View logs:
```bash
journalctl --user -u ccusage-sync.service -f
```

### macOS (launchd)

1. Copy the plist file:
```bash
cp com.ccusage.sync.plist ~/Library/LaunchAgents/
```

2. Load the service:
```bash
launchctl load ~/Library/LaunchAgents/com.ccusage.sync.plist
```

3. Check if it's running:
```bash
launchctl list | grep ccusage
```

4. View logs:
```bash
# Standard output
tail -f /tmp/ccusage-sync.log

# Error output
tail -f /tmp/ccusage-sync.error.log
```

## Configuration

### Environment Variables

If you need to use a custom server URL, set the `CCUSAGE_SERVER_URL` environment variable:

**Linux (systemd):**
Edit the service file and add to the `[Service]` section:
```ini
Environment="CCUSAGE_SERVER_URL=https://your-server.com"
```

**macOS (launchd):**
Edit the plist file and add to the `EnvironmentVariables` dict:
```xml
<key>CCUSAGE_SERVER_URL</key>
<string>https://your-server.com</string>
```

### Sync Interval

The default sync interval is 5 minutes. To change it:

**Linux (systemd):**
Edit `/etc/systemd/user/ccusage-sync.timer` and modify:
```ini
OnUnitActiveSec=5min
```

**macOS (launchd):**
Edit `~/Library/LaunchAgents/com.ccusage.sync.plist` and modify:
```xml
<key>StartInterval</key>
<integer>300</integer>  <!-- seconds -->
```

## Troubleshooting

### Service not starting

1. Check if ccusage binary is accessible:
```bash
which ccusage
ccusage sync --help
```

2. Check for Claude data directory:
```bash
ls ~/.claude/projects/ ~/.config/claude/projects/
```

3. Test sync manually:
```bash
ccusage sync
```

### Permission issues

Ensure the service has read access to:
- `~/.claude/` or `~/.config/claude/` (Claude data)
- `~/.ccusage/` (GUID storage)

### Uninstalling

**Linux:**
```bash
systemctl --user stop ccusage-sync.timer
systemctl --user disable ccusage-sync.timer
rm /etc/systemd/user/ccusage-sync.service
rm /etc/systemd/user/ccusage-sync.timer
systemctl --user daemon-reload
```

**macOS:**
```bash
launchctl unload ~/Library/LaunchAgents/com.ccusage.sync.plist
rm ~/Library/LaunchAgents/com.ccusage.sync.plist
```

## Manual Usage

You can also run the sync command manually:

```bash
# Sync once and exit
ccusage sync

# Sync quietly (suppress non-error output)
ccusage sync --quiet

# Sync with custom session length
ccusage sync --session-length 3
```