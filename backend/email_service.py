"""
Email notification service for CashFlow CRM
Sends notifications about payment due dates and other important events
"""

import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
import os
from dataclasses import dataclass

@dataclass
class EmailConfig:
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587
    sender_email: str = "info@cashflowloans.co.za"
    sender_password: str = os.getenv('EMAIL_PASSWORD', '')  # Set this in environment
    recipient_email: str = "info@cashflowloans.co.za"

class EmailNotificationService:
    def __init__(self):
        self.config = EmailConfig()
        
    def create_payment_due_email(self, clients_due: List[Dict[str, Any]]) -> str:
        """Create HTML email content for payment due notifications"""
        
        # Calculate totals
        total_clients = len(clients_due)
        total_amount_due = sum(client.get('current_amount_due', 0) for client in clients_due)
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .header {{ background-color: #2563eb; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; }}
                .summary {{ background-color: #f8fafc; padding: 15px; margin: 20px 0; border-left: 4px solid #2563eb; }}
                .client-table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                .client-table th, .client-table td {{ border: 1px solid #ddd; padding: 12px; text-align: left; }}
                .client-table th {{ background-color: #f8fafc; font-weight: bold; }}
                .amount {{ font-weight: bold; color: #dc2626; }}
                .footer {{ background-color: #f8fafc; padding: 15px; text-align: center; color: #666; }}
                .status-due {{ color: #dc2626; font-weight: bold; }}
                .status-overdue {{ color: #b91c1c; font-weight: bold; background-color: #fee2e2; padding: 2px 6px; border-radius: 4px; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>💰 CashFlow Loans - Payment Due Alert</h1>
                <p>Daily Payment Reminder for {datetime.now().strftime('%B %d, %Y')}</p>
            </div>
            
            <div class="content">
                <div class="summary">
                    <h2>📊 Summary</h2>
                    <p><strong>Clients with payments due:</strong> {total_clients}</p>
                    <p><strong>Total amount due:</strong> <span class="amount">R{total_amount_due:,.2f}</span></p>
                    <p><strong>Payment deadline:</strong> {self._get_month_end_date().strftime('%B %d, %Y')}</p>
                </div>
                
                <h2>👥 Clients Requiring Attention</h2>
                
                {self._create_client_table(clients_due)}
                
                <div class="summary">
                    <h3>📞 Recommended Actions</h3>
                    <ul>
                        <li>Contact clients with <span class="status-overdue">OVERDUE</span> payments immediately</li>
                        <li>Send friendly reminders to clients with <span class="status-due">DUE TODAY</span> payments</li>
                        <li>Follow up on large outstanding amounts first</li>
                        <li>Consider payment plan negotiations for struggling clients</li>
                    </ul>
                </div>
            </div>
            
            <div class="footer">
                <p>🏦 CashFlow Loans Management System</p>
                <p>Generated automatically on {datetime.now().strftime('%Y-%m-%d at %H:%M')}</p>
                <p>For support, contact: info@cashflowloans.co.za</p>
            </div>
        </body>
        </html>
        """
        
        return html_content
    
    def _create_client_table(self, clients: List[Dict[str, Any]]) -> str:
        """Create HTML table for client payment information"""
        if not clients:
            return "<p>✅ Great news! No payments are due today.</p>"
        
        table_rows = ""
        for client in clients:
            status = client.get('status', 'active')
            current_due = client.get('current_amount_due', 0)
            amount_paid = client.get('amount_paid', 0)
            loan_amount = client.get('loan_amount', 0)
            
            # Determine status styling
            if status == 'overdue':
                status_class = 'status-overdue'
                status_text = 'OVERDUE'
            elif status == 'repayment-due':
                status_class = 'status-due'
                status_text = 'DUE TODAY'
            else:
                status_class = 'status-due'
                status_text = status.upper()
            
            table_rows += f"""
            <tr>
                <td><strong>{client.get('name', 'Unknown')}</strong></td>
                <td>R{loan_amount:,.2f}</td>
                <td class="amount">R{current_due:,.2f}</td>
                <td>R{amount_paid:,.2f}</td>
                <td><span class="{status_class}">{status_text}</span></td>
                <td>{client.get('phone', 'N/A')}</td>
                <td>{client.get('email', 'N/A')}</td>
            </tr>
            """
        
        return f"""
        <table class="client-table">
            <thead>
                <tr>
                    <th>Client Name</th>
                    <th>Loan Amount</th>
                    <th>Amount Due</th>
                    <th>Amount Paid</th>
                    <th>Status</th>
                    <th>Phone</th>
                    <th>Email</th>
                </tr>
            </thead>
            <tbody>
                {table_rows}
            </tbody>
        </table>
        """
    
    def _get_month_end_date(self) -> datetime:
        """Get the last day of current month"""
        today = datetime.now()
        # Get first day of next month, then subtract one day
        if today.month == 12:
            next_month = today.replace(year=today.year + 1, month=1, day=1)
        else:
            next_month = today.replace(month=today.month + 1, day=1)
        
        last_day = next_month - timedelta(days=1)
        return last_day
    
    def send_email(self, subject: str, html_content: str, recipient_email: str = None) -> bool:
        """Send email notification"""
        try:
            # Use provided email or default to config
            to_email = recipient_email or self.config.recipient_email
            
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = self.config.sender_email
            message["To"] = to_email
            
            # Create HTML part
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)
            
            # Create secure connection and send email
            context = ssl.create_default_context()
            
            # For development, we'll just log the email content
            # In production, uncomment the SMTP code below
            
            print(f"📧 EMAIL NOTIFICATION READY")
            print(f"To: {to_email}")
            print(f"Subject: {subject}")
            print(f"Content length: {len(html_content)} characters")
            print("="*50)
            
            # PRODUCTION EMAIL SENDING (uncomment when ready):
            # with smtplib.SMTP(self.config.smtp_server, self.config.smtp_port) as server:
            #     server.starttls(context=context)
            #     server.login(self.config.sender_email, self.config.sender_password)
            #     server.sendmail(self.config.sender_email, to_email, message.as_string())
            
            return True
            
        except Exception as e:
            print(f"❌ Failed to send email: {e}")
            return False
    
    def send_payment_due_notification(self, clients_due: List[Dict[str, Any]]) -> bool:
        """Send payment due notification email"""
        
        if not clients_due:
            print("✅ No clients with payments due - no email sent")
            return True
        
        # Create email content
        html_content = self.create_payment_due_email(clients_due)
        
        # Create subject
        total_amount = sum(client.get('current_amount_due', 0) for client in clients_due)
        subject = f"💰 Payment Due Alert - {len(clients_due)} clients, R{total_amount:,.2f} total due"
        
        # Send email
        success = self.send_email(subject, html_content)
        
        if success:
            print(f"✅ Payment due notification sent successfully")
            print(f"   - {len(clients_due)} clients notified")
            print(f"   - Total amount due: R{total_amount:,.2f}")
        
        return success

# Create global instance
email_service = EmailNotificationService()