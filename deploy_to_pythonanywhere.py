#!/usr/bin/env python3
"""
Deploy ccusage Flask app to PythonAnywhere
This script uploads flask_app.py and reloads the web app
"""

import requests
import sys
import os
from urllib.parse import urljoin
import getpass

# PythonAnywhere configuration
USERNAME = 'soothaa'
DOMAIN_NAME = 'soothaa.pythonanywhere.com'
API_BASE = 'https://www.pythonanywhere.com'
REMOTE_FILE_PATH = f'/home/{USERNAME}/mysite/flask_app.py'

def get_api_token():
    """Get API token from environment or use hardcoded token"""
    token = os.environ.get('PYTHONANYWHERE_API_TOKEN')
    if not token:
        # Hardcoded token for automated deployment
        token = 'f7eb94ea3a882239f48a316ac9e4c654c4c43c96'
    return token

def upload_file(local_file_path, api_token):
    """Upload file to PythonAnywhere"""
    print(f"Uploading {local_file_path} to {REMOTE_FILE_PATH}...")
    
    with open(local_file_path, 'rb') as f:
        response = requests.post(
            urljoin(API_BASE, f"api/v0/user/{USERNAME}/files/path{REMOTE_FILE_PATH}"),
            files={'content': f},
            headers={'Authorization': f'Token {api_token}'}
        )
    
    if response.status_code == 200:
        print("✓ File updated successfully")
        return True
    elif response.status_code == 201:
        print("✓ File created successfully")
        return True
    else:
        print(f"✗ Upload failed: {response.status_code}")
        print(f"Response: {response.text}")
        return False

def reload_webapp(api_token):
    """Reload the web app to apply changes"""
    print(f"Reloading web app {DOMAIN_NAME}...")
    
    response = requests.post(
        f'{API_BASE}/api/v0/user/{USERNAME}/webapps/{DOMAIN_NAME}/reload/',
        headers={'Authorization': f'Token {api_token}'}
    )
    
    if response.status_code == 200:
        print("✓ Web app reloaded successfully")
        return True
    else:
        print(f"✗ Reload failed: {response.status_code}")
        print(f"Response: {response.text}")
        return False

def upload_dashboard_file(api_token):
    """Upload dashboard HTML file to PythonAnywhere"""
    local_dashboard = 'dashboard_bootstrap.html'
    remote_dashboard = f'/home/{USERNAME}/mysite/dashboard_bootstrap.html'
    
    if not os.path.exists(local_dashboard):
        print(f"Warning: {local_dashboard} not found, dashboard will not work")
        return False
    
    print(f"Uploading {local_dashboard} to {remote_dashboard}...")
    
    with open(local_dashboard, 'rb') as f:
        response = requests.post(
            urljoin(API_BASE, f"api/v0/user/{USERNAME}/files/path{remote_dashboard}"),
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
    """Main deployment function"""
    print("=== PythonAnywhere Deployment Script ===")
    print(f"Deploying to: {DOMAIN_NAME}")
    
    # Use the single Flask app file
    local_file = 'flask_app.py'
    if not os.path.exists(local_file):
        print(f"Error: {local_file} not found in current directory")
        sys.exit(1)
    
    print(f"Using local file: {local_file}")
    
    # Get API token
    api_token = get_api_token()
    
    # Upload Flask app
    if not upload_file(local_file, api_token):
        print("Deployment failed at upload stage")
        sys.exit(1)
    
    # Upload dashboard HTML file
    upload_dashboard_file(api_token)
    
    # Reload web app
    if not reload_webapp(api_token):
        print("Deployment failed at reload stage")
        sys.exit(1)
    
    print("\n✓ Deployment completed successfully!")
    print(f"Your updated Flask app is now live at: https://{DOMAIN_NAME}")
    print("\nNote: It may take a few seconds for changes to be visible.")

if __name__ == '__main__':
    main()