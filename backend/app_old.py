from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import uuid

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-jwt-secret-key')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key')

# Initialize extensions
jwt = JWTManager(app)
CORS(app, origins=[os.getenv('FRONTEND_URL', 'http://localhost:5173')])

# MongoDB connection
try:
    client = MongoClient(os.getenv('MONGODB_URI'))
    db = client[os.getenv('DATABASE_NAME', 'cashflowloans')]
    clients_collection = db[os.getenv('COLLECTION_NAME', 'cashflowapp')]
    print("✅ Connected to MongoDB Atlas successfully!")
except Exception as e:
    print(f"❌ Failed to connect to MongoDB: {e}")

# Helper function to serialize MongoDB documents
def serialize_doc(doc):
    """Convert MongoDB document to JSON serializable format"""
    if doc is None:
        return None
    
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    
    if '_id' in doc:
        doc['_id'] = str(doc['_id'])
    
    return doc

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    try:
        # Test MongoDB connection
        client.admin.command('ping')
        return jsonify({
            'status': 'healthy',
            'message': 'Cashflow CRM API is running',
            'database': 'connected',
            'timestamp': datetime.utcnow().isoformat()
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'message': 'Database connection failed',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

# Get all clients
@app.route('/api/clients', methods=['GET'])
def get_clients():
    try:
        clients = list(clients_collection.find({}))
        return jsonify({
            'success': True,
            'clients': serialize_doc(clients),
            'count': len(clients)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Get client by ID
@app.route('/api/clients/<client_id>', methods=['GET'])
def get_client(client_id):
    try:
        # Try to find by custom id first, then by MongoDB _id
        client = clients_collection.find_one({'id': client_id})
        if not client:
            client = clients_collection.find_one({'_id': ObjectId(client_id)})
        
        if client:
            return jsonify({
                'success': True,
                'client': serialize_doc(client)
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Client not found'
            }), 404
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Create new client
@app.route('/api/clients', methods=['POST'])
def create_client():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email', 'phone', 'loanAmount', 'loanType']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Generate unique client ID
        client_id = str(uuid.uuid4())
        
        # Calculate loan details
        loan_amount = float(data['loanAmount'])
        total_amount_due = loan_amount * 1.5  # 50% interest
        
        # Set dates
        today = datetime.utcnow()
        start_date = today.strftime('%Y-%m-%d')
        
        # Calculate end of current month for due date
        if today.month == 12:
            next_month = today.replace(year=today.year + 1, month=1, day=1)
        else:
            next_month = today.replace(month=today.month + 1, day=1)
        due_date = (next_month - timedelta(days=1)).strftime('%Y-%m-%d')
        
        # Create client document
        client = {
            'id': client_id,
            'name': data['name'],
            'email': data['email'],
            'phone': data['phone'],
            'idNumber': data.get('idNumber', ''),
            'loanType': data['loanType'],
            'loanAmount': loan_amount,
            'interestRate': 50.0,
            'startDate': start_date,
            'dueDate': due_date,
            'monthlyPayment': total_amount_due,
            'amountPaid': 0,
            'status': 'new-lead',
            'applicationDate': today.isoformat(),
            'lastStatusUpdate': today.isoformat(),
            'documents': data.get('documents', []),
            'paymentHistory': [],
            'notes': [],
            'createdAt': today.isoformat(),
            'updatedAt': today.isoformat()
        }
        
        # Insert into MongoDB
        result = clients_collection.insert_one(client)
        client['_id'] = str(result.inserted_id)
        
        return jsonify({
            'success': True,
            'message': 'Client created successfully',
            'client': serialize_doc(client)
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Update client
@app.route('/api/clients/<client_id>', methods=['PUT'])
def update_client(client_id):
    try:
        data = request.get_json()
        
        # Find client
        client = clients_collection.find_one({'id': client_id})
        if not client:
            return jsonify({
                'success': False,
                'error': 'Client not found'
            }), 404
        
        # Update timestamp
        data['updatedAt'] = datetime.utcnow().isoformat()
        
        # Update client
        result = clients_collection.update_one(
            {'id': client_id},
            {'$set': data}
        )
        
        if result.modified_count > 0:
            updated_client = clients_collection.find_one({'id': client_id})
            return jsonify({
                'success': True,
                'message': 'Client updated successfully',
                'client': serialize_doc(updated_client)
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'No changes made'
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Update client status
@app.route('/api/clients/<client_id>/status', methods=['PUT'])
def update_client_status(client_id):
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({
                'success': False,
                'error': 'Status is required'
            }), 400
        
        # Valid statuses
        valid_statuses = ['new-lead', 'active', 'repayment-due', 'paid', 'overdue', 'negotiation']
        if new_status not in valid_statuses:
            return jsonify({
                'success': False,
                'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'
            }), 400
        
        # Update client status
        result = clients_collection.update_one(
            {'id': client_id},
            {
                '$set': {
                    'status': new_status,
                    'lastStatusUpdate': datetime.utcnow().isoformat(),
                    'updatedAt': datetime.utcnow().isoformat()
                }
            }
        )
        
        if result.modified_count > 0:
            updated_client = clients_collection.find_one({'id': client_id})
            return jsonify({
                'success': True,
                'message': 'Status updated successfully',
                'client': serialize_doc(updated_client)
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Client not found'
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Delete client
@app.route('/api/clients/<client_id>', methods=['DELETE'])
def delete_client(client_id):
    try:
        result = clients_collection.delete_one({'id': client_id})
        
        if result.deleted_count > 0:
            return jsonify({
                'success': True,
                'message': 'Client deleted successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Client not found'
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Add payment to client
@app.route('/api/clients/<client_id>/payments', methods=['POST'])
def add_payment(client_id):
    try:
        data = request.get_json()
        
        # Validate required fields
        if 'amount' not in data:
            return jsonify({
                'success': False,
                'error': 'Payment amount is required'
            }), 400
        
        payment_amount = float(data['amount'])
        payment_date = data.get('date', datetime.utcnow().strftime('%Y-%m-%d'))
        
        # Find client
        client = clients_collection.find_one({'id': client_id})
        if not client:
            return jsonify({
                'success': False,
                'error': 'Client not found'
            }), 404
        
        # Create payment record
        payment = {
            'id': str(uuid.uuid4()),
            'amount': payment_amount,
            'date': payment_date,
            'timestamp': datetime.utcnow().isoformat(),
            'method': data.get('method', 'cash'),
            'notes': data.get('notes', '')
        }
        
        # Update client with payment
        new_amount_paid = client.get('amountPaid', 0) + payment_amount
        total_amount_due = client['loanAmount'] * 1.5
        
        # Determine new status based on payment
        new_status = client['status']
        if new_amount_paid >= total_amount_due:
            new_status = 'paid'
        elif new_amount_paid > 0 and client['status'] == 'new-lead':
            new_status = 'active'
        
        # Update in database
        result = clients_collection.update_one(
            {'id': client_id},
            {
                '$set': {
                    'amountPaid': new_amount_paid,
                    'status': new_status,
                    'lastPaymentDate': payment_date,
                    'lastStatusUpdate': datetime.utcnow().isoformat(),
                    'updatedAt': datetime.utcnow().isoformat()
                },
                '$push': {
                    'paymentHistory': payment
                }
            }
        )
        
        if result.modified_count > 0:
            updated_client = clients_collection.find_one({'id': client_id})
            return jsonify({
                'success': True,
                'message': 'Payment added successfully',
                'payment': payment,
                'client': serialize_doc(updated_client)
            }), 201
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to add payment'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Get analytics/dashboard data
@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    try:
        # Get all clients for calculations
        clients = list(clients_collection.find({}))
        
        if not clients:
            return jsonify({
                'success': True,
                'analytics': {
                    'totalClients': 0,
                    'totalLoaned': 0,
                    'totalAmountDue': 0,
                    'totalCollected': 0,
                    'totalOutstanding': 0,
                    'activeLoans': 0,
                    'overdueCount': 0,
                    'repaymentRate': 0,
                    'statusBreakdown': {},
                    'loanTypeBreakdown': {}
                }
            }), 200
        
        # Calculate analytics
        total_clients = len(clients)
        total_loaned = sum(client.get('loanAmount', 0) for client in clients)
        total_amount_due = sum(client.get('loanAmount', 0) * 1.5 for client in clients)
        total_collected = sum(client.get('amountPaid', 0) for client in clients)
        total_outstanding = total_amount_due - total_collected
        
        # Status counts
        status_counts = {}
        loan_type_counts = {}
        
        for client in clients:
            status = client.get('status', 'unknown')
            loan_type = client.get('loanType', 'unknown')
            
            status_counts[status] = status_counts.get(status, 0) + 1
            loan_type_counts[loan_type] = loan_type_counts.get(loan_type, 0) + 1
        
        active_loans = status_counts.get('active', 0) + status_counts.get('repayment-due', 0)
        overdue_count = status_counts.get('overdue', 0)
        repayment_rate = (total_collected / total_amount_due * 100) if total_amount_due > 0 else 0
        
        analytics = {
            'totalClients': total_clients,
            'totalLoaned': total_loaned,
            'totalAmountDue': total_amount_due,
            'totalCollected': total_collected,
            'totalOutstanding': total_outstanding,
            'activeLoans': active_loans,
            'overdueCount': overdue_count,
            'repaymentRate': round(repayment_rate, 2),
            'statusBreakdown': status_counts,
            'loanTypeBreakdown': loan_type_counts
        }
        
        return jsonify({
            'success': True,
            'analytics': analytics
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500

if __name__ == '__main__':
    print("🚀 Starting Cashflow CRM API...")
    print(f"📊 Database: {os.getenv('DATABASE_NAME', 'cashflowloans')}")
    print(f"📦 Collection: {os.getenv('COLLECTION_NAME', 'cashflowapp')}")
    print(f"🌐 Frontend URL: {os.getenv('FRONTEND_URL', 'http://localhost:5173')}")
    
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )