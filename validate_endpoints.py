#!/usr/bin/env python3
"""
Endpoint Validation Script - Ensures all Flask apps have the same endpoints
This prevents missing functionality when creating new versions
"""

import re
import sys
from typing import List, Set, Tuple

def extract_endpoints(filepath: str) -> Set[Tuple[str, str]]:
    """Extract all Flask routes from a Python file"""
    endpoints = set()
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Find all @app.route decorators with their methods
    route_pattern = r'@app\.route\([\'"]([^\'"]*)[\'"](.*?)\)'
    matches = re.findall(route_pattern, content)
    
    for match in matches:
        route = match[0]
        methods_str = match[1]
        
        # Extract methods if specified
        methods = ['GET']  # Default method
        if 'methods=' in methods_str:
            methods_match = re.search(r'methods=\[(.*?)\]', methods_str)
            if methods_match:
                methods_text = methods_match.group(1)
                methods = [m.strip().strip("'\"") for m in methods_text.split(',')]
        
        for method in methods:
            endpoints.add((method, route))
    
    return endpoints

def compare_endpoints(file1: str, file2: str) -> Tuple[bool, List[str]]:
    """Compare endpoints between two Flask files"""
    endpoints1 = extract_endpoints(file1)
    endpoints2 = extract_endpoints(file2)
    
    missing_in_file2 = endpoints1 - endpoints2
    missing_in_file1 = endpoints2 - endpoints1
    
    errors = []
    
    if missing_in_file2:
        errors.append(f"\nEndpoints missing in {file2}:")
        for method, route in sorted(missing_in_file2):
            errors.append(f"  - {method} {route}")
    
    if missing_in_file1:
        errors.append(f"\nEndpoints missing in {file1}:")
        for method, route in sorted(missing_in_file1):
            errors.append(f"  - {method} {route}")
    
    return len(errors) == 0, errors

def main():
    """Main validation function"""
    print("=== Flask Endpoint Validation ===\n")
    
    files_to_check = [
        ('flask_app.py', 'flask_app_deploy.py'),
        ('flask_app.py', 'flask_app_v3.py'),
        ('flask_app_deploy.py', 'flask_app_v3.py')
    ]
    
    all_valid = True
    
    for file1, file2 in files_to_check:
        print(f"Comparing {file1} vs {file2}...")
        valid, errors = compare_endpoints(file1, file2)
        
        if valid:
            print("  ✓ All endpoints match!")
        else:
            print("  ✗ MISMATCH FOUND!")
            for error in errors:
                print(error)
            all_valid = False
        print()
    
    # Also create a summary of all endpoints
    print("\n=== Endpoint Summary ===")
    all_endpoints = set()
    
    for file in ['flask_app.py', 'flask_app_deploy.py', 'flask_app_v3.py']:
        try:
            endpoints = extract_endpoints(file)
            all_endpoints.update(endpoints)
        except FileNotFoundError:
            print(f"Warning: {file} not found")
    
    print("\nAll unique endpoints across all files:")
    for method, route in sorted(all_endpoints):
        print(f"  {method:6} {route}")
    
    if not all_valid:
        print("\n❌ VALIDATION FAILED! Some endpoints are missing.")
        print("This must be fixed to ensure feature parity.")
        sys.exit(1)
    else:
        print("\n✅ All files have matching endpoints!")
        sys.exit(0)

if __name__ == '__main__':
    main()