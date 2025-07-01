# Deployment Guide for Token Server

## Option 1: PythonAnywhere (Recommended - FREE)

### Steps:

1. **Sign up** at [pythonanywhere.com](https://www.pythonanywhere.com)

2. **Upload files**:
   - Go to "Files" tab
   - Create a new directory called `mysite` (or any name you prefer)
   - Upload:
     - `flask_app.py`
     - `requirements-server.txt`

3. **Install dependencies**:
   - Go to "Consoles" tab
   - Start a new Bash console
   - Run:
     ```bash
     cd ~/token_server
     pip3.8 install --user -r requirements-server.txt
     ```

4. **Create web app**:
   - Go to "Web" tab
   - Click "Add a new web app"
   - Choose "Manual configuration"
   - Select Python 3.8 (or latest)

5. **Configure WSGI**:
   - In the "Code" section, set:
     - Source code: `/home/yourusername/token_server`
     - Working directory: `/home/yourusername/token_server`
   - Click on the WSGI configuration file link
   - Replace contents with:

     ```python
     import sys
     import os

     # Add your project directory
     path = '/home/yourusername/token_server'
     if path not in sys.path:
         sys.path.insert(0, path)

     from token_server import app as application
     ```

6. **Reload** your web app

7. **Your server is live at**: `https://yourusername.pythonanywhere.com`

### Update ccusage Configuration:

The server URL is now hardcoded to: `https://soothaa.pythonanywhere.com`

If you deploy to your own server, you can override it with:

```bash
# Set environment variable
export CCUSAGE_SERVER_URL=https://yourusername.pythonanywhere.com

# Or add to your shell profile (.bashrc, .zshrc, etc.)
echo 'export CCUSAGE_SERVER_URL=https://yourusername.pythonanywhere.com' >> ~/.bashrc
```

## Option 2: Render.com (Also FREE)

### Steps:

1. **Create a GitHub repository** with your server files

2. **Add a `render.yaml`** file:

   ```yaml
   services:
     - type: web
       name: ccusage-token-server
       env: python
       buildCommand: pip install -r requirements-server.txt
       startCommand: python token_server.py
       envVars:
         - key: PORT
           value: 10000
   ```

3. **Sign up** at [render.com](https://render.com)

4. **Connect GitHub** and select your repository

5. **Deploy** - Render will automatically deploy your app

6. **Your server is live at**: `https://your-app-name.onrender.com`

## Option 3: Local Network Deployment

If you just want to use it on your local network:

```bash
# On your server machine
python token_server.py

# On client machines, set:
export CCUSAGE_SERVER_URL=http://192.168.1.100:9017  # Use your server's IP
```

## Testing Your Deployment

```bash
# Test the server is working
curl https://yourusername.pythonanywhere.com/health

# Expected response:
{
  "status": "healthy",
  "guids_tracked": 0,
  "hosts_tracked": 0
}
```

## Notes

- **PythonAnywhere**: Free tier never sleeps, always available
- **Render**: May spin down after inactivity on free tier
- **Data persistence**: Both options use in-memory storage (data lost on restart)
- **For persistence**: Consider upgrading to paid tier and using SQLite or PostgreSQL
