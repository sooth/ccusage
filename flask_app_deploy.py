#!/usr/bin/env python3
"""
Server for storing Claude token usage data with project-level tracking.
Stores token data per user, hostname, and project - supports multiple projects per host.
Automatically purges expired entries based on session end times.
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


def purge_expired_entries():
    """Remove entries that have expired based on their expiresAt timestamp."""
    current_time = datetime.now(timezone.utc)
    guids_to_remove = []
    total_purged = 0
    
    for guid, hosts in list(usage_data.items()):
        hosts_to_remove = []
        
        for hostname, projects in list(hosts.items()):
            projects_to_remove = []
            
            for project_name, project_data in list(projects.items()):
                # Check if this entry has an expiration time
                expires_at_str = project_data.get('expiresAt')
                if expires_at_str:
                    try:
                        expires_at = datetime.fromisoformat(expires_at_str.replace('Z', '+00:00'))
                        if current_time > expires_at:
                            projects_to_remove.append(project_name)
                            total_purged += 1
                            logging.info(f"Purging expired project: {guid}/{hostname}/{project_name}")
                    except Exception as e:
                        logging.warning(f"Failed to parse expiresAt for {guid}/{hostname}/{project_name}: {e}")
            
            # Remove expired projects
            for project_name in projects_to_remove:
                del projects[project_name]
            
            # If all projects for a host are removed, mark host for removal
            if not projects:
                hosts_to_remove.append(hostname)
        
        # Remove empty hosts
        for hostname in hosts_to_remove:
            del hosts[hostname]
        
        # If all hosts for a GUID are removed, mark GUID for removal
        if not hosts:
            guids_to_remove.append(guid)
    
    # Remove empty GUIDs
    for guid in guids_to_remove:
        del usage_data[guid]
    
    if total_purged > 0:
        logging.info(f"Purged {total_purged} expired entries across {len(guids_to_remove)} GUIDs")


@app.route('/')
def index():
    """Welcome endpoint with server info."""
    purge_expired_entries()  # Clean up on each request
    
    total_guids = len(usage_data)
    total_hosts = sum(len(hosts) for hosts in usage_data.values())
    total_projects = sum(
        len(projects)
        for hosts in usage_data.values()
        for projects in hosts.values()
    )
    
    return jsonify({
        'service': 'Claude Token Usage Tracker',
        'version': '2.0',
        'api': 'v2',
        'features': [
            'Project-level token tracking',
            'Multi-host support',
            'Model usage breakdowns',
            'Automatic expiration of old sessions'
        ],
        'stats': {
            'total_guids': total_guids,
            'total_hosts': total_hosts,
            'total_projects': total_projects
        }
    })


@app.route('/health')
def health():
    """Health check endpoint."""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now(timezone.utc).isoformat()})


@app.route('/v2/update', methods=['POST'])
def update_v2():
    """Update token usage data with project-level information."""
    purge_expired_entries()  # Clean up before processing
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        guid = data.get('guid')
        hostname = data.get('hostname')
        projects = data.get('projects', [])
        expires_at = data.get('expiresAt')
        
        if not guid or not hostname:
            return jsonify({'error': 'Missing required fields: guid, hostname'}), 400
        
        # Initialize storage structure if needed
        if guid not in usage_data:
            usage_data[guid] = {}
        if hostname not in usage_data[guid]:
            usage_data[guid][hostname] = {}
        
        # Store each project's data
        for project in projects:
            project_name = project.get('projectName', 'default')
            tokens = project.get('tokens', {})
            
            # Calculate total tokens
            total_tokens = (
                tokens.get('inputTokens', 0) +
                tokens.get('outputTokens', 0) +
                tokens.get('cacheCreationTokens', 0) +
                tokens.get('cacheReadTokens', 0)
            )
            
            # Store project data
            project_data = {
                'hostname': hostname,
                'tokens': {
                    'inputTokens': tokens.get('inputTokens', 0),
                    'outputTokens': tokens.get('outputTokens', 0),
                    'cacheCreationTokens': tokens.get('cacheCreationTokens', 0),
                    'cacheReadTokens': tokens.get('cacheReadTokens', 0),
                    'totalTokens': total_tokens
                },
                'lastUpdated': datetime.now(timezone.utc).isoformat()
            }
            
            # Add optional fields
            if 'modelBreakdowns' in project:
                project_data['modelBreakdowns'] = project['modelBreakdowns']
            
            if expires_at:
                project_data['expiresAt'] = expires_at
            
            # Store in our data structure
            usage_data[guid][hostname][project_name] = project_data
        
        logging.info(f"Updated v2 data for GUID: {guid}, hostname: {hostname}, projects: {len(projects)}")
        return jsonify({
            'status': 'success',
            'guid': guid,
            'hostname': hostname,
            'projects_updated': len(projects)
        })
        
    except Exception as e:
        logging.error(f"Error in /v2/update: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/v2/status/<guid>')
def status_v2(guid):
    """Get usage data for a specific GUID with project detail."""
    purge_expired_entries()  # Clean up before returning data
    
    if guid not in usage_data:
        return jsonify({'error': 'GUID not found'}), 404
    
    entries = []
    for hostname, projects in usage_data[guid].items():
        # Build project list for this host
        project_list = []
        for project_name, project_data in projects.items():
            project_info = {
                'projectName': project_name,
                'tokens': project_data['tokens'],
                'lastUpdated': project_data['lastUpdated']
            }
            
            if 'modelBreakdowns' in project_data:
                project_info['modelBreakdowns'] = project_data['modelBreakdowns']
            
            if 'expiresAt' in project_data:
                project_info['expiresAt'] = project_data['expiresAt']
            
            project_list.append(project_info)
        
        # Add host entry with all its projects
        entries.append({
            'hostname': hostname,
            'projects': project_list
        })
    
    return jsonify({
        'guid': guid,
        'entries': entries
    })


@app.route('/v2/status')
def status_all_v2():
    """Get all usage data with project detail."""
    purge_expired_entries()  # Clean up before returning data
    
    result = {}
    for guid, hosts in usage_data.items():
        entries = []
        for hostname, projects in hosts.items():
            # Build project list for this host
            project_list = []
            for project_name, project_data in projects.items():
                project_info = {
                    'projectName': project_name,
                    'tokens': project_data['tokens'],
                    'lastUpdated': project_data['lastUpdated']
                }
                
                if 'modelBreakdowns' in project_data:
                    project_info['modelBreakdowns'] = project_data['modelBreakdowns']
                
                if 'expiresAt' in project_data:
                    project_info['expiresAt'] = project_data['expiresAt']
                
                project_list.append(project_info)
            
            # Add host entry with all its projects
            entries.append({
                'hostname': hostname,
                'projects': project_list
            })
        
        result[guid] = {
            'guid': guid,
            'entries': entries
        }
    
    return jsonify(result)


if __name__ == '__main__':
    app.run(debug=True, port=5001)