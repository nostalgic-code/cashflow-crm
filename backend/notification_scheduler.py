"""
Notification scheduler for CashFlow CRM
Checks for payment due dates and sends notifications
"""

from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from supabase_database import SupabaseDatabase
from email_service import email_service
import schedule
import time
import threading

class NotificationScheduler:
    def __init__(self):
        self.db = SupabaseDatabase()
        self.is_running = False
        
    def get_clients_with_payments_due(self) -> List[Dict[str, Any]]:
        """Get clients whose payments are due tomorrow (last day of month)"""
        try:
            # Get all active clients
            clients = self.db.get_all_clients(include_archived=False)
            
            # Get current date info
            today = datetime.now()
            
            # Check if tomorrow is the last day of the month
            tomorrow = today + timedelta(days=1)
            month_end = self._get_month_end_date(today)
            
            # Only check if tomorrow is the last day of the month
            if tomorrow.date() != month_end.date():
                print(f"📅 Not month-end tomorrow ({tomorrow.date()}), skipping notification check")
                return []
            
            print(f"📅 Tomorrow is month-end ({month_end.date()}), checking for due payments...")
            
            clients_due = []
            
            for client in clients:
                # Skip archived clients
                if client.get('archived', False):
                    continue
                
                # Calculate current amount due
                try:
                    from utils.loanCalculations import calculateCurrentAmountDue
                    current_due = calculateCurrentAmountDue(client)
                except:
                    # Fallback calculation
                    loan_amount = client.get('loan_amount', client.get('loanAmount', 0))
                    amount_paid = client.get('amount_paid', client.get('amountPaid', 0))
                    current_due = max(0, (loan_amount * 1.5) - amount_paid)
                
                # Only include clients with outstanding balances
                if current_due > 0:
                    client_info = {
                        'id': client.get('id') or client.get('client_uuid'),
                        'name': client.get('name') or client.get('client_name'),
                        'email': client.get('email') or client.get('client_email'),
                        'phone': client.get('phone') or client.get('client_phone'),
                        'loan_amount': client.get('loan_amount') or client.get('loanAmount', 0),
                        'amount_paid': client.get('amount_paid') or client.get('amountPaid', 0),
                        'current_amount_due': current_due,
                        'status': client.get('status', 'active'),
                        'start_date': client.get('start_date') or client.get('startDate'),
                    }
                    clients_due.append(client_info)
            
            # Sort by amount due (highest first)
            clients_due.sort(key=lambda x: x['current_amount_due'], reverse=True)
            
            print(f"📊 Found {len(clients_due)} clients with payments due")
            
            return clients_due
            
        except Exception as e:
            print(f"❌ Error checking for due payments: {e}")
            return []
    
    def _get_month_end_date(self, date: datetime) -> datetime:
        """Get the last day of the given month"""
        # Get first day of next month, then subtract one day
        if date.month == 12:
            next_month = date.replace(year=date.year + 1, month=1, day=1)
        else:
            next_month = date.replace(month=date.month + 1, day=1)
        
        last_day = next_month - timedelta(days=1)
        return last_day
    
    def send_daily_notification(self):
        """Check for payments due and send notifications"""
        print(f"🔔 Running daily notification check at {datetime.now()}")
        
        try:
            # Get clients with payments due
            clients_due = self.get_clients_with_payments_due()
            
            if clients_due:
                # Send email notification
                success = email_service.send_payment_due_notification(clients_due)
                
                if success:
                    print(f"✅ Notification sent successfully for {len(clients_due)} clients")
                else:
                    print(f"❌ Failed to send notification")
            else:
                print("ℹ️ No clients with payments due tomorrow")
                
        except Exception as e:
            print(f"❌ Error in daily notification check: {e}")
    
    def schedule_notifications(self):
        """Set up scheduled notifications"""
        # Schedule daily check at 9:00 AM
        schedule.every().day.at("09:00").do(self.send_daily_notification)
        
        # Also schedule at 5:00 PM as backup
        schedule.every().day.at("17:00").do(self.send_daily_notification)
        
        print("📅 Notification scheduler configured:")
        print("   - Daily checks at 9:00 AM and 5:00 PM")
        print("   - Notifications sent day before month-end")
    
    def run_scheduler(self):
        """Run the notification scheduler in background"""
        self.is_running = True
        print("🚀 Starting notification scheduler...")
        
        while self.is_running:
            schedule.run_pending()
            time.sleep(60)  # Check every minute
    
    def start_background_scheduler(self):
        """Start scheduler in background thread"""
        if not self.is_running:
            self.schedule_notifications()
            
            # Start in background thread
            scheduler_thread = threading.Thread(target=self.run_scheduler, daemon=True)
            scheduler_thread.start()
            
            print("✅ Background notification scheduler started")
        else:
            print("ℹ️ Scheduler is already running")
    
    def stop_scheduler(self):
        """Stop the notification scheduler"""
        self.is_running = False
        schedule.clear()
        print("🛑 Notification scheduler stopped")
    
    def test_notification(self):
        """Test notification system with current data"""
        print("🧪 Testing notification system...")
        
        # Get all clients with outstanding balances for testing
        try:
            clients = self.db.get_all_clients(include_archived=False)
            clients_due = []
            
            for client in clients:
                # Skip archived clients
                if client.get('archived', False):
                    continue
                
                loan_amount = client.get('loan_amount') or client.get('loanAmount', 0)
                amount_paid = client.get('amount_paid') or client.get('amountPaid', 0)
                current_due = max(0, (loan_amount * 1.5) - amount_paid)
                
                if current_due > 0:
                    client_info = {
                        'id': client.get('id') or client.get('client_uuid'),
                        'name': client.get('name') or client.get('client_name'),
                        'email': client.get('email') or client.get('client_email'),
                        'phone': client.get('phone') or client.get('client_phone'),
                        'loan_amount': loan_amount,
                        'amount_paid': amount_paid,
                        'current_amount_due': current_due,
                        'status': client.get('status', 'active'),
                        'start_date': client.get('start_date') or client.get('startDate'),
                    }
                    clients_due.append(client_info)
            
            if clients_due:
                print(f"📧 Sending test notification for {len(clients_due)} clients...")
                success = email_service.send_payment_due_notification(clients_due)
                return success
            else:
                print("ℹ️ No clients with outstanding payments to test with")
                return True
                
        except Exception as e:
            print(f"❌ Error in test notification: {e}")
            return False

# Create global instance
notification_scheduler = NotificationScheduler()