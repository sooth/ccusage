# Server Deployment Instructions for PythonAnywhere

## Overview
This guide explains how to deploy the updated Claude Token Usage Tracker server (v3) to PythonAnywhere.

## Prerequisites
- A PythonAnywhere account (free tier is sufficient)
- Access to the PythonAnywhere web interface

## Deployment Steps

### 1. Upload the Server File
1. Log in to your PythonAnywhere account
2. Go to the "Files" tab
3. Navigate to your web app directory (e.g., `/home/yourusername/mysite/`)
4. Upload or replace the `flask_app.py` file with the new version from this repository

### 2. Install Required Dependencies
Open a Bash console in PythonAnywhere and run:
```bash
pip3.8 install --user flask flask-cors
```

### 3. Reload the Web App
1. Go to the "Web" tab
2. Click the "Reload" button for your web app
3. The server should now be running with the new features

## New Features in v3

### Enhanced Endpoints
- **POST /v2/update** - Submit token usage data with automatic archival
- **GET /v2/status/{guid}** - Get current session data
- **GET /v2/daily/{guid}** - Get daily usage aggregated across all hosts (NEW)
- **GET /v2/monthly/{guid}** - Get monthly usage aggregated across all hosts (NEW)

### Data Management
- Dual storage: Current session data + Historical daily aggregates
- Automatic archival when sessions expire (based on expiresAt timestamp)
- Multi-host aggregation for daily/monthly reports
- Project-level tracking with model breakdowns

### Query Parameters for Daily/Monthly
- `since` - Start date (ISO format, e.g., "2025-01-01")
- `until` - End date (ISO format, e.g., "2025-12-31")

Example:
```
GET /v2/daily/{guid}?since=2025-01-01&until=2025-01-31
```

## Testing the Deployment

### 1. Check Server Status
```bash
curl https://yourdomain.pythonanywhere.com/
```

Should return:
```json
{
  "service": "Claude Token Usage Tracker",
  "version": "3.0",
  "api": "v3",
  "features": [...]
}
```

### 2. Test Data Submission
```bash
curl -X POST https://yourdomain.pythonanywhere.com/v2/update \
  -H "Content-Type: application/json" \
  -d '{
    "guid": "test-guid",
    "hostname": "test-host",
    "projects": [{
      "projectName": "test-project",
      "tokens": {
        "inputTokens": 100,
        "outputTokens": 50,
        "cacheCreationTokens": 10,
        "cacheReadTokens": 5
      }
    }],
    "expiresAt": "2025-12-31T23:59:59Z"
  }'
```

### 3. Test Daily Endpoint
```bash
curl https://yourdomain.pythonanywhere.com/v2/daily/test-guid
```

## Client Configuration

To use the server with ccusage, set the environment variable:
```bash
export CCUSAGE_SERVER_URL=https://yourdomain.pythonanywhere.com
```

Then use the `--server` flag:
```bash
ccusage daily --server
ccusage monthly --server
```

## Important Notes

1. **Data Persistence**: The current implementation uses in-memory storage. Data will be lost when the server restarts. For production use, consider adding database persistence.

2. **Memory Limits**: PythonAnywhere free tier has memory limits. Monitor your usage if tracking many GUIDs.

3. **Rate Limits**: Be aware of PythonAnywhere's rate limits on the free tier.

4. **Security**: Consider adding authentication if sensitive data is being tracked.

## Troubleshooting

### Server Not Responding
1. Check the error log in PythonAnywhere's "Web" tab
2. Ensure all dependencies are installed
3. Verify the Python version (should be 3.8+)

### Data Not Persisting
Remember that the server uses in-memory storage. Data is lost on restart.

### CORS Issues
The server has CORS enabled for all origins. If you need to restrict this, modify the CORS configuration in `flask_app.py`.