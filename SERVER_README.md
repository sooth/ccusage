# Token Usage Server

Simple in-memory server for tracking Claude token usage across multiple machines.

**Default Server**: https://soothaa.pythonanywhere.com

For local development: Runs on port 9017

## Features

- Stores token usage per user per hostname (multiple machines per GUID)
- In-memory storage (no persistence)
- RESTful API endpoints for submission and retrieval
- Supports multi-host aggregation
- Lightweight Flask server

## Setup

### Using the Default Server

No setup needed! The ccusage client is pre-configured to use `https://soothaa.pythonanywhere.com`.

### Running Your Own Server

```bash
pip install -r requirements-server.txt
python flask_app.py
```

## API Endpoints

### POST /update

Submit usage data:

```json
{
	"guid": "user-unique-id",
	"hostname": "machine-name",
	"tokens": {
		"inputTokens": 1234,
		"outputTokens": 567,
		"cacheCreationTokens": 890,
		"cacheReadTokens": 123
	}
}
```

### GET /status/{guid}

Get usage for all hostnames under a specific GUID. Returns:

```json
{
	"guid": "user-unique-id",
	"entries": [
		{
			"hostname": "machine-1",
			"tokens": {
				"inputTokens": 15000,
				"outputTokens": 8000,
				"cacheCreationTokens": 1000,
				"cacheReadTokens": 500,
				"totalTokens": 24500
			},
			"lastUpdated": "2024-01-01T12:00:00Z"
		},
		{
			"hostname": "machine-2",
			"tokens": {
				"inputTokens": 25000,
				"outputTokens": 12000,
				"cacheCreationTokens": 2000,
				"cacheReadTokens": 1000,
				"totalTokens": 40000
			},
			"lastUpdated": "2024-01-01T12:00:00Z"
		}
	]
}
```

### GET /status

Get all users' usage data

### GET /health

Server health check

## Example Usage

- `client_example.py` - Basic single-host submission example
- `test_multi_host.py` - Multi-host aggregation testing

## Multi-Host Support

The server now supports tracking multiple machines per user GUID:

- Each hostname maintains its own token counts
- The ccusage live monitor automatically aggregates local + remote tokens
- Remote hosts are displayed separately in the live monitor UI
