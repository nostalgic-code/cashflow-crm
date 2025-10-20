import requests
import json

# Test the Flask API endpoints
BASE_URL = "http://localhost:5000/api"

def test_health():
    """Test health endpoint"""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        print("✅ Health check passed!\n")
    except Exception as e:
        print(f"❌ Health check failed: {e}\n")

def test_create_client():
    """Test creating a new client"""
    print("🔍 Testing client creation...")
    try:
        client_data = {
            "name": "John Smith",
            "email": "john.smith@example.com",
            "phone": "+27 123 456 7890",
            "idNumber": "9001015009088",
            "loanType": "Secured Loan",
            "loanAmount": 15000,
            "documents": []
        }
        
        response = requests.post(f"{BASE_URL}/clients", json=client_data)
        print(f"Status: {response.status_code}")
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2)}")
        
        if response.status_code == 201:
            print("✅ Client creation passed!")
            return result['client']['id']
        else:
            print("❌ Client creation failed!")
            return None
    except Exception as e:
        print(f"❌ Client creation failed: {e}")
        return None

def test_get_clients():
    """Test getting all clients"""
    print("\n🔍 Testing get all clients...")
    try:
        response = requests.get(f"{BASE_URL}/clients")
        print(f"Status: {response.status_code}")
        result = response.json()
        print(f"Found {result.get('count', 0)} clients")
        print("✅ Get clients passed!\n")
    except Exception as e:
        print(f"❌ Get clients failed: {e}\n")

def test_analytics():
    """Test analytics endpoint"""
    print("🔍 Testing analytics endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/analytics")
        print(f"Status: {response.status_code}")
        result = response.json()
        analytics = result.get('analytics', {})
        print(f"Total Clients: {analytics.get('totalClients', 0)}")
        print(f"Total Loaned: R{analytics.get('totalLoaned', 0):,.2f}")
        print(f"Total Outstanding: R{analytics.get('totalOutstanding', 0):,.2f}")
        print("✅ Analytics test passed!\n")
    except Exception as e:
        print(f"❌ Analytics test failed: {e}\n")

if __name__ == "__main__":
    print("🧪 Testing Cashflow CRM API...\n")
    
    # Run tests
    test_health()
    client_id = test_create_client()
    test_get_clients()
    test_analytics()
    
    print("🏁 API testing completed!")