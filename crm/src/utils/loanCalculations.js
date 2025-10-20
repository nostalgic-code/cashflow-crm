// Loan calculation utilities for 50% monthly interest

// Calculate total amount due (principal + 50% interest)
export const calculateTotalAmountDue = (principal) => {
  return Math.round(principal * 1.5 * 100) / 100;
};

// For display purposes - this is the total amount due, not a monthly payment
export const calculateMonthlyPayment = (principal, monthlyInterestRate = 0.5, termInMonths = 1) => {
  // Total amount due at month end = principal * 1.5
  return calculateTotalAmountDue(principal);
};

// Calculate remaining balance based on payments made
export const calculateRemainingBalance = (principal, totalAmountPaid) => {
  const totalAmountDue = calculateTotalAmountDue(principal);
  return Math.max(0, Math.round((totalAmountDue - totalAmountPaid) * 100) / 100);
};

export const calculateDaysOverdue = (dueDate) => {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = today - due;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};

// Calculate payment due date (end of the month when loan was taken)
export const calculatePaymentDueDate = (loanStartDate) => {
  const startDate = new Date(loanStartDate);
  const year = startDate.getFullYear();
  const month = startDate.getMonth();
  
  // Get last day of the month
  const lastDay = new Date(year, month + 1, 0);
  return lastDay.toISOString();
};

export const calculateNextPaymentDate = (lastPaymentDate, frequency = 'monthly') => {
  if (!lastPaymentDate) return null;
  
  const lastPayment = new Date(lastPaymentDate);
  const nextPayment = new Date(lastPayment);
  
  switch (frequency) {
    case 'weekly':
      nextPayment.setDate(nextPayment.getDate() + 7);
      break;
    case 'bi-weekly':
      nextPayment.setDate(nextPayment.getDate() + 14);
      break;
    case 'monthly':
    default:
      nextPayment.setMonth(nextPayment.getMonth() + 1);
      break;
  }
  
  return nextPayment.toISOString().split('T')[0];
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
};

export const getStatusColor = (status) => {
  const colors = {
    'new-lead': 'bg-monday-blue text-white',
    'active': 'bg-monday-purple text-white',
    'repayment-due': 'bg-monday-yellow text-black',
    'paid': 'bg-monday-green text-white',
    'overdue': 'bg-monday-red text-white',
  };
  
  return colors[status] || 'bg-gray-400 text-white';
};

export const getStatusBadgeClasses = (status) => {
  const classes = {
    'new-lead': 'bg-monday-blue text-white',
    'active': 'bg-monday-purple text-white', 
    'repayment-due': 'bg-monday-yellow text-black font-bold',
    'paid': 'bg-monday-green text-white',
    'overdue': 'bg-monday-red text-white',
  };
  
  return classes[status] || 'bg-gray-400 text-white';
};

export const getStatusText = (status) => {
  const statusTexts = {
    'new-lead': 'New Lead',
    'active': 'Active Loan',
    'repayment-due': 'Repayment Due',
    'paid': 'Paid',
    'overdue': 'Overdue',
  };
  
  return statusTexts[status] || 'Unknown';
};

export const calculateLoanHealth = (client) => {
  const { loanAmount, amountPaid, status, lastPaymentDate } = client;
  
  // Calculate payment percentage
  const paymentPercentage = (amountPaid / loanAmount) * 100;
  
  // Calculate days since last payment
  const daysSincePayment = lastPaymentDate ? 
    Math.floor((new Date() - new Date(lastPaymentDate)) / (1000 * 60 * 60 * 24)) : 
    null;
  
  // Determine health score (0-100)
  let healthScore = 100;
  
  if (status === 'overdue') {
    healthScore -= 40;
  } else if (status === 'repayment-due') {
    healthScore -= 20;
  }
  
  if (daysSincePayment > 60) {
    healthScore -= 30;
  } else if (daysSincePayment > 30) {
    healthScore -= 15;
  }
  
  if (paymentPercentage < 25) {
    healthScore -= 20;
  }
  
  return {
    score: Math.max(0, healthScore),
    paymentPercentage,
    daysSincePayment,
    status: healthScore >= 80 ? 'excellent' : 
            healthScore >= 60 ? 'good' : 
            healthScore >= 40 ? 'fair' : 'poor'
  };
};