#!/usr/bin/env python3
"""
WSGI configuration for PythonAnywhere and other WSGI servers.
This file is used by PythonAnywhere to run your Flask app.
"""

import sys
import os

# Add your project directory to the sys.path
project_home = os.path.dirname(os.path.abspath(__file__))
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Import the Flask app
from flask_app import app as application

# For debugging on PythonAnywhere (optional)
# application.config['DEBUG'] = True