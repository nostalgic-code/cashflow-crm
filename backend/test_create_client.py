#!/usr/bin/env python3
"""
Test script to reproduce the client creation HTTP 500 error
"""

import requests
import json
from datetime import datetime
import uuid

# Test data that matches what NewClientModal sends
test_client_data = {
    "id": str(uuid.uuid4()),
    "name": "Test User",
    "email": "test@example.com", 
    "phone": "+27 123 456 7890",
    "idNumber": "1234567890123",
    "loanType": "Secured Loan",
    "loanAmount": 5000,
    "interestRate": 50.0,
    "startDate": datetime.now().strftime('%Y-%m-%d'),
    "dueDate": datetime.now().isoformat(),
    "monthlyPayment": 7500,  # 5000 * 1.5
    "amountPaid": 0,
    "status": "new-lead",
    "applicationDate": datetime.now().isoformat(),
    "lastStatusUpdate": datetime.now().isoformat(),
    "documents": [
        {
            "id": str(uuid.uuid4()),
            "name": "test_document.pdf",
            "size": 1024,
            "type": "application/pdf"
        }
    ],
    "paymentHistory": [],
    "notes": []
}

def test_local_api():
    """Test against local Flask server"""
    url = "http://localhost:5000/api/clients"
    
    print("🧪 Testing local API...")
    print(f"📤 POST {url}")
    print(f"📝 Data: {json.dumps(test_client_data, indent=2)}")
    
    try:
        response = requests.post(
            url,
            json=test_client_data,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"📥 Status: {response.status_code}")
        print(f"📥 Headers: {dict(response.headers)}")
        
        if response.status_code == 200 or response.status_code == 201:
            print(f"✅ Success! Response: {response.json()}")
        else:
            print(f"❌ Error! Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection failed - make sure Flask server is running on localhost:5000")
    except Exception as e:
        print(f"❌ Request failed: {e}")

def test_production_api():
    """Test against production API"""
    url = "https://cashflow-crm.onrender.com/api/clients"
    
    print("🧪 Testing production API...")
    print(f"📤 POST {url}")
    print(f"📝 Data: {json.dumps(test_client_data, indent=2)}")
    
    try:
        response = requests.post(
            url,
            json=test_client_data,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"📥 Status: {response.status_code}")
        print(f"📥 Headers: {dict(response.headers)}")
        
        if response.status_code == 200 or response.status_code == 201:
            print(f"✅ Success! Response: {response.json()}")
        else:
            print(f"❌ Error! Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")

if __name__ == "__main__":
    print("🚀 Starting client creation test...")
    print("=" * 50)
    
    # Test local first
    test_local_api()
    print()
    
    # Test production
    test_production_api()
    
    print("=" * 50)
    print("✅ Test completed!")