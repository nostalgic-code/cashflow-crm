"""
Database service layer for Cashflow CRM
Uses MongoDB Atlas Data API to bypass SSL issues on Render
"""

from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import os
from dotenv import load_dotenv
from models import ClientModel, PaymentModel, DocumentModel, NoteModel, UserModel
from mongodb_api_wrapper import mongo_api

# Load environment variables
load_dotenv()

class DatabaseService:
    """Database service using MongoDB Atlas Data API"""
    
    def __init__(self):
        print(f"🔌 Initializing MongoDB Data API service...")
        if not mongo_api.api_key:
            print("⚠️ Warning: MONGODB_API_KEY not found. Please set it in your environment.")
        else:
            print(f"✅ MongoDB Data API service initialized")
    
    def is_connected(self) -> bool:
        """Check if database is connected"""
        try:
            # Test by getting one client
            result = mongo_api.find_one('clients', {})
            return True
        except:
            return False
    
    def is_connected(self) -> bool:
        """Check if database is connected"""
        try:
            if self.client:
                self.client.admin.command('ping')
                return True
        except:
            pass
        return False
    
    # Client operations
    def create_client(self, client_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new client"""
        try:
            client = ClientModel(client_data)
            client_dict = client.to_dict()
            
            # Insert into database using API
            inserted_id = mongo_api.insert_one('clients', client_dict)
            
            if inserted_id:
                client_dict['_id'] = inserted_id
                return client_dict
            
            return None
            
        except Exception as e:
            print(f"❌ Error creating client: {e}")
            raise
    
    def get_all_clients(self) -> List[Dict[str, Any]]:
        """Get all clients"""
        try:
            clients = mongo_api.find_all('clients')
            return clients or []
            
        except Exception as e:
            print(f"❌ Error getting clients: {e}")
            raise
    
    def get_client_by_id(self, client_id: str) -> Optional[Dict[str, Any]]:
        """Get a client by ID"""
        try:
            # Try to find by custom id first
            client = mongo_api.find_one('clients', {"id": client_id})
            
            # If not found and looks like MongoDB ObjectId, try that
            if not client and len(client_id) == 24:
                client = mongo_api.find_one('clients', {"_id": client_id})
            
            return client
            
        except Exception as e:
            print(f"❌ Error getting client: {e}")
            raise
    
    def update_client(self, client_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a client"""
        try:
            # Add updated timestamp
            update_data['updatedAt'] = datetime.now(timezone.utc).isoformat()
            
            # Try to update by custom id first
            success = mongo_api.update_one('clients', {"id": client_id}, {"$set": update_data})
            
            # If not found and looks like MongoDB ObjectId, try that
            if not success and len(client_id) == 24:
                success = mongo_api.update_one('clients', {"_id": client_id}, {"$set": update_data})
            
            if success:
                return self.get_client_by_id(client_id)
            
            return None
            
        except Exception as e:
            print(f"❌ Error updating client: {e}")
            raise
    
    def delete_client(self, client_id: str) -> bool:
        """Delete a client"""
        try:
            # Try to delete by custom id first
            success = mongo_api.delete_one('clients', {"id": client_id})
            
            # If not found and looks like MongoDB ObjectId, try that
            if not success and len(client_id) == 24:
                success = mongo_api.delete_one('clients', {"_id": client_id})
            
            return success
            
        except Exception as e:
            print(f"❌ Error deleting client: {e}")
            raise
    
    def update_client_status(self, client_id: str, new_status: str) -> Optional[Dict[str, Any]]:
        """Update client status"""
        try:
            update_data = {
                'status': new_status,
                'lastStatusUpdate': datetime.now(timezone.utc).isoformat(),
                'updatedAt': datetime.now(timezone.utc).isoformat()
            }
            
            return self.update_client(client_id, update_data)
            
        except Exception as e:
            print(f"❌ Error updating client status: {e}")
            raise
    
    # Payment operations
    def add_payment(self, client_id: str, payment_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Add a payment for a client"""
        try:
            # Create payment record
            payment_data['clientId'] = client_id
            payment = PaymentModel(payment_data)
            
            # Insert payment using API
            mongo_api.insert_one('payments', payment.to_dict())
            
            # Update client's amount paid
            client = self.get_client_by_id(client_id)
            if client:
                new_amount_paid = client.get('amountPaid', 0) + payment.amount
                
                # Update client
                update_data = {
                    'amountPaid': new_amount_paid,
                    'lastPaymentDate': payment.paymentDate
                }
                
                # Add to payment history
                payment_history = client.get('paymentHistory', [])
                payment_history.append(payment.to_dict())
                update_data['paymentHistory'] = payment_history
                
                # Auto-update status if needed
                total_due = client.get('loanAmount', 0) * 1.5
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
            payments = mongo_api.find_all('payments')
            # Filter by client ID
            client_payments = [p for p in payments if p.get('clientId') == client_id]
            return client_payments
            
        except Exception as e:
            print(f"❌ Error getting payments: {e}")
            raise
    
    # Note operations
    def add_note(self, client_id: str, note_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add a note to a client"""
        try:
            note_data['clientId'] = client_id
            note = NoteModel(note_data)
            note_dict = note.to_dict()
            
            # Insert note using API
            inserted_id = mongo_api.insert_one('notes', note_dict)
            
            # Add to client's notes array
            client = self.get_client_by_id(client_id)
            if client:
                notes = client.get('notes', [])
                notes.append(note_dict)
                self.update_client(client_id, {'notes': notes})
            
            if inserted_id:
                note_dict['_id'] = inserted_id
            
            return note_dict
            
        except Exception as e:
            print(f"❌ Error adding note: {e}")
            raise
    
    # Analytics operations (simplified for API)
    def get_analytics_data(self) -> Dict[str, Any]:
        """Get analytics data for dashboard"""
        try:
            clients = mongo_api.find_all('clients')
            
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
            total_loan_amount = sum(c.get('loanAmount', 0) for c in clients)
            total_amount_paid = sum(c.get('amountPaid', 0) for c in clients)
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
            clients = mongo_api.find_all('clients')
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
            clients = mongo_api.find_all('clients')
            type_data = {}
            
            for client in clients:
                loan_type = client.get('loanType', 'unknown')
                loan_amount = client.get('loanAmount', 0)
                amount_paid = client.get('amountPaid', 0)
                
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

    # User Management Methods (simplified for API)
    def create_user(self, user_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create a new user"""
        try:
            inserted_id = mongo_api.insert_one('users', user_data)
            
            if inserted_id:
                user_data['_id'] = inserted_id
                return user_data
            
            return None
            
        except Exception as e:
            print(f"❌ Error creating user: {e}")
            raise
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        try:
            return mongo_api.find_one('users', {"id": user_id})
            
        except Exception as e:
            print(f"❌ Error getting user by ID: {e}")
            raise
    
    def get_user_by_supabase_id(self, supabase_id: str) -> Optional[Dict[str, Any]]:
        """Get user by Supabase ID"""
        try:
            return mongo_api.find_one('users', {"supabaseId": supabase_id})
            
        except Exception as e:
            print(f"❌ Error getting user by Supabase ID: {e}")
            raise
    
    def update_user(self, user_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update user"""
        try:
            # Remove MongoDB ID if present
            update_data.pop('_id', None)
            
            success = mongo_api.update_one('users', {"id": user_id}, {"$set": update_data})
            
            if success:
                return self.get_user_by_id(user_id)
            
            return None
            
        except Exception as e:
            print(f"❌ Error updating user: {e}")
            raise
    
    def get_all_users(self) -> List[Dict[str, Any]]:
        """Get all users"""
        try:
            return mongo_api.find_all('users') or []
            
        except Exception as e:
            print(f"❌ Error getting all users: {e}")
            raise

# Global database service instance
db_service = DatabaseService()