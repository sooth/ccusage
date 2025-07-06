#!/usr/bin/env python3
"""
Deploy only the dashboard HTML to PythonAnywhere without restarting the server
"""

import requests
import sys
import os
from urllib.parse import urljoin

# PythonAnywhere configuration
USERNAME = 'soothaa'
API_BASE = 'https://www.pythonanywhere.com'
REMOTE_DASHBOARD_PATH = f'/home/{USERNAME}/mysite/dashboard_bootstrap.html'

def get_api_token():
    """Get API token from environment or use hardcoded token"""
    token = os.environ.get('PYTHONANYWHERE_API_TOKEN')
    if not token:
        # Hardcoded token for automated deployment
        token = 'f7eb94ea3a882239f48a316ac9e4c654c4c43c96'
    return token

def upload_dashboard_file(api_token):
    """Upload dashboard HTML file to PythonAnywhere"""
    local_dashboard = 'dashboard_bootstrap.html'
    
    if not os.path.exists(local_dashboard):
        print(f"Error: {local_dashboard} not found")
        return False
    
    print(f"Uploading {local_dashboard} to {REMOTE_DASHBOARD_PATH}...")
    
    with open(local_dashboard, 'rb') as f:
        response = requests.post(
            urljoin(API_BASE, f"api/v0/user/{USERNAME}/files/path{REMOTE_DASHBOARD_PATH}"),
            files={'content': f},
            headers={'Authorization': f'Token {api_token}'}
        )
    
    if response.status_code in [200, 201]:
        print("✓ Dashboard file uploaded successfully")
        return True
    else:
        print(f"✗ Dashboard upload failed: {response.status_code}")
        print(f"Response: {response.text}")
        return False

def main():
    """Main function"""
    print("=== Dashboard-Only Deployment ===")
    print("Uploading dashboard HTML without server restart...")
    
    api_token = get_api_token()
    
    if upload_dashboard_file(api_token):
        print("\n✓ Dashboard updated successfully!")
        print("No server restart needed - changes are live immediately.")
    else:
        print("\n✗ Dashboard deployment failed")
        sys.exit(1)

if __name__ == '__main__':
    main()