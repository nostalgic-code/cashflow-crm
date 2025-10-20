import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  User, 
  DollarSign, 
  Calendar, 
  Phone, 
  Mail, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor, getStatusText } from '../utils/loanCalculations';

const ClientCard = React.memo(({ client, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: client.id });

  const style = React.useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition,
  }), [transform, transition]);

  const remainingAmount = React.useMemo(() => 
    client.loanAmount - client.amountPaid, 
    [client.loanAmount, client.amountPaid]
  );
  
  const paymentProgress = React.useMemo(() => 
    (client.amountPaid / client.loanAmount) * 100, 
    [client.amountPaid, client.loanAmount]
  );
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4" />;
      case 'repayment-due':
        return <Clock className="w-4 h-4" />;
      case 'active':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRiskBadge = (riskAssessment) => {
    if (!riskAssessment) return null;
    
    const { level } = riskAssessment;
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[level]}`}>
        Risk: {level.toUpperCase()}
      </span>
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`
        bg-white rounded-lg shadow-md p-4 mb-3 border border-gray-200 
        cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-gray-300
        ${isDragging ? 'shadow-xl border-purple-400 rotate-3 z-50' : ''}
      `}
    >
      {/* Client Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm mb-1">
            {client.name}
          </h3>
          <p className="text-xs text-gray-500">{client.loanType}</p>
        </div>
        
        {/* Status Badge */}
        <div className={`
          flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white
          ${getStatusColor(client.status)}
        `}>
          {getStatusIcon(client.status)}
          <span className="hidden sm:inline">{getStatusText(client.status)}</span>
        </div>
      </div>

      {/* Loan Amount */}
      <div className="flex items-center gap-2 mb-2">
        <DollarSign className="w-4 h-4 text-gray-400" />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">
            {formatCurrency(client.loanAmount)}
          </p>
          <p className="text-xs text-gray-500">
            Paid: {formatCurrency(client.amountPaid)}
          </p>
        </div>
      </div>

      {/* Payment Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span>{Math.round(paymentProgress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(paymentProgress, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-1 mb-3">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Mail className="w-3 h-3" />
          <span className="truncate">{client.email}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Phone className="w-3 h-3" />
          <span>{client.phone}</span>
        </div>
      </div>

      {/* Due Date */}
      {client.dueDate && (
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
          <Calendar className="w-3 h-3" />
          <span>Due: {formatDate(client.dueDate)}</span>
        </div>
      )}

      {/* Last Payment */}
      {client.lastPaymentDate && (
        <div className="text-xs text-gray-500 mb-3">
          Last payment: {formatDate(client.lastPaymentDate)}
        </div>
      )}

      {/* Risk Assessment */}
      {client.riskAssessment && (
        <div className="mb-2">
          {getRiskBadge(client.riskAssessment)}
        </div>
      )}

      {/* Monthly Payment */}
      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-500">Monthly</span>
        <span className="text-sm font-medium text-gray-900">
          {formatCurrency(client.monthlyPayment)}
        </span>
      </div>

      {/* Remaining Amount */}
      {remainingAmount > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Remaining</span>
          <span className="text-sm font-medium text-red-600">
            {formatCurrency(remainingAmount)}
          </span>
        </div>
      )}

      {/* Notes Preview */}
      {client.notes && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500 line-clamp-2">
            {client.notes}
          </p>
        </div>
      )}
    </div>
  );
});

ClientCard.displayName = 'ClientCard';

export default ClientCard;