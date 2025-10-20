from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
import os
from dotenv import load_dotenv
from supabase_database import db_service
from models import validate_client_data, validate_payment_data, validate_user_data, CLIENT_STATUS_OPTIONS, UserModel

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, origins=[
    "http://localhost:5173", 
    "http://localhost:5175",
    "https://cashflow-crm.vercel.app",
    "https://cashflow-crm.vercel.app/crm"
], supports_credentials=True)  # Allow requests from React frontend

print(f"✅ Connected to Supabase successfully!")
print(f"🚀 Starting Cashflow CRM API...")
print(f"📊 Database: {os.getenv('DB_NAME', 'cashflowloans')}")
print(f"📦 Collection: clients, payments, documents, notes")
print(f"🌐 Frontend URL: http://localhost:5175 (and http://localhost:5173)")

# Helper function for error responses
def error_response(message: str, status_code: int = 400):
    return jsonify({'error': message, 'success': False}), status_code

def success_response(data=None, message: str = "Success"):
    response = {'success': True, 'message': message}
    if data is not None:
        if isinstance(data, dict):
            response.update(data)
        else:
            response['data'] = data
    return jsonify(response)

# Root and Info endpoints
@app.route('/')
def root():
    """Root endpoint"""
    return jsonify({
        'message': 'Cashflow CRM Backend API',
        'status': 'running',
        'version': '1.0.0',
        'frontend': 'https://cashflow-crm.vercel.app/crm',
        'api_docs': '/api',
        'health_check': '/api/health'
    })

@app.route('/api')
def api_info():
    """API information endpoint"""
    return jsonify({
        'message': 'Cashflow CRM API is running',
        'status': 'healthy',
        'version': '1.0.0',
        'frontend_url': 'https://cashflow-crm.vercel.app/crm',
        'endpoints': {
            'health': '/api/health',
            'clients': '/api/clients',
            'users': '/api/users',
            'analytics': '/api/analytics'
        }
    })

# Health and Info endpoints
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        is_connected = db_service.is_connected()
        return jsonify({
            'status': 'healthy' if is_connected else 'unhealthy',
            'message': 'Cashflow CRM API is running',
            'database': 'connected' if is_connected else 'disconnected',
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'message': str(e),
            'database': 'disconnected',
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/info', methods=['GET'])
def api_info():
    """API information endpoint"""
    return jsonify({
        'name': 'Cashflow CRM API',
        'version': '1.0.0',
        'description': 'Backend API for Cashflow CRM loan management system',
        'endpoints': {
            'clients': '/api/clients',
            'payments': '/api/clients/{id}/payments',
            'notes': '/api/clients/{id}/notes',
            'analytics': '/api/analytics'
        }
    })

# Client endpoints
@app.route('/api/clients', methods=['GET'])
def get_clients():
    """Get all clients"""
    try:
        clients = db_service.get_all_clients()
        return jsonify(clients)
    except Exception as e:
        return error_response(f"Failed to fetch clients: {str(e)}", 500)

@app.route('/api/clients', methods=['POST'])
def create_client():
    """Create a new client"""
    try:
        data = request.get_json()
        
        if not data:
            return error_response("No data provided")
        
        # Validate client data
        is_valid, errors = validate_client_data(data)
        if not is_valid:
            return error_response(f"Validation errors: {', '.join(errors)}")
        
        # Create client
        client = db_service.create_client(data)
        
        return jsonify({
            'success': True,
            'message': 'Client created successfully',
            'client': client
        }), 201
        
    except Exception as e:
        return error_response(f"Failed to create client: {str(e)}", 500)

@app.route('/api/clients/<client_id>', methods=['GET'])
def get_client(client_id):
    """Get a specific client"""
    try:
        client = db_service.get_client_by_id(client_id)
        
        if client:
            return jsonify(client)
        else:
            return error_response('Client not found', 404)
            
    except Exception as e:
        return error_response(f"Failed to fetch client: {str(e)}", 500)

@app.route('/api/clients/<client_id>', methods=['PUT'])
def update_client(client_id):
    """Update a client"""
    try:
        data = request.get_json()
        
        if not data:
            return error_response("No data provided")
        
        # Update client
        updated_client = db_service.update_client(client_id, data)
        
        if updated_client:
            return jsonify({
                'success': True,
                'message': 'Client updated successfully',
                'client': updated_client
            })
        else:
            return error_response('Client not found', 404)
            
    except Exception as e:
        return error_response(f"Failed to update client: {str(e)}", 500)

@app.route('/api/clients/<client_id>/status', methods=['PUT'])
def update_client_status(client_id):
    """Update client status"""
    try:
        data = request.get_json()
        new_status = data.get('status') if data else None
        
        if not new_status:
            return error_response('Status is required')
        
        if new_status not in CLIENT_STATUS_OPTIONS:
            return error_response(f'Invalid status. Must be one of: {", ".join(CLIENT_STATUS_OPTIONS)}')
        
        # Update client status
        updated_client = db_service.update_client_status(client_id, new_status)
        
        if updated_client:
            return jsonify({
                'success': True,
                'message': 'Client status updated successfully',
                'client': updated_client
            })
        else:
            return error_response('Client not found', 404)
            
    except Exception as e:
        return error_response(f"Failed to update client status: {str(e)}", 500)

@app.route('/api/clients/<client_id>', methods=['DELETE'])
def delete_client(client_id):
    """Delete a client"""
    try:
        success = db_service.delete_client(client_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Client deleted successfully'
            })
        else:
            return error_response('Client not found', 404)
            
    except Exception as e:
        return error_response(f"Failed to delete client: {str(e)}", 500)

# Payment endpoints
@app.route('/api/clients/<client_id>/payments', methods=['POST'])
def add_payment(client_id):
    """Add a payment for a client"""
    try:
        data = request.get_json()
        
        if not data:
            return error_response("No data provided")
        
        # Validate payment data
        is_valid, errors = validate_payment_data({**data, 'clientId': client_id})
        if not is_valid:
            return error_response(f"Validation errors: {', '.join(errors)}")
        
        # Add payment
        updated_client = db_service.add_payment(client_id, data)
        
        if updated_client:
            return jsonify({
                'success': True,
                'message': 'Payment added successfully',
                'client': updated_client
            }), 201
        else:
            return error_response('Client not found', 404)
            
    except Exception as e:
        return error_response(f"Failed to add payment: {str(e)}", 500)

@app.route('/api/clients/<client_id>/payments', methods=['GET'])
def get_client_payments(client_id):
    """Get all payments for a client"""
    try:
        payments = db_service.get_client_payments(client_id)
        return jsonify(payments)
    except Exception as e:
        return error_response(f"Failed to fetch payments: {str(e)}", 500)

# Note endpoints
@app.route('/api/clients/<client_id>/notes', methods=['POST'])
def add_note(client_id):
    """Add a note to a client"""
    try:
        data = request.get_json()
        
        if not data or not data.get('content'):
            return error_response("Note content is required")
        
        # Add note
        note = db_service.add_note(client_id, data)
        
        return jsonify({
            'success': True,
            'message': 'Note added successfully',
            'note': note
        }), 201
        
    except Exception as e:
        return error_response(f"Failed to add note: {str(e)}", 500)

# Analytics endpoints
@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    """Get analytics data for dashboard"""
    try:
        analytics = db_service.get_analytics_data()
        status_breakdown = db_service.get_status_breakdown()
        loan_type_breakdown = db_service.get_loan_type_breakdown()
        
        return jsonify({
            'summary': analytics,
            'statusBreakdown': status_breakdown,
            'loanTypeBreakdown': loan_type_breakdown,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return error_response(f"Failed to fetch analytics: {str(e)}", 500)

@app.route('/api/analytics/summary', methods=['GET'])
def get_analytics_summary():
    """Get summary analytics"""
    try:
        analytics = db_service.get_analytics_data()
        return jsonify(analytics)
    except Exception as e:
        return error_response(f"Failed to fetch analytics summary: {str(e)}", 500)

# Utility endpoints
@app.route('/api/clients/<client_id>/calculate', methods=['GET'])
def calculate_client_amounts(client_id):
    """Calculate amounts for a specific client"""
    try:
        client = db_service.get_client_by_id(client_id)
        
        if not client:
            return error_response('Client not found', 404)
        
        loan_amount = client.get('loanAmount', 0)
        amount_paid = client.get('amountPaid', 0)
        total_due = loan_amount * 1.5  # 50% interest
        remaining = max(0, total_due - amount_paid)
        progress = (amount_paid / total_due * 100) if total_due > 0 else 0
        
        return jsonify({
            'loanAmount': loan_amount,
            'totalAmountDue': total_due,
            'amountPaid': amount_paid,
            'remainingBalance': remaining,
            'paymentProgress': progress,
            'interestAmount': loan_amount * 0.5,
            'isFullyPaid': remaining <= 0
        })
        
    except Exception as e:
        return error_response(f"Failed to calculate amounts: {str(e)}", 500)

# User Management Endpoints
@app.route('/api/users', methods=['POST'])
def create_or_update_user():
    """Create or update a user after Supabase authentication"""
    try:
        data = request.get_json()
        
        if not data:
            return error_response('No data provided')
        
        # Validate user data
        is_valid, validation_errors = validate_user_data(data)
        if not is_valid:
            return error_response(f"Validation failed: {', '.join(validation_errors)}")
        
        # Check if user exists by supabaseId
        existing_user = db_service.get_user_by_supabase_id(data['supabaseId'])
        
        if existing_user:
            # Update existing user
            user_data = UserModel(data).to_dict()
            user_data['updatedAt'] = datetime.now().isoformat()
            
            updated_user = db_service.update_user(existing_user['id'], user_data)
            if updated_user:
                return success_response(updated_user, "User updated successfully")
            else:
                return error_response("Failed to update user", 500)
        else:
            # Create new user
            user_model = UserModel(data)
            created_user = db_service.create_user(user_model.to_dict())
            
            if created_user:
                return success_response(created_user, "User created successfully")
            else:
                return error_response("Failed to create user", 500)
                
    except Exception as e:
        return error_response(f"Failed to process user: {str(e)}", 500)

@app.route('/api/users/<user_id>', methods=['GET'])
def get_user(user_id):
    """Get user by ID"""
    try:
        user = db_service.get_user_by_id(user_id)
        
        if not user:
            return error_response('User not found', 404)
        
        return success_response(user)
        
    except Exception as e:
        return error_response(f"Failed to get user: {str(e)}", 500)

@app.route('/api/users/supabase/<supabase_id>', methods=['GET'])
def get_user_by_supabase_id(supabase_id):
    """Get user by Supabase ID"""
    try:
        user = db_service.get_user_by_supabase_id(supabase_id)
        
        if not user:
            return error_response('User not found', 404)
        
        return success_response(user)
        
    except Exception as e:
        return error_response(f"Failed to get user: {str(e)}", 500)

@app.route('/api/users/<user_id>/login', methods=['POST'])
def update_user_login(user_id):
    """Update user's last login timestamp"""
    try:
        user = db_service.get_user_by_id(user_id)
        
        if not user:
            return error_response('User not found', 404)
        
        update_data = {
            'lastLoginAt': datetime.now().isoformat(),
            'updatedAt': datetime.now().isoformat()
        }
        
        updated_user = db_service.update_user(user_id, update_data)
        
        if updated_user:
            return success_response(updated_user, "Login timestamp updated")
        else:
            return error_response("Failed to update login timestamp", 500)
            
    except Exception as e:
        return error_response(f"Failed to update login: {str(e)}", 500)

# For development only
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)

# For production, gunicorn will import the app directly