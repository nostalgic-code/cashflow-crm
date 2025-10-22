import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { RefreshCw, Plus, Trash2 } from 'lucide-react';
import { updateClientStatus } from '../services/backendApi';
import { formatCurrency, getStatusColor, getStatusBadgeClasses, calculateCurrentAmountDue, calculateRemainingBalance } from '../utils/loanCalculations';

const COLUMNS = [
  { 
    id: 'new-lead', 
    title: 'New Leads', 
    color: 'bg-monday-blue',
    borderColor: 'border-monday-blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-monday-blue',
    headerText: 'text-monday-gray-900',
    statsText: 'text-monday-gray-900'
  },
  { 
    id: 'active', 
    title: 'Active Loans', 
    color: 'bg-monday-purple',
    borderColor: 'border-monday-purple',
    bgColor: 'bg-purple-50',
    textColor: 'text-monday-purple',
    headerText: 'text-monday-gray-900',
    statsText: 'text-monday-gray-900'
  },
  { 
    id: 'repayment-due', 
    title: 'Repayment Due', 
    color: 'bg-monday-yellow',
    borderColor: 'border-monday-yellow',
    bgColor: 'bg-yellow-50',
    textColor: 'text-monday-yellow',
    // Yellow header is light; use dark text for readability
    headerText: 'text-monday-gray-900',
    statsText: 'text-monday-gray-900'
  },
  { 
    id: 'paid', 
    title: 'Paid', 
    color: 'bg-monday-green',
    borderColor: 'border-monday-green',
    bgColor: 'bg-green-50',
    textColor: 'text-monday-green',
    headerText: 'text-monday-gray-900',
    statsText: 'text-monday-gray-900'
  },
  { 
    id: 'overdue', 
    title: 'Overdue', 
    color: 'bg-monday-red',
    borderColor: 'border-monday-red',
    bgColor: 'bg-red-50',
    textColor: 'text-monday-red',
    headerText: 'text-monday-gray-900',
    statsText: 'text-monday-gray-900'
  },
];

// Simple Client Card Component (essential info only)
const SimpleClientCard = ({ client, index, onClientClick, onDelete }) => {
  const currentAmountDue = calculateCurrentAmountDue(client);
  const remainingAmount = currentAmountDue - (client.amountPaid || 0);
  const paymentProgress = currentAmountDue > 0 ? Math.min(100, ((client.amountPaid || 0) / currentAmountDue) * 100) : 100;
  
  return (
    <Draggable draggableId={client.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`
            bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3 
            cursor-grab transition-all duration-200 hover:shadow-md hover:border-gray-300
            break-words overflow-hidden max-w-sm
            ${snapshot.isDragging ? 'shadow-xl border-blue-400 rotate-1 z-50 cursor-grabbing' : ''}
          `}
          style={{
            ...provided.draggableProps.style,
            userSelect: 'none'
          }}
          onDoubleClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClientClick(client);
          }}
        >
          {/* Client Name, Status & Actions */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0 mr-2">
              <h4 className="font-semibold text-monday-gray-900 text-sm truncate">
                {client.name}
              </h4>
              <span className={`
                inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full
                ${getStatusBadgeClasses(client.status)}
              `}>
                {client.status === 'new-lead' ? 'New' :
                 client.status === 'repayment-due' ? 'Due' :
                 client.status.charAt(0).toUpperCase() + client.status.slice(1)}
              </span>
            </div>
            {/* Delete button - show for new leads and paid clients */}
            {(client.status === 'new-lead' || client.status === 'paid') && onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(client.id);
                }}
                className="flex-shrink-0 p-1 text-monday-gray-400 hover:text-monday-red hover:bg-monday-red/10 rounded-full transition-colors"
                title={client.status === 'paid' ? 'Archive paid client (hide from view)' : 'Delete client'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Loan Type */}
          <p className="text-xs text-monday-gray-600 mb-2 truncate">{client.loanType}</p>
          
          {/* Loan Amount & Total Due */}
          <div className="flex justify-between items-center mb-3 gap-2">
            <div className="text-left flex-1 min-w-0">
              <span className="text-xs text-monday-gray-500">Principal</span>
              <div className="text-sm font-semibold text-monday-gray-900 truncate">
                {formatCurrency(client.loanAmount)}
              </div>
            </div>
            <div className="text-right flex-1 min-w-0">
              <span className="text-xs text-monday-gray-500">Current Due</span>
              <div className="text-sm font-semibold text-monday-red truncate">
                {formatCurrency(currentAmountDue)}
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex justify-between text-xs text-monday-gray-600 font-medium mb-1">
              <span>Progress</span>
              <span>{Math.round(paymentProgress)}%</span>
            </div>
            <div className="w-full bg-monday-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-monday-blue to-monday-green h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(paymentProgress, 100)}%` }}
              />
            </div>
          </div>
          
          {/* Remaining Amount (if not paid) */}
          {remainingAmount > 0 && (
            <div className="flex justify-between items-center text-xs gap-2">
              <span className="text-monday-gray-600 font-medium">Remaining</span>
              <span className="font-semibold text-monday-red truncate">
                {formatCurrency(Math.max(0, remainingAmount))}
              </span>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};

// Kanban Column Component
const KanbanColumn = ({ column, clients, onClientClick, onAddClient, onDelete }) => {
  const outstandingAmount = clients.reduce((sum, client) => sum + (client.loanAmount - client.amountPaid), 0);
  
  return (
    <div className={`
      flex flex-col w-full md:w-80 md:min-w-80 md:max-w-80 rounded-lg border-2 ${column.borderColor} ${column.bgColor} 
      shadow-sm mx-0 md:mx-1 max-h-full
    `}>
      {/* Column Header */}
      <div className={`${column.color} p-4 rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`font-semibold text-lg ${column.headerText || 'text-white'}`}>{column.title}</h3>
            <p className={`text-sm opacity-90 ${column.headerText || 'text-white'}`}>
              {clients.length} client{clients.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          {column.id === 'new-lead' && onAddClient && (
            <button
              onClick={onAddClient}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              title="Add New Lead"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* Column Stats */}
        {clients.length > 0 && (
          <div className={`mt-2 pt-2 border-t border-white/20 text-sm ${column.statsText || 'text-white/90'}`}>
            {column.id === 'paid' 
              ? `Collected: ${formatCurrency(clients.reduce((sum, c) => sum + c.amountPaid, 0))}`
              : `Outstanding: ${formatCurrency(outstandingAmount)}`
            }
          </div>
        )}
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              flex-1 p-4 overflow-y-auto scrollbar-thin
              ${snapshot.isDraggingOver ? 'bg-opacity-75' : ''}
            `}
            style={{ 
              maxHeight: 'calc(100vh - 320px)',
              minHeight: '300px'
            }}
          >
            {clients.length > 0 ? (
              <>
                {clients.map((client, index) => (
                  <SimpleClientCard
                    key={client.id}
                    client={client}
                    index={index}
                    onClientClick={onClientClick}
                    onDelete={onDelete}
                  />
                ))}
                {/* Extra padding at the bottom to ensure last card is fully visible */}
                <div className="h-4"></div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-monday-gray-500">
                <div className="w-12 h-12 mb-3 rounded-full bg-monday-gray-200 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-monday-gray-400" />
                </div>
                <p className="text-sm font-semibold text-monday-gray-600">No clients</p>
                <p className="text-xs text-center mt-1 text-monday-gray-500">
                  {column.id === 'new-lead' 
                    ? 'Add new leads to get started'
                    : 'Drag clients here'
                  }
                </p>
              </div>
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

const KanbanBoard = ({ 
  clients = [], 
  onClientsUpdate, 
  onClientClick, 
  onAddClient,
  onDeleteClient 
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  // Group clients by status
  const clientsByStatus = COLUMNS.reduce((acc, column) => {
    acc[column.id] = clients.filter(client => client.status === column.id);
    return acc;
  }, {});

  const handleDragStart = useCallback((start) => {
    console.log('Drag started:', start);
  }, []);

  const handleDragEnd = useCallback(async (result) => {
    console.log('Drag ended:', result);
    const { destination, source, draggableId } = result;
    
    // If dropped outside any droppable area
    if (!destination) {
      console.log('No destination - dropped outside');
      return;
    }
    
    // If dropped in the same position
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      console.log('Dropped in same position');
      return;
    }

    const sourceStatus = source.droppableId;
    const destStatus = destination.droppableId;
    const clientId = draggableId;
    
    console.log(`Moving client ${clientId} from ${sourceStatus} to ${destStatus}`);
    
    // If moving to a different column (status change)
    if (sourceStatus !== destStatus) {
      setIsUpdating(true);
      
      try {
        // Update client status locally first for immediate feedback
        const updatedClients = clients.map(client => {
          if (client.id === clientId) {
            return {
              ...client,
              status: destStatus,
              lastStatusUpdate: new Date().toISOString()
            };
          }
          return client;
        });
        
        onClientsUpdate(updatedClients);
        
        // Update in backend with timeout
        const updatePromise = updateClientStatus(clientId, destStatus);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Update timeout')), 5000)
        );
        
        await Promise.race([updatePromise, timeoutPromise]);
        
        console.log(`Client moved to ${destStatus}`);
        
      } catch (error) {
        console.error('Failed to update client status:', error);
        // Revert the change on error
        onClientsUpdate(clients);
      } finally {
        setIsUpdating(false);
      }
    }
  }, [clients, onClientsUpdate]);

  const runManualAutomation = useCallback(() => {
    setIsUpdating(true);
    // Simple automation - just update timestamps, don't change statuses automatically
    const updatedClients = clients.map(client => ({
      ...client,
      lastAutomationRun: new Date().toISOString()
    }));
    onClientsUpdate(updatedClients);
    setIsUpdating(false);
  }, [clients, onClientsUpdate]);

  const handleDeleteClient = useCallback((clientId) => {
    if (window.confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      if (onDeleteClient) {
        onDeleteClient(clientId);
      } else {
        // Fallback: update local state if no delete handler provided
        const updatedClients = clients.filter(client => client.id !== clientId);
        onClientsUpdate(updatedClients);
      }
    }
  }, [clients, onClientsUpdate, onDeleteClient]);

  return (
    <div className="h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-monday-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-monday-gray-900">Client Pipeline</h2>
            <p className="text-sm text-monday-gray-600 mt-1 font-medium">
              Drag and drop clients between stages to update their status
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-xs text-monday-gray-600 font-medium">
              Total: <span className="font-bold text-monday-gray-900">{clients.length} clients</span>
            </div>
            
            <button
              onClick={runManualAutomation}
              disabled={isUpdating}
              className="
                flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold
                hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 shadow-sm
              "
            >
              <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
              {isUpdating ? 'Updating...' : 'Refresh'}
            </button>
          </div>
        </div>
        
        {/* Stats Summary */}
        <div className="grid grid-cols-5 gap-4 mt-4">
          {COLUMNS.map((column) => {
            const count = clientsByStatus[column.id]?.length || 0;
            return (
              <div key={column.id} className="text-center">
                <div className={`text-2xl font-bold ${column.textColor}`}>{count}</div>
                <div className="text-xs text-monday-gray-600 font-medium">{column.title}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Kanban Board with Responsive Layout */}
      <div className="p-2 md:p-4 h-full overflow-hidden">
        <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          {/* Mobile: Stack columns vertically */}
          <div className="md:hidden space-y-4">
            {COLUMNS.map((column) => (
              <div key={column.id} className="w-full">
                <KanbanColumn
                  column={column}
                  clients={clientsByStatus[column.id] || []}
                  onClientClick={onClientClick}
                  onAddClient={column.id === 'new-lead' ? onAddClient : undefined}
                  onDelete={onDeleteClient}
                />
              </div>
            ))}
          </div>
          
          {/* Desktop: Horizontal layout */}
          <div className="hidden md:flex flex-row gap-2 overflow-x-auto pb-4" style={{ height: 'calc(100vh - 200px)' }}>
            {COLUMNS.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                clients={clientsByStatus[column.id] || []}
                onClientClick={onClientClick}
                onAddClient={column.id === 'new-lead' ? onAddClient : undefined}
                onDelete={onDeleteClient}
              />
            ))}
          </div>
        </DragDropContext>
      </div>
      
      {/* Loading Overlay */}
      {isUpdating && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3 shadow-lg">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-gray-700">Updating client status...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;