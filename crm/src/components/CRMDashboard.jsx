import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Plus, 
  Bell, 
  Settings, 
  Menu,
  X,
  LogOut,
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import KanbanBoard from './KanbanBoard';
import Dashboard from './Dashboard';
import ClientModal from './ClientModal';
import NewClientModal from './NewClientModal';
import NotificationManager from './NotificationManager';
import ClientsTable from './ClientsTable';
import StatsBoard from './StatsBoard';
import { useAuth } from '../contexts/AuthContext';
import { getClients, addClient, updateClient, deleteClient, updateClientStatus, archiveClient } from '../services/backendApi';
import { automationService } from '../services/simpleAutomation';
import { calculateRemainingBalance } from '../utils/loanCalculations';

function CRMDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('kanban');
  const [selectedClient, setSelectedClient] = useState(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);

  // Load clients on app start
  useEffect(() => {
    const loadClients = async () => {
      setLoading(true);
      try {
        console.log('🔄 Loading clients from backend...');
        const clientData = await getClients();
        console.log('📦 Received client data:', clientData);
        
        // Run automation to set up initial risk assessments and status updates
        const automationResult = automationService.runAutomation(clientData);
        console.log('⚡ Automation result:', automationResult);
        
        setClients(automationResult.clients);
        setNotifications(automationResult.notifications);
      } catch (error) {
        console.error('Failed to load clients:', error);
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []);

  const handleClientClick = (client) => {
    setSelectedClient(client);
    setIsClientModalOpen(true);
  };

  const handleClientUpdate = (updatedClient, action) => {
    if (action === 'delete') {
      // Remove the client from the list
      setClients(prev => prev.filter(client => client.id !== selectedClient.id));
      setSelectedClient(null);
    } else {
      // Update the client in the list
      setClients(prev => 
        prev.map(client => 
          client.id === updatedClient.id ? updatedClient : client
        )
      );
      setSelectedClient(updatedClient);
    }
  };

  const handleClientsUpdate = React.useCallback((updatedClients) => {
    // Only update if clients actually changed
    setClients(prevClients => {
      // Quick check if arrays are different
      if (prevClients.length !== updatedClients.length) {
        return updatedClients;
      }
      
      // Check if any client has actually changed
      const hasChanges = updatedClients.some((client, index) => {
        const prevClient = prevClients[index];
        return !prevClient || 
               client.status !== prevClient.status || 
               client.amountPaid !== prevClient.amountPaid ||
               client.loanAmount !== prevClient.loanAmount;
      });
      
      return hasChanges ? updatedClients : prevClients;
    });
  }, []);

  const handleAddNewClient = () => {
    setIsNewClientModalOpen(true);
  };

  const handleAddClient = async (newClient) => {
    try {
      const client = await addClient(newClient);
      setClients(prev => [...prev, client]);
      setIsNewClientModalOpen(false);
    } catch (error) {
      console.error('Failed to add client:', error);
      // Could add a toast notification here
    }
  };

  const handleDeleteClient = async (clientId) => {
    // Find the client to get their status and name for confirmation
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const isPaidClient = client.status === 'paid';
    const confirmMessage = isPaidClient 
      ? `Are you sure you want to archive ${client.name}? This will hide them from the CRM view but preserve their payment history for records.`
      : `Are you sure you want to delete ${client.name}? This action cannot be undone.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      if (isPaidClient) {
        // Archive paid clients (preserves data, just hides from view)
        await archiveClient(clientId);
      } else {
        // Delete new leads and other statuses completely
        await deleteClient(clientId);
      }
      
      // Remove from UI in both cases
      setClients(prev => prev.filter(client => client.id !== clientId));
      
      // Show success message
      const successMessage = isPaidClient 
        ? `${client.name} has been archived and hidden from view. Their payment history is preserved.`
        : `${client.name} has been deleted.`;
      alert(successMessage);
      
    } catch (error) {
      console.error('Failed to process client:', error);
      const errorMessage = isPaidClient 
        ? 'Failed to archive client. Please try again.'
        : 'Failed to delete client. Please try again.';
      alert(errorMessage);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { id: 'kanban', label: 'Pipeline', icon: Users },
    { id: 'clients', label: 'All Clients', icon: Users },
    { id: 'stats', label: 'Analytics', icon: BarChart3 },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Cashflow CRM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <div className={`
        bg-white border-r border-gray-200 transition-all duration-300 flex flex-col
        ${isSidebarOpen ? 'w-64' : 'w-16'} 
        ${isSidebarOpen ? 'md:w-64' : 'md:w-16'}
        fixed md:relative z-30 h-full
        ${isSidebarOpen ? 'block' : 'hidden md:flex'}
      `}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {isSidebarOpen && (
              <div>
                <h1 className="text-xl font-bold text-monday-gray-900">Cashflow CRM</h1>
                <p className="text-sm text-monday-gray-600 font-medium">Loan Management</p>
              </div>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left
                    ${activeTab === item.id 
                      ? 'bg-monday-blue bg-opacity-10 text-monday-blue border border-monday-blue border-opacity-20 font-semibold' 
                      : 'text-monday-gray-700 hover:bg-monday-gray-100 font-medium'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {isSidebarOpen && <span className="font-medium">{item.label}</span>}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200">
          {/* Add New Client Button */}
          <button
            onClick={handleAddNewClient}
            className={`
              w-full flex items-center gap-3 px-3 py-2 bg-blue-600 text-white rounded-lg
              hover:bg-blue-700 transition-all duration-200 mb-3 shadow-sm font-semibold
              ${!isSidebarOpen ? 'justify-center' : ''}
            `}
          >
            <Plus className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span className="font-semibold">New Client</span>}
          </button>

          {/* Notifications */}
          <button
            className={`
              w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg
              transition-colors relative
              ${!isSidebarOpen ? 'justify-center' : ''}
            `}
          >
            <Bell className="w-5 h-5 flex-shrink-0" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {notifications.length}
              </span>
            )}
            {isSidebarOpen && <span className="font-medium">Notifications</span>}
          </button>

          {/* Settings */}
          <button
            className={`
              w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg
              transition-colors mt-2
              ${!isSidebarOpen ? 'justify-center' : ''}
            `}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span className="font-medium">Settings</span>}
          </button>

          {/* User Profile & Logout */}
          {isSidebarOpen && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="px-3 py-2 mb-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Account</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{user?.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-monday-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-monday-gray-900">
                {activeTab === 'kanban' ? 'Client Pipeline' : 
                 activeTab === 'clients' ? 'Clients Database' :
                 activeTab === 'stats' ? 'Client Analytics' :
                 activeTab === 'notifications' ? 'Email Notifications' : 'Analytics Dashboard'}
              </h2>
              <p className="text-sm text-monday-gray-600 mt-1 font-medium">
                {activeTab === 'kanban' 
                  ? `Managing ${clients.length} clients across different loan stages`
                  : activeTab === 'clients'
                  ? 'Complete client database with search, filtering, and export capabilities'
                  : activeTab === 'stats'
                  ? 'Top 20 client analytics and business intelligence for targeting decisions'
                  : activeTab === 'notifications'
                  ? 'Manage payment due notifications and email alerts'
                  : 'Overview of your loan portfolio performance and metrics'
                }
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Quick Stats */}
              <div className="hidden md:flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className="font-bold text-monday-purple">
                    {clients.filter(c => c.status === 'active').length}
                  </div>
                  <div className="text-monday-gray-600 font-medium">Active</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-monday-red">
                    {clients.filter(c => c.status === 'overdue').length}
                  </div>
                  <div className="text-monday-gray-600 font-medium">Overdue</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-monday-blue">
                    R{Math.round(clients.reduce((sum, c) => sum + calculateRemainingBalance(c.loanAmount, c.amountPaid), 0) / 1000)}k
                  </div>
                  <div className="text-monday-gray-600 font-medium">Outstanding</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'kanban' ? (
            <KanbanBoard
              clients={clients}
              onClientsUpdate={handleClientsUpdate}
              onClientClick={handleClientClick}
              onAddClient={handleAddNewClient}
              onDeleteClient={handleDeleteClient}
            />
          ) : activeTab === 'clients' ? (
            <ClientsTable 
              clients={clients}
              onClientClick={handleClientClick}
            />
          ) : activeTab === 'stats' ? (
            <StatsBoard 
              clients={clients}
            />
          ) : activeTab === 'notifications' ? (
            <NotificationManager />
          ) : (
            <Dashboard clients={clients} />
          )}
        </div>
      </div>

      {/* Client Modal */}
      <ClientModal
        client={selectedClient}
        isOpen={isClientModalOpen}
        onClose={() => {
          setIsClientModalOpen(false);
          setSelectedClient(null);
        }}
        onUpdate={handleClientUpdate}
      />

      {/* New Client Modal */}
      <NewClientModal
        isOpen={isNewClientModalOpen}
        onClose={() => setIsNewClientModalOpen(false)}
        onAddClient={handleAddClient}
      />
    </div>
  );
}

export default CRMDashboard;