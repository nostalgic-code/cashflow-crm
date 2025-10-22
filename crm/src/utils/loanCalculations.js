// Loan calculation utilities for 50% monthly interest with compound interest

// Calculate total amount due (principal + 50% interest)
export const calculateTotalAmountDue = (principal) => {
  return Math.round(principal * 1.5 * 100) / 100;
};

// Calculate current amount due with compound interest
export const calculateCurrentAmountDue = (client) => {
  const { loanAmount, amountPaid = 0, startDate, lastPaymentDate, dueDate } = client;
  
  // Validate inputs
  if (!loanAmount || loanAmount <= 0) return 0;
  
  // Initial amount due (principal + 50% interest)
  const initialAmountDue = loanAmount * 1.5;
  
  // If no payments made, return initial amount
  if (amountPaid === 0) {
    return Math.round(initialAmountDue * 100) / 100;
  }
  
  // Calculate remaining balance after payments
  let remainingBalance = initialAmountDue - amountPaid;
  
  // If fully paid or overpaid, return 0
  if (remainingBalance <= 0) {
    return 0;
  }
  
  // If no due date, return simple remaining balance (fallback)
  if (!dueDate) {
    console.log('📊 No due date specified, returning simple remaining balance:', remainingBalance);
    return Math.round(remainingBalance * 100) / 100;
  }
  
  // Calculate compound interest based on due date
  const dueDateObj = new Date(dueDate);
  const referenceDate = lastPaymentDate ? new Date(lastPaymentDate) : new Date(startDate || Date.now());
  const now = new Date();
  
  console.log('📊 Compound Interest Calculation (Custom Due Date):', {
    loanAmount,
    amountPaid,
    initialAmountDue,
    remainingBalance,
    startDate,
    lastPaymentDate,
    dueDate,
    dueDateObj: dueDateObj.toISOString(),
    referenceDate: referenceDate.toISOString(),
    now: now.toISOString(),
    dueDatePassed: dueDateObj < now
  });
  
  // Check if due date has passed
  if (dueDateObj < now) {
    // Due date has passed, apply 50% compound interest
    const oldBalance = remainingBalance;
    remainingBalance = remainingBalance * 1.5;
    
    console.log(`📊 Due date passed: ${formatCurrency(oldBalance)} → ${formatCurrency(remainingBalance)} (50% interest applied)`);
    
    // Cap maximum balance to prevent runaway calculations (10x original loan)
    const maxReasonableBalance = loanAmount * 10;
    if (remainingBalance > maxReasonableBalance) {
      remainingBalance = maxReasonableBalance;
      console.log('📊 Capped at maximum reasonable balance:', formatCurrency(remainingBalance));
    }
  } else {
    // Due date hasn't passed yet, no compound interest
    console.log('📊 Due date hasn\'t passed yet, no compound interest applied');
  }
  
  const finalAmount = Math.round(remainingBalance * 100) / 100;
  console.log('📊 Final current amount due:', formatCurrency(finalAmount));
  return finalAmount;
};

// Calculate remaining balance based on current amount due (with compound interest)
export const calculateRemainingBalance = (clientOrPrincipal, totalAmountPaid) => {
  // If client object is passed, calculate with compound interest
  if (typeof clientOrPrincipal === 'object' && clientOrPrincipal && clientOrPrincipal.loanAmount) {
    const currentAmountDue = calculateCurrentAmountDue(clientOrPrincipal);
    const amountPaid = clientOrPrincipal.amountPaid || 0;
    return Math.max(0, Math.round((currentAmountDue - amountPaid) * 100) / 100);
  }
  
  // Legacy support: if called with (principal, totalAmountPaid)
  if (typeof clientOrPrincipal === 'number' && typeof totalAmountPaid === 'number') {
    const totalAmountDue = calculateTotalAmountDue(clientOrPrincipal);
    return Math.max(0, Math.round((totalAmountDue - totalAmountPaid) * 100) / 100);
  }
  
  // Fallback
  return 0;
};

// For display purposes - this is the total amount due, not a monthly payment
export const calculateMonthlyPayment = (principal, monthlyInterestRate = 0.5, termInMonths = 1) => {
  // Total amount due at month end = principal * 1.5
  return calculateTotalAmountDue(principal);
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
  // Handle invalid or extremely large numbers
  if (!amount || isNaN(amount) || !isFinite(amount)) {
    return 'R0';
  }
  
  // Cap extremely large numbers
  const cappedAmount = Math.min(amount, 999999999999); // 999 billion max
  
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(cappedAmount));
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