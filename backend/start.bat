@echo off
echo 🚀 Starting Cashflow CRM Backend...
echo.

REM Check if virtual environment exists
if not exist "venv\" (
    echo 📦 Creating virtual environment...
    python -m venv venv
    echo.
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install requirements
echo 📚 Installing requirements...
pip install -r requirements.txt
echo.

REM Start the Flask app
echo 🌟 Starting Flask application on http://localhost:5000
echo 📊 API Documentation available at endpoints:
echo    - GET  /api/health          - Health check
echo    - GET  /api/clients         - Get all clients
echo    - POST /api/clients         - Create new client
echo    - GET  /api/clients/{id}    - Get client by ID
echo    - PUT  /api/clients/{id}    - Update client
echo    - DELETE /api/clients/{id}  - Delete client
echo    - PUT  /api/clients/{id}/status - Update client status
echo    - POST /api/clients/{id}/payments - Add payment
echo    - GET  /api/analytics       - Get dashboard analytics
echo.
echo 🛑 Press Ctrl+C to stop the server
echo.

python app.py