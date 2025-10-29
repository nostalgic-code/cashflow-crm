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
    "https://cashflow-crm.vercel.app/crm",
    "https://cashflow-crm.onrender.com",
    "https://loan-forms.vercel.app"
], supports_credentials=True)  # Allow requests from React frontend

print(f"✅ Connected to Supabase successfully!")
print(f"🚀 Starting Cashflow CRM API...")
print(f"📊 Database: {os.getenv('DB_NAME', 'cashflowloans')}")
print(f"📦 Collection: clients, payments, documents, notes")
print(f"🌐 Frontend URL: https://cashflow-crm.vercel.app/crm")
print(f"🔗 Backend URL: https://cashflow-crm.onrender.com")

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

# Client management endpoints
@app.route('/api/clients', methods=['GET'])
def get_clients():
    """Get all clients with optional archived parameter"""
    try:
        print(f"🔍 GET /api/clients - Fetching all clients")
        
        # Check for include_archived parameter
        include_archived = request.args.get('include_archived', 'false').lower() == 'true'
        
        clients = db_service.get_all_clients(include_archived=include_archived)
        print(f"✅ Found {len(clients)} clients: {[c.get('name', 'No name') for c in clients]}")
        return jsonify(clients)
    except Exception as e:
        print(f"❌ Error fetching clients: {str(e)}")
        return error_response(f"Failed to fetch clients: {str(e)}", 500)

@app.route('/api/clients', methods=['POST'])
def create_client():
    """Create a new client"""
    try:
        print(f"🔍 POST /api/clients - Received request")
        data = request.get_json()
        print(f"📝 Request data: {data}")
        
        if not data:
            print("❌ No data provided")
            return error_response("No data provided")
        
        # Validate client data
        print(f"🔍 Validating client data...")
        is_valid, errors = validate_client_data(data)
        print(f"✅ Validation result: valid={is_valid}, errors={errors}")
        
        if not is_valid:
            print(f"❌ Validation failed: {errors}")
            return error_response(f"Validation errors: {', '.join(errors)}")
        
        # Create client
        print(f"🔍 Creating client in database...")
        client = db_service.create_client(data)
        print(f"✅ Client created successfully: {client}")
        
        return jsonify({
            'success': True,
            'message': 'Client created successfully',
            'client': client
        }), 201
        
    except Exception as e:
        print(f"❌ Error creating client: {str(e)}")
        import traceback
        print(f"📍 Full traceback: {traceback.format_exc()}")
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

# Additional Loan endpoints
@app.route('/api/clients/<client_id>/loans', methods=['POST'])
def add_loan_to_client(client_id):
    """Add an additional loan to an existing client"""
    try:
        print(f"🔍 POST /api/clients/{client_id}/loans - Adding additional loan")
        data = request.get_json()
        print(f"📝 Loan data: {data}")
        
        if not data:
            return error_response("No data provided")
        
        # Validate loan amount
        if not data.get('amount') or float(data.get('amount', 0)) <= 0:
            return error_response("Valid loan amount is required")
        
        # Add loan to client
        print(f"🔍 Adding additional loan to client...")
        updated_client = db_service.add_loan_to_client(client_id, data)
        print(f"✅ Additional loan added successfully: {updated_client}")
        
        if updated_client:
            return jsonify({
                'success': True,
                'message': 'Additional loan added successfully',
                'client': updated_client
            }), 201
        else:
            return error_response('Client not found', 404)
            
    except Exception as e:
        print(f"❌ Error adding additional loan: {str(e)}")
        import traceback
        print(f"📍 Full traceback: {traceback.format_exc()}")
        return error_response(f"Failed to add additional loan: {str(e)}", 500)

@app.route('/api/clients/<client_id>/loans', methods=['GET'])
def get_client_loans(client_id):
    """Get all individual loans for a client"""
    try:
        loans = db_service.get_client_loans(client_id)
        return jsonify(loans)
        
    except Exception as e:
        return error_response(f"Failed to fetch client loans: {str(e)}", 500)

@app.route('/api/clients/<client_id>/archive', methods=['POST'])
def archive_client(client_id):
    """Archive a paid client"""
    try:
        updated_client = db_service.archive_client(client_id)
        
        if updated_client:
            return jsonify({
                'success': True,
                'message': 'Client archived successfully',
                'client': updated_client
            })
        else:
            return error_response('Client not found', 404)
            
    except Exception as e:
        return error_response(f"Failed to archive client: {str(e)}", 500)

@app.route('/api/clients/<client_id>/unarchive', methods=['POST'])
def unarchive_client(client_id):
    """Unarchive a client for new loans"""
    try:
        updated_client = db_service.unarchive_client(client_id)
        
        if updated_client:
            return jsonify({
                'success': True,
                'message': 'Client unarchived successfully',
                'client': updated_client
            })
        else:
            return error_response('Client not found', 404)
            
    except Exception as e:
        return error_response(f"Failed to unarchive client: {str(e)}", 500)

# Payment endpoints
@app.route('/api/clients/<client_id>/payments', methods=['POST'])
def add_payment(client_id):
    """Add a payment for a client"""
    try:
        print(f"🔍 POST /api/clients/{client_id}/payments - Adding payment")
        data = request.get_json()
        print(f"📝 Payment data: {data}")
        
        if not data:
            return error_response("No data provided")
        
        # Validate payment data
        is_valid, errors = validate_payment_data({**data, 'clientId': client_id})
        print(f"✅ Validation result: valid={is_valid}, errors={errors}")
        
        if not is_valid:
            return error_response(f"Validation errors: {', '.join(errors)}")
        
        # Add payment
        print(f"🔍 Adding payment to database...")
        updated_client = db_service.add_payment(client_id, data)
        print(f"✅ Payment added successfully: {updated_client}")
        
        if updated_client:
            return jsonify({
                'success': True,
                'message': 'Payment added successfully',
                'client': updated_client
            }), 201
        else:
            return error_response('Client not found', 404)
            
    except Exception as e:
        print(f"❌ Error adding payment: {str(e)}")
        import traceback
        print(f"📍 Full traceback: {traceback.format_exc()}")
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

# =============================================================================
# NOTIFICATION ENDPOINTS
# =============================================================================

@app.route('/api/notifications/test', methods=['POST'])
def test_notification():
    """Test the notification system"""
    try:
        from notification_scheduler import notification_scheduler
        
        print("🧪 Testing notification system...")
        success = notification_scheduler.test_notification()
        
        if success:
            return success_response({
                'message': 'Test notification sent successfully',
                'email': 'info@cashflowloans.co.za'
            }, "Test notification completed")
        else:
            return error_response("Failed to send test notification", 500)
            
    except Exception as e:
        print(f"❌ Test notification error: {e}")
        return error_response(f"Failed to test notification: {str(e)}", 500)

@app.route('/api/notifications/check-due', methods=['GET'])
def check_payments_due():
    """Check for clients with payments due and return the list"""
    try:
        from notification_scheduler import notification_scheduler
        
        clients_due = notification_scheduler.get_clients_with_payments_due()
        
        return success_response({
            'clients': clients_due,
            'count': len(clients_due),
            'total_amount_due': sum(client.get('current_amount_due', 0) for client in clients_due)
        }, f"Found {len(clients_due)} clients with payments due")
        
    except Exception as e:
        print(f"❌ Check payments due error: {e}")
        return error_response(f"Failed to check payments due: {str(e)}", 500)

@app.route('/api/notifications/send-due', methods=['POST'])
def send_payment_due_notifications():
    """Send payment due notifications immediately"""
    try:
        from notification_scheduler import notification_scheduler
        from email_service import email_service
        
        # Get clients with payments due
        clients_due = notification_scheduler.get_clients_with_payments_due()
        
        if not clients_due:
            return success_response({
                'message': 'No clients with payments due',
                'count': 0
            }, "No notifications sent")
        
        # Send notification
        success = email_service.send_payment_due_notification(clients_due)
        
        if success:
            return success_response({
                'message': 'Payment due notifications sent successfully',
                'clients_notified': len(clients_due),
                'total_amount_due': sum(client.get('current_amount_due', 0) for client in clients_due),
                'email': 'info@cashflowloans.co.za'
            }, "Notifications sent successfully")
        else:
            return error_response("Failed to send notifications", 500)
            
    except Exception as e:
        print(f"❌ Send notifications error: {e}")
        return error_response(f"Failed to send notifications: {str(e)}", 500)

@app.route('/api/notifications/schedule-start', methods=['POST'])
def start_notification_scheduler():
    """Start the background notification scheduler"""
    try:
        from notification_scheduler import notification_scheduler
        
        notification_scheduler.start_background_scheduler()
        
        return success_response({
            'message': 'Notification scheduler started',
            'schedule': 'Daily at 9:00 AM and 5:00 PM',
            'trigger': 'Day before month-end'
        }, "Scheduler started successfully")
        
    except Exception as e:
        print(f"❌ Start scheduler error: {e}")
        return error_response(f"Failed to start scheduler: {str(e)}", 500)

@app.route('/api/notifications/schedule-stop', methods=['POST'])
def stop_notification_scheduler():
    """Stop the background notification scheduler"""
    try:
        from notification_scheduler import notification_scheduler
        
        notification_scheduler.stop_scheduler()
        
        return success_response({
            'message': 'Notification scheduler stopped'
        }, "Scheduler stopped successfully")
        
    except Exception as e:
        print(f"❌ Stop scheduler error: {e}")
        return error_response(f"Failed to stop scheduler: {str(e)}", 500)

# For development only
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)

# For production, gunicorn will import the app directly