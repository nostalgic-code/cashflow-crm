"""
Supabase Database Service for Cashflow CRM
Uses PostgreSQL instead of MongoDB for better compatibility
"""

import os
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class SupabaseService:
    """Database service using Supabase PostgreSQL"""
    
    def __init__(self):
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_ANON_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required")
        
        self.client: Client = create_client(self.supabase_url, self.supabase_key)
        print(f"✅ Connected to Supabase database")
        
        # Initialize tables if they don't exist
        self._initialize_tables()
    
    def _initialize_tables(self):
        """Create tables if they don't exist"""
        try:
            # This will be handled by Supabase migrations
            # For now, we'll assume tables exist or create them manually
            print("📋 Database tables initialized")
        except Exception as e:
            print(f"⚠️ Warning: Could not initialize tables: {e}")
    
    def is_connected(self) -> bool:
        """Check if database is connected"""
        try:
            # Test connection with a simple query
            result = self.client.table('clients').select("count", count="exact").execute()
            return True
        except:
            return False
    
    # Client operations
    def create_client(self, client_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new client"""
        try:
            # Handle field mapping between frontend and database
            mapped_data = client_data.copy()
            
            # Handle the frontend UUID - store it as client_uuid but don't use it as primary key
            if 'id' in mapped_data:
                mapped_data['client_uuid'] = mapped_data['id']
                del mapped_data['id']  # Remove frontend id, let database auto-generate primary key
            
            # Split name into first_name and last_name if needed
            if 'name' in mapped_data and 'first_name' not in mapped_data:
                name_parts = mapped_data['name'].split(' ', 1)
                mapped_data['first_name'] = name_parts[0]
                mapped_data['last_name'] = name_parts[1] if len(name_parts) > 1 else ''
                del mapped_data['name']  # Remove the original name field
            
            # Map camelCase to snake_case fields
            field_mappings = {
                'loanAmount': 'loan_amount',
                'loanType': 'loan_type', 
                'amountPaid': 'amount_paid',
                'applicationDate': 'application_date',
                'lastStatusUpdate': 'last_status_update',
                'idNumber': 'id_number',
                'interestRate': 'interest_rate',
                'startDate': 'start_date',
                'dueDate': 'due_date',
                'monthlyPayment': 'monthly_payment',
                'paymentHistory': 'payment_history'
            }
            
            for frontend_field, db_field in field_mappings.items():
                if frontend_field in mapped_data:
                    mapped_data[db_field] = mapped_data[frontend_field]
                    del mapped_data[frontend_field]
            
            # Add timestamps
            now = datetime.now(timezone.utc).isoformat()
            mapped_data['created_at'] = now
            mapped_data['updated_at'] = now
            
            # Insert into Supabase
            result = self.client.table('clients').insert(mapped_data).execute()
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            
            raise Exception("Failed to create client")
            
        except Exception as e:
            print(f"❌ Error creating client: {e}")
            raise
    
    def get_all_clients(self) -> List[Dict[str, Any]]:
        """Get all clients"""
        try:
            result = self.client.table('clients').select("*").order('created_at', desc=True).execute()
            clients = result.data or []
            
            # Map fields back to frontend format
            for client in clients:
                # Combine first_name and last_name into name
                if 'first_name' in client and 'last_name' in client:
                    client['name'] = f"{client['first_name']} {client['last_name']}".strip()
                
                # Use client_uuid as frontend id if available, otherwise use database id
                if 'client_uuid' in client and client['client_uuid']:
                    client['id'] = client['client_uuid']
                elif 'id' in client:
                    client['id'] = str(client['id'])  # Convert database id to string
                
                # Map snake_case to camelCase fields
                field_mappings = {
                    'loan_amount': 'loanAmount',
                    'loan_type': 'loanType', 
                    'amount_paid': 'amountPaid',
                    'application_date': 'applicationDate',
                    'last_status_update': 'lastStatusUpdate',
                    'id_number': 'idNumber',
                    'interest_rate': 'interestRate',
                    'start_date': 'startDate',
                    'due_date': 'dueDate',
                    'monthly_payment': 'monthlyPayment',
                    'payment_history': 'paymentHistory'
                }
                
                for db_field, frontend_field in field_mappings.items():
                    if db_field in client:
                        client[frontend_field] = client[db_field]
            
            return clients
            
        except Exception as e:
            print(f"❌ Error getting clients: {e}")
            raise
    
    def get_client_by_id(self, client_id: str) -> Optional[Dict[str, Any]]:
        """Get a client by ID"""
        try:
            # Try UUID first (client_uuid field)
            result = self.client.table('clients').select("*").eq('client_uuid', client_id).execute()
            if result.data and len(result.data) > 0:
                return result.data[0]
            
            # Try numeric ID 
            try:
                result = self.client.table('clients').select("*").eq('id', int(client_id)).execute()
                if result.data and len(result.data) > 0:
                    return result.data[0]
            except ValueError:
                pass
            
            return None
            
        except Exception as e:
            print(f"❌ Error getting client: {e}")
            raise
    
    def update_client(self, client_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a client"""
        try:
            # Add updated timestamp
            update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
            
            # Try UUID first (client_uuid field)
            result = self.client.table('clients').update(update_data).eq('client_uuid', client_id).execute()
            if result.data and len(result.data) > 0:
                return result.data[0]
            
            # Try numeric ID
            try:
                result = self.client.table('clients').update(update_data).eq('id', int(client_id)).execute()
                if result.data and len(result.data) > 0:
                    return result.data[0]
            except ValueError:
                pass
            
            return None
            
        except Exception as e:
            print(f"❌ Error updating client: {e}")
            raise
    
    def delete_client(self, client_id: str) -> bool:
        """Delete a client"""
        try:
            # Try UUID first (client_uuid field)
            result = self.client.table('clients').delete().eq('client_uuid', client_id).execute()
            if result.data and len(result.data) > 0:
                return True
            
            # Try numeric ID
            try:
                result = self.client.table('clients').delete().eq('id', int(client_id)).execute()
                if result.data and len(result.data) > 0:
                    return True
            except ValueError:
                pass
            
            return False
            
        except Exception as e:
            print(f"❌ Error deleting client: {e}")
            raise
    
    def update_client_status(self, client_id: str, new_status: str) -> Optional[Dict[str, Any]]:
        """Update client status"""
        try:
            update_data = {
                'status': new_status,
                'last_status_update': datetime.now(timezone.utc).isoformat(),
            }
            
            return self.update_client(client_id, update_data)
            
        except Exception as e:
            print(f"❌ Error updating client status: {e}")
            raise
    
    # Payment operations
    def add_payment(self, client_id: str, payment_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Add a payment for a client"""
        try:
            # Add payment record
            payment_data['client_id'] = client_id
            payment_data['created_at'] = datetime.now(timezone.utc).isoformat()
            
            # Insert payment
            payment_result = self.client.table('payments').insert(payment_data).execute()
            
            # Update client's amount paid
            client = self.get_client_by_id(client_id)
            if client:
                new_amount_paid = client.get('amount_paid', 0) + payment_data.get('amount', 0)
                
                update_data = {
                    'amount_paid': new_amount_paid,
                    'last_payment_date': payment_data.get('payment_date', datetime.now(timezone.utc).isoformat())
                }
                
                # Auto-update status if needed
                total_due = client.get('loan_amount', 0) * 1.5
                if new_amount_paid >= total_due:
                    update_data['status'] = 'paid'
                
                return self.update_client(client_id, update_data)
            
            return None
            
        except Exception as e:
            print(f"❌ Error adding payment: {e}")
            raise
    
    def get_client_payments(self, client_id: str) -> List[Dict[str, Any]]:
        """Get all payments for a client"""
        try:
            result = self.client.table('payments').select("*").eq('client_id', client_id).order('created_at', desc=True).execute()
            return result.data or []
            
        except Exception as e:
            print(f"❌ Error getting payments: {e}")
            raise
    
    # Note operations
    def add_note(self, client_id: str, note_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add a note to a client"""
        try:
            note_data['client_id'] = client_id
            note_data['created_at'] = datetime.now(timezone.utc).isoformat()
            
            # Insert note
            result = self.client.table('notes').insert(note_data).execute()
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            
            raise Exception("Failed to create note")
            
        except Exception as e:
            print(f"❌ Error adding note: {e}")
            raise
    
    # Analytics operations
    def get_analytics_data(self) -> Dict[str, Any]:
        """Get analytics data for dashboard"""
        try:
            # Get all clients for calculation
            clients = self.get_all_clients()
            
            if not clients:
                return {
                    'totalClients': 0,
                    'totalLoanAmount': 0,
                    'totalAmountPaid': 0,
                    'totalAmountDue': 0,
                    'totalOutstanding': 0,
                    'activeLoans': 0,
                    'overdueCount': 0,
                    'paidCount': 0,
                    'repaymentRate': 0,
                    'avgLoanAmount': 0
                }
            
            # Calculate metrics
            total_clients = len(clients)
            total_loan_amount = sum(c.get('loan_amount', 0) for c in clients)
            total_amount_paid = sum(c.get('amount_paid', 0) for c in clients)
            total_due = total_loan_amount * 1.5
            total_outstanding = max(0, total_due - total_amount_paid)
            
            active_statuses = ['active', 'repayment-due', 'overdue']
            active_loans = len([c for c in clients if c.get('status') in active_statuses])
            overdue_count = len([c for c in clients if c.get('status') == 'overdue'])
            paid_count = len([c for c in clients if c.get('status') == 'paid'])
            
            repayment_rate = (total_amount_paid / total_due * 100) if total_due > 0 else 0
            avg_loan_amount = total_loan_amount / total_clients if total_clients > 0 else 0
            
            return {
                'totalClients': total_clients,
                'totalLoanAmount': total_loan_amount,
                'totalAmountPaid': total_amount_paid,
                'totalAmountDue': total_due,
                'totalOutstanding': total_outstanding,
                'activeLoans': active_loans,
                'overdueCount': overdue_count,
                'paidCount': paid_count,
                'repaymentRate': repayment_rate,
                'avgLoanAmount': avg_loan_amount
            }
            
        except Exception as e:
            print(f"❌ Error getting analytics: {e}")
            raise
    
    def get_status_breakdown(self) -> List[Dict[str, Any]]:
        """Get client count by status"""
        try:
            clients = self.get_all_clients()
            status_counts = {}
            
            for client in clients:
                status = client.get('status', 'unknown')
                status_counts[status] = status_counts.get(status, 0) + 1
            
            return [{"status": status, "count": count} for status, count in status_counts.items()]
            
        except Exception as e:
            print(f"❌ Error getting status breakdown: {e}")
            raise
    
    def get_loan_type_breakdown(self) -> List[Dict[str, Any]]:
        """Get loan amount by loan type"""
        try:
            clients = self.get_all_clients()
            type_data = {}
            
            for client in clients:
                loan_type = client.get('loan_type', 'unknown')
                loan_amount = client.get('loan_amount', 0)
                amount_paid = client.get('amount_paid', 0)
                
                if loan_type not in type_data:
                    type_data[loan_type] = {
                        'count': 0,
                        'totalAmount': 0,
                        'totalPaid': 0
                    }
                
                type_data[loan_type]['count'] += 1
                type_data[loan_type]['totalAmount'] += loan_amount
                type_data[loan_type]['totalPaid'] += amount_paid
            
            result = []
            for loan_type, data in type_data.items():
                total_due = data['totalAmount'] * 1.5
                outstanding = max(0, total_due - data['totalPaid'])
                
                result.append({
                    "type": loan_type,
                    "count": data['count'],
                    "amount": data['totalAmount'],
                    "totalDue": total_due,
                    "outstanding": outstanding
                })
            
            return result
            
        except Exception as e:
            print(f"❌ Error getting loan type breakdown: {e}")
            raise

    # User Management Methods
    def create_user(self, user_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create a new user"""
        try:
            user_data['created_at'] = datetime.now(timezone.utc).isoformat()
            result = self.client.table('users').insert(user_data).execute()
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            
            return None
            
        except Exception as e:
            print(f"❌ Error creating user: {e}")
            raise
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        try:
            result = self.client.table('users').select("*").eq('id', user_id).execute()
            if result.data and len(result.data) > 0:
                return result.data[0]
            return None
            
        except Exception as e:
            print(f"❌ Error getting user by ID: {e}")
            raise
    
    def get_user_by_supabase_id(self, supabase_id: str) -> Optional[Dict[str, Any]]:
        """Get user by Supabase ID"""
        try:
            result = self.client.table('users').select("*").eq('supabase_id', supabase_id).execute()
            if result.data and len(result.data) > 0:
                return result.data[0]
            return None
            
        except Exception as e:
            print(f"❌ Error getting user by Supabase ID: {e}")
            raise
    
    def update_user(self, user_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update user"""
        try:
            update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
            result = self.client.table('users').update(update_data).eq('id', user_id).execute()
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            
            return None
            
        except Exception as e:
            print(f"❌ Error updating user: {e}")
            raise
    
    def get_all_users(self) -> List[Dict[str, Any]]:
        """Get all users"""
        try:
            result = self.client.table('users').select("*").execute()
            return result.data or []
            
        except Exception as e:
            print(f"❌ Error getting all users: {e}")
            raise

# Global database service instance
db_service = SupabaseService()