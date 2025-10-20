"""
Database service layer for Cashflow CRM
Handles all MongoDB operations with proper error handling
"""

from pymongo import MongoClient
from pymongo.errors import PyMongoError
from bson import ObjectId
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import os
import ssl
from dotenv import load_dotenv
from models import ClientModel, PaymentModel, DocumentModel, NoteModel, UserModel

# Load environment variables
load_dotenv()

class DatabaseService:
    """Database service for MongoDB operations"""
    
    def __init__(self):
        self.client = None
        self.db = None
        self.clients_collection = None
        self.payments_collection = None
        self.documents_collection = None
        self.notes_collection = None
        self.users_collection = None
        self._connect()
    
    def _connect(self):
        """Connect to MongoDB Atlas"""
        try:
            mongo_uri = os.getenv('MONGODB_URI') or os.getenv('MONGO_URI')
            if not mongo_uri:
                raise ValueError("MONGODB_URI environment variable not found")
            
            # Alternative connection strings for Render compatibility
            connection_strings = [
                # Primary: Original connection string with SSL disabled
                mongo_uri.replace('?retryWrites=true&w=majority', '?ssl=false&retryWrites=true&w=majority'),
                # Fallback 1: Original string
                mongo_uri,
                # Fallback 2: Standard MongoDB connection (if SRV fails)
                "mongodb://tcityhorizon88_db_user:kHGmFJIUqsm51mYo@ac-joren2z-shard-00-00.pmt1i7t.mongodb.net:27017,ac-joren2z-shard-00-01.pmt1i7t.mongodb.net:27017,ac-joren2z-shard-00-02.pmt1i7t.mongodb.net:27017/cashflowloans?ssl=false&replicaSet=atlas-gjmxtg-shard-0&authSource=admin&retryWrites=true&w=majority"
            ]
            
            # Create SSL context for bypass
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            
            # Try multiple connection methods for Render compatibility
            connection_methods = [
                # Method 1: Complete SSL bypass
                {
                    'ssl': False,
                    'serverSelectionTimeoutMS': 50000,
                    'socketTimeoutMS': 50000,
                    'connectTimeoutMS': 50000,
                    'maxPoolSize': 1
                },
                # Method 2: SSL context bypass
                {
                    'ssl_context': ssl_context,
                    'serverSelectionTimeoutMS': 50000,
                    'socketTimeoutMS': 50000,
                    'connectTimeoutMS': 50000
                },
                # Method 3: PyMongo SSL options
                {
                    'ssl': True,
                    'ssl_cert_reqs': ssl.CERT_NONE,
                    'ssl_match_hostname': False,
                    'serverSelectionTimeoutMS': 50000,
                    'socketTimeoutMS': 50000,
                    'connectTimeoutMS': 50000
                }
            ]
            
            client = None
            last_error = None
            
            # Try different connection strings and methods
            for uri in connection_strings:
                for method in connection_methods:
                    try:
                        print(f"Trying MongoDB URI: {uri[:50]}... with method: {method}")
                        client = MongoClient(uri, **method)
                        # Test the connection
                        client.admin.command('ping')
                        print("✅ MongoDB connection successful!")
                        print(f"✅ Connected using URI: {uri[:50]}... with method: {method}")
                        break
                    except Exception as e:
                        print(f"❌ Connection failed: {str(e)[:100]}...")
                        last_error = e
                        if client:
                            client.close()
                        client = None
                if client:  # Break outer loop if connection successful
                    break
            
            if not client:
                raise last_error or Exception("All MongoDB connection methods failed")
                
            self.client = client
            
            # Test connection
            self.client.admin.command('ping')
            
            # Get database and collections
            db_name = os.getenv('DB_NAME', 'cashflowloans')
            self.db = self.client[db_name]
            
            self.clients_collection = self.db['clients']
            self.payments_collection = self.db['payments']
            self.documents_collection = self.db['documents']
            self.notes_collection = self.db['notes']
            self.users_collection = self.db['users']
            
            print(f"✅ Connected to MongoDB database: {db_name}")
            
        except Exception as e:
            print(f"❌ Failed to connect to MongoDB: {e}")
            raise
    
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
            
            # Insert into database
            result = self.clients_collection.insert_one(client.to_dict())
            
            # Get the inserted document
            inserted_client = self.clients_collection.find_one({"_id": result.inserted_id})
            
            # Convert ObjectId to string for JSON serialization
            if inserted_client:
                inserted_client['_id'] = str(inserted_client['_id'])
            
            return inserted_client
            
        except PyMongoError as e:
            print(f"❌ Database error creating client: {e}")
            raise
        except Exception as e:
            print(f"❌ Error creating client: {e}")
            raise
    
    def get_all_clients(self) -> List[Dict[str, Any]]:
        """Get all clients"""
        try:
            cursor = self.clients_collection.find({}).sort("createdAt", -1)
            clients = []
            
            for doc in cursor:
                doc['_id'] = str(doc['_id'])
                clients.append(doc)
            
            return clients
            
        except PyMongoError as e:
            print(f"❌ Database error getting clients: {e}")
            raise
        except Exception as e:
            print(f"❌ Error getting clients: {e}")
            raise
    
    def get_client_by_id(self, client_id: str) -> Optional[Dict[str, Any]]:
        """Get a client by ID (either MongoDB _id or custom id)"""
        try:
            # Try to find by custom id first
            client = self.clients_collection.find_one({"id": client_id})
            
            # If not found, try MongoDB _id
            if not client:
                try:
                    client = self.clients_collection.find_one({"_id": ObjectId(client_id)})
                except:
                    pass
            
            if client:
                client['_id'] = str(client['_id'])
            
            return client
            
        except PyMongoError as e:
            print(f"❌ Database error getting client: {e}")
            raise
        except Exception as e:
            print(f"❌ Error getting client: {e}")
            raise
    
    def update_client(self, client_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a client"""
        try:
            # Add updated timestamp
            update_data['updatedAt'] = datetime.now(timezone.utc).isoformat()
            
            # Try to update by custom id first
            result = self.clients_collection.update_one(
                {"id": client_id},
                {"$set": update_data}
            )
            
            # If not found, try MongoDB _id
            if result.matched_count == 0:
                try:
                    result = self.clients_collection.update_one(
                        {"_id": ObjectId(client_id)},
                        {"$set": update_data}
                    )
                except:
                    pass
            
            if result.matched_count > 0:
                return self.get_client_by_id(client_id)
            
            return None
            
        except PyMongoError as e:
            print(f"❌ Database error updating client: {e}")
            raise
        except Exception as e:
            print(f"❌ Error updating client: {e}")
            raise
    
    def delete_client(self, client_id: str) -> bool:
        """Delete a client"""
        try:
            # Try to delete by custom id first
            result = self.clients_collection.delete_one({"id": client_id})
            
            # If not found, try MongoDB _id
            if result.deleted_count == 0:
                try:
                    result = self.clients_collection.delete_one({"_id": ObjectId(client_id)})
                except:
                    pass
            
            return result.deleted_count > 0
            
        except PyMongoError as e:
            print(f"❌ Database error deleting client: {e}")
            raise
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
            
            # Insert payment
            self.payments_collection.insert_one(payment.to_dict())
            
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
            cursor = self.payments_collection.find({"clientId": client_id}).sort("createdAt", -1)
            payments = []
            
            for doc in cursor:
                doc['_id'] = str(doc['_id'])
                payments.append(doc)
            
            return payments
            
        except Exception as e:
            print(f"❌ Error getting payments: {e}")
            raise
    
    # Note operations
    def add_note(self, client_id: str, note_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add a note to a client"""
        try:
            note_data['clientId'] = client_id
            note = NoteModel(note_data)
            
            # Insert note
            result = self.notes_collection.insert_one(note.to_dict())
            
            # Add to client's notes array
            client = self.get_client_by_id(client_id)
            if client:
                notes = client.get('notes', [])
                notes.append(note.to_dict())
                self.update_client(client_id, {'notes': notes})
            
            note_dict = note.to_dict()
            note_dict['_id'] = str(result.inserted_id)
            return note_dict
            
        except Exception as e:
            print(f"❌ Error adding note: {e}")
            raise
    
    # Analytics operations
    def get_analytics_data(self) -> Dict[str, Any]:
        """Get analytics data for dashboard"""
        try:
            pipeline = [
                {
                    "$group": {
                        "_id": None,
                        "totalClients": {"$sum": 1},
                        "totalLoanAmount": {"$sum": "$loanAmount"},
                        "totalAmountPaid": {"$sum": "$amountPaid"},
                        "activeLoans": {
                            "$sum": {
                                "$cond": [
                                    {"$in": ["$status", ["active", "repayment-due", "overdue"]]},
                                    1,
                                    0
                                ]
                            }
                        },
                        "overdueCount": {
                            "$sum": {
                                "$cond": [{"$eq": ["$status", "overdue"]}, 1, 0]
                            }
                        },
                        "paidCount": {
                            "$sum": {
                                "$cond": [{"$eq": ["$status", "paid"]}, 1, 0]
                            }
                        }
                    }
                }
            ]
            
            result = list(self.clients_collection.aggregate(pipeline))
            
            if result:
                data = result[0]
                # Calculate additional metrics
                total_due = data['totalLoanAmount'] * 1.5 if data['totalLoanAmount'] else 0
                data['totalAmountDue'] = total_due
                data['totalOutstanding'] = max(0, total_due - data['totalAmountPaid'])
                data['repaymentRate'] = (data['totalAmountPaid'] / total_due * 100) if total_due > 0 else 0
                data['avgLoanAmount'] = data['totalLoanAmount'] / data['totalClients'] if data['totalClients'] > 0 else 0
                
                return data
            
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
            
        except Exception as e:
            print(f"❌ Error getting analytics: {e}")
            raise
    
    def get_status_breakdown(self) -> List[Dict[str, Any]]:
        """Get client count by status"""
        try:
            pipeline = [
                {
                    "$group": {
                        "_id": "$status",
                        "count": {"$sum": 1}
                    }
                }
            ]
            
            result = list(self.clients_collection.aggregate(pipeline))
            return [{"status": doc["_id"], "count": doc["count"]} for doc in result]
            
        except Exception as e:
            print(f"❌ Error getting status breakdown: {e}")
            raise
    
    def get_loan_type_breakdown(self) -> List[Dict[str, Any]]:
        """Get loan amount by loan type"""
        try:
            pipeline = [
                {
                    "$group": {
                        "_id": "$loanType",
                        "count": {"$sum": 1},
                        "totalAmount": {"$sum": "$loanAmount"},
                        "totalDue": {"$sum": {"$multiply": ["$loanAmount", 1.5]}},
                        "totalPaid": {"$sum": "$amountPaid"}
                    }
                }
            ]
            
            result = list(self.clients_collection.aggregate(pipeline))
            formatted_result = []
            
            for doc in result:
                formatted_result.append({
                    "type": doc["_id"],
                    "count": doc["count"],
                    "amount": doc["totalAmount"],
                    "totalDue": doc["totalDue"],
                    "outstanding": max(0, doc["totalDue"] - doc["totalPaid"])
                })
            
            return formatted_result
            
        except Exception as e:
            print(f"❌ Error getting loan type breakdown: {e}")
            raise

    # User Management Methods
    def create_user(self, user_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create a new user"""
        try:
            result = self.users_collection.insert_one(user_data)
            
            if result.inserted_id:
                user_data['_id'] = str(result.inserted_id)
                return user_data
            
            return None
            
        except Exception as e:
            print(f"❌ Error creating user: {e}")
            raise
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        try:
            user = self.users_collection.find_one({"id": user_id})
            
            if user:
                user['_id'] = str(user['_id'])
            
            return user
            
        except Exception as e:
            print(f"❌ Error getting user by ID: {e}")
            raise
    
    def get_user_by_supabase_id(self, supabase_id: str) -> Optional[Dict[str, Any]]:
        """Get user by Supabase ID"""
        try:
            user = self.users_collection.find_one({"supabaseId": supabase_id})
            
            if user:
                user['_id'] = str(user['_id'])
            
            return user
            
        except Exception as e:
            print(f"❌ Error getting user by Supabase ID: {e}")
            raise
    
    def update_user(self, user_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update user"""
        try:
            # Remove MongoDB ID if present
            update_data.pop('_id', None)
            
            result = self.users_collection.update_one(
                {"id": user_id},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                return self.get_user_by_id(user_id)
            
            return None
            
        except Exception as e:
            print(f"❌ Error updating user: {e}")
            raise
    
    def get_all_users(self) -> List[Dict[str, Any]]:
        """Get all users"""
        try:
            users = list(self.users_collection.find({}))
            
            for user in users:
                user['_id'] = str(user['_id'])
            
            return users
            
        except Exception as e:
            print(f"❌ Error getting all users: {e}")
            raise

# Global database service instance
db_service = DatabaseService()