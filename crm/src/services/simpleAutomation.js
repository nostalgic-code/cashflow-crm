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

  // Minimal automation - only check for completed loans
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
    
    // Only auto-update status for clearly completed loans
    const updatedClients = clients.map(client => {
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