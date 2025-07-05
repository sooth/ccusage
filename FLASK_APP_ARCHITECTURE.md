# Flask App Architecture - IMPORTANT

## Current State (PROBLEMATIC)

- `flask_app.py` - Original server with all endpoints but NO database persistence
- `flask_app_deploy.py` - Enhanced with database BUT was missing endpoints
- `flask_app_v3.py` - EXACT DUPLICATE of flask_app_deploy.py (WHY?!)

## The Right Way (GOING FORWARD)

### Single Source of Truth

We should have ONE Flask app file: `flask_app.py` that includes:

- All endpoints from the original
- Database persistence features
- Proper configuration for both local and PythonAnywhere deployment

### Deployment Process

1. The SAME file should work locally and on PythonAnywhere
2. Use environment variables for configuration differences
3. The deployment script should upload `flask_app.py` directly

### Configuration

```python
# Detect environment
IS_PYTHONANYWHERE = os.environ.get('PYTHONANYWHERE_DOMAIN') is not None

# Database path
DB_PATH = os.environ.get('CLAUDE_USAGE_DB',
    '/home/soothaa/claude_usage.db' if IS_PYTHONANYWHERE else 'claude_usage.db'
)

# Logging configuration
if IS_PYTHONANYWHERE:
    logging.basicConfig(level=logging.WARNING)
else:
    logging.basicConfig(level=logging.INFO)
```

## What Went Wrong

1. Created enhanced version (`flask_app_deploy.py`) but didn't include all endpoints
2. Made a duplicate (`flask_app_v3.py`) for no reason
3. Lost track of which file had which features
4. No validation to ensure feature parity

## Prevention

1. ONE Flask app file only
2. Run `validate_endpoints.py` before any deployment
3. All changes go to the single file
4. Version control and clear commit messages
