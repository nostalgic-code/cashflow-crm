


import os
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

# Use DATABASE_URL from environment (Render sets this for you)
app = Flask(__name__)
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

if __name__ == '__main__':
    app.run(debug=True)
