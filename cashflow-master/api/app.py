import os
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from flask_mail import Mail, Message


# Use DATABASE_URL from environment (Render sets this for you)
app = Flask(__name__)

# Flask-Mail configuration
app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.zoho.com')
app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.environ.get('MAIL_USE_TLS', 'True') == 'True'
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER', app.config['MAIL_USERNAME'])
mail = Mail(app)

db_url = os.environ.get('DATABASE_URL')
if db_url:
    # Render gives a URL starting with 'postgres://', but SQLAlchemy needs 'postgresql://'
    db_url = db_url.replace('postgres://', 'postgresql://', 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url
else:
    # Fallback to SQLite for local development
    basedir = os.path.abspath(os.path.dirname(__file__))
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'cashflow.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)



# Import text for raw SQL execution
from sqlalchemy import text

# TEMPORARY: Route to drop the admin_user table for schema reset
@app.route('/drop-admin-table')
def drop_admin_table():
    db.session.execute(text('DROP TABLE IF EXISTS admin_user CASCADE;'))
    db.session.commit()
    return 'admin_user table dropped!'

# Debug: Print which database is being used
print('--- DATABASE CONFIG ---')
print('SQLALCHEMY_DATABASE_URI:', app.config['SQLALCHEMY_DATABASE_URI'])
print('------------------------')

# Admin login endpoint
@app.route('/admin/login', methods=['POST'])
def admin_login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'success': False, 'message': 'Username and password required.'}), 400
    user = AdminUser.query.filter_by(username=username).first()
    if user and user.check_password(password):
        return jsonify({'success': True, 'message': 'Login successful.'})
    else:
        return jsonify({'success': False, 'message': 'Invalid username or password.'}), 401

from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os

# Initialize Flask app and database


# Admin registration endpoint
@app.route('/admin/register', methods=['POST'])
def admin_register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    if AdminUser.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 409
    user = AdminUser(username=username)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'Admin registered successfully'})



# Admin user model for registration/login
class AdminUser(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# --- New Models ---
class Client(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    surname = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    # Add more fields as needed

class Repayment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    loan_id = db.Column(db.Integer, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.DateTime, nullable=False)
    # Add more fields as needed

class MoneyOut(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    recipient = db.Column(db.String(120), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.DateTime, nullable=False)
    # Add more fields as needed
ALLOWED_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# Serve admin.html at /admin.html (robust to cwd)
@app.route('/admin.html')
def serve_admin():
    admin_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'admin.html')
    return send_file(admin_path)

# Serve apply-for-loan.html from src directory (perfect match)
@app.route('/apply-for-loan.html')
def serve_apply_for_loan():
    # Serve the static HTML file directly for exact styling and behavior
    src_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'src', 'apply-for-loan.html')
    return send_file(src_path)

# Serve dashboard.html at /dashboard.html
@app.route('/dashboard.html')
def serve_dashboard():
    dashboard_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'dashboard.html')
    return send_file(dashboard_path)

# Serve pages.html at /pages.html
@app.route('/pages.html')
def serve_pages():
    pages_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'pages.html')
    return send_file(pages_path)

# Serve favicon.ico if present in src/assets/images or root
@app.route('/favicon.ico')
def serve_favicon():
    # Try src/assets/images first
    favicon_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'src', 'assets', 'images', 'logo.jpeg')
    if os.path.exists(favicon_path):
        return send_file(favicon_path)
    # Fallback: look for favicon.ico in src/
    fallback_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'src', 'favicon.ico')
    if os.path.exists(fallback_path):
        return send_file(fallback_path)
    return '', 404

# --- File download endpoint ---
@app.route('/uploads/<filename>', methods=['GET'])
def download_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename, as_attachment=True)

# File upload config
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload size



ALLOWED_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
@app.route('/apply/unsecured', methods=['POST'])
def apply_unsecured():
    data = request.form
    files = request.files
    payslip_file = files.get('payslip')
    id_document_file = files.get('idDocument')
    bank_statement_file = files.get('bankStatement')

    payslip_filename = None
    id_document_filename = None
    bank_statement_filename = None

    # Save files if present and allowed
    if payslip_file and allowed_file(payslip_file.filename):
        payslip_filename = secure_filename(payslip_file.filename)
        payslip_file.save(os.path.join(app.config['UPLOAD_FOLDER'], payslip_filename))
    if id_document_file and allowed_file(id_document_file.filename):
        id_document_filename = secure_filename(id_document_file.filename)
        id_document_file.save(os.path.join(app.config['UPLOAD_FOLDER'], id_document_filename))
    if bank_statement_file and allowed_file(bank_statement_file.filename):
        bank_statement_filename = secure_filename(bank_statement_file.filename)
        bank_statement_file.save(os.path.join(app.config['UPLOAD_FOLDER'], bank_statement_filename))

    loan = UnsecuredLoan(
        amount=data.get('amount'),
        name=data.get('name'),
        surname=data.get('surname'),
        id_number=data.get('idNumber'),
        phone=data.get('phone'),
        email=data.get('email'),
        payslip_filename=payslip_filename,
        id_document_filename=id_document_filename,
        bank_statement_filename=bank_statement_filename,
        terms_accepted=bool(data.get('terms'))
    )
    db.session.add(loan)
    db.session.commit()
    # Send email notification
    try:
        msg = Message(
            subject="New Unsecured Loan Application",
            recipients=["info@cashflowloans.co.za"],
            body=f"A new unsecured loan application has been submitted.\n\nName: {loan.name} {loan.surname}\nEmail: {loan.email}\nAmount: R{loan.amount}\nPhone: {loan.phone}\nID Number: {loan.id_number}"
        )
        mail.send(msg)
    except Exception as e:
        print(f"Failed to send email notification: {e}")
    return jsonify({'message': 'Unsecured loan application submitted successfully.'}), 201

@app.route('/apply/secured', methods=['POST'])
def apply_secured():
    data = request.form
    files = request.files.getlist('collateralImages')
    collateral_filenames = []
    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            collateral_filenames.append(filename)

    loan = SecuredLoan(
        amount=data.get('amount'),
        name=data.get('name'),
        id_number=data.get('idNumber'),
        phone=data.get('phone'),
        email=data.get('email'),
        collateral_images_filenames=','.join(collateral_filenames),
        terms_accepted=bool(data.get('terms'))
    )
    db.session.add(loan)
    db.session.commit()
    # Send email notification
    try:
        msg = Message(
            subject="New Secured Loan Application",
            recipients=["info@cashflowloans.co.za"],
            body=f"A new secured loan application has been submitted.\n\nName: {loan.name}\nEmail: {loan.email}\nAmount: R{loan.amount}\nPhone: {loan.phone}\nID Number: {loan.id_number}"
        )
        mail.send(msg)
    except Exception as e:
        print(f"Failed to send email notification: {e}")
    return jsonify({'message': 'Secured loan application submitted successfully.'}), 201

class UnsecuredLoan(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    surname = db.Column(db.String(100), nullable=False)
    id_number = db.Column(db.String(50), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    payslip_filename = db.Column(db.String(200), nullable=True)
    id_document_filename = db.Column(db.String(200), nullable=True)
    bank_statement_filename = db.Column(db.String(200), nullable=True)
    terms_accepted = db.Column(db.Boolean, default=False)

class SecuredLoan(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    id_number = db.Column(db.String(50), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    collateral_images_filenames = db.Column(db.Text, nullable=True)  # Comma-separated filenames
    terms_accepted = db.Column(db.Boolean, default=False)


# --- Submission viewing endpoints ---
@app.route('/submissions/unsecured', methods=['GET'])
def list_unsecured_loans():
    loans = UnsecuredLoan.query.all()
    result = []
    for loan in loans:
        result.append({
            'id': loan.id,
            'amount': loan.amount,
            'name': loan.name,
            'surname': loan.surname,
            'id_number': loan.id_number,
            'phone': loan.phone,
            'email': loan.email,
            'payslip_filename': loan.payslip_filename,
            'id_document_filename': loan.id_document_filename,
            'bank_statement_filename': loan.bank_statement_filename,
            'terms_accepted': loan.terms_accepted
        })
    return jsonify(result)

@app.route('/submissions/secured', methods=['GET'])
def list_secured_loans():
    loans = SecuredLoan.query.all()
    result = []
    for loan in loans:
        result.append({
            'id': loan.id,
            'amount': loan.amount,
            'name': loan.name,
            'id_number': loan.id_number,
            'phone': loan.phone,
            'email': loan.email,
            'collateral_images_filenames': loan.collateral_images_filenames.split(',') if loan.collateral_images_filenames else [],
            'terms_accepted': loan.terms_accepted
        })
    return jsonify(result)

@app.route('/submissions/unsecured/<int:loan_id>', methods=['GET'])
def get_unsecured_loan(loan_id):
    loan = UnsecuredLoan.query.get_or_404(loan_id)
    return jsonify({
        'id': loan.id,
        'amount': loan.amount,
        'name': loan.name,
        'surname': loan.surname,
        'id_number': loan.id_number,
        'phone': loan.phone,
        'email': loan.email,
        'payslip_filename': loan.payslip_filename,
        'id_document_filename': loan.id_document_filename,
        'bank_statement_filename': loan.bank_statement_filename,
        'terms_accepted': loan.terms_accepted
    })

@app.route('/submissions/secured/<int:loan_id>', methods=['GET'])
def get_secured_loan(loan_id):
    loan = SecuredLoan.query.get_or_404(loan_id)
    return jsonify({
        'id': loan.id,
        'amount': loan.amount,
        'name': loan.name,
        'id_number': loan.id_number,
        'phone': loan.phone,
        'email': loan.email,
        'collateral_images_filenames': loan.collateral_images_filenames.split(',') if loan.collateral_images_filenames else [],
        'terms_accepted': loan.terms_accepted
    })

@app.route('/init-db')
def init_db():
    db.create_all()
    return 'Database initialized!'


# --- Admin dashboard stats endpoint ---
@app.route('/admin/stats', methods=['GET'])
def admin_stats():
    unsecured_count = UnsecuredLoan.query.count()
    secured_count = SecuredLoan.query.count()
    admin_count = AdminUser.query.count()
    print('--- /admin/stats DEBUG ---')
    print('Unsecured Loans:', unsecured_count)
    print('Secured Loans:', secured_count)
    print('Admins:', admin_count)
    print('--------------------------')
    return jsonify({
        'unsecured_loans': unsecured_count,
        'secured_loans': secured_count,
        'admins': admin_count
    })

# --- New Dashboard Metrics Endpoint ---
@app.route('/admin/metrics', methods=['GET'])
def admin_metrics():
    # Total loan + interest (dummy interest 10%)
    total_loan = db.session.query(db.func.sum(UnsecuredLoan.amount)).scalar() or 0
    total_loan += db.session.query(db.func.sum(SecuredLoan.amount)).scalar() or 0
    total_interest = total_loan * 0.10
    total_with_interest = total_loan + total_interest

    # Outstanding balance (total loan - repayments)
    total_repaid = db.session.query(db.func.sum(Repayment.amount)).scalar() or 0
    outstanding_balance = total_with_interest - total_repaid

    # Overdue status (dummy: loans older than 30 days and not fully repaid)
    from datetime import datetime, timedelta
    overdue_loans = []
    now = datetime.utcnow()
    for loan in UnsecuredLoan.query.all() + SecuredLoan.query.all():
        # Assume loan.id matches Repayment.loan_id
        repaid = db.session.query(db.func.sum(Repayment.amount)).filter(Repayment.loan_id == loan.id).scalar() or 0
        loan_date = getattr(loan, 'created_at', now - timedelta(days=31))
        if (now - loan_date).days > 30 and repaid < loan.amount:
            overdue_loans.append(loan.id)

    # Money out
    money_out = [
        {'recipient': m.recipient, 'amount': m.amount, 'date': m.date.strftime('%Y-%m-%d')}
        for m in MoneyOut.query.all()
    ]

    # Breakdown by status (dummy: Active, Paid, Overdue)
    active_loans = []
    paid_loans = []
    for loan in UnsecuredLoan.query.all() + SecuredLoan.query.all():
        repaid = db.session.query(db.func.sum(Repayment.amount)).filter(Repayment.loan_id == loan.id).scalar() or 0
        if repaid >= loan.amount:
            paid_loans.append(loan.id)
        elif loan.id in overdue_loans:
            continue
        else:
            active_loans.append(loan.id)

    return jsonify({
        'total_loan_with_interest': total_with_interest,
        'outstanding_balance': outstanding_balance,
        'overdue_loans': overdue_loans,
        'money_out': money_out,
        'active_loans': active_loans,
        'paid_loans': paid_loans,
        'total_loans_disbursed': total_loan,
        'total_repayments_collected': total_repaid,
        'number_of_overdue_loans': len(overdue_loans)
    })

# --- Clients Table Endpoint ---
@app.route('/admin/clients', methods=['GET'])
def admin_clients():
    # Search and sort by query params
    q = request.args.get('q', '').lower()
    sort = request.args.get('sort', 'name')
    clients = Client.query.all()
    result = []
    for c in clients:
        if q and q not in c.name.lower() and q not in c.surname.lower() and q not in c.email.lower():
            continue
        result.append({
            'id': c.id,
            'name': c.name,
            'surname': c.surname,
            'email': c.email,
            'phone': c.phone
        })
    result.sort(key=lambda x: x.get(sort, ''))
    return jsonify(result)

# --- Loans Table Endpoint ---
@app.route('/admin/loans', methods=['GET'])
def admin_loans():
    status = request.args.get('status', '').lower()
    loans = []
    for loan in UnsecuredLoan.query.all() + SecuredLoan.query.all():
        repaid = db.session.query(db.func.sum(Repayment.amount)).filter(Repayment.loan_id == loan.id).scalar() or 0
        loan_status = 'active'
        if repaid >= loan.amount:
            loan_status = 'paid'
        # Overdue logic
        from datetime import datetime, timedelta
        loan_date = getattr(loan, 'created_at', datetime.utcnow() - timedelta(days=31))
        if (datetime.utcnow() - loan_date).days > 30 and repaid < loan.amount:
            loan_status = 'overdue'
        if status and loan_status != status:
            continue
        loans.append({
            'id': loan.id,
            'amount': loan.amount,
            'name': getattr(loan, 'name', ''),
            'status': loan_status
        })
    return jsonify(loans)

# --- Repayments Table Endpoint ---
@app.route('/admin/repayments', methods=['GET'])
def admin_repayments():
    loan_id = request.args.get('loan_id')
    repayments = Repayment.query
    if loan_id:
        repayments = repayments.filter_by(loan_id=loan_id)
    repayments = repayments.all()
    result = []
    for r in repayments:
        result.append({
            'id': r.id,
            'loan_id': r.loan_id,
            'amount': r.amount,
            'date': r.date.strftime('%Y-%m-%d')
        })
    return jsonify(result)

# --- Money Out Table Endpoint ---
@app.route('/admin/moneyout', methods=['GET'])
def admin_moneyout():
    money_out = [
        {'id': m.id, 'recipient': m.recipient, 'amount': m.amount, 'date': m.date.strftime('%Y-%m-%d')}
        for m in MoneyOut.query.all()
    ]
    return jsonify(money_out)

if __name__ == '__main__':
    app.run(debug=True)
