import { calculateNextPaymentDate, calculateDaysOverdue } from '../utils/loanCalculations.js';

// Automation service for Cashflow CRM operations
export class AutomationService {
  constructor() {
    this.notifications = [];
  }

  // Auto-update client statuses based on payment dates and amounts
  autoUpdateStatuses(clients) {
    const today = new Date();
    let hasChanges = false;
    
    const updatedClients = clients.map(client => {
      let newStatus = client.status;
      
      // Check if loan is fully paid
      if (client.amountPaid >= client.loanAmount && client.status !== 'paid') {
        newStatus = 'paid';
        hasChanges = true;
        this.addNotification({
          type: 'success',
          clientId: client.id,
          message: `${client.name}'s loan has been fully paid!`,
          timestamp: new Date().toISOString()
        });
      }
      // Check for overdue payments
      else if (client.lastPaymentDate && client.status !== 'overdue') {
        const nextPaymentDate = calculateNextPaymentDate(client.lastPaymentDate);
        if (nextPaymentDate && new Date(nextPaymentDate) < today) {
          newStatus = 'overdue';
          hasChanges = true;
          this.addNotification({
            type: 'warning',
            clientId: client.id,
            message: `${client.name} has an overdue payment!`,
            timestamp: new Date().toISOString()
          });
        }
        // Check for upcoming due payments (within 7 days) - only if currently active
        else if (nextPaymentDate && client.status === 'active') {
          const daysUntilDue = Math.ceil((new Date(nextPaymentDate) - today) / (1000 * 60 * 60 * 24));
          if (daysUntilDue <= 7 && daysUntilDue > 0) {
            newStatus = 'repayment-due';
            hasChanges = true;
            this.addNotification({
              type: 'info',
              clientId: client.id,
              message: `${client.name} has a payment due in ${daysUntilDue} days`,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
      
      return newStatus !== client.status ? { ...client, status: newStatus } : client;
    });
    
    return { clients: updatedClients, hasChanges };
  }

  // Auto-calculate interest and update loan amounts
  autoCalculateInterest(clients) {
    return clients.map(client => {
      if (client.status === 'paid') return client;
      
      const lastPaymentDate = new Date(client.lastPaymentDate || client.startDate);
      const today = new Date();
      const daysSinceLastPayment = Math.floor((today - lastPaymentDate) / (1000 * 60 * 60 * 24));
      
      // Calculate daily interest
      const dailyRate = (client.interestRate / 100) / 365;
      const interestAccrued = (client.loanAmount - client.amountPaid) * dailyRate * daysSinceLastPayment;
      
      // Only add interest if it's been more than 30 days since last payment
      if (daysSinceLastPayment > 30 && interestAccrued > 1) {
        const updatedClient = {
          ...client,
          loanAmount: client.loanAmount + interestAccrued,
          lastInterestUpdate: today.toISOString().split('T')[0]
        };
        
        this.addNotification({
          type: 'info',
          clientId: client.id,
          message: `Interest of $${interestAccrued.toFixed(2)} added to ${client.name}'s account`,
          timestamp: new Date().toISOString()
        });
        
        return updatedClient;
      }
      
      return client;
    });
  }

  // Generate payment reminders
  generatePaymentReminders(clients) {
    const today = new Date();
    const reminders = [];
    
    clients.forEach(client => {
      if (client.status === 'paid') return;
      
      const nextPaymentDate = calculateNextPaymentDate(client.lastPaymentDate);
      if (nextPaymentDate) {
        const daysUntilDue = Math.ceil((new Date(nextPaymentDate) - today) / (1000 * 60 * 60 * 24));
        
        // Send reminder 3 days before due date
        if (daysUntilDue === 3) {
          reminders.push({
            type: 'reminder',
            clientId: client.id,
            client: client,
            message: `Payment reminder: ${client.name} has a payment of $${client.monthlyPayment} due in 3 days`,
            dueDate: nextPaymentDate,
            amount: client.monthlyPayment
          });
        }
        // Send overdue notice
        else if (daysUntilDue < 0) {
          const daysOverdue = Math.abs(daysUntilDue);
          reminders.push({
            type: 'overdue',
            clientId: client.id,
            client: client,
            message: `OVERDUE: ${client.name}'s payment is ${daysOverdue} days overdue`,
            dueDate: nextPaymentDate,
            amount: client.monthlyPayment,
            daysOverdue: daysOverdue
          });
        }
      }
    });
    
    return reminders;
  }

  // Add notification to queue
  addNotification(notification) {
    this.notifications.push({
      id: Date.now() + Math.random(),
      ...notification
    });
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(-50);
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

  // Auto-assign loan status based on payment history
  autoAssignRiskLevel(client) {
    const { amountPaid, loanAmount, lastPaymentDate, startDate } = client;
    
    const paymentPercentage = (amountPaid / loanAmount) * 100;
    const loanStartDate = new Date(startDate);
    const today = new Date();
    const loanDurationDays = Math.floor((today - loanStartDate) / (1000 * 60 * 60 * 24));
    const expectedPaymentPercentage = Math.min(100, (loanDurationDays / 365) * 100); // Assuming 1 year term
    
    let riskLevel = 'low';
    let riskScore = 0;
    
    // Payment history risk
    if (paymentPercentage < expectedPaymentPercentage * 0.5) {
      riskScore += 40;
    } else if (paymentPercentage < expectedPaymentPercentage * 0.8) {
      riskScore += 20;
    }
    
    // Payment recency risk
    if (lastPaymentDate) {
      const daysSincePayment = Math.floor((today - new Date(lastPaymentDate)) / (1000 * 60 * 60 * 24));
      if (daysSincePayment > 60) {
        riskScore += 30;
      } else if (daysSincePayment > 30) {
        riskScore += 15;
      }
    } else {
      riskScore += 50; // No payments made
    }
    
    // Status risk
    if (client.status === 'overdue') {
      riskScore += 25;
    } else if (client.status === 'repayment-due') {
      riskScore += 10;
    }
    
    // Determine risk level
    if (riskScore >= 70) {
      riskLevel = 'high';
    } else if (riskScore >= 40) {
      riskLevel = 'medium';
    }
    
    return {
      level: riskLevel,
      score: riskScore,
      factors: {
        paymentHistory: paymentPercentage < expectedPaymentPercentage * 0.8,
        paymentRecency: lastPaymentDate ? 
          Math.floor((today - new Date(lastPaymentDate)) / (1000 * 60 * 60 * 24)) > 30 : true,
        currentStatus: client.status === 'overdue' || client.status === 'repayment-due'
      }
    };
  }

  // Run all automation processes
  runAutomation(clients) {
    console.log('Running automation processes...');
    
    // Update statuses
    const statusResult = this.autoUpdateStatuses(clients);
    let updatedClients = statusResult.clients;
    let hasAnyChanges = statusResult.hasChanges;
    
    // Calculate interest (if applicable) - less frequently
    const shouldCalculateInterest = Math.random() < 0.1; // Only 10% of the time
    if (shouldCalculateInterest) {
      const newClients = this.autoCalculateInterest(updatedClients);
      if (JSON.stringify(newClients) !== JSON.stringify(updatedClients)) {
        updatedClients = newClients;
        hasAnyChanges = true;
      }
    }
    
    // Generate reminders
    const reminders = this.generatePaymentReminders(updatedClients);
    
    // Add risk assessments - only if there were other changes
    if (hasAnyChanges) {
      updatedClients = updatedClients.map(client => ({
        ...client,
        riskAssessment: this.autoAssignRiskLevel(client)
      }));
    }
    
    console.log(`Automation complete: ${this.notifications.length} notifications generated`);
    
    return {
      clients: updatedClients,
      reminders: reminders,
      notifications: this.getNotifications(),
      hasChanges: hasAnyChanges
    };
  }
}

// Create singleton instance
export const automationService = new AutomationService();