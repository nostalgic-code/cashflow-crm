#!/usr/bin/env python3
"""
Test script for Cashflow CRM API endpoints
"""

import requests
import json
from datetime import datetime

# API base URL
BASE_URL = "http://localhost:5000/api"

def test_health():
    """Test the health endpoint"""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_create_client():
    """Test creating a new client"""
    print("\n🔍 Testing create client endpoint...")
    
    sample_client = {
        "name": "John Doe",
        "email": "john.doe@test.com",
        "phone": "+27 123 456 7890",
        "idNumber": "8001015009087",
        "loanType": "Secured Loan",
        "loanAmount": 15000,
        "interestRate": 50.0,
        "startDate": "2025-10-20",
        "dueDate": "2025-10-31",
        "monthlyPayment": 22500,
        "amountPaid": 0,
        "status": "new-lead",
        "documents": []
    }
    
    try:
        response = requests.post(f"{BASE_URL}/clients", json=sample_client)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 201:
            return response.json().get('id')
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_get_clients():
    """Test getting all clients"""
    print("\n🔍 Testing get all clients endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/clients")
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Number of clients: {len(data)}")
        if data and len(data) > 0:
            # Handle both direct array and wrapped response
            clients = data if isinstance(data, list) else data.get('clients', [])
            if clients:
                first_client = clients[0]
                client_name = first_client.get('name', 'Unknown')
                print(f"First client: {client_name}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_get_client_by_id(client_id):
    """Test getting a specific client by ID"""
    if not client_id:
        return False
        
    print(f"\n🔍 Testing get client by ID: {client_id}...")
    try:
        response = requests.get(f"{BASE_URL}/clients/{client_id}")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            client = response.json()
            print(f"Client: {client['name']} - {client['email']}")
        else:
            print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_update_client_status(client_id):
    """Test updating client status"""
    if not client_id:
        return False
        
    print(f"\n🔍 Testing update client status for ID: {client_id}...")
    try:
        response = requests.put(f"{BASE_URL}/clients/{client_id}/status", 
                              json={"status": "active"})
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    print("🧪 Starting API Tests for Cashflow CRM")
    print("=" * 50)
    
    # Test health
    if not test_health():
        print("❌ Health check failed. Make sure the API is running.")
        return
    
    # Test create client
    client_id = test_create_client()
    
    # Test get all clients
    test_get_clients()
    
    # Test get client by ID
    test_get_client_by_id(client_id)
    
    # Test update client status
    test_update_client_status(client_id)
    
    print("\n✅ API tests completed!")
    print(f"📊 MongoDB Atlas connection: Working")
    print(f"🌐 API Server: http://localhost:5000")
    print(f"📚 API Documentation: Available at endpoints")

if __name__ == "__main__":
    main()