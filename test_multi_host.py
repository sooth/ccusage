#!/usr/bin/env python3
"""
End-to-end test for multi-host token tracking.
This simulates multiple hosts submitting data to the server.
"""

import requests
import json
import time
import sys

SERVER = "https://soothaa.pythonanywhere.com"
TEST_GUID = "test-multi-host-12345"

def submit_for_host(hostname, input_tokens, output_tokens, cache_creation, cache_read):
    """Submit token data for a specific host."""
    data = {
        'guid': TEST_GUID,
        'hostname': hostname,
        'tokens': {
            'inputTokens': input_tokens,
            'outputTokens': output_tokens,
            'cacheCreationTokens': cache_creation,
            'cacheReadTokens': cache_read
        }
    }
    
    try:
        response = requests.post(f"{SERVER}/update", json=data, timeout=5)
        if response.status_code == 200:
            print(f"✓ Submitted for {hostname}: {input_tokens + output_tokens} total tokens")
        else:
            print(f"✗ Failed to submit for {hostname}: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Error submitting for {hostname}: {e}")
        return False
    return True

def fetch_all_data():
    """Fetch all entries for the test GUID."""
    try:
        response = requests.get(f"{SERVER}/status/{TEST_GUID}", timeout=5)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"✗ Failed to fetch data: {response.status_code}")
            return None
    except Exception as e:
        print(f"✗ Error fetching data: {e}")
        return None

def main():
    print("Testing Multi-Host Token Tracking")
    print("=================================\n")
    
    # Check server health
    try:
        health = requests.get(f"{SERVER}/health", timeout=2)
        if health.status_code != 200:
            print("✗ Server is not responding. Please start the server first.")
            sys.exit(1)
        print("✓ Server is running\n")
    except:
        print("✗ Server is not running at: " + SERVER)
        sys.exit(1)
    
    # Simulate data from 3 different hosts
    print("1. Submitting data from multiple hosts...")
    hosts = [
        ("workstation-1", 15000, 8000, 1000, 500),
        ("laptop-2", 25000, 12000, 2000, 1000),
        ("cloud-vm-3", 35000, 18000, 3000, 1500),
    ]
    
    for hostname, *tokens in hosts:
        if not submit_for_host(hostname, *tokens):
            sys.exit(1)
        time.sleep(0.1)  # Small delay between submissions
    
    print("\n2. Fetching combined data...")
    data = fetch_all_data()
    if not data:
        sys.exit(1)
    
    print(f"\nFound {len(data['entries'])} hosts for GUID: {TEST_GUID}")
    print("\nDetailed breakdown:")
    print("-" * 70)
    
    total_input = 0
    total_output = 0
    total_cache_creation = 0
    total_cache_read = 0
    
    for entry in data['entries']:
        tokens = entry['tokens']
        print(f"Host: {entry['hostname']:<15} Input: {tokens['inputTokens']:>7,}  "
              f"Output: {tokens['outputTokens']:>7,}  "
              f"Cache: {tokens['cacheCreationTokens'] + tokens['cacheReadTokens']:>6,}  "
              f"Total: {tokens['totalTokens']:>7,}")
        
        total_input += tokens['inputTokens']
        total_output += tokens['outputTokens']
        total_cache_creation += tokens['cacheCreationTokens']
        total_cache_read += tokens['cacheReadTokens']
    
    print("-" * 70)
    grand_total = total_input + total_output + total_cache_creation + total_cache_read
    print(f"{'TOTAL':<15} Input: {total_input:>7,}  "
          f"Output: {total_output:>7,}  "
          f"Cache: {total_cache_creation + total_cache_read:>6,}  "
          f"Total: {grand_total:>7,}")
    
    print("\n3. Testing exclusion logic (simulating host 'workstation-1')...")
    print("   Remote tokens (excluding workstation-1):")
    remote_total = 0
    for entry in data['entries']:
        if entry['hostname'] != 'workstation-1':
            tokens = entry['tokens']
            remote_total += tokens['totalTokens']
            print(f"   - {entry['hostname']}: {tokens['totalTokens']:,} tokens")
    
    print(f"\n   Local (workstation-1): 24,500 tokens")
    print(f"   Remote (2 hosts): {remote_total:,} tokens")
    print(f"   Combined Total: {24500 + remote_total:,} tokens")
    
    print("\n✓ Test completed successfully!")

if __name__ == "__main__":
    main()