"""
Quick script to check what columns exist in the clients table
"""

import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

def check_table_structure():
    """Check the clients table structure"""
    try:
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_ANON_KEY')
        
        if not supabase_url or not supabase_key:
            print("❌ Missing Supabase credentials")
            return
        
        client = create_client(supabase_url, supabase_key)
        
        # Try to get table info using a simple query
        print("🔍 Checking clients table structure...")
        
        # Try inserting a minimal test record to see what columns are required/missing
        test_data = {
            'first_name': 'Test',
            'last_name': 'User',
            'email': 'test@example.com',
            'phone': '+27123456789'
        }
        
        print(f"📝 Testing minimal insert: {test_data}")
        
        try:
            result = client.table('clients').insert(test_data).execute()
            print(f"✅ Minimal insert successful: {result.data}")
            
            # Clean up - delete the test record
            if result.data and len(result.data) > 0:
                test_id = result.data[0]['id']
                client.table('clients').delete().eq('id', test_id).execute()
                print(f"🧹 Cleaned up test record")
                
        except Exception as e:
            print(f"❌ Minimal insert failed: {str(e)}")
            print("This will show us what columns are missing or have constraints")
            
    except Exception as e:
        print(f"❌ Failed to check table: {e}")

if __name__ == "__main__":
    check_table_structure()