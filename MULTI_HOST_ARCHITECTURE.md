# Multi-Host Token Tracking Architecture

## Overview

The ccusage live monitor now supports tracking Claude token usage across multiple machines sharing the same user GUID.

## How It Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Machine A     │     │   Machine B     │     │   Machine C     │
│  (workstation)  │     │    (laptop)     │     │   (cloud VM)    │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ Local Tokens:   │     │ Local Tokens:   │     │ Local Tokens:   │
│   15,000        │     │   25,000        │     │   35,000        │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │  Submit every 30s     │                       │
         └───────────────────────┴───────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────┐
                    │   Token Server      │
                    │   (Port 9017)       │
                    ├─────────────────────┤
                    │ Stores per GUID:    │
                    │ - Machine A: 15k    │
                    │ - Machine B: 25k    │
                    │ - Machine C: 35k    │
                    └─────────────────────┘
                                 │
                                 │ Fetch all entries
                                 ▼
                    ┌─────────────────────┐
                    │ Live Monitor on     │
                    │ Machine A shows:    │
                    ├─────────────────────┤
                    │ Local:  15,000      │
                    │ Remote: 60,000 (2)  │
                    │ Total:  75,000      │
                    └─────────────────────┘
```

## Key Features

1. **Automatic GUID Generation**: Each user gets a persistent GUID stored in `~/.ccusage-guid`

2. **Per-Hostname Storage**: Server maintains separate entries for each hostname under the same GUID

3. **Smart Aggregation**: Each client:
   - Submits its local data
   - Fetches all entries for its GUID
   - Excludes its own hostname to avoid double-counting
   - Displays local vs remote breakdown

4. **Live Updates**: Data is submitted and fetched every 30 seconds

## Display Examples

### Full Display (Wide Terminal)

```
┌──────────────────────────────────────────────────┐
│    CLAUDE CODE - LIVE TOKEN USAGE MONITOR        │
├──────────────────────────────────────────────────┤
│ Local: 15,234  Remote: 60,123 (2 hosts)         │
│ Total: 75,357  Cost: $1.23                      │
└──────────────────────────────────────────────────┘
```

### Compact Display (Narrow Terminal)

```
Local: 15,234
Remote: 60,123 (2 hosts)
Total: 75,357
Cost: $1.23
```

## Environment Variables

- `CCUSAGE_SERVER_URL`: Override default server URL (default: `https://soothaa.pythonanywhere.com`)

## Testing

Run `test_multi_host.py` to simulate multiple hosts and verify aggregation works correctly.
