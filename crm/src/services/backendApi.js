// Backend API service for Cashflow CRM
// This replaces the mock API with real backend calls

import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://cashflow-crm.onrender.com/api';

// Helper function to get auth headers
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Helper function to make API calls
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const authHeaders = await getAuthHeaders();
  const config = {
    headers: {
      ...authHeaders,
      ...options.headers
    },
    ...options
  };

  const response = await fetch(url, config);
  return handleResponse(response);
};

// Get all clients
export const getClients = async () => {
  try {
    console.log('🔍 Fetching clients from backend API...');
    const data = await apiCall('/clients');
    console.log('✅ Backend response:', data);
    const clients = Array.isArray(data) ? data : data.clients || [];
    console.log('📊 Processed clients:', clients.length);
    return clients;
  } catch (error) {
    console.error('❌ Error fetching clients:', error);
    throw error;
  }
};

// Get a single client by ID
export const getClient = async (clientId) => {
  try {
    const data = await apiCall(`/clients/${clientId}`);
    return data.client || data;
  } catch (error) {
    console.error('Error fetching client:', error);
    throw error;
  }
};

// Add a new client
export const addClient = async (clientData) => {
  try {
    console.log('🔍 Adding new client to backend:', clientData);
    const data = await apiCall('/clients', {
      method: 'POST',
      body: JSON.stringify(clientData)
    });
    console.log('✅ Backend add response:', data);
    const client = data.client || data;
    console.log('📊 Processed client:', client);
    return client;
  } catch (error) {
    console.error('❌ Error adding client:', error);
    throw error;
  }
};

// Update client status
export const updateClientStatus = async (clientId, newStatus) => {
  try {
    const data = await apiCall(`/clients/${clientId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });
    return data.client || data;
  } catch (error) {
    console.error('Error updating client status:', error);
    throw error;
  }
};

// Update client information
export const updateClient = async (clientId, updates) => {
  try {
    const data = await apiCall(`/clients/${clientId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return data.client || data;
  } catch (error) {
    console.error('Error updating client:', error);
    throw error;
  }
};

// Delete a client
export const deleteClient = async (clientId) => {
  try {
    const data = await apiCall(`/clients/${clientId}`, {
      method: 'DELETE'
    });
    return data;
  } catch (error) {
    console.error('Error deleting client:', error);
    throw error;
  }
};

// Add a payment to a client
export const addPayment = async (clientId, paymentData) => {
  try {
    const data = await apiCall(`/clients/${clientId}/payments`, {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
    return data.client || data;
  } catch (error) {
    console.error('Error adding payment:', error);
    throw error;
  }
};

// Add an additional loan to existing client
export const addLoanToClient = async (clientId, loanData) => {
  try {
    const data = await apiCall(`/clients/${clientId}/loans`, {
      method: 'POST',
      body: JSON.stringify(loanData)
    });
    return data.client || data;
  } catch (error) {
    console.error('Error adding loan to client:', error);
    throw error;
  }
};

// Get all individual loans for a client
export const getClientLoans = async (clientId) => {
  try {
    const data = await apiCall(`/clients/${clientId}/loans`);
    return data;
  } catch (error) {
    console.error('Error getting client loans:', error);
    throw error;
  }
};

// Archive a paid client
export const archiveClient = async (clientId) => {
  try {
    const data = await apiCall(`/clients/${clientId}/archive`, {
      method: 'POST'
    });
    return data.client || data;
  } catch (error) {
    console.error('Error archiving client:', error);
    throw error;
  }
};

// Unarchive a client for new loans
export const unarchiveClient = async (clientId) => {
  try {
    const data = await apiCall(`/clients/${clientId}/unarchive`, {
      method: 'POST'
    });
    return data.client || data;
  } catch (error) {
    console.error('Error unarchiving client:', error);
    throw error;
  }
};

// Health check
export const checkHealth = async () => {
  try {
    const data = await apiCall('/health');
    return data;
  } catch (error) {
    console.error('Error checking API health:', error);
    throw error;
  }
};

// Export default object with all functions
export default {
  getClients,
  getClient,
  addClient,
  updateClientStatus,
  updateClient,
  deleteClient,
  addPayment,
  addLoanToClient,
  getClientLoans,
  archiveClient,
  unarchiveClient,
  checkHealth
};