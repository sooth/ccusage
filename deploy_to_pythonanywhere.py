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
    """Get API token from environment or prompt user"""
    token = os.environ.get('PYTHONANYWHERE_API_TOKEN')
    if not token:
        print("API token not found in environment.")
        print("To get your API token:")
        print("1. Log into PythonAnywhere")
        print("2. Go to Account > API Token tab")
        print("3. Generate a new token if needed")
        print("4. Copy the token")
        token = getpass.getpass("Enter your PythonAnywhere API token: ")
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

def main():
    """Main deployment function"""
    print("=== PythonAnywhere Deployment Script ===")
    print(f"Deploying to: {DOMAIN_NAME}")
    
    # Check if flask_app_deploy.py exists
    local_file = 'flask_app_deploy.py'
    if not os.path.exists(local_file):
        # Try flask_app_v2.py as fallback
        local_file = 'flask_app_v2.py'
        if not os.path.exists(local_file):
            print(f"Error: {local_file} not found in current directory")
            sys.exit(1)
    
    print(f"Using local file: {local_file}")
    
    # Get API token
    api_token = get_api_token()
    
    # Upload file
    if not upload_file(local_file, api_token):
        print("Deployment failed at upload stage")
        sys.exit(1)
    
    # Reload web app
    if not reload_webapp(api_token):
        print("Deployment failed at reload stage")
        sys.exit(1)
    
    print("\n✓ Deployment completed successfully!")
    print(f"Your updated Flask app is now live at: https://{DOMAIN_NAME}")
    print("\nNote: It may take a few seconds for changes to be visible.")

if __name__ == '__main__':
    main()