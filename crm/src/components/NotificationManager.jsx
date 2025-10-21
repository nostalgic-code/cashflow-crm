import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Send, 
  Calendar, 
  Users, 
  DollarSign, 
  Play, 
  Square, 
  TestTube,
  CheckCircle,
  AlertCircle,
  Clock,
  Mail
} from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { formatCurrency } from '../utils/loanCalculations';

const NotificationManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentsDue, setPaymentsDue] = useState(null);
  const [schedulerStatus, setSchedulerStatus] = useState('unknown');
  const [lastChecked, setLastChecked] = useState(null);

  // Check payments due on component mount
  useEffect(() => {
    checkPaymentsDue();
  }, []);

  const checkPaymentsDue = async () => {
    setIsLoading(true);
    try {
      const result = await notificationService.checkPaymentsDue();
      setPaymentsDue(result);
      setLastChecked(new Date());
    } catch (error) {
      console.error('Failed to check payments due:', error);
      alert('❌ Failed to check payments due');
    } finally {
      setIsLoading(false);
    }
  };

  const testNotification = async () => {
    setIsLoading(true);
    try {
      const result = await notificationService.testNotification();
      alert(`✅ Test notification sent to ${result.email}`);
    } catch (error) {
      console.error('Test notification failed:', error);
      alert('❌ Test notification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const sendNotifications = async () => {
    setIsLoading(true);
    try {
      const result = await notificationService.sendPaymentDueNotifications();
      alert(`✅ Notifications sent to info@cashflowloans.co.za\n📊 ${result.clients_notified} clients notified\n💰 Total: ${formatCurrency(result.total_amount_due)}`);
    } catch (error) {
      console.error('Send notifications failed:', error);
      alert('❌ Failed to send notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const startScheduler = async () => {
    setIsLoading(true);
    try {
      const result = await notificationService.startScheduler();
      setSchedulerStatus('running');
      alert(`✅ Notification scheduler started\n📅 ${result.schedule}\n🎯 ${result.trigger}`);
    } catch (error) {
      console.error('Start scheduler failed:', error);
      alert('❌ Failed to start scheduler');
    } finally {
      setIsLoading(false);
    }
  };

  const stopScheduler = async () => {
    setIsLoading(true);
    try {
      await notificationService.stopScheduler();
      setSchedulerStatus('stopped');
      alert('🛑 Notification scheduler stopped');
    } catch (error) {
      console.error('Stop scheduler failed:', error);
      alert('❌ Failed to stop scheduler');
    } finally {
      setIsLoading(false);
    }
  };

  const isMonthEndSoon = () => {
    return notificationService.isTomorrowMonthEnd();
  };

  const getNextMonthEnd = () => {
    return notificationService.getNextMonthEnd().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Bell className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Manager</h1>
          <p className="text-gray-600">Manage email notifications for payment due dates</p>
        </div>
      </div>

      {/* Email Config Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">Email Configuration</h3>
            <p className="text-blue-700 text-sm">
              Notifications will be sent to: <strong>info@cashflowloans.co.za</strong>
            </p>
            <p className="text-blue-700 text-sm">
              Schedule: Daily at 9:00 AM and 5:00 PM (day before month-end)
            </p>
          </div>
        </div>
      </div>

      {/* Month-End Status */}
      <div className={`border rounded-lg p-4 ${isMonthEndSoon() ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
        <div className="flex items-start space-x-3">
          <Calendar className={`w-5 h-5 mt-0.5 ${isMonthEndSoon() ? 'text-yellow-600' : 'text-green-600'}`} />
          <div>
            <h3 className={`font-semibold ${isMonthEndSoon() ? 'text-yellow-900' : 'text-green-900'}`}>
              {isMonthEndSoon() ? '⚠️ Month-End Alert' : '📅 Month-End Status'}
            </h3>
            <p className={`text-sm ${isMonthEndSoon() ? 'text-yellow-700' : 'text-green-700'}`}>
              Next month-end: <strong>{getNextMonthEnd()}</strong>
            </p>
            {isMonthEndSoon() && (
              <p className="text-yellow-700 text-sm font-medium">
                Tomorrow is month-end! Notifications will be sent automatically.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Current Payments Due */}
      {paymentsDue && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Current Payments Due</h2>
            <button
              onClick={checkPaymentsDue}
              disabled={isLoading}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-blue-600">Clients Due</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{paymentsDue.count}</p>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-red-600" />
                <span className="text-sm text-red-600">Total Amount</span>
              </div>
              <p className="text-2xl font-bold text-red-900">
                {formatCurrency(paymentsDue.total_amount_due)}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-600">Last Checked</span>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {lastChecked ? lastChecked.toLocaleTimeString() : 'Never'}
              </p>
            </div>
          </div>

          {paymentsDue.clients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium text-gray-900">Client</th>
                    <th className="text-left py-2 font-medium text-gray-900">Amount Due</th>
                    <th className="text-left py-2 font-medium text-gray-900">Status</th>
                    <th className="text-left py-2 font-medium text-gray-900">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsDue.clients.slice(0, 5).map((client, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2 font-medium">{client.name}</td>
                      <td className="py-2 text-red-600 font-semibold">
                        {formatCurrency(client.current_amount_due)}
                      </td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          client.status === 'overdue' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {client.status}
                        </span>
                      </td>
                      <td className="py-2 text-gray-600">{client.phone || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {paymentsDue.clients.length > 5 && (
                <p className="text-sm text-gray-500 mt-2">
                  And {paymentsDue.clients.length - 5} more clients...
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <p>No payments are due at this time</p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={testNotification}
          disabled={isLoading}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <TestTube className="w-5 h-5" />
          <span>Test Email</span>
        </button>

        <button
          onClick={sendNotifications}
          disabled={isLoading || !paymentsDue?.count}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-5 h-5" />
          <span>Send Now</span>
        </button>

        <button
          onClick={startScheduler}
          disabled={isLoading || schedulerStatus === 'running'}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Play className="w-5 h-5" />
          <span>Start Scheduler</span>
        </button>

        <button
          onClick={stopScheduler}
          disabled={isLoading || schedulerStatus === 'stopped'}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Square className="w-5 h-5" />
          <span>Stop Scheduler</span>
        </button>
      </div>

      {/* Scheduler Status */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${
            schedulerStatus === 'running' ? 'bg-green-500' : 
            schedulerStatus === 'stopped' ? 'bg-red-500' : 'bg-gray-400'
          }`}></div>
          <div>
            <h3 className="font-semibold text-gray-900">Scheduler Status</h3>
            <p className="text-sm text-gray-600">
              {schedulerStatus === 'running' ? 'Active - Monitoring for month-end notifications' :
               schedulerStatus === 'stopped' ? 'Stopped - No automatic notifications' :
               'Unknown - Click Start Scheduler to begin monitoring'}
            </p>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationManager;