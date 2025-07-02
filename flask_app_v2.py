#!/usr/bin/env python3
"""
Enhanced server for storing Claude token usage data with project-level tracking.
Stores token data per user, hostname, and project - supports multiple projects per host.
Backward compatible with v1 API while adding new project-aware endpoints.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timezone
import logging
import os
from typing import Dict, Any, List, Optional

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

# In-memory storage: {guid: {hostname: {projectName: {data}}}}
usage_data: Dict[str, Dict[str, Dict[str, Any]]] = {}


def aggregate_host_data(projects: Dict[str, Any]) -> Dict[str, Any]:
    """Aggregate all project data for a host into a single entry (for backward compatibility)."""
    total_tokens = {
        'inputTokens': 0,
        'outputTokens': 0,
        'cacheCreationTokens': 0,
        'cacheReadTokens': 0,
        'totalTokens': 0
    }
    
    # Aggregate model breakdowns across all projects
    model_breakdowns_map: Dict[str, Any] = {}
    last_updated = None
    hostname = None
    
    for project_name, project_data in projects.items():
        # Get hostname from first project
        if hostname is None:
            hostname = project_data['hostname']
        
        # Sum up tokens
        tokens = project_data['tokens']
        for key in ['inputTokens', 'outputTokens', 'cacheCreationTokens', 'cacheReadTokens']:
            total_tokens[key] += tokens[key]
        total_tokens['totalTokens'] += tokens['totalTokens']
        
        # Track most recent update
        project_time = project_data['lastUpdated']
        if last_updated is None or project_time > last_updated:
            last_updated = project_time
        
        # Aggregate model breakdowns
        if 'modelBreakdowns' in project_data:
            for mb in project_data['modelBreakdowns']:
                model_name = mb['modelName']
                if model_name not in model_breakdowns_map:
                    model_breakdowns_map[model_name] = {
                        'modelName': model_name,
                        'inputTokens': 0,
                        'outputTokens': 0,
                        'cacheCreationInputTokens': 0,
                        'cacheReadInputTokens': 0,
                        'cost': 0
                    }
                
                model_breakdowns_map[model_name]['inputTokens'] += mb.get('inputTokens', 0)
                model_breakdowns_map[model_name]['outputTokens'] += mb.get('outputTokens', 0)
                model_breakdowns_map[model_name]['cacheCreationInputTokens'] += mb.get('cacheCreationInputTokens', 0)
                model_breakdowns_map[model_name]['cacheReadInputTokens'] += mb.get('cacheReadInputTokens', 0)
                model_breakdowns_map[model_name]['cost'] += mb.get('cost', 0)
    
    result = {
        'hostname': hostname,
        'tokens': total_tokens,
        'lastUpdated': last_updated
    }
    
    if model_breakdowns_map:
        result['modelBreakdowns'] = list(model_breakdowns_map.values())
    
    return result


@app.route('/update', methods=['POST'])
def update_usage():
    """Update token usage data for a user. Backward compatible with v1 API."""
    try:
        data = request.json
        
        # Validate required fields
        if not data or 'guid' not in data or 'hostname' not in data or 'tokens' not in data:
            return jsonify({'error': 'Missing required fields: guid, hostname, tokens'}), 400
        
        guid = data['guid']
        hostname = data['hostname']
        tokens = data['tokens']
        
        # Validate token structure
        required_token_fields = ['inputTokens', 'outputTokens', 'cacheCreationTokens', 'cacheReadTokens']
        if not all(field in tokens for field in required_token_fields):
            return jsonify({'error': f'Tokens must include: {required_token_fields}'}), 400
        
        # Initialize storage structure if needed
        if guid not in usage_data:
            usage_data[guid] = {}
        if hostname not in usage_data[guid]:
            usage_data[guid][hostname] = {}
        
        # Determine project name (default for backward compatibility)
        project_name = 'default'
        
        # Build entry data
        entry_data = {
            'hostname': hostname,
            'projectName': project_name,
            'tokens': {
                'inputTokens': int(tokens['inputTokens']),
                'outputTokens': int(tokens['outputTokens']),
                'cacheCreationTokens': int(tokens['cacheCreationTokens']),
                'cacheReadTokens': int(tokens['cacheReadTokens']),
                'totalTokens': sum(int(tokens[field]) for field in required_token_fields)
            },
            'lastUpdated': datetime.now(timezone.utc).isoformat()
        }
        
        # Add model breakdowns if provided
        if 'modelBreakdowns' in data and data['modelBreakdowns']:
            entry_data['modelBreakdowns'] = data['modelBreakdowns']
        
        # Store data
        usage_data[guid][hostname][project_name] = entry_data
        
        logging.info(f"Updated usage for {guid}/{hostname}/{project_name} (v1 API)")
        return jsonify({'status': 'success'}), 200
        
    except Exception as e:
        logging.error(f"Error updating usage: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/v2/update', methods=['POST'])
def update_usage_v2():
    """Update token usage data with project-level tracking."""
    try:
        data = request.json
        
        # Validate required fields
        if not data or 'guid' not in data or 'hostname' not in data or 'projects' not in data:
            return jsonify({'error': 'Missing required fields: guid, hostname, projects'}), 400
        
        guid = data['guid']
        hostname = data['hostname']
        projects = data['projects']
        
        if not isinstance(projects, list) or len(projects) == 0:
            return jsonify({'error': 'Projects must be a non-empty array'}), 400
        
        # Initialize storage structure if needed
        if guid not in usage_data:
            usage_data[guid] = {}
        if hostname not in usage_data[guid]:
            usage_data[guid][hostname] = {}
        
        # Process each project
        for project in projects:
            if 'projectName' not in project or 'tokens' not in project:
                return jsonify({'error': 'Each project must have projectName and tokens'}), 400
            
            project_name = project['projectName']
            tokens = project['tokens']
            
            # Validate token structure
            required_token_fields = ['inputTokens', 'outputTokens', 'cacheCreationTokens', 'cacheReadTokens']
            if not all(field in tokens for field in required_token_fields):
                return jsonify({'error': f'Tokens must include: {required_token_fields}'}), 400
            
            # Build entry data
            entry_data = {
                'hostname': hostname,
                'projectName': project_name,
                'tokens': {
                    'inputTokens': int(tokens['inputTokens']),
                    'outputTokens': int(tokens['outputTokens']),
                    'cacheCreationTokens': int(tokens['cacheCreationTokens']),
                    'cacheReadTokens': int(tokens['cacheReadTokens']),
                    'totalTokens': sum(int(tokens[field]) for field in required_token_fields)
                },
                'lastUpdated': datetime.now(timezone.utc).isoformat()
            }
            
            # Add model breakdowns if provided
            if 'modelBreakdowns' in project and project['modelBreakdowns']:
                entry_data['modelBreakdowns'] = project['modelBreakdowns']
            
            # Store data
            usage_data[guid][hostname][project_name] = entry_data
            
        logging.info(f"Updated usage for {guid}/{hostname} with {len(projects)} projects (v2 API)")
        return jsonify({'status': 'success', 'projects_updated': len(projects)}), 200
        
    except Exception as e:
        logging.error(f"Error updating usage v2: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/status/<guid>', methods=['GET'])
def get_user_status(guid: str):
    """Get current usage data for all hostnames under a specific GUID (v1 backward compatible)."""
    if guid in usage_data:
        # Aggregate project data per host for backward compatibility
        entries = []
        for hostname, projects in usage_data[guid].items():
            entries.append(aggregate_host_data(projects))
        
        return jsonify({
            'guid': guid,
            'entries': entries
        }), 200
    return jsonify({'error': 'User not found'}), 404


@app.route('/v2/status/<guid>', methods=['GET'])
def get_user_status_v2(guid: str):
    """Get current usage data with project-level detail."""
    if guid in usage_data:
        # Return detailed project-level data
        entries = []
        for hostname, projects in usage_data[guid].items():
            host_entry = {
                'hostname': hostname,
                'projects': list(projects.values())
            }
            entries.append(host_entry)
        
        return jsonify({
            'guid': guid,
            'entries': entries
        }), 200
    return jsonify({'error': 'User not found'}), 404


@app.route('/status', methods=['GET'])
def get_all_status():
    """Get usage data for all users (admin endpoint)."""
    # Count total unique hostnames and projects
    total_hosts = sum(len(hosts) for hosts in usage_data.values())
    total_projects = sum(
        len(projects) 
        for hosts in usage_data.values() 
        for projects in hosts.values()
    )
    
    # Convert to v1 format for backward compatibility
    v1_data = {}
    for guid, hosts in usage_data.items():
        v1_data[guid] = {}
        for hostname, projects in hosts.items():
            v1_data[guid][hostname] = aggregate_host_data(projects)
    
    return jsonify({
        'guids': len(usage_data),
        'total_hosts': total_hosts,
        'total_projects': total_projects,
        'data': v1_data
    }), 200


@app.route('/v2/status', methods=['GET'])
def get_all_status_v2():
    """Get usage data for all users with project detail (admin endpoint)."""
    # Count total unique hostnames and projects
    total_hosts = sum(len(hosts) for hosts in usage_data.values())
    total_projects = sum(
        len(projects) 
        for hosts in usage_data.values() 
        for projects in hosts.values()
    )
    
    return jsonify({
        'guids': len(usage_data),
        'total_hosts': total_hosts,
        'total_projects': total_projects,
        'data': usage_data
    }), 200


@app.route('/', methods=['GET'])
def home():
    """Home page with basic info."""
    total_hosts = sum(len(hosts) for hosts in usage_data.values())
    total_projects = sum(
        len(projects) 
        for hosts in usage_data.values() 
        for projects in hosts.values()
    )
    
    return jsonify({
        'service': 'ccusage Token Tracking Server',
        'version': '2.0.0',
        'endpoints': {
            'v1 (backward compatible)': {
                'POST /update': 'Submit token usage data (aggregated)',
                'GET /status/{guid}': 'Get usage for specific GUID (aggregated)',
                'GET /status': 'Get all usage data (aggregated)'
            },
            'v2 (project-aware)': {
                'POST /v2/update': 'Submit token usage data with project detail',
                'GET /v2/status/{guid}': 'Get usage for specific GUID with project detail',
                'GET /v2/status': 'Get all usage data with project detail'
            },
            'other': {
                'GET /health': 'Health check'
            }
        },
        'stats': {
            'guids_tracked': len(usage_data),
            'hosts_tracked': total_hosts,
            'projects_tracked': total_projects
        }
    }), 200


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    total_hosts = sum(len(hosts) for hosts in usage_data.values())
    total_projects = sum(
        len(projects) 
        for hosts in usage_data.values() 
        for projects in hosts.values()
    )
    
    return jsonify({
        'status': 'healthy',
        'version': '2.0.0',
        'guids_tracked': len(usage_data),
        'hosts_tracked': total_hosts,
        'projects_tracked': total_projects
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