import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle,
  Target,
  Activity
} from 'lucide-react';
import { formatCurrency, calculateTotalAmountDue, calculateRemainingBalance } from '../utils/loanCalculations';

const Dashboard = ({ clients = [] }) => {
  // Calculate real-time stats from clients
  const stats = useMemo(() => {
    if (!clients.length) {
      return {
        totalLoaned: 0,
        totalAmountDue: 0,
        totalCollected: 0,
        activeLoans: 0,
        overdueCount: 0,
        avgLoanAmount: 0,
        repaymentRate: 0,
        totalOutstanding: 0
      };
    }

    const totalLoaned = clients.reduce((sum, client) => sum + client.loanAmount, 0);
    const totalAmountDue = clients.reduce((sum, client) => sum + calculateTotalAmountDue(client.loanAmount), 0);
    const totalCollected = clients.reduce((sum, client) => sum + client.amountPaid, 0);
    const totalOutstanding = clients.reduce((sum, client) => sum + calculateRemainingBalance(client.loanAmount, client.amountPaid), 0);
    const activeLoans = clients.filter(client => 
      ['active', 'repayment-due', 'overdue'].includes(client.status)
    ).length;
    const overdueCount = clients.filter(client => client.status === 'overdue').length;
    const avgLoanAmount = totalLoaned / clients.length;
    const repaymentRate = totalAmountDue > 0 ? (totalCollected / totalAmountDue) * 100 : 0;

    return {
      totalLoaned,
      totalAmountDue,
      totalCollected,
      totalOutstanding,
      activeLoans,
      overdueCount,
      avgLoanAmount,
      repaymentRate
    };
  }, [clients]);

  // Prepare chart data based on real client data
  const statusData = useMemo(() => [
    { name: 'New Leads', value: clients.filter(c => c.status === 'new-lead').length, color: '#0073ea' },
    { name: 'Active', value: clients.filter(c => c.status === 'active').length, color: '#a25ddc' },
    { name: 'Due', value: clients.filter(c => c.status === 'repayment-due').length, color: '#ffcc00' },
    { name: 'Paid', value: clients.filter(c => c.status === 'paid').length, color: '#00d647' },
    { name: 'Overdue', value: clients.filter(c => c.status === 'overdue').length, color: '#e2445c' },
  ], [clients]);

  const loanTypeData = useMemo(() => {
    const typeMap = new Map();
    
    clients.forEach(client => {
      const existing = typeMap.get(client.loanType);
      const totalAmountDue = calculateTotalAmountDue(client.loanAmount);
      const outstanding = calculateRemainingBalance(client.loanAmount, client.amountPaid);
      
      if (existing) {
        existing.count += 1;
        existing.amount += client.loanAmount;
        existing.totalDue += totalAmountDue;
        existing.outstanding += outstanding;
      } else {
        typeMap.set(client.loanType, {
          type: client.loanType,
          count: 1,
          amount: client.loanAmount,
          totalDue: totalAmountDue,
          outstanding: outstanding
        });
      }
    });
    
    return Array.from(typeMap.values());
  }, [clients]);

const StatCard = ({ title, value, icon: Icon, color = 'blue', trend, subtitle }) => {
    const colorClasses = {
      blue: 'border-blue-200 bg-blue-50',
      green: 'border-green-200 bg-green-50',
      yellow: 'border-yellow-200 bg-yellow-50',
      red: 'border-red-200 bg-red-50',
      purple: 'border-purple-200 bg-purple-50'
    };

    return (
      <div className={`bg-white rounded-lg border ${colorClasses[color]} p-6 shadow-sm`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-monday-gray-600">{title}</p>
            <p className="text-2xl font-bold text-monday-gray-900 mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-monday-gray-500 mt-1">{subtitle}</p>
            )}
            {trend !== undefined && (
              <div className="flex items-center mt-2 text-sm">
                <TrendingUp className="w-4 h-4 text-monday-green mr-1" />
                <span className="text-monday-green font-semibold">
                  {trend}% from last month
                </span>
              </div>
            )}
          </div>
          <div className="p-3 rounded-full bg-white shadow-sm">
            <Icon className="w-6 h-6 text-monday-gray-600" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-monday-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-monday-gray-900">Analytics Dashboard</h2>
            <p className="text-monday-gray-600 mt-1 font-medium">Real-time overview of your loan portfolio</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Loaned"
            value={formatCurrency(stats.totalLoaned)}
            icon={DollarSign}
            color="blue"
          />
          <StatCard
            title="Total Collected"
            value={formatCurrency(stats.totalCollected)}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Outstanding"
            value={formatCurrency(stats.totalOutstanding)}
            icon={Activity}
            color="purple"
          />
          <StatCard
            title="Overdue Loans"
            value={stats.overdueCount}
            icon={AlertTriangle}
            color="red"
          />
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Total Amount Due"
            value={formatCurrency(stats.totalAmountDue)}
            icon={Target}
            color="red"
            subtitle="Principal + 50% Interest"
          />
          <StatCard
            title="Repayment Rate"
            value={`${Math.round(stats.repaymentRate)}%`}
            icon={Target}
            color="green"
          />
          <StatCard
            title="Active Loans"
            value={stats.activeLoans}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Avg Loan Amount"
            value={formatCurrency(stats.avgLoanAmount)}
            icon={Users}
            color="purple"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <div className="bg-white rounded-lg border border-monday-gray-200 p-6">
            <h3 className="text-lg font-bold text-monday-gray-900 mb-4">Loan Status Distribution</h3>
            {statusData.some(item => item.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData.filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.filter(item => item.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-monday-gray-500 font-medium">
                No data available
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {statusData.filter(item => item.value > 0).map((entry) => (
                <div key={entry.name} className="flex items-center text-sm">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-monday-gray-700 font-medium">
                    {entry.name}: <span className="font-bold">{entry.value}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Loan Types Performance */}
          <div className="bg-white rounded-lg border border-monday-gray-200 p-6">
            <h3 className="text-lg font-bold text-monday-gray-900 mb-4">Loan Types</h3>
            {loanTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={loanTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="type" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tickFormatter={(value) => `R${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'outstanding' ? formatCurrency(value) : value,
                      name === 'outstanding' ? 'Outstanding' : 'Count'
                    ]}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Bar dataKey="outstanding" fill="#4f46e5" name="outstanding" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-monday-gray-500 font-medium">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Risk Assessment Summary */}
        <div className="bg-white rounded-lg border border-monday-gray-200 p-6">
          <h3 className="text-lg font-bold text-monday-gray-900 mb-4">Quick Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Collection Rate */}
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-800">
                {Math.round(stats.repaymentRate)}%
              </div>
              <div className="text-sm text-green-700">Collection Rate</div>
            </div>
            
            {/* Risk Distribution */}
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-800">
                {stats.overdueCount}
              </div>
              <div className="text-sm text-yellow-700">At Risk</div>
            </div>

            {/* Portfolio Size */}
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-800">
                {clients.length}
              </div>
              <div className="text-sm text-blue-700">Total Clients</div>
            </div>

            {/* Average Loan Size */}
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-800">
                R{Math.round(stats.avgLoanAmount / 1000)}k
              </div>
              <div className="text-sm text-purple-700">Avg Loan Size</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;