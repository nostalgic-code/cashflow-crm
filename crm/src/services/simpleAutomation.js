// Simple automation service to prevent flickering
export class SimpleAutomationService {
  constructor() {
    this.notifications = [];
    this.lastRun = 0;
  }

  // Add notification to queue
  addNotification(notification) {
    this.notifications.push({
      id: Date.now() + Math.random(),
      ...notification
    });
    
    // Keep only last 10 notifications
    if (this.notifications.length > 10) {
      this.notifications = this.notifications.slice(-10);
    }
  }

  // Get all notifications
  getNotifications() {
    return this.notifications;
  }

  // Clear notifications
  clearNotifications() {
    this.notifications = [];
  }

  // Minimal automation - check for completed loans and due dates
  runAutomation(clients) {
    // Throttle automation to prevent excessive runs
    const now = Date.now();
    if (this.lastRun && (now - this.lastRun) < 60000) { // 1 minute throttle
      return { 
        clients, 
        reminders: [], 
        notifications: this.getNotifications(),
        hasChanges: false 
      };
    }
    
    this.lastRun = now;
    let hasChanges = false;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to compare only dates
    
    const updatedClients = clients.map(client => {
      // Check for completed loans
      if (client.amountPaid >= client.loanAmount && client.status !== 'paid') {
        this.addNotification({
          type: 'success',
          clientId: client.id,
          message: `${client.name}'s loan has been fully paid!`,
          timestamp: new Date().toISOString()
        });
        hasChanges = true;
        return { ...client, status: 'paid' };
      }
      
      // Check for due dates - move active loans to repayment-due on due date
      if (client.status === 'active' && client.dueDate) {
        try {
          const dueDate = new Date(client.dueDate);
          dueDate.setHours(0, 0, 0, 0); // Reset time to compare only dates
          
          // If due date is today or has passed, move to repayment-due
          if (dueDate <= today) {
            this.addNotification({
              type: 'warning',
              clientId: client.id,
              message: `${client.name}'s payment is now due!`,
              timestamp: new Date().toISOString()
            });
            hasChanges = true;
            return { ...client, status: 'repayment-due' };
          }
        } catch (error) {
          console.error('Error checking due date for client:', client.name, error);
        }
      }
      
      // Check for overdue payments - move repayment-due to overdue after due date
      if (client.status === 'repayment-due' && client.dueDate) {
        try {
          const dueDate = new Date(client.dueDate);
          dueDate.setHours(23, 59, 59, 999); // End of due date
          
          // If due date has fully passed (next day), move to overdue
          if (dueDate < today) {
            this.addNotification({
              type: 'error',
              clientId: client.id,
              message: `${client.name}'s payment is now overdue!`,
              timestamp: new Date().toISOString()
            });
            hasChanges = true;
            return { ...client, status: 'overdue' };
          }
        } catch (error) {
          console.error('Error checking overdue date for client:', client.name, error);
        }
      }
      
      return client;
    });
    
    return {
      clients: updatedClients,
      reminders: [],
      notifications: this.getNotifications(),
      hasChanges
    };
  }
}

// Create singleton instance
export const automationService = new SimpleAutomationService();