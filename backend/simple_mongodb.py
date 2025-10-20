"""
Simple MongoDB connection for Render deployment
This bypasses complex SSL configurations and uses basic connection methods
"""

from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

def get_simple_mongodb_client():
    """
    Get MongoDB client with simple connection methods
    """
    mongo_uri = os.getenv('MONGODB_URI') or os.getenv('MONGO_URI')
    if not mongo_uri:
        raise ValueError("MONGODB_URI environment variable not found")
    
    # Simple connection methods that work on most platforms
    simple_methods = [
        # Method 1: Basic connection
        {},
        # Method 2: With timeouts
        {
            'serverSelectionTimeoutMS': 30000,
            'socketTimeoutMS': 30000,
            'connectTimeoutMS': 30000
        },
        # Method 3: TLS bypass
        {
            'tls': False,
            'serverSelectionTimeoutMS': 30000
        }
    ]
    
    # Simple URI variants
    uri_variants = [
        # Clean SRV URI
        mongo_uri.split('?')[0],
        # Original URI
        mongo_uri,
        # URI with basic params
        mongo_uri.split('?')[0] + '?retryWrites=true&w=majority'
    ]
    
    for uri in uri_variants:
        for method in simple_methods:
            try:
                print(f"Trying simple connection: {uri[:50]}...")
                client = MongoClient(uri, **method)
                client.admin.command('ping')
                print("✅ Simple MongoDB connection successful!")
                return client
            except Exception as e:
                print(f"❌ Simple connection failed: {str(e)[:100]}")
                continue
    
    raise Exception("All simple MongoDB connection methods failed")

# Test the connection
if __name__ == "__main__":
    try:
        client = get_simple_mongodb_client()
        print("MongoDB connection test passed!")
        client.close()
    except Exception as e:
        print(f"MongoDB connection test failed: {e}")