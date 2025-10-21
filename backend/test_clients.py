#!/usr/bin/env python3
"""
Quick test script to check if clients are being retrieved correctly
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from supabase_database import db_service

def test_get_clients():
    try:
        print("🔍 Testing client retrieval...")
        clients = db_service.get_all_clients()
        print(f"✅ Retrieved {len(clients)} clients")
        
        for i, client in enumerate(clients):
            print(f"Client {i+1}:")
            print(f"  - ID: {client.get('id', 'No ID')}")
            print(f"  - Name: {client.get('name', 'No name')}")
            print(f"  - Status: {client.get('status', 'No status')}")
            print(f"  - Loan Amount: {client.get('loanAmount', client.get('loan_amount', 'No amount'))}")
            print(f"  - Raw keys: {list(client.keys())}")
            print()
        
        return clients
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        print(f"📍 Traceback: {traceback.format_exc()}")
        return []

if __name__ == "__main__":
    test_get_clients()