import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  DollarSign,
  Calendar,
  FileText,
  Plus,
  Edit3,
  Save,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor, getStatusText, calculateCurrentAmountDue, calculateRemainingBalance, calculatePaymentDueDate } from '../utils/loanCalculations';
import { addPayment, updateClient, addLoanToClient, getClientLoans } from '../services/backendApi';

const ClientModal = ({ client, isOpen, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedClient, setEditedClient] = useState(client || {});
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [newNote, setNewNote] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isProcessingLoan, setIsProcessingLoan] = useState(false);
  const [additionalLoanAmount, setAdditionalLoanAmount] = useState('');
  const [clientLoans, setClientLoans] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen || !client) return null;

  // Validate client data more thoroughly
  if (!client.name || !client.id) {
    console.error('ClientModal: Invalid client data', client);
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-red-600">Invalid Client Data</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-600 mb-4">
            Client data is incomplete. Please refresh and try again.
          </p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Safely calculate amounts with error handling
  const safeCalculateCurrentAmountDue = () => {
    try {
      if (!client?.loanAmount || isNaN(client.loanAmount)) {
        console.warn('Invalid loan amount:', client?.loanAmount);
        return 0;
      }
      return calculateCurrentAmountDue(client);
    } catch (error) {
      console.error('Error calculating current amount due:', error);
      return (client.loanAmount || 0) * 1.5; // Fallback to simple calculation
    }
  };

  const safeCalculateRemainingBalance = () => {
    try {
      const currentAmountDue = safeCalculateCurrentAmountDue();
      const amountPaid = client.amountPaid || 0;
      return Math.max(0, currentAmountDue - amountPaid);
    } catch (error) {
      console.error('Error calculating remaining balance:', error);
      return Math.max(0, (client.loanAmount || 0) - (client.amountPaid || 0));
    }
  };

  const currentAmountDue = safeCalculateCurrentAmountDue();
  const remainingAmount = safeCalculateRemainingBalance();

  const loadClientLoans = useCallback(async () => {
    try {
      const loans = await getClientLoans(client.id);
      setClientLoans(loans);
    } catch (error) {
      console.error('Failed to load client loans:', error);
      setClientLoans([]);
    }
  }, [client.id]);

  // Load client loans on component mount
  useEffect(() => {
    if (client?.id) {
      // Temporarily disable loan loading to debug modal
      // loadClientLoans();
      setClientLoans([]); // Set empty array for now
    }
  }, [client?.id]); // Simplified dependencies

  const handleAddLoan = async () => {
    if (!additionalLoanAmount || parseFloat(additionalLoanAmount) <= 0) return;
    
    const amount = parseFloat(additionalLoanAmount);
    
    const confirmLoan = window.confirm(
      `Add additional loan of ${formatCurrency(amount)} to ${client.name}? ` +
      `This will increase their total amount due by ${formatCurrency(amount * 1.5)} (including 50% interest).`
    );
    
    if (!confirmLoan) return;
    
    setIsProcessingLoan(true);
    try {
      const loanData = {
        amount: amount,
        loan_date: new Date().toISOString().split('T')[0],
        notes: `Additional loan of ${formatCurrency(amount)}`
      };
      
      const updatedClient = await addLoanToClient(client.id, loanData);
      onUpdate(updatedClient);
      setAdditionalLoanAmount('');
      loadClientLoans(); // Refresh loans list
      
      alert(`Additional loan of ${formatCurrency(amount)} added successfully!`);
    } catch (error) {
      console.error('Failed to add additional loan:', error);
      alert('Failed to add additional loan. Please try again.');
    } finally {
      setIsProcessingLoan(false);
    }
  };

  const paymentProgress = currentAmountDue > 0 ? Math.min(100, ((client.amountPaid || 0) / currentAmountDue) * 100) : 100;

  // Add error logging for debugging
  console.log('ClientModal - Rendering for client:', client?.name, client?.id);
  console.log('ClientModal - Current amounts:', { currentAmountDue, remainingAmount, paymentProgress });

  // Error boundary for modal content
  try {

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      await updateClient(client.id, editedClient);
      onUpdate({ ...client, ...editedClient });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update client:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) return;
    
    const amount = parseFloat(paymentAmount);
    
    // Check for overpayment
    if (amount > remainingAmount) {
      const confirmOverpayment = window.confirm(
        `Payment amount (${formatCurrency(amount)}) exceeds remaining balance (${formatCurrency(remainingAmount)}). ` +
        `Do you want to proceed with a payment of ${formatCurrency(remainingAmount)} to settle the loan?`
      );
      
      if (!confirmOverpayment) {
        return;
      }
    }
    
    setIsProcessingPayment(true);
    try {
      const paymentData = {
        amount: amount,
        payment_date: paymentDate,
        clientId: client.id
      };
      const updatedClient = await addPayment(client.id, paymentData);
      onUpdate(updatedClient);
      setPaymentAmount('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      
      // Show success message
      if (amount > remainingAmount) {
        alert(`Payment processed successfully. Loan has been settled with ${formatCurrency(Math.min(amount, remainingAmount))}.`);
      }
    } catch (error) {
      console.error('Failed to add payment:', error);
      alert('Failed to record payment. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    // In a real app, you would upload these files to a server
    console.log('Files to upload:', files);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'overdue':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'repayment-due':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'active':
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
      default:
        return <User className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-full">
                <User className="w-8 h-8" />
              </div>
              <div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedClient.name || ''}
                    onChange={(e) => setEditedClient({ ...editedClient, name: e.target.value })}
                    className="bg-white/20 border border-white/30 rounded px-3 py-1 text-xl font-bold placeholder-white/70"
                    placeholder="Client Name"
                  />
                ) : (
                  <h2 className="text-2xl font-bold">{client.name}</h2>
                )}
                <div className="flex items-center gap-2 mt-2">
                  {getStatusIcon(client.status)}
                  <span className="text-sm font-semibold opacity-90">{getStatusText(client.status)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  title="Edit Client"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                    className="px-3 py-1 bg-monday-green hover:bg-opacity-90 rounded text-sm disabled:opacity-50 font-semibold"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditedClient(client);
                    }}
                    className="px-3 py-1 bg-monday-gray-600 hover:bg-monday-gray-700 rounded text-sm font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              )}
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-120px)] overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Contact Information
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    {isEditing ? (
                      <input
                        type="email"
                        value={editedClient.email || ''}
                        onChange={(e) => setEditedClient({ ...editedClient, email: e.target.value })}
                        className="flex-1 border border-gray-300 rounded px-3 py-2"
                        placeholder="Email"
                      />
                    ) : (
                      <span className="text-gray-700">{client.email}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editedClient.phone || ''}
                        onChange={(e) => setEditedClient({ ...editedClient, phone: e.target.value })}
                        className="flex-1 border border-gray-300 rounded px-3 py-2"
                        placeholder="Phone"
                      />
                    ) : (
                      <span className="text-gray-700">{client.phone}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Loan Summary */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Loan Summary
                </h3>
                
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Loan Type:</span>
                    <span className="font-medium">{client.loanType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Principal:</span>
                    <span className="font-medium">{formatCurrency(client.loanAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Interest Rate:</span>
                    <span className="font-medium">50% (Monthly)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount Due:</span>
                    <span className="font-medium text-red-600">{formatCurrency(currentAmountDue)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(client.amountPaid)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Remaining:</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(remainingAmount)}
                    </span>
                  </div>
                </div>

                {/* Payment Progress */}
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Payment Progress</span>
                    <span>{Math.round(paymentProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(paymentProgress, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Loan Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
                  Loan Details
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Start Date</p>
                      <p className="font-medium">{formatDate(client.startDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Due Date (End of Month)</p>
                      <p className="font-medium">
                        {client.startDate ? formatDate(calculatePaymentDueDate(client.startDate)) : formatDate(client.dueDate)}
                      </p>
                    </div>
                  </div>
                  {client.lastPaymentDate && (
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Last Payment</p>
                        <p className="font-medium">{formatDate(client.lastPaymentDate)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Risk Assessment */}
              {client.riskAssessment && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
                    Risk Assessment
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Risk Level:</span>
                      <span className={`
                        px-3 py-1 rounded-full text-sm font-medium
                        ${client.riskAssessment.level === 'low' ? 'bg-green-100 text-green-800' :
                          client.riskAssessment.level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'}
                      `}>
                        {client.riskAssessment.level.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Risk Score:</span>
                      <span className="font-medium">{client.riskAssessment.score}/100</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p className="font-medium mb-2">Risk Factors:</p>
                      <ul className="space-y-1 text-xs">
                        {client.riskAssessment.factors.paymentHistory && (
                          <li>• Poor payment history</li>
                        )}
                        {client.riskAssessment.factors.paymentRecency && (
                          <li>• Recent payment delays</li>
                        )}
                        {client.riskAssessment.factors.currentStatus && (
                          <li>• Current status requires attention</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
                Notes & Comments
              </h3>
              
              {client.notes && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-gray-700">{client.notes}</p>
                </div>
              )}
              
              {/* Add New Note */}
              <div className="flex gap-3">
                <MessageSquare className="w-5 h-5 text-gray-400 mt-1" />
                <div className="flex-1">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note or comment..."
                    className="w-full border border-gray-300 rounded-lg p-3 resize-none"
                    rows="3"
                  />
                  {newNote.trim() && (
                    <button
                      onClick={() => {
                        // In a real app, save the note to the backend
                        console.log('New note:', newNote);
                        setNewNote('');
                      }}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add Note
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Documents */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
                Documents
              </h3>
              
              {/* Show existing documents */}
              {client.documents && client.documents.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {client.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-blue-600 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">{doc.name}</p>
                          <p className="text-sm text-gray-600">{Math.round(doc.size / 1024)} KB</p>
                        </div>
                      </div>
                      <button
                        onClick={() => window.open(doc.url || '#', '_blank')}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        title="View document"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 mb-4">No documents uploaded</p>
              )}
              
              {/* Upload new documents */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 mb-4">Upload additional documents</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  Upload Files
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar - Payment Actions */}
          <div className="w-80 border-l border-gray-200 p-6 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
              Quick Actions
            </h3>
            
            {/* Add Payment */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Record Payment</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">R</span>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <button
                  onClick={handleAddPayment}
                  disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || isProcessingPayment}
                  className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessingPayment ? 'Processing...' : 'Record Payment'}
                </button>
              </div>
            </div>

            {/* Additional Loan Section */}
            <div className="mb-6 border-t pt-6">
              <h4 className="font-medium text-gray-900 mb-3">Add Additional Loan</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Loan Amount
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={additionalLoanAmount}
                      onChange={(e) => setAdditionalLoanAmount(e.target.value)}
                      placeholder="0.00"
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                      disabled={isProcessingLoan}
                    />
                    <button
                      onClick={handleAddLoan}
                      disabled={!additionalLoanAmount || parseFloat(additionalLoanAmount) <= 0 || isProcessingLoan}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                      {isProcessingLoan ? 'Adding...' : 'Add Loan'}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    This will add {additionalLoanAmount ? formatCurrency(parseFloat(additionalLoanAmount) * 1.5) : formatCurrency(0)} to total amount due (including 50% interest)
                  </p>
                </div>

                {/* Loan History */}
                {clientLoans.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Loan History</h5>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {clientLoans.map((loan, index) => (
                        <div key={loan.id || index} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                          <span>{formatCurrency(loan.loan_amount)}</span>
                          <span className="text-gray-500">{formatDate(loan.loan_date)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Payment Amounts */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Quick Amounts</h4>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => setPaymentAmount(remainingAmount.toFixed(2))}
                  className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                >
                  Pay Off ({formatCurrency(remainingAmount)})
                </button>
              </div>
            </div>

            {/* Payment Information */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Payment Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 bg-white rounded border">
                  <span className="text-gray-600">Payment Term:</span>
                  <span className="font-medium">1 Month (End of Month)</span>
                </div>
                <div className="flex justify-between p-2 bg-white rounded border">
                  <span className="text-gray-600">Interest Applied:</span>
                  <span className="font-medium">50% Monthly</span>
                </div>
                <div className="flex justify-between p-2 bg-white rounded border">
                  <span className="text-gray-600">Payment Status:</span>
                  <span className="font-medium">
                    {remainingAmount <= 0 ? 'Paid in Full' : `${formatCurrency(remainingAmount)} Outstanding`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  } catch (error) {
    console.error('ClientModal rendering error:', error);
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-red-600">Error Loading Client Details</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-600 mb-4">
            There was an error loading the client details. Please try again.
          </p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }
};

export default ClientModal;