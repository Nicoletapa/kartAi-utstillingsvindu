import os
import sys
from datetime import datetime
import logging

# Add parent directory to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Now import from src
from src.trpc_client import TRPCClient, ApplicationType

# Setup logging
logging.basicConfig(level=logging.DEBUG)

# Get session token - you'll need a valid one
user_session_token = input("Enter your next-auth session token: ")

# Create client
client = TRPCClient()

# Test creating an application
try:
    result = client.create_application(
        application_type=ApplicationType.SMA_BYGGEPROSJEKTER,
        submission_date=datetime.now(),
        user_session_token=user_session_token
    )
    print(f"SUCCESS! Application created with ID: {result['applicationID']}")
    print(f"Full result: {result}")
except Exception as e:
    print(f"ERROR: {e}")