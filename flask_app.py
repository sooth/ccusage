#!/usr/bin/env python3
"""
Simple in-memory server for storing latest Claude token usage data per user.
Stores token data, hostname, and user GUID - overwrites on each update.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timezone
import logging
import os
from typing import Dict, Any

app = Flask(__name__)

# Enable CORS for all routes (allows browser-based clients)
CORS(app)

# Configure logging based on environment
if os.environ.get('PYTHONANYWHERE_DOMAIN'):
    # Use PythonAnywhere's logging
    logging.basicConfig(level=logging.WARNING, format='%(asctime)s - %(levelname)s - %(message)s')
else:
    # Local development logging
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# In-memory storage: {guid: {hostname: {data}}}
usage_data: Dict[str, Dict[str, Any]] = {}


@app.route('/update', methods=['POST'])
def update_usage():
    """Update token usage data for a user."""
    try:
        data = request.json
        
        # Validate required fields
        if not data or 'guid' not in data or 'hostname' not in data or 'tokens' not in data:
            return jsonify({'error': 'Missing required fields: guid, hostname, tokens'}), 400
        
        guid = data['guid']
        tokens = data['tokens']
        
        # Validate token structure
        required_token_fields = ['inputTokens', 'outputTokens', 'cacheCreationTokens', 'cacheReadTokens']
        if not all(field in tokens for field in required_token_fields):
            return jsonify({'error': f'Tokens must include: {required_token_fields}'}), 400
        
        # Initialize guid entry if not exists
        if guid not in usage_data:
            usage_data[guid] = {}
        
        # Store/overwrite data for this hostname
        hostname = data['hostname']
        usage_data[guid][hostname] = {
            'hostname': hostname,
            'tokens': {
                'inputTokens': int(tokens['inputTokens']),
                'outputTokens': int(tokens['outputTokens']),
                'cacheCreationTokens': int(tokens['cacheCreationTokens']),
                'cacheReadTokens': int(tokens['cacheReadTokens']),
                'totalTokens': sum(int(tokens[field]) for field in required_token_fields)
            },
            'lastUpdated': datetime.now(timezone.utc).isoformat()
        }
        
        logging.info(f"Updated usage for {guid} from {hostname}")
        return jsonify({'status': 'success'}), 200
        
    except Exception as e:
        logging.error(f"Error updating usage: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/status/<guid>', methods=['GET'])
def get_user_status(guid: str):
    """Get current usage data for all hostnames under a specific GUID."""
    if guid in usage_data:
        # Return all hostname entries for this GUID
        return jsonify({
            'guid': guid,
            'entries': list(usage_data[guid].values())
        }), 200
    return jsonify({'error': 'User not found'}), 404


@app.route('/status', methods=['GET'])
def get_all_status():
    """Get usage data for all users (admin endpoint)."""
    # Count total unique hostnames across all GUIDs
    total_hosts = sum(len(hosts) for hosts in usage_data.values())
    return jsonify({
        'guids': len(usage_data),
        'total_hosts': total_hosts,
        'data': usage_data
    }), 200


@app.route('/', methods=['GET'])
def home():
    """Home page with basic info."""
    total_hosts = sum(len(hosts) for hosts in usage_data.values())
    return jsonify({
        'service': 'ccusage Token Tracking Server',
        'version': '1.0.0',
        'endpoints': {
            'POST /update': 'Submit token usage data',
            'GET /status/{guid}': 'Get usage for specific GUID',
            'GET /status': 'Get all usage data',
            'GET /health': 'Health check'
        },
        'stats': {
            'guids_tracked': len(usage_data),
            'hosts_tracked': total_hosts
        }
    }), 200


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    total_hosts = sum(len(hosts) for hosts in usage_data.values())
    return jsonify({
        'status': 'healthy',
        'guids_tracked': len(usage_data),
        'hosts_tracked': total_hosts
    }), 200


if __name__ == '__main__':
    # For local development
    import os
    port = int(os.environ.get('PORT', 9017))
    
    # Check if running on PythonAnywhere
    if 'PYTHONANYWHERE_DOMAIN' in os.environ:
        # PythonAnywhere handles the WSGI server
        # This block won't actually run on PythonAnywhere
        pass
    else:
        # For local development or other platforms
        app.run(host='0.0.0.0', port=port, debug=False)