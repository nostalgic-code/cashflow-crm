"""
MongoDB Models for Cashflow CRM
Defines the data structure and validation for all collections
"""

from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from bson import ObjectId
import uuid

class BaseModel:
    """Base model with common fields and methods"""
    
    def __init__(self):
        self.id = str(uuid.uuid4())
        self.createdAt = datetime.now(timezone.utc).isoformat()
        self.updatedAt = datetime.now(timezone.utc).isoformat()
    
    def to_dict(self):
        """Convert model to dictionary"""
        result = {}
        for key, value in self.__dict__.items():
            if isinstance(value, ObjectId):
                result[key] = str(value)
            elif isinstance(value, datetime):
                result[key] = value.isoformat()
            else:
                result[key] = value
        return result
    
    def update_timestamp(self):
        """Update the updatedAt timestamp"""
        self.updatedAt = datetime.now(timezone.utc).isoformat()

class UserModel(BaseModel):
    """User model for authentication and user management"""
    
    def __init__(self, data: Dict[str, Any]):
        super().__init__()
        
        # Authentication fields (from Supabase)
        self.supabaseId = data.get('supabaseId', '')  # Supabase user ID
        self.email = data.get('email', '')
        self.fullName = data.get('fullName', '')
        
        # Profile fields
        self.role = data.get('role', 'admin')  # admin, manager, user
        self.isActive = data.get('isActive', True)
        self.lastLoginAt = data.get('lastLoginAt', None)
        
        # Business settings
        self.companyName = data.get('companyName', '')
        self.defaultInterestRate = float(data.get('defaultInterestRate', 50.0))
        self.currency = data.get('currency', 'ZAR')
        
        # Permissions
        self.permissions = data.get('permissions', [
            'view_clients', 'create_clients', 'edit_clients', 'delete_clients',
            'view_payments', 'create_payments', 'edit_payments',
            'view_analytics', 'export_data'
        ])
    
    def update_last_login(self):
        """Update last login timestamp"""
        self.lastLoginAt = datetime.now(timezone.utc).isoformat()
        self.update_timestamp()
    
    def has_permission(self, permission: str) -> bool:
        """Check if user has specific permission"""
        return permission in self.permissions
    
    def add_permission(self, permission: str):
        """Add permission to user"""
        if permission not in self.permissions:
            self.permissions.append(permission)
            self.update_timestamp()
    
    def remove_permission(self, permission: str):
        """Remove permission from user"""
        if permission in self.permissions:
            self.permissions.remove(permission)
            self.update_timestamp()

class ClientModel(BaseModel):
    """Client model for loan applicants"""
    
    def __init__(self, data: Dict[str, Any]):
        super().__init__()
        
        # User relationship
        self.userId = data.get('userId', '')  # Links to UserModel
        
        # Personal Information
        self.name = data.get('name', '')
        self.email = data.get('email', '')
        self.phone = data.get('phone', '')
        self.idNumber = data.get('idNumber', '')
        
        # Loan Information
        self.loanType = data.get('loanType', 'Secured Loan')  # Secured Loan or Unsecured Loan
        self.loanAmount = float(data.get('loanAmount', 0))
        self.interestRate = float(data.get('interestRate', 50.0))  # 50% monthly
        self.startDate = data.get('startDate', datetime.now().strftime('%Y-%m-%d'))
        self.dueDate = data.get('dueDate', self._calculate_due_date())
        self.monthlyPayment = float(data.get('monthlyPayment', self._calculate_monthly_payment()))
        
        # Payment Information
        self.amountPaid = float(data.get('amountPaid', 0))
        
        # Status Information
        self.status = data.get('status', 'new-lead')  # new-lead, active, repayment-due, paid, overdue
        self.applicationDate = data.get('applicationDate', datetime.now(timezone.utc).isoformat())
        self.lastStatusUpdate = data.get('lastStatusUpdate', datetime.now(timezone.utc).isoformat())
        
        # Additional Data
        self.documents = data.get('documents', [])
        self.paymentHistory = data.get('paymentHistory', [])
        self.notes = data.get('notes', [])
    
    def _calculate_due_date(self):
        """Calculate due date as end of current month"""
        now = datetime.now()
        if now.month == 12:
            next_month = now.replace(year=now.year + 1, month=1, day=1)
        else:
            next_month = now.replace(month=now.month + 1, day=1)
        
        last_day = next_month - timedelta(days=1)
        return last_day.strftime('%Y-%m-%d')
    
    def _calculate_monthly_payment(self):
        """Calculate monthly payment (total amount due for 1-month loan)"""
        return self.loanAmount * 1.5  # 50% interest
    
    def calculate_remaining_balance(self):
        """Calculate remaining balance"""
        total_due = self.loanAmount * 1.5
        return max(0, total_due - self.amountPaid)
    
    def calculate_payment_progress(self):
        """Calculate payment progress percentage"""
        total_due = self.loanAmount * 1.5
        if total_due == 0:
            return 100
        return min(100, (self.amountPaid / total_due) * 100)
    
    def is_overdue(self):
        """Check if payment is overdue"""
        if self.status in ['paid', 'new-lead']:
            return False
        
        due_date = datetime.strptime(self.dueDate, '%Y-%m-%d').date()
        today = datetime.now().date()
        return today > due_date
    
    def update_status_if_needed(self):
        """Auto-update status based on payment and date"""
        # Check if fully paid
        remaining = self.calculate_remaining_balance()
        if remaining <= 0:
            self.status = 'paid'
        # Check if overdue
        elif self.is_overdue() and self.status not in ['paid', 'new-lead']:
            self.status = 'overdue'
        # Check if payment is due (within 3 days of due date)
        elif self.status == 'active':
            due_date = datetime.strptime(self.dueDate, '%Y-%m-%d').date()
            today = datetime.now().date()
            days_until_due = (due_date - today).days
            if 0 <= days_until_due <= 3:
                self.status = 'repayment-due'

class PaymentModel(BaseModel):
    """Payment model for tracking payments"""
    
    def __init__(self, data: Dict[str, Any]):
        super().__init__()
        
        self.clientId = data.get('clientId', '')
        self.amount = float(data.get('amount', 0))
        self.paymentDate = data.get('paymentDate', datetime.now().strftime('%Y-%m-%d'))
        self.paymentMethod = data.get('paymentMethod', 'cash')  # cash, bank_transfer, card, etc.
        self.reference = data.get('reference', '')
        self.notes = data.get('notes', '')
        self.processedBy = data.get('processedBy', 'system')

class DocumentModel(BaseModel):
    """Document model for file uploads"""
    
    def __init__(self, data: Dict[str, Any]):
        super().__init__()
        
        self.clientId = data.get('clientId', '')
        self.fileName = data.get('fileName', '')
        self.originalName = data.get('originalName', '')
        self.fileSize = int(data.get('fileSize', 0))
        self.fileType = data.get('fileType', '')
        self.filePath = data.get('filePath', '')
        self.uploadedBy = data.get('uploadedBy', 'system')
        self.description = data.get('description', '')

class NoteModel(BaseModel):
    """Note model for client notes"""
    
    def __init__(self, data: Dict[str, Any]):
        super().__init__()
        
        self.clientId = data.get('clientId', '')
        self.content = data.get('content', '')
        self.createdBy = data.get('createdBy', 'system')
        self.noteType = data.get('noteType', 'general')  # general, payment, status_change, etc.

# Validation schemas
CLIENT_REQUIRED_FIELDS = ['name', 'email', 'phone', 'loanAmount', 'loanType']
CLIENT_STATUS_OPTIONS = ['new-lead', 'active', 'repayment-due', 'paid', 'overdue']
LOAN_TYPE_OPTIONS = ['Secured Loan', 'Unsecured Loan']
USER_ROLES = ['admin', 'manager', 'user']
USER_PERMISSIONS = [
    'view_clients', 'create_clients', 'edit_clients', 'delete_clients',
    'view_payments', 'create_payments', 'edit_payments',
    'view_analytics', 'export_data', 'manage_users'
]

def validate_user_data(data: Dict[str, Any]) -> tuple[bool, List[str]]:
    """Validate user data"""
    errors = []
    
    # Check required fields
    required_fields = ['supabaseId', 'email', 'fullName']
    for field in required_fields:
        if not data.get(field):
            errors.append(f"{field} is required")
    
    # Validate email format
    email = data.get('email', '')
    if email and '@' not in email:
        errors.append("Invalid email format")
    
    # Validate role
    role = data.get('role', 'admin')
    if role not in USER_ROLES:
        errors.append(f"Role must be one of: {', '.join(USER_ROLES)}")
    
    # Validate permissions
    permissions = data.get('permissions', [])
    if permissions:
        invalid_permissions = [p for p in permissions if p not in USER_PERMISSIONS]
        if invalid_permissions:
            errors.append(f"Invalid permissions: {', '.join(invalid_permissions)}")
    
    return len(errors) == 0, errors

def validate_client_data(data: Dict[str, Any]) -> tuple[bool, List[str]]:
    """Validate client data"""
    errors = []
    
    # Check required fields
    for field in CLIENT_REQUIRED_FIELDS:
        if not data.get(field):
            errors.append(f"{field} is required")
    
    # Validate email format
    email = data.get('email', '')
    if email and '@' not in email:
        errors.append("Invalid email format")
    
    # Validate loan amount
    try:
        loan_amount = float(data.get('loanAmount', 0))
        if loan_amount <= 0:
            errors.append("Loan amount must be greater than 0")
    except (ValueError, TypeError):
        errors.append("Invalid loan amount")
    
    # Validate loan type
    loan_type = data.get('loanType', '')
    if loan_type and loan_type not in LOAN_TYPE_OPTIONS:
        errors.append(f"Loan type must be one of: {', '.join(LOAN_TYPE_OPTIONS)}")
    
    # Validate status
    status = data.get('status', '')
    if status and status not in CLIENT_STATUS_OPTIONS:
        errors.append(f"Status must be one of: {', '.join(CLIENT_STATUS_OPTIONS)}")
    
    return len(errors) == 0, errors

def validate_payment_data(data: Dict[str, Any]) -> tuple[bool, List[str]]:
    """Validate payment data"""
    errors = []
    
    # Check required fields
    if not data.get('clientId'):
        errors.append("clientId is required")
    
    if not data.get('amount'):
        errors.append("amount is required")
    
    # Validate amount
    try:
        amount = float(data.get('amount', 0))
        if amount <= 0:
            errors.append("Payment amount must be greater than 0")
    except (ValueError, TypeError):
        errors.append("Invalid payment amount")
    
    return len(errors) == 0, errors