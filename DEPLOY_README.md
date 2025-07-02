# Deploying ccusage Server to PythonAnywhere

## Important Notes
- The Flask app file **MUST** be named `flask_app.py` on PythonAnywhere
- The deployment will **overwrite** the existing file
- Site: https://soothaa.pythonanywhere.com

## Prerequisites

1. Get your PythonAnywhere API token:
   - Log into PythonAnywhere with username: soothaa
   - Go to Account > API Token tab
   - Generate a new token if you don't have one
   - Copy the token

## Deployment Steps

### Option 1: Using the deployment script (recommended)

1. Make sure `flask_app_deploy.py` or `flask_app_v2.py` exists
2. Run the deployment script:
   ```bash
   python3 deploy_to_pythonanywhere.py
   ```
3. Enter your API token when prompted
4. The script will:
   - Upload the file as `flask_app.py` (overwriting existing)
   - Reload the web app

### Option 2: Set API token in environment

```bash
export PYTHONANYWHERE_API_TOKEN="your_token_here"
python3 deploy_to_pythonanywhere.py
```

### Option 3: Manual deployment via PythonAnywhere dashboard

1. Log into PythonAnywhere
2. Go to Files tab
3. Navigate to `/home/soothaa/mysite/`
4. Upload your file as `flask_app.py` (will overwrite existing)
5. Go to Web tab
6. Click "Reload" button

## Testing the Deployment

After deployment, test the new v2 endpoints:

```bash
# Check server info
curl https://soothaa.pythonanywhere.com/

# Check health
curl https://soothaa.pythonanywhere.com/health

# Test v2 endpoints (replace with actual GUID)
curl https://soothaa.pythonanywhere.com/v2/status/{guid}
```

## Security Notes

- Never commit `deploy_config.py` if you add your API token to it
- Add `deploy_config.py` to `.gitignore`
- API tokens provide full account access - keep them secure
- The password should not be needed for API deployment

## Troubleshooting

1. **Upload fails**: Check your API token is correct
2. **Reload fails**: Ensure the domain name is exactly `soothaa.pythonanywhere.com`
3. **Site shows errors**: Check the error log in PythonAnywhere Web tab
4. **Old version still showing**: Wait a few seconds and refresh, or manually reload in Web tab

## Server Features (v2)

The deployed server now supports:
- **v1 endpoints** (backward compatible): Aggregated host-level data
- **v2 endpoints** (new): Project-level tracking
- In-memory storage (data persists until server restart)
- CORS enabled for browser clients