import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import ClientCard from './ClientCard';
import { getStatusColor } from '../utils/loanCalculations';

const KanbanColumn = ({ 
  status, 
  title, 
  clients = [], 
  onClientClick, 
  onAddClient 
}) => {
  const { setNodeRef } = useDroppable({
    id: status,
  });

  const getColumnHeaderColor = (status) => {
    const colors = {
      'new-lead': 'bg-blue-400 border-blue-500',     // Light Blue
      'active': 'bg-blue-600 border-blue-700',       // Primary Blue
      'repayment-due': 'bg-yellow-500 border-yellow-600', // Yellow
      'paid': 'bg-green-500 border-green-600',       // Green
      'overdue': 'bg-red-500 border-red-600',        // Red
    };
    
    return colors[status] || 'bg-gray-400 border-gray-500';
  };

  const getColumnBg = (status) => {
    const colors = {
      'new-lead': 'bg-blue-50',
      'active': 'bg-blue-50',
      'repayment-due': 'bg-yellow-50',
      'paid': 'bg-green-50',
      'overdue': 'bg-red-50',
    };
    
    return colors[status] || 'bg-gray-50';
  };

  return (
    <div className={`flex flex-col rounded-lg border ${getColumnBg(status)} min-h-[600px]`}>
      {/* Column Header */}
      <div className={`
        ${getColumnHeaderColor(status)} text-white p-4 rounded-t-lg border-b-2
      `}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-sm opacity-90">
              {clients.length} client{clients.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          {/* Add Client Button (only show for new-lead column) */}
          {status === 'new-lead' && onAddClient && (
            <button
              onClick={onAddClient}
              className="
                p-2 rounded-full bg-white/20 hover:bg-white/30 
                transition-colors duration-200 group
              "
              title="Add New Lead"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
            </button>
          )}
        </div>
        
        {/* Column Statistics */}
        {clients.length > 0 && (
          <div className="mt-2 pt-2 border-t border-white/20">
            {status === 'active' || status === 'repayment-due' || status === 'overdue' ? (
              <div className="text-sm opacity-90">
                Total Outstanding: ${clients.reduce((sum, client) => 
                  sum + (client.loanAmount - client.amountPaid), 0
                ).toLocaleString()}
              </div>
            ) : status === 'paid' ? (
              <div className="text-sm opacity-90">
                Total Collected: ${clients.reduce((sum, client) => 
                  sum + client.amountPaid, 0
                ).toLocaleString()}
              </div>
            ) : (
              <div className="text-sm opacity-90">
                Potential Value: ${clients.reduce((sum, client) => 
                  sum + client.loanAmount, 0
                ).toLocaleString()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Column Content */}
      <div
        ref={setNodeRef}
        className="flex-1 p-4 overflow-y-auto"
      >
        <SortableContext 
          items={clients.map(client => client.id)} 
          strategy={verticalListSortingStrategy}
        >
          {clients.length > 0 ? (
            clients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onClick={() => onClientClick(client)}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <div className="w-16 h-16 mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                <Plus className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium">No clients</p>
              <p className="text-xs text-center mt-1">
                {status === 'new-lead' 
                  ? 'Add new leads to get started'
                  : 'Drag clients here or they\'ll appear automatically'
                }
              </p>
            </div>
          )}
        </SortableContext>
      </div>

      {/* Column Footer (show totals) */}
      {clients.length > 0 && (
        <div className="p-3 bg-white/50 rounded-b-lg border-t border-gray-200">
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Count:</span>
              <span className="font-medium">{clients.length}</span>
            </div>
            
            {(status === 'active' || status === 'repayment-due' || status === 'overdue') && (
              <>
                <div className="flex justify-between">
                  <span>Monthly Payments:</span>
                  <span className="font-medium">
                    ${clients.reduce((sum, client) => sum + client.monthlyPayment, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Avg. Payment:</span>
                  <span className="font-medium">
                    ${Math.round(clients.reduce((sum, client) => sum + client.monthlyPayment, 0) / clients.length).toLocaleString()}
                  </span>
                </div>
              </>
            )}
            
            {status === 'overdue' && (
              <div className="flex justify-between text-red-600">
                <span>Risk Level:</span>
                <span className="font-medium">HIGH</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanColumn;