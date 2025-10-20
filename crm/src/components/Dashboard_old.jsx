import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Activity,
  Calendar
} from 'lucide-react';
import { getAnalyticsData } from '../services/api';
import { formatCurrency } from '../utils/loanCalculations';

const Dashboard = ({ clients = [] }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('6months');

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const data = await getAnalyticsData(clients);
        setAnalyticsData(data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch analytics when clients array changes and has data
    if (clients.length > 0) {
      fetchAnalytics();
    } else {
      setLoading(false);
      setAnalyticsData({
        totalLoaned: 0,
        totalCollected: 0,
        overduePercentage: 0,
        monthlyData: [],
        loanTypeData: [],
        repaymentRate: 0
      });
    }
  }, [clients]);

  // Memoize stats calculation to prevent unnecessary recalculations
  const stats = React.useMemo(() => {
    if (!clients.length) {
      return {
        totalLoaned: 0,
        totalCollected: 0,
        activeLoans: 0,
        overdueCount: 0,
        avgLoanAmount: 0,
        repaymentRate: 0
      };
    }

    const totalLoaned = clients.reduce((sum, client) => sum + client.loanAmount, 0);
    const totalCollected = clients.reduce((sum, client) => sum + client.amountPaid, 0);
    const activeLoans = clients.filter(client => 
      ['active', 'repayment-due', 'overdue'].includes(client.status)
    ).length;
    const overdueCount = clients.filter(client => client.status === 'overdue').length;
    const avgLoanAmount = totalLoaned / clients.length;
    const repaymentRate = totalLoaned > 0 ? (totalCollected / totalLoaned) * 100 : 0;

    return {
      totalLoaned,
      totalCollected,
      activeLoans,
      overdueCount,
      avgLoanAmount,
      repaymentRate
    };
  }, [clients]);

  // Memoize chart data to prevent recalculations
  const statusData = React.useMemo(() => [
    { name: 'New Leads', value: clients.filter(c => c.status === 'new-lead').length, color: '#2684FF' },
    { name: 'Active', value: clients.filter(c => c.status === 'active').length, color: '#0052CC' },
    { name: 'Due', value: clients.filter(c => c.status === 'repayment-due').length, color: '#FFAB00' },
    { name: 'Paid', value: clients.filter(c => c.status === 'paid').length, color: '#36B37E' },
    { name: 'Overdue', value: clients.filter(c => c.status === 'overdue').length, color: '#FF5630' },
  ], [clients]);

  const loanTypeData = React.useMemo(() => {
    return clients.reduce((acc, client) => {
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
  }, [clients]);

  const monthlyTrend = analyticsData?.monthlyData || [];

  if (loading) {
    return (
      <div className="h-full bg-gray-50 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-gray-200 rounded-lg"></div>
            <div className="h-80 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, trend, color = 'blue' }) => {
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
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {trend && (
              <div className="flex items-center mt-2 text-sm">
                {trend > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                )}
                <span className={trend > 0 ? 'text-green-600' : 'text-red-600'}>
                  {Math.abs(trend)}%
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full bg-white shadow-sm`}>
            <Icon className="w-6 h-6 text-gray-600" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
            <p className="text-gray-600 mt-1">Overview of your loan portfolio performance</p>
          </div>
          
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="30days">Last 30 Days</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Loaned"
            value={formatCurrency(stats.totalLoaned)}
            icon={DollarSign}
            trend={12}
            color="blue"
          />
          <StatCard
            title="Total Collected"
            value={formatCurrency(stats.totalCollected)}
            icon={CheckCircle}
            trend={8}
            color="green"
          />
          <StatCard
            title="Active Loans"
            value={stats.activeLoans}
            icon={Activity}
            color="purple"
          />
          <StatCard
            title="Overdue Loans"
            value={stats.overdueCount}
            icon={AlertTriangle}
            trend={-5}
            color="red"
          />
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Repayment Rate"
            value={`${Math.round(stats.repaymentRate)}%`}
            icon={Target}
            trend={3}
            color="green"
          />
          <StatCard
            title="Avg Loan Amount"
            value={formatCurrency(stats.avgLoanAmount)}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Portfolio Value"
            value={formatCurrency(stats.totalLoaned - stats.totalCollected)}
            icon={TrendingUp}
            color="purple"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trend */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), '']}
                  labelStyle={{ color: '#374151' }}
                />
                <Area
                  type="monotone"
                  dataKey="loaned"
                  stackId="1"
                  stroke="#0052CC"
                  fill="#0052CC"
                  fillOpacity={0.8}
                  name="Loaned"
                />
                <Area
                  type="monotone"
                  dataKey="collected"
                  stackId="2"
                  stroke="#36B37E"
                  fill="#36B37E"
                  fillOpacity={0.8}
                  name="Collected"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Loan Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {statusData.map((entry) => (
                <div key={entry.name} className="flex items-center text-sm">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-gray-600">
                    {entry.name}: {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Loan Types Analysis */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Loan Types Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={loanTypeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'amount' ? formatCurrency(value) : value,
                  name === 'amount' ? 'Amount' : 'Count'
                ]}
                labelStyle={{ color: '#374151' }}
              />
              <Bar dataKey="amount" fill="#0052CC" name="amount" />
              <Bar dataKey="count" fill="#36B37E" name="count" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Assessment Summary */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['low', 'medium', 'high'].map((risk) => {
              const riskClients = clients.filter(client => 
                client.riskAssessment?.level === risk
              );
              const riskColors = {
                low: 'border-green-200 bg-green-50 text-green-800',
                medium: 'border-yellow-200 bg-yellow-50 text-yellow-800',
                high: 'border-red-200 bg-red-50 text-red-800'
              };
              
              return (
                <div key={risk} className={`rounded-lg border p-4 ${riskColors[risk]}`}>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {riskClients.length}
                    </div>
                    <div className="text-sm font-medium capitalize">
                      {risk} Risk
                    </div>
                    <div className="text-xs mt-1">
                      {formatCurrency(riskClients.reduce((sum, client) => 
                        sum + (client.loanAmount - client.amountPaid), 0
                      ))} outstanding
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;