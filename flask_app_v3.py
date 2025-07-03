#!/usr/bin/env python3
"""
Enhanced server for storing Claude token usage data with historical tracking.
Stores both current session data and historical daily/monthly aggregates.
Supports project-level tracking and multi-host aggregation.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timezone, timedelta
import logging
import os
from typing import Dict, Any, List, Optional
from collections import defaultdict

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

# In-memory storage
# Current session data: {guid: {hostname: {projectName: {data}}}}
current_data: Dict[str, Dict[str, Dict[str, Any]]] = {}

# Historical data: {guid: {date: {hostname: {projectName: {aggregated_data}}}}}
historical_data: Dict[str, Dict[str, Dict[str, Dict[str, Any]]]] = {}


def get_date_key(timestamp_str: str) -> str:
    """Extract date key (YYYY-MM-DD) from ISO timestamp."""
    try:
        dt = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
        return dt.strftime('%Y-%m-%d')
    except:
        return datetime.now(timezone.utc).strftime('%Y-%m-%d')


def aggregate_tokens(existing: Dict[str, Any], new_data: Dict[str, Any]) -> Dict[str, Any]:
    """Aggregate token counts and model breakdowns."""
    if not existing:
        return new_data.copy()
    
    # Aggregate tokens
    for token_type in ['inputTokens', 'outputTokens', 'cacheCreationTokens', 'cacheReadTokens', 'totalTokens']:
        existing[token_type] = existing.get(token_type, 0) + new_data.get(token_type, 0)
    
    # Update cost
    existing['cost'] = existing.get('cost', 0) + new_data.get('cost', 0)
    
    # Aggregate model breakdowns
    if 'modelBreakdowns' in new_data:
        existing_models = {mb['modelName']: mb for mb in existing.get('modelBreakdowns', [])}
        
        for new_mb in new_data['modelBreakdowns']:
            model_name = new_mb['modelName']
            if model_name in existing_models:
                # Aggregate existing model data
                mb = existing_models[model_name]
                mb['inputTokens'] += new_mb.get('inputTokens', 0)
                mb['outputTokens'] += new_mb.get('outputTokens', 0)
                mb['cacheCreationInputTokens'] += new_mb.get('cacheCreationInputTokens', 0)
                mb['cacheReadInputTokens'] += new_mb.get('cacheReadInputTokens', 0)
                mb['cost'] += new_mb.get('cost', 0)
            else:
                # Add new model
                existing_models[model_name] = new_mb.copy()
        
        existing['modelBreakdowns'] = list(existing_models.values())
    
    # Update timestamp to latest
    existing['lastUpdated'] = new_data.get('lastUpdated', datetime.now(timezone.utc).isoformat())
    
    return existing


def archive_to_historical(guid: str, hostname: str, project_name: str, project_data: Dict[str, Any]):
    """Archive current data to historical storage."""
    date_key = get_date_key(project_data.get('lastUpdated', ''))
    
    # Initialize nested structure if needed
    if guid not in historical_data:
        historical_data[guid] = {}
    if date_key not in historical_data[guid]:
        historical_data[guid][date_key] = {}
    if hostname not in historical_data[guid][date_key]:
        historical_data[guid][date_key][hostname] = {}
    
    # Prepare data for archiving (remove expiration)
    archive_data = {
        'tokens': project_data['tokens'],
        'lastUpdated': project_data['lastUpdated'],
        'cost': project_data['tokens']['totalTokens'] * 0.000001  # Simplified cost calculation
    }
    
    if 'modelBreakdowns' in project_data:
        archive_data['modelBreakdowns'] = project_data['modelBreakdowns']
    
    # Aggregate with existing historical data
    if project_name in historical_data[guid][date_key][hostname]:
        historical_data[guid][date_key][hostname][project_name] = aggregate_tokens(
            historical_data[guid][date_key][hostname][project_name],
            archive_data
        )
    else:
        historical_data[guid][date_key][hostname][project_name] = archive_data


def purge_expired_entries():
    """Remove expired entries and archive them to historical data."""
    current_time = datetime.now(timezone.utc)
    guids_to_remove = []
    total_purged = 0
    
    for guid, hosts in list(current_data.items()):
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
                            # Archive before removing
                            archive_to_historical(guid, hostname, project_name, project_data)
                            projects_to_remove.append(project_name)
                            total_purged += 1
                            logging.info(f"Archiving and purging expired project: {guid}/{hostname}/{project_name}")
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
        del current_data[guid]
    
    if total_purged > 0:
        logging.info(f"Archived and purged {total_purged} expired entries")


@app.route('/')
def index():
    """Welcome endpoint with server info."""
    purge_expired_entries()  # Clean up on each request
    
    total_guids = len(set(list(current_data.keys()) + list(historical_data.keys())))
    total_current = sum(
        len(projects)
        for hosts in current_data.values()
        for projects in hosts.values()
    )
    total_historical_days = sum(
        len(dates)
        for dates in historical_data.values()
    )
    
    return jsonify({
        'service': 'Claude Token Usage Tracker',
        'version': '3.0',
        'api': 'v3',
        'features': [
            'Project-level token tracking',
            'Multi-host support',
            'Model usage breakdowns',
            'Automatic expiration and archival',
            'Historical daily/monthly data',
            'Time-based aggregation'
        ],
        'stats': {
            'total_guids': total_guids,
            'current_entries': total_current,
            'historical_days': total_historical_days
        }
    })


@app.route('/health')
def health():
    """Health check endpoint."""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now(timezone.utc).isoformat()})


@app.route('/v2/update', methods=['POST'])
def update_v2():
    """Update token usage data with project-level information."""
    purge_expired_entries()  # Clean up and archive before processing
    
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
        if guid not in current_data:
            current_data[guid] = {}
        if hostname not in current_data[guid]:
            current_data[guid][hostname] = {}
        
        # Store each project's data
        updated_projects = []
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
            
            # Store in current data
            current_data[guid][hostname][project_name] = project_data
            updated_projects.append(project_name)
            
            # Also update historical data for today
            archive_to_historical(guid, hostname, project_name, project_data)
        
        logging.info(f"Updated data for GUID: {guid}, hostname: {hostname}, projects: {updated_projects}")
        return jsonify({
            'status': 'success',
            'guid': guid,
            'hostname': hostname,
            'projects_updated': len(updated_projects)
        })
        
    except Exception as e:
        logging.error(f"Error in /v2/update: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/v2/status/<guid>')
def status_v2(guid):
    """Get current usage data for a specific GUID."""
    purge_expired_entries()  # Clean up before returning data
    
    if guid not in current_data:
        return jsonify({'error': 'GUID not found'}), 404
    
    entries = []
    for hostname, projects in current_data[guid].items():
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


@app.route('/v2/daily/<guid>')
def daily_usage(guid):
    """Get daily usage aggregated across all hosts and projects."""
    purge_expired_entries()
    
    # Get date range from query params
    since = request.args.get('since')
    until = request.args.get('until')
    
    # Determine date range
    if until:
        end_date = datetime.fromisoformat(until.replace('Z', '+00:00')).date()
    else:
        end_date = datetime.now(timezone.utc).date()
    
    if since:
        start_date = datetime.fromisoformat(since.replace('Z', '+00:00')).date()
    else:
        # Default to last 30 days
        start_date = end_date - timedelta(days=30)
    
    # Collect daily data
    daily_data = []
    
    if guid in historical_data:
        for date_str, hosts in historical_data[guid].items():
            date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
            
            # Check if date is in range
            if start_date <= date_obj <= end_date:
                # Aggregate across all hosts and projects for this date
                day_totals = {
                    'date': date_str,
                    'inputTokens': 0,
                    'outputTokens': 0,
                    'cacheCreationTokens': 0,
                    'cacheReadTokens': 0,
                    'totalTokens': 0,
                    'cost': 0,
                    'hosts': {},
                    'projects': {},
                    'modelBreakdowns': {}
                }
                
                for hostname, projects in hosts.items():
                    day_totals['hosts'][hostname] = True
                    
                    for project_name, project_data in projects.items():
                        day_totals['projects'][project_name] = True
                        
                        # Aggregate tokens
                        tokens = project_data.get('tokens', {})
                        day_totals['inputTokens'] += tokens.get('inputTokens', 0)
                        day_totals['outputTokens'] += tokens.get('outputTokens', 0)
                        day_totals['cacheCreationTokens'] += tokens.get('cacheCreationTokens', 0)
                        day_totals['cacheReadTokens'] += tokens.get('cacheReadTokens', 0)
                        day_totals['totalTokens'] += tokens.get('totalTokens', 0)
                        day_totals['cost'] += project_data.get('cost', 0)
                        
                        # Aggregate model breakdowns
                        if 'modelBreakdowns' in project_data:
                            for mb in project_data['modelBreakdowns']:
                                model_name = mb['modelName']
                                if model_name not in day_totals['modelBreakdowns']:
                                    day_totals['modelBreakdowns'][model_name] = {
                                        'modelName': model_name,
                                        'inputTokens': 0,
                                        'outputTokens': 0,
                                        'cacheCreationInputTokens': 0,
                                        'cacheReadInputTokens': 0,
                                        'cost': 0
                                    }
                                
                                model = day_totals['modelBreakdowns'][model_name]
                                model['inputTokens'] += mb.get('inputTokens', 0)
                                model['outputTokens'] += mb.get('outputTokens', 0)
                                model['cacheCreationInputTokens'] += mb.get('cacheCreationInputTokens', 0)
                                model['cacheReadInputTokens'] += mb.get('cacheReadInputTokens', 0)
                                model['cost'] += mb.get('cost', 0)
                
                # Convert sets to counts
                day_totals['hostCount'] = len(day_totals['hosts'])
                day_totals['projectCount'] = len(day_totals['projects'])
                day_totals['modelBreakdowns'] = list(day_totals['modelBreakdowns'].values())
                del day_totals['hosts']
                del day_totals['projects']
                
                daily_data.append(day_totals)
    
    # Sort by date
    daily_data.sort(key=lambda x: x['date'])
    
    return jsonify({
        'guid': guid,
        'daily': daily_data,
        'dateRange': {
            'since': start_date.isoformat(),
            'until': end_date.isoformat()
        }
    })


@app.route('/v2/monthly/<guid>')
def monthly_usage(guid):
    """Get monthly usage aggregated across all hosts and projects."""
    purge_expired_entries()
    
    # Get date range from query params
    since = request.args.get('since')
    until = request.args.get('until')
    
    # Determine date range
    if until:
        end_date = datetime.fromisoformat(until.replace('Z', '+00:00')).date()
    else:
        end_date = datetime.now(timezone.utc).date()
    
    if since:
        start_date = datetime.fromisoformat(since.replace('Z', '+00:00')).date()
    else:
        # Default to last 12 months
        start_date = (end_date - timedelta(days=365)).replace(day=1)
    
    # Collect monthly data
    monthly_data = defaultdict(lambda: {
        'inputTokens': 0,
        'outputTokens': 0,
        'cacheCreationTokens': 0,
        'cacheReadTokens': 0,
        'totalTokens': 0,
        'cost': 0,
        'days': 0,
        'hosts': set(),
        'projects': set(),
        'modelBreakdowns': {}
    })
    
    if guid in historical_data:
        for date_str, hosts in historical_data[guid].items():
            date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
            
            # Check if date is in range
            if start_date <= date_obj <= end_date:
                month_key = date_obj.strftime('%Y-%m')
                month_data = monthly_data[month_key]
                month_data['days'] += 1
                
                for hostname, projects in hosts.items():
                    month_data['hosts'].add(hostname)
                    
                    for project_name, project_data in projects.items():
                        month_data['projects'].add(project_name)
                        
                        # Aggregate tokens
                        tokens = project_data.get('tokens', {})
                        month_data['inputTokens'] += tokens.get('inputTokens', 0)
                        month_data['outputTokens'] += tokens.get('outputTokens', 0)
                        month_data['cacheCreationTokens'] += tokens.get('cacheCreationTokens', 0)
                        month_data['cacheReadTokens'] += tokens.get('cacheReadTokens', 0)
                        month_data['totalTokens'] += tokens.get('totalTokens', 0)
                        month_data['cost'] += project_data.get('cost', 0)
                        
                        # Aggregate model breakdowns
                        if 'modelBreakdowns' in project_data:
                            for mb in project_data['modelBreakdowns']:
                                model_name = mb['modelName']
                                if model_name not in month_data['modelBreakdowns']:
                                    month_data['modelBreakdowns'][model_name] = {
                                        'modelName': model_name,
                                        'inputTokens': 0,
                                        'outputTokens': 0,
                                        'cacheCreationInputTokens': 0,
                                        'cacheReadInputTokens': 0,
                                        'cost': 0
                                    }
                                
                                model = month_data['modelBreakdowns'][model_name]
                                model['inputTokens'] += mb.get('inputTokens', 0)
                                model['outputTokens'] += mb.get('outputTokens', 0)
                                model['cacheCreationInputTokens'] += mb.get('cacheCreationInputTokens', 0)
                                model['cacheReadInputTokens'] += mb.get('cacheReadInputTokens', 0)
                                model['cost'] += mb.get('cost', 0)
    
    # Convert to list format
    result = []
    for month, data in sorted(monthly_data.items()):
        month_entry = {
            'month': month,
            'inputTokens': data['inputTokens'],
            'outputTokens': data['outputTokens'],
            'cacheCreationTokens': data['cacheCreationTokens'],
            'cacheReadTokens': data['cacheReadTokens'],
            'totalTokens': data['totalTokens'],
            'cost': data['cost'],
            'days': data['days'],
            'hostCount': len(data['hosts']),
            'projectCount': len(data['projects']),
            'modelBreakdowns': list(data['modelBreakdowns'].values())
        }
        result.append(month_entry)
    
    return jsonify({
        'guid': guid,
        'monthly': result,
        'dateRange': {
            'since': start_date.isoformat(),
            'until': end_date.isoformat()
        }
    })


if __name__ == '__main__':
    app.run(debug=True, port=5001)