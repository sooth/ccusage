#!/usr/bin/env python3
"""
Enhanced server for storing Claude token usage data with historical tracking.
Stores both current session data and historical daily/monthly aggregates.
Supports project-level tracking and multi-host aggregation.
"""

from flask import Flask, request, jsonify, render_template_string
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


def archive_to_historical(guid: str, hostname: str, project_name: str, project_data: Dict[str, Any], is_final: bool = False):
    """Archive current data to historical storage.
    
    Args:
        is_final: If True, aggregate with existing data (for expired sessions).
                  If False, replace existing data (for active session updates).
    """
    date_key = get_date_key(project_data.get('lastUpdated', ''))
    
    # Initialize nested structure if needed
    if guid not in historical_data:
        historical_data[guid] = {}
    if date_key not in historical_data[guid]:
        historical_data[guid][date_key] = {}
    if hostname not in historical_data[guid][date_key]:
        historical_data[guid][date_key][hostname] = {}
    
    # Calculate cost from model breakdowns if available
    cost = 0
    if 'modelBreakdowns' in project_data:
        for mb in project_data['modelBreakdowns']:
            cost += mb.get('cost', 0)
    else:
        # Fallback to simple calculation
        cost = project_data['tokens']['totalTokens'] * 0.000003
    
    # Prepare data for archiving (remove expiration)
    archive_data = {
        'tokens': project_data['tokens'],
        'lastUpdated': project_data['lastUpdated'],
        'cost': cost
    }
    
    if 'modelBreakdowns' in project_data:
        archive_data['modelBreakdowns'] = project_data['modelBreakdowns']
    
    # For active sessions, replace the data. For expired sessions, aggregate.
    if is_final and project_name in historical_data[guid][date_key][hostname]:
        # Aggregate with existing historical data (for expired sessions)
        historical_data[guid][date_key][hostname][project_name] = aggregate_tokens(
            historical_data[guid][date_key][hostname][project_name],
            archive_data
        )
    else:
        # Replace existing data (for active sessions)
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
                            archive_to_historical(guid, hostname, project_name, project_data, is_final=True)
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
            
            # Also update historical data for today (active session, so replace not aggregate)
            archive_to_historical(guid, hostname, project_name, project_data, is_final=False)
        
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


@app.route('/v2/backfill', methods=['POST'])
def backfill_v2():
    """Backfill historical usage data directly to historical storage."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        guid = data.get('guid')
        hostname = data.get('hostname')
        historical_data_input = data.get('historicalData', {})
        
        if not guid or not hostname or not historical_data_input:
            return jsonify({'error': 'Missing required fields: guid, hostname, historicalData'}), 400
        
        # Process each date's data
        dates_processed = 0
        projects_processed = 0
        
        for date_str, projects in historical_data_input.items():
            # Validate date format
            try:
                datetime.strptime(date_str, '%Y-%m-%d')
            except ValueError:
                return jsonify({'error': f'Invalid date format: {date_str}. Use YYYY-MM-DD'}), 400
            
            # Initialize nested structure if needed
            if guid not in historical_data:
                historical_data[guid] = {}
            if date_str not in historical_data[guid]:
                historical_data[guid][date_str] = {}
            if hostname not in historical_data[guid][date_str]:
                historical_data[guid][date_str][hostname] = {}
            
            # Process each project
            for project_name, project_data in projects.items():
                # Prepare data for archiving
                archive_data = {
                    'tokens': project_data.get('tokens', {}),
                    'lastUpdated': f"{date_str}T23:59:59Z",  # End of day timestamp
                    'cost': project_data.get('cost', 0)
                }
                
                if 'modelBreakdowns' in project_data:
                    archive_data['modelBreakdowns'] = project_data['modelBreakdowns']
                
                # Aggregate with existing historical data
                if project_name in historical_data[guid][date_str][hostname]:
                    historical_data[guid][date_str][hostname][project_name] = aggregate_tokens(
                        historical_data[guid][date_str][hostname][project_name],
                        archive_data
                    )
                else:
                    historical_data[guid][date_str][hostname][project_name] = archive_data
                
                projects_processed += 1
            
            dates_processed += 1
        
        logging.info(f"Backfilled data for GUID: {guid}, hostname: {hostname}, dates: {dates_processed}, projects: {projects_processed}")
        
        return jsonify({
            'status': 'success',
            'guid': guid,
            'hostname': hostname,
            'dates_processed': dates_processed,
            'projects_processed': projects_processed
        })
        
    except Exception as e:
        logging.error(f"Error in /v2/backfill: {str(e)}")
        return jsonify({'error': str(e)}), 500


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


# Dashboard HTML template
DASHBOARD_HTML = '''<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>Claude Usage Dashboard</title>
		<style>
			* {
				margin: 0;
				padding: 0;
				box-sizing: border-box;
			}

			body {
				font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
				background: #0a0a0a;
				color: #e0e0e0;
				line-height: 1.6;
			}

			.container {
				max-width: 1400px;
				margin: 0 auto;
				padding: 20px;
			}

			header {
				text-align: center;
				margin-bottom: 40px;
				padding: 30px 0;
				background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
				border-radius: 12px;
				box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
			}

			h1 {
				font-size: 2.5em;
				font-weight: 300;
				margin-bottom: 10px;
				background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
				-webkit-background-clip: text;
				-webkit-text-fill-color: transparent;
			}

			.subtitle {
				color: #888;
				font-size: 1.1em;
			}

			.stats-grid {
				display: grid;
				grid-template-columns: repeat(7, 1fr);
				gap: 15px;
				margin-bottom: 40px;
			}

			.stat-card {
				background: #1a1a2e;
				padding: 20px;
				border-radius: 12px;
				border: 1px solid #2a2a3e;
				transition:
					transform 0.2s,
					box-shadow 0.2s;
				min-width: 0;
			}

			.stat-card:hover {
				transform: translateY(-2px);
				box-shadow: 0 8px 30px rgba(102, 126, 234, 0.1);
			}

			.stat-label {
				color: #888;
				font-size: 0.9em;
				text-transform: uppercase;
				letter-spacing: 1px;
				margin-bottom: 8px;
			}

			.stat-value {
				font-size: 1.6em;
				font-weight: 600;
				color: #fff;
				margin-bottom: 4px;
			}

			.stat-value.cost {
				color: #4ade80;
			}

			.stat-value#sessionCountdown {
				color: #fbbf24;
				font-family: 'Courier New', monospace;
			}

			.stat-subtitle {
				color: #666;
				font-size: 0.85em;
			}

			.chart-container {
				background: #1a1a2e;
				padding: 24px;
				border-radius: 12px;
				border: 1px solid #2a2a3e;
				margin-bottom: 30px;
			}

			.chart-title {
				font-size: 1.3em;
				margin-bottom: 20px;
				color: #e0e0e0;
			}

			.hosts-projects {
				display: grid;
				grid-template-columns: 1fr 2fr;
				gap: 20px;
				margin-bottom: 30px;
			}

			.list-container {
				background: #1a1a2e;
				padding: 24px;
				border-radius: 12px;
				border: 1px solid #2a2a3e;
			}

			.list-title {
				font-size: 1.2em;
				margin-bottom: 16px;
				color: #e0e0e0;
				display: flex;
				align-items: center;
				gap: 10px;
			}

			.badge {
				background: #667eea;
				color: white;
				padding: 2px 8px;
				border-radius: 12px;
				font-size: 0.8em;
			}

			.list-item {
				padding: 12px;
				margin-bottom: 8px;
				background: #0f0f1e;
				border-radius: 8px;
				border: 1px solid #2a2a3e;
				display: flex;
				justify-content: space-between;
				align-items: center;
			}

			.list-item-name {
				font-weight: 500;
			}

			.list-item-stats {
				display: flex;
				gap: 20px;
				font-size: 0.9em;
				color: #888;
			}

			.token-type {
				display: flex;
				align-items: center;
				gap: 5px;
			}

			.dot {
				width: 8px;
				height: 8px;
				border-radius: 50%;
				display: inline-block;
			}

			.dot.input {
				background: #667eea;
			}
			.dot.output {
				background: #764ba2;
			}
			.dot.cache-create {
				background: #f093fb;
			}
			.dot.cache-read {
				background: #4facfe;
			}

			.daily-chart {
				height: 300px;
				position: relative;
				margin-top: 20px;
			}

			.chart-bar {
				display: flex;
				align-items: flex-end;
				height: 100%;
				gap: 4px;
				padding: 0 10px;
			}

			.bar {
				flex: 1;
				background: linear-gradient(to top, #667eea, #764ba2);
				border-radius: 4px 4px 0 0;
				position: relative;
				min-height: 5px;
				transition: opacity 0.2s;
				cursor: pointer;
			}

			.bar:hover {
				opacity: 0.8;
			}

			.bar-label {
				position: absolute;
				bottom: -25px;
				left: 50%;
				transform: translateX(-50%);
				font-size: 0.8em;
				color: #666;
				white-space: nowrap;
			}

			.loading {
				text-align: center;
				padding: 40px;
				color: #666;
			}

			.error {
				background: #991b1b;
				color: #fca5a5;
				padding: 16px;
				border-radius: 8px;
				margin-bottom: 20px;
			}

			.last-updated {
				text-align: center;
				color: #666;
				font-size: 0.9em;
				margin-top: 30px;
			}

			@media (max-width: 1400px) {
				.stats-grid {
					grid-template-columns: repeat(4, 1fr);
				}
			}

			@media (max-width: 1024px) {
				.stats-grid {
					grid-template-columns: repeat(3, 1fr);
				}
			}

			@media (max-width: 768px) {
				.hosts-projects {
					grid-template-columns: 1fr;
				}

				.stats-grid {
					grid-template-columns: repeat(2, 1fr);
				}
				
				.stat-value {
					font-size: 1.4em;
				}
			}

			@media (max-width: 480px) {
				.stats-grid {
					grid-template-columns: 1fr;
				}
			}
		</style>
	</head>
	<body>
		<div class="container">
			<header>
				<h1>Claude Usage Dashboard</h1>
				<div class="subtitle">Real-time token usage and cost tracking</div>
			</header>

			<div id="loading" class="loading">Loading dashboard data...</div>
			<div id="error" class="error" style="display: none"></div>

			<div id="dashboard" style="display: none">
				<div class="stats-grid">
					<div class="stat-card">
						<div class="stat-label">Total Tokens Today</div>
						<div class="stat-value" id="totalTokens">0</div>
						<div class="stat-subtitle" id="tokenBreakdown">Loading...</div>
					</div>

					<div class="stat-card">
						<div class="stat-label">Total Cost Today</div>
						<div class="stat-value cost" id="totalCost">$0.00</div>
						<div class="stat-subtitle">USD</div>
					</div>

					<div class="stat-card">
						<div class="stat-label">Current Session Cost</div>
						<div class="stat-value cost" id="sessionCost">$0.00</div>
						<div class="stat-subtitle">Since session start</div>
					</div>

					<div class="stat-card">
						<div class="stat-label">Session Ends In</div>
						<div class="stat-value" id="sessionCountdown">--:--:--</div>
						<div class="stat-subtitle" id="sessionEndTime">Calculating...</div>
					</div>

					<div class="stat-card">
						<div class="stat-label">Total Cost This Month</div>
						<div class="stat-value cost" id="monthCost">$0.00</div>
						<div class="stat-subtitle" id="monthName">Loading...</div>
					</div>

					<div class="stat-card">
						<div class="stat-label">Active Hosts</div>
						<div class="stat-value" id="hostCount">0</div>
						<div class="stat-subtitle">machines reporting</div>
					</div>

					<div class="stat-card">
						<div class="stat-label">Active Projects</div>
						<div class="stat-value" id="projectCount">0</div>
						<div class="stat-subtitle">unique projects</div>
					</div>
				</div>

				<div class="chart-container">
					<h2 class="chart-title">Token Usage - Last 7 Days</h2>
					<div class="daily-chart">
						<div class="chart-bar" id="dailyChart"></div>
					</div>
				</div>

				<div class="hosts-projects">
					<div class="list-container">
						<h3 class="list-title">
							Active Hosts
							<span class="badge" id="hostBadge">0</span>
						</h3>
						<div id="hostsList"></div>
					</div>

					<div class="list-container">
						<h3 class="list-title">
							Projects
							<span class="badge" id="projectBadge">0</span>
						</h3>
						<div id="projectsList"></div>
					</div>
				</div>

				<div class="last-updated" id="lastUpdated">Last updated: Never</div>
			</div>
		</div>

		<script>
			const guid = window.location.pathname.substring(1);
			const apiBase = window.location.origin;

			function formatNumber(num) {
				if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
				if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
				if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
				return num.toLocaleString();
			}

			function formatCost(cost) {
				return '$' + cost.toFixed(2);
			}

			function calculateSessionEnd() {
				// Claude's billing cycles are 5-hour blocks
				const now = new Date();
				const utcHour = now.getUTCHours();
				
				// Find next 5-hour boundary (0, 5, 10, 15, 20)
				const nextBoundary = Math.ceil(utcHour / 5) * 5;
				const hoursUntilEnd = nextBoundary - utcHour;
				
				const sessionEnd = new Date(now);
				sessionEnd.setUTCHours(nextBoundary, 0, 0, 0);
				
				// Handle day rollover
				if (nextBoundary >= 24) {
					sessionEnd.setUTCDate(sessionEnd.getUTCDate() + 1);
					sessionEnd.setUTCHours(nextBoundary % 24, 0, 0, 0);
				}
				
				return sessionEnd;
			}

			function formatCountdown(milliseconds) {
				const totalSeconds = Math.floor(milliseconds / 1000);
				const hours = Math.floor(totalSeconds / 3600);
				const minutes = Math.floor((totalSeconds % 3600) / 60);
				const seconds = totalSeconds % 60;
				
				return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
			}

			function getMonthName(date) {
				const months = ['January', 'February', 'March', 'April', 'May', 'June', 
				               'July', 'August', 'September', 'October', 'November', 'December'];
				return months[date.getMonth()] + ' ' + date.getFullYear();
			}

			async function fetchDashboardData() {
				try {
					// Fetch current status
					const statusResponse = await fetch(`${apiBase}/v2/status/${guid}`);
					if (!statusResponse.ok) {
						throw new Error('Failed to fetch status data');
					}
					const statusData = await statusResponse.json();

					// Fetch daily data for the last 7 days
					const today = new Date();
					const sevenDaysAgo = new Date(today);
					sevenDaysAgo.setDate(today.getDate() - 6);

					const dailyResponse = await fetch(
						`${apiBase}/v2/daily/${guid}?since=${sevenDaysAgo.toISOString()}&until=${today.toISOString()}`,
					);
					if (!dailyResponse.ok) {
						throw new Error('Failed to fetch daily data');
					}
					const dailyData = await dailyResponse.json();

					// Fetch monthly data for current month
					const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
					const monthlyResponse = await fetch(
						`${apiBase}/v2/monthly/${guid}?since=${firstOfMonth.toISOString()}&until=${today.toISOString()}`,
					);
					let monthlyData = null;
					if (monthlyResponse.ok) {
						monthlyData = await monthlyResponse.json();
					}

					return { status: statusData, daily: dailyData, monthly: monthlyData };
				} catch (error) {
					console.error('Error fetching data:', error);
					throw error;
				}
			}

			function updateDashboard(data) {
				const { status, daily, monthly } = data;

				// Calculate today's totals
				const today = new Date().toISOString().split('T')[0];
				const todayData = daily.daily.find((d) => d.date === today) || {
					totalTokens: 0,
					cost: 0,
					inputTokens: 0,
					outputTokens: 0,
					cacheCreationTokens: 0,
					cacheReadTokens: 0,
				};

				// Update stats cards
				document.getElementById('totalTokens').textContent = formatNumber(todayData.totalTokens);
				document.getElementById('totalCost').textContent = formatCost(todayData.cost);

				// Token breakdown
				const breakdown = `Input: ${formatNumber(todayData.inputTokens)} | Output: ${formatNumber(todayData.outputTokens)} | Cache: ${formatNumber(todayData.cacheCreationTokens + todayData.cacheReadTokens)}`;
				document.getElementById('tokenBreakdown').textContent = breakdown;

				// Calculate current session cost
				let sessionCost = 0;
				status.entries.forEach((entry) => {
					entry.projects.forEach((project) => {
						// Use model breakdowns if available for accurate cost
						if (project.modelBreakdowns && project.modelBreakdowns.length > 0) {
							project.modelBreakdowns.forEach(mb => {
								sessionCost += mb.cost || 0;
							});
						} else {
							// Fallback: estimate cost based on tokens
							const totalTokens = project.tokens.inputTokens + project.tokens.outputTokens + 
							                   project.tokens.cacheCreationTokens + project.tokens.cacheReadTokens;
							sessionCost += totalTokens * 0.000003; // Rough estimate
						}
					});
				});
				document.getElementById('sessionCost').textContent = formatCost(sessionCost);

				// Update session countdown
				const sessionEnd = calculateSessionEnd();
				const updateCountdown = () => {
					const now = new Date();
					const remaining = sessionEnd - now;
					if (remaining > 0) {
						document.getElementById('sessionCountdown').textContent = formatCountdown(remaining);
						document.getElementById('sessionEndTime').textContent = sessionEnd.toLocaleTimeString();
					} else {
						// Session has ended, recalculate
						const newSessionEnd = calculateSessionEnd();
						sessionEnd.setTime(newSessionEnd.getTime());
					}
				};
				updateCountdown();
				// Update countdown every second
				if (window.countdownInterval) {
					clearInterval(window.countdownInterval);
				}
				window.countdownInterval = setInterval(updateCountdown, 1000);

				// Calculate monthly cost
				const currentMonth = new Date();
				document.getElementById('monthName').textContent = getMonthName(currentMonth);
				
				if (monthly && monthly.monthly && monthly.monthly.length > 0) {
					const currentMonthData = monthly.monthly[0];
					document.getElementById('monthCost').textContent = formatCost(currentMonthData.cost);
				} else {
					// If no monthly data, sum up daily data for current month
					let monthCost = 0;
					const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
					daily.daily.forEach(day => {
						const dayDate = new Date(day.date);
						if (dayDate >= monthStart) {
							monthCost += day.cost;
						}
					});
					document.getElementById('monthCost').textContent = formatCost(monthCost);
				}

				// Host and project counts
				const uniqueHosts = new Set();
				const uniqueProjects = new Set();
				const projectTokens = {};

				status.entries.forEach((entry) => {
					uniqueHosts.add(entry.hostname);
					entry.projects.forEach((project) => {
						uniqueProjects.add(project.projectName);
						if (!projectTokens[project.projectName]) {
							projectTokens[project.projectName] = {
								tokens: { inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0 },
								hosts: new Set(),
							};
						}
						projectTokens[project.projectName].tokens.inputTokens += project.tokens.inputTokens;
						projectTokens[project.projectName].tokens.outputTokens += project.tokens.outputTokens;
						projectTokens[project.projectName].tokens.cacheCreationTokens += project.tokens.cacheCreationTokens;
						projectTokens[project.projectName].tokens.cacheReadTokens += project.tokens.cacheReadTokens;
						projectTokens[project.projectName].hosts.add(entry.hostname);
					});
				});

				document.getElementById('hostCount').textContent = uniqueHosts.size;
				document.getElementById('projectCount').textContent = uniqueProjects.size;
				document.getElementById('hostBadge').textContent = uniqueHosts.size;
				document.getElementById('projectBadge').textContent = uniqueProjects.size;

				// Update hosts list
				const hostsList = document.getElementById('hostsList');
				hostsList.innerHTML = '';
				uniqueHosts.forEach((hostname) => {
					const hostProjects = status.entries.filter((e) => e.hostname === hostname).flatMap((e) => e.projects);
					const totalTokens = hostProjects.reduce(
						(sum, p) =>
							sum +
							p.tokens.inputTokens +
							p.tokens.outputTokens +
							p.tokens.cacheCreationTokens +
							p.tokens.cacheReadTokens,
						0,
					);

					const hostItem = document.createElement('div');
					hostItem.className = 'list-item';
					hostItem.innerHTML = `
                    <div class="list-item-name">${hostname}</div>
                    <div class="list-item-stats">
                        <span>${hostProjects.length} projects</span>
                        <span>${formatNumber(totalTokens)} tokens</span>
                    </div>
                `;
					hostsList.appendChild(hostItem);
				});

				// Update projects list
				const projectsList = document.getElementById('projectsList');
				projectsList.innerHTML = '';
				Object.entries(projectTokens)
					.sort((a, b) => {
						const totalA =
							a[1].tokens.inputTokens +
							a[1].tokens.outputTokens +
							a[1].tokens.cacheCreationTokens +
							a[1].tokens.cacheReadTokens;
						const totalB =
							b[1].tokens.inputTokens +
							b[1].tokens.outputTokens +
							b[1].tokens.cacheCreationTokens +
							b[1].tokens.cacheReadTokens;
						return totalB - totalA;
					})
					.forEach(([projectName, data]) => {
						const projectItem = document.createElement('div');
						projectItem.className = 'list-item';
						projectItem.innerHTML = `
                        <div class="list-item-name">${projectName}</div>
                        <div class="list-item-stats">
                            <div class="token-type"><span class="dot input"></span> ${formatNumber(data.tokens.inputTokens)}</div>
                            <div class="token-type"><span class="dot output"></span> ${formatNumber(data.tokens.outputTokens)}</div>
                            <div class="token-type"><span class="dot cache-create"></span> ${formatNumber(data.tokens.cacheCreationTokens)}</div>
                            <div class="token-type"><span class="dot cache-read"></span> ${formatNumber(data.tokens.cacheReadTokens)}</div>
                        </div>
                    `;
						projectsList.appendChild(projectItem);
					});

				// Update daily chart
				const chartBar = document.getElementById('dailyChart');
				chartBar.innerHTML = '';

				const maxTokens = Math.max(...daily.daily.map((d) => d.totalTokens));
				daily.daily.forEach((day) => {
					const bar = document.createElement('div');
					bar.className = 'bar';
					const height = (day.totalTokens / maxTokens) * 100;
					bar.style.height = `${height}%`;
					bar.title = `${day.date}: ${formatNumber(day.totalTokens)} tokens, ${formatCost(day.cost)}`;

					const label = document.createElement('div');
					label.className = 'bar-label';
					label.textContent = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
					bar.appendChild(label);

					chartBar.appendChild(bar);
				});

				// Update last updated time
				document.getElementById('lastUpdated').textContent = `Last updated: ${new Date().toLocaleTimeString()}`;

				// Show dashboard, hide loading
				document.getElementById('loading').style.display = 'none';
				document.getElementById('dashboard').style.display = 'block';
			}

			function showError(message) {
				document.getElementById('loading').style.display = 'none';
				document.getElementById('error').style.display = 'block';
				document.getElementById('error').textContent = `Error: ${message}`;
			}

			// Initial load
			fetchDashboardData()
				.then(updateDashboard)
				.catch((error) => showError(error.message));

			// Refresh every 30 seconds
			setInterval(() => {
				fetchDashboardData()
					.then(updateDashboard)
					.catch((error) => console.error('Refresh error:', error));
			}, 30000);
		</script>
	</body>
</html>
'''


@app.route('/<guid>')
def dashboard(guid):
    """Serve the dashboard for a specific GUID."""
    # Validate GUID format (basic UUID validation)
    import re
    if not re.match(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', guid):
        return 'Invalid GUID format', 400
    
    return render_template_string(DASHBOARD_HTML)


if __name__ == '__main__':
    app.run(debug=True, port=5001)