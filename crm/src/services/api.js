import { v4 as uuidv4 } from 'uuid';

// Mock data for Cashflow CRM
const mockClients = [
  {
    id: uuidv4(),
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+1-555-0123',
    loanType: 'Secured Loan',
    loanAmount: 15000,
    interestRate: 50.0, // 50% monthly interest
    startDate: '2024-09-15',
    dueDate: '2024-09-30', // End of September
    monthlyPayment: 22500, // 15000 * 1.5 (total amount due)
    amountPaid: 10000,
    status: 'active',
    lastPaymentDate: '2024-09-20',
    notes: 'Good payment history, reliable client',
    documents: []
  },
  {
    id: uuidv4(),
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '+1-555-0234',
    loanType: 'Unsecured Loan',
    loanAmount: 50000,
    interestRate: 50.0,
    startDate: '2024-10-01',
    dueDate: '2024-10-31', // End of October
    monthlyPayment: 75000, // 50000 * 1.5 (total amount due)
    amountPaid: 25000,
    status: 'repayment-due',
    lastPaymentDate: '2024-10-15',
    notes: 'Small business owner, restaurant',
    documents: []
  },
  {
    id: uuidv4(),
    name: 'Mike Wilson',
    email: 'mike.wilson@email.com',
    phone: '+1-555-0345',
    loanType: 'Secured Loan',
    loanAmount: 25000,
    interestRate: 6.5,
    startDate: '2023-06-01',
    dueDate: '2028-06-01',
    monthlyPayment: 485,
    amountPaid: 7275,
    status: 'overdue',
    lastPaymentDate: '2024-07-01',
    notes: 'Payment overdue by 2 months',
    documents: []
  },
  {
    id: uuidv4(),
    name: 'Emma Davis',
    email: 'emma.davis@email.com',
    phone: '+1-555-0456',
    loanType: 'Unsecured Loan',
    loanAmount: 8000,
    interestRate: 9.0,
    startDate: '2023-01-01',
    dueDate: '2024-01-01',
    monthlyPayment: 700,
    amountPaid: 8400,
    status: 'paid',
    lastPaymentDate: '2024-01-01',
    notes: 'Loan fully paid off early',
    documents: []
  },
  {
    id: uuidv4(),
    name: 'David Brown',
    email: 'david.brown@email.com',
    phone: '+1-555-0567',
    loanType: 'Secured Loan',
    loanAmount: 120000,
    interestRate: 4.5,
    startDate: '2024-09-01',
    dueDate: '2034-09-01',
    monthlyPayment: 1245,
    amountPaid: 2490,
    status: 'new-lead',
    lastPaymentDate: null,
    notes: 'New client, just approved',
    documents: []
  }
];

// API Functions
export const getClients = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockClients);
    }, 100);
  });
};

export const updateClientStatus = (clientId, newStatus) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const clientIndex = mockClients.findIndex(client => client.id === clientId);
      if (clientIndex !== -1) {
        mockClients[clientIndex].status = newStatus;
        resolve(mockClients[clientIndex]);
      } else {
        reject(new Error(`Client with ID ${clientId} not found`));
      }
    }, 100);
  });
};

export const updateClient = (clientId, updates) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const clientIndex = mockClients.findIndex(client => client.id === clientId);
      if (clientIndex !== -1) {
        mockClients[clientIndex] = { ...mockClients[clientIndex], ...updates };
        resolve(mockClients[clientIndex]);
      }
    }, 100);
  });
};

export const addPayment = (clientId, amount, date = new Date().toISOString().split('T')[0]) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const clientIndex = mockClients.findIndex(client => client.id === clientId);
      if (clientIndex !== -1) {
        const client = mockClients[clientIndex];
        client.amountPaid += amount;
        client.lastPaymentDate = date;
        
        // Auto-update status based on payment
        const remainingAmount = client.loanAmount - client.amountPaid;
        if (remainingAmount <= 0) {
          client.status = 'paid';
        } else {
          client.status = 'active';
        }
        
        resolve(client);
      }
    }, 100);
  });
};

// Analytics data - now calculates from real client data
export const getAnalyticsData = (clients = []) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!clients.length) {
        resolve({
          totalLoaned: 0,
          totalCollected: 0,
          overduePercentage: 0,
          monthlyData: [],
          loanTypeData: [],
          repaymentRate: 0
        });
        return;
      }

      const totalLoaned = clients.reduce((sum, client) => sum + client.loanAmount, 0);
      const totalCollected = clients.reduce((sum, client) => sum + client.amountPaid, 0);
      const overdueLoans = clients.filter(client => client.status === 'overdue').length;
      const totalLoans = clients.length;
      
      // Generate realistic monthly data based on client data
      const avgMonthlyLoaned = totalLoaned / 6; // Spread over 6 months
      const avgMonthlyCollected = totalCollected / 6;
      
      const monthlyData = [
        { month: 'May', loaned: Math.round(avgMonthlyLoaned * 0.8), collected: Math.round(avgMonthlyCollected * 0.7) },
        { month: 'Jun', loaned: Math.round(avgMonthlyLoaned * 1.2), collected: Math.round(avgMonthlyCollected * 0.9) },
        { month: 'Jul', loaned: Math.round(avgMonthlyLoaned * 0.9), collected: Math.round(avgMonthlyCollected * 1.1) },
        { month: 'Aug', loaned: Math.round(avgMonthlyLoaned * 1.1), collected: Math.round(avgMonthlyCollected * 1.0) },
        { month: 'Sep', loaned: Math.round(avgMonthlyLoaned * 1.0), collected: Math.round(avgMonthlyCollected * 1.2) },
        { month: 'Oct', loaned: Math.round(avgMonthlyLoaned * 0.7), collected: Math.round(avgMonthlyCollected * 0.8) },
      ];
      
      // Calculate loan type data from actual clients
      const loanTypeData = clients.reduce((acc, client) => {
        const existing = acc.find(item => item.type === client.loanType);
        if (existing) {
          existing.count += 1;
          existing.amount += client.loanAmount;
        } else {
          acc.push({
            type: client.loanType,
            count: 1,
            amount: client.loanAmount
          });
        }
        return acc;
      }, []);
      
      resolve({
        totalLoaned,
        totalCollected,
        overduePercentage: totalLoans > 0 ? (overdueLoans / totalLoans) * 100 : 0,
        monthlyData,
        loanTypeData,
        repaymentRate: totalLoaned > 0 ? (totalCollected / totalLoaned) * 100 : 0
      });
    }, 100);
  });
};

// Add a new client
export const addClient = (clientData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      mockClients.push(clientData);
      resolve(clientData);
    }, 100);
  });
};

// Delete a client
export const deleteClient = (clientId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const index = mockClients.findIndex(client => client.id === clientId);
      if (index > -1) {
        const deletedClient = mockClients.splice(index, 1)[0];
        resolve(deletedClient);
      } else {
        throw new Error('Client not found');
      }
    }, 100);
  });
};