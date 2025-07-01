#!/usr/bin/env python3
"""
Example client for submitting token usage data to the server.
"""

import requests
import json
from uuid import uuid4
import socket

# Example usage
def submit_usage(server_url: str, guid: str, tokens: dict):
    """Submit token usage data to the server."""
    data = {
        'guid': guid,
        'hostname': socket.gethostname(),
        'tokens': tokens
    }
    
    response = requests.post(f"{server_url}/update", json=data)
    return response.json()


if __name__ == "__main__":
    # Server URL
    SERVER = "https://soothaa.pythonanywhere.com"
    
    # Example GUID (in practice, this would be persistent per user)
    user_guid = str(uuid4())
    
    # Example token data matching ccusage structure
    token_data = {
        'inputTokens': 15234,
        'outputTokens': 8921,
        'cacheCreationTokens': 1200,
        'cacheReadTokens': 450
    }
    
    # Submit usage
    result = submit_usage(SERVER, user_guid, token_data)
    print(f"Submission result: {result}")
    
    # Check status - now returns all entries for this GUID
    status = requests.get(f"{SERVER}/status/{user_guid}")
    status_data = status.json()
    print(f"Current status: {json.dumps(status_data, indent=2)}")
    
    # Show combined totals across all hosts
    if 'entries' in status_data:
        total_tokens = sum(
            entry['tokens']['totalTokens'] 
            for entry in status_data['entries']
        )
        print(f"\nTotal tokens across all hosts: {total_tokens:,}")