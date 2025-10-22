import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar, 
  BarChart3,
  PieChart,
  Target,
  Trophy,
  ArrowUp,
  ArrowDown,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/loanCalculations';

const StatsBoard = ({ clients, onRefresh }) => {
  const [statsData, setStatsData] = useState(null);
  const [timeframe, setTimeframe] = useState('3months');
  const [isLoading, setIsLoading] = useState(false);
  const [topClients, setTopClients] = useState([]);

  useEffect(() => {
    calculateStats();
  }, [clients, timeframe]);

  const calculateStats = () => {
    if (!clients || clients.length === 0) return;

    setIsLoading(true);
    
    // Calculate timeframe dates
    const now = new Date();
    const timeframes = {
      '1month': new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()),
      '3months': new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()),
      '6months': new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()),
      '1year': new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
      'all': new Date(2020, 0, 1)
    };

    const fromDate = timeframes[timeframe] || timeframes['3months'];

    // Calculate client statistics
    const clientStats = clients.map(client => {
      const loanAmount = parseFloat(client.loanAmount || client.loan_amount || 0);
      const amountPaid = parseFloat(client.amountPaid || client.amount_paid || 0);
      const createdAt = new Date(client.createdAt || client.created_at || new Date());
      
      // Calculate total loans (assuming this client could have multiple loans)
      const totalLoaned = loanAmount;
      const totalRepaid = amountPaid;
      const totalSpent = amountPaid; // Interest they've paid
      const currentLoan = Math.max(0, (loanAmount * 1.5) - amountPaid); // With 50% interest
      
      // Activity in timeframe
      const isInTimeframe = createdAt >= fromDate;
      const recentActivity = isInTimeframe ? totalLoaned : 0;
      
      return {
        ...client,
        id: client.id || client.client_uuid,
        name: `${client.firstName || client.first_name || ''} ${client.lastName || client.last_name || ''}`.trim(),
        totalLoaned,
        totalRepaid,
        totalSpent,
        currentLoan,
        recentActivity,
        profitability: totalRepaid - totalLoaned, // Net profit from this client
        loyaltyScore: totalRepaid + (totalLoaned * 0.1), // Custom loyalty metric
        riskScore: currentLoan > 0 ? (currentLoan / totalLoaned) : 0,
        lastActivity: createdAt
      };
    });

    // Sort by total spent (interest paid) to find most profitable clients
    const topClientsBySpent = [...clientStats]
      .sort((a, b) => b.totalRepaid - a.totalRepaid)
      .slice(0, 20);

    // Calculate overall stats
    const totalLoanAmount = clientStats.reduce((sum, client) => sum + client.totalLoaned, 0);
    const totalRepaid = clientStats.reduce((sum, client) => sum + client.totalRepaid, 0);
    const totalProfit = totalRepaid - totalLoanAmount;
    const averageLoan = totalLoanAmount / clientStats.length;
    const repaymentRate = totalLoanAmount > 0 ? (totalRepaid / (totalLoanAmount * 1.5)) * 100 : 0;

    // Recent activity stats
    const recentClients = clientStats.filter(client => client.recentActivity > 0);
    const recentLoanAmount = recentClients.reduce((sum, client) => sum + client.recentActivity, 0);

    const stats = {
      overview: {
        totalClients: clientStats.length,
        totalLoanAmount,
        totalRepaid,
        totalProfit,
        averageLoan,
        repaymentRate,
        activeLoans: clientStats.filter(client => client.currentLoan > 0).length,
        paidOffLoans: clientStats.filter(client => client.status === 'paid').length
      },
      timeframeStats: {
        newClients: recentClients.length,
        newLoanAmount: recentLoanAmount,
        periodName: timeframe
      },
      trends: {
        growthRate: recentLoanAmount > 0 ? ((recentLoanAmount / totalLoanAmount) * 100) : 0,
        clientGrowth: (recentClients.length / clientStats.length) * 100,
      }
    };

    setStatsData(stats);
    setTopClients(topClientsBySpent);
    setIsLoading(false);
  };

  const getTimeframeName = (tf) => {
    const names = {
      '1month': 'Last Month',
      '3months': 'Last 3 Months', 
      '6months': 'Last 6 Months',
      '1year': 'Last Year',
      'all': 'All Time'
    };
    return names[tf] || 'Last 3 Months';
  };

  const exportStats = () => {
    const csvData = [
      ['Rank', 'Client Name', 'Email', 'Phone', 'Total Loaned', 'Total Repaid', 'Current Loan', 'Profit', 'Status'].join(','),
      ...topClients.map((client, index) => [
        index + 1,
        `"${client.name}"`,
        `"${client.email || ''}"`,
        `"${client.phone || ''}"`,
        client.totalLoaned,
        client.totalRepaid,
        client.currentLoan,
        client.profitability,
        `"${client.status}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `client-stats-${timeframe}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!statsData) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics & Stats</h1>
            <p className="text-gray-600">Client performance and loan analytics</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="1month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
            <option value="all">All Time</option>
          </select>
          <button
            onClick={onRefresh}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={exportStats}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">{statsData.overview.totalClients}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-green-600 flex items-center">
              <ArrowUp className="w-3 h-3 mr-1" />
              {statsData.timeframeStats.newClients} new
            </span>
            <span className="text-gray-500 ml-2">this period</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Loaned</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(statsData.overview.totalLoanAmount)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-green-600 flex items-center">
              <ArrowUp className="w-3 h-3 mr-1" />
              {formatCurrency(statsData.timeframeStats.newLoanAmount)}
            </span>
            <span className="text-gray-500 ml-2">this period</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Repaid</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(statsData.overview.totalRepaid)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-gray-600">
              {statsData.overview.repaymentRate.toFixed(1)}% repayment rate
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Net Profit</p>
              <p className={`text-2xl font-bold ${statsData.overview.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(statsData.overview.totalProfit)}
              </p>
            </div>
            <Target className="w-8 h-8 text-orange-600" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-gray-600">
              {statsData.overview.averageLoan > 0 ? formatCurrency(statsData.overview.averageLoan) : 'R0'} avg loan
            </span>
          </div>
        </div>
      </div>

      {/* Top 20 Clients Table */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              <h2 className="text-lg font-semibold text-gray-900">Top 20 Clients by Total Repaid</h2>
            </div>
            <p className="text-sm text-gray-500">
              Ranked by total amount repaid • {getTimeframeName(timeframe)}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Loaned</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Repaid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Loan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit Generated</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topClients.map((client, index) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        index < 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </span>
                      {index < 3 && <Trophy className="w-4 h-4 text-yellow-500 ml-1" />}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-semibold text-xs">
                          {client.name.split(' ').map(n => n.charAt(0)).join('').slice(0,2).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{client.name}</div>
                        <div className="text-sm text-gray-500">{client.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(client.totalLoaned)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-green-600">{formatCurrency(client.totalRepaid)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${client.currentLoan > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                      {client.currentLoan > 0 ? formatCurrency(client.currentLoan) : 'Paid Off'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${client.profitability >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(client.profitability)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      client.status === 'paid' ? 'bg-green-100 text-green-800' :
                      client.status === 'active' ? 'bg-blue-100 text-blue-800' :
                      client.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(client.lastActivity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {topClients.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No client data available</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add some clients and transactions to see analytics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsBoard;