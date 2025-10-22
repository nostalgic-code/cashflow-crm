import React, { useState, useEffect } from 'react';
import { X, Upload, File } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// Calculate end of current month for due date
const getEndOfCurrentMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDay = new Date(year, month + 1, 0);
  return lastDay.toISOString();
};

const NewClientModal = ({ isOpen, onClose, onAddClient }) => {
  const [formData, setFormData] = useState({
    idNumber: '',
    name: '',
    surname: '',
    email: '',
    phone: '',
    amount: '',
    loanType: 'Secured Loan',
    dueDate: '' // Custom due date when client gets paid - will be set on modal open
  });
  
  const [errors, setErrors] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const loanTypes = [
    'Secured Loan',
    'Unsecured Loan'
  ];

  // Set default due date when modal opens (end of current month)
  useEffect(() => {
    if (isOpen && !formData.dueDate) {
      const defaultDueDate = getEndOfCurrentMonth();
      const dueDateOnly = defaultDueDate.split('T')[0]; // Get YYYY-MM-DD format
      setFormData(prev => ({
        ...prev,
        dueDate: dueDateOnly
      }));
    }
  }, [isOpen, formData.dueDate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map(file => ({
      id: uuidv4(),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.idNumber.trim()) {
      newErrors.idNumber = 'ID Number is required';
    } else if (!/^\d{13}$/.test(formData.idNumber.replace(/\s/g, ''))) {
      newErrors.idNumber = 'ID Number must be 13 digits';
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.surname.trim()) {
      newErrors.surname = 'Surname is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[+]?[\d\s()-]{10,}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid loan amount';
    }
    
    if (!formData.dueDate.trim()) {
      newErrors.dueDate = 'Payment due date is required';
    } else {
      const selectedDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to compare only dates
      
      if (selectedDate < today) {
        newErrors.dueDate = 'Due date cannot be in the past';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const loanAmount = parseFloat(formData.amount);
    const totalAmountDue = loanAmount * 1.5; // 50% interest
    
    // Set start date to today and use custom due date from form
    const today = new Date();
    const startDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    const dueDate = new Date(formData.dueDate).toISOString(); // Use custom due date
    
    // Sanitize uploaded files: strip the actual File object to avoid sending non-serializable data
    const sanitizedFiles = uploadedFiles.map(f => ({
      id: f.id,
      name: f.name,
      size: f.size,
      type: f.type
    }));

    const newClient = {
      id: uuidv4(),
      name: `${formData.name} ${formData.surname}`,
      email: formData.email,
      phone: formData.phone,
      idNumber: formData.idNumber,
      loanType: formData.loanType,
      loanAmount: loanAmount,
      interestRate: 50.0, // 50% monthly interest
      startDate: startDate,
      dueDate: dueDate,
      monthlyPayment: totalAmountDue, // This is actually total amount due, kept for compatibility
      amountPaid: 0,
      status: 'new-lead',
      applicationDate: new Date().toISOString(),
      lastStatusUpdate: new Date().toISOString(),
      documents: sanitizedFiles, // Include uploaded documents metadata only
      paymentHistory: [],
      notes: []
    };

    onAddClient(newClient);
    
    // Reset form
    setFormData({
      idNumber: '',
      name: '',
      surname: '',
      email: '',
      phone: '',
      amount: '',
      loanType: 'Secured Loan'
    });
    setErrors({});
    setUploadedFiles([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">New Client Application</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Information Row */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ID Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Number *
                </label>
                <input
                  type="text"
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleInputChange}
                  placeholder="1234567890123"
                  maxLength="13"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.idNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.idNumber && (
                  <p className="text-red-500 text-xs mt-1">{errors.idNumber}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john.smith@email.com"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+27 123 456 7890"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                )}
              </div>

              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>

              {/* Surname */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Surname *
                </label>
                <input
                  type="text"
                  name="surname"
                  value={formData.surname}
                  onChange={handleInputChange}
                  placeholder="Smith"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.surname ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.surname && (
                  <p className="text-red-500 text-xs mt-1">{errors.surname}</p>
                )}
              </div>
            </div>
          </div>

          {/* Loan Information Row */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Loan Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Loan Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loan Amount (Rand) *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="3000"
                  min="100"
                  step="100"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.amount && (
                  <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
                )}
                {formData.amount && parseFloat(formData.amount) > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    Total amount due: <span className="font-semibold text-red-600">
                      R{(parseFloat(formData.amount) * 1.5).toLocaleString()}
                    </span> (50% interest)
                  </p>
                )}
              </div>

              {/* Loan Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type of Loan *
                </label>
                <select
                  name="loanType"
                  value={formData.loanType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {loanTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Payment Due Date */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Due Date *
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]} // Today or later
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.dueDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.dueDate && (
                <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>
              )}
              <p className="text-sm text-gray-600 mt-1">
                Select the date when this client gets paid and should repay the loan. 
                A notification will be sent one day before this date.
              </p>
            </div>
          </div>

          {/* Document Upload Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Upload documents
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      ID document, proof of income, bank statements (PDF, JPG, PNG)
                    </span>
                  </label>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="sr-only"
                    onChange={handleFileUpload}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  or drag and drop files here
                </p>
              </div>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Uploaded Files</h4>
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <File className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(file.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Create Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewClientModal;