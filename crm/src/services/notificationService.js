// Notification service for CashFlow CRM
// Handles email notifications and payment due alerts

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://cashflow-crm.onrender.com';

class NotificationService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api/notifications`;
  }

  // Test the notification system
  async testNotification() {
    try {
      console.log('🧪 Testing notification system...');
      
      const response = await fetch(`${this.baseURL}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to test notification');
      }

      console.log('✅ Test notification result:', data);
      return data;

    } catch (error) {
      console.error('❌ Test notification failed:', error);
      throw error;
    }
  }

  // Check for clients with payments due
  async checkPaymentsDue() {
    try {
      console.log('📅 Checking for payments due...');
      
      const response = await fetch(`${this.baseURL}/check-due`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check payments due');
      }

      console.log('📊 Payments due check result:', data);
      return data;

    } catch (error) {
      console.error('❌ Check payments due failed:', error);
      throw error;
    }
  }

  // Send payment due notifications immediately
  async sendPaymentDueNotifications() {
    try {
      console.log('📧 Sending payment due notifications...');
      
      const response = await fetch(`${this.baseURL}/send-due`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send notifications');
      }

      console.log('✅ Notifications sent:', data);
      return data;

    } catch (error) {
      console.error('❌ Send notifications failed:', error);
      throw error;
    }
  }

  // Start the background notification scheduler
  async startScheduler() {
    try {
      console.log('🚀 Starting notification scheduler...');
      
      const response = await fetch(`${this.baseURL}/schedule-start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start scheduler');
      }

      console.log('✅ Scheduler started:', data);
      return data;

    } catch (error) {
      console.error('❌ Start scheduler failed:', error);
      throw error;
    }
  }

  // Stop the background notification scheduler
  async stopScheduler() {
    try {
      console.log('🛑 Stopping notification scheduler...');
      
      const response = await fetch(`${this.baseURL}/schedule-stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to stop scheduler');
      }

      console.log('✅ Scheduler stopped:', data);
      return data;

    } catch (error) {
      console.error('❌ Stop scheduler failed:', error);
      throw error;
    }
  }

  // Get the next month-end date
  getNextMonthEnd() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    // Get last day of current month
    const lastDay = new Date(year, month + 1, 0);
    return lastDay;
  }

  // Check if tomorrow is month-end
  isTomorrowMonthEnd() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const monthEnd = this.getNextMonthEnd();
    
    return tomorrow.toDateString() === monthEnd.toDateString();
  }

  // Format currency for display
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // Show notification result to user
  showNotificationResult(result, type = 'success') {
    const message = result.message || 'Operation completed';
    
    if (type === 'success') {
      alert(`✅ ${message}`);
    } else {
      alert(`❌ ${message}`);
    }
  }
}

// Create and export singleton instance
export const notificationService = new NotificationService();
export default notificationService;