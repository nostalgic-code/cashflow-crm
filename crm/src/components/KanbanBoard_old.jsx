import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { RefreshCw, Plus } from 'lucide-react';
import { updateClientStatus } from '../services/api';
import { automationService } from '../services/automation';
import { formatCurrency, getStatusColor } from '../utils/loanCalculations';

const COLUMNS = [
  { 
    id: 'new-lead', 
    title: 'New Leads', 
    color: 'bg-blue-500',
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-50'
  },
  { 
    id: 'active', 
    title: 'Active Loans', 
    color: 'bg-indigo-600',
    borderColor: 'border-indigo-600',
    bgColor: 'bg-indigo-50'
  },
  { 
    id: 'repayment-due', 
    title: 'Repayment Due', 
    color: 'bg-yellow-500',
    borderColor: 'border-yellow-500',
    bgColor: 'bg-yellow-50'
  },
  { 
    id: 'paid', 
    title: 'Paid', 
    color: 'bg-green-500',
    borderColor: 'border-green-500',
    bgColor: 'bg-green-50'
  },
  { 
    id: 'overdue', 
    title: 'Overdue', 
    color: 'bg-red-500',
    borderColor: 'border-red-500',
    bgColor: 'bg-red-50'
  },
];

const KanbanBoard = ({ 
  clients = [], 
  onClientsUpdate, 
  onClientClick, 
  onAddClient 
}) => {
  const [activeId, setActiveId] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group clients by status
  const clientsByStatus = COLUMNS.reduce((acc, column) => {
    acc[column.id] = clients.filter(client => client.status === column.id);
    return acc;
  }, {});

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeClient = clients.find(client => client.id === active.id);
    const overId = over.id;
    
    // Check if we're dropping on a column or another client
    const overColumn = COLUMNS.find(column => column.id === overId);
    const overClient = clients.find(client => client.id === overId);
    
    if (!activeClient) return;
    
    const activeStatus = activeClient.status;
    const overStatus = overColumn ? overId : overClient?.status;
    
    if (activeStatus !== overStatus) {
      // Update client status
      const updatedClients = clients.map(client => {
        if (client.id === activeClient.id) {
          return { ...client, status: overStatus };
        }
        return client;
      });
      
      onClientsUpdate(updatedClients);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeClient = clients.find(client => client.id === active.id);
    const overId = over.id;
    
    // Determine the target status
    const overColumn = COLUMNS.find(column => column.id === overId);
    const overClient = clients.find(client => client.id === overId);
    const targetStatus = overColumn ? overId : overClient?.status;
    
    if (activeClient && targetStatus && activeClient.status !== targetStatus) {
      setIsUpdating(true);
      
      try {
        // Update in backend
        await updateClientStatus(activeClient.id, targetStatus);
        
        // Update local state
        const updatedClients = clients.map(client => {
          if (client.id === activeClient.id) {
            return { 
              ...client, 
              status: targetStatus,
              // Update last activity
              lastStatusUpdate: new Date().toISOString()
            };
          }
          return client;
        });
        
        // Run automation to check for any additional updates needed
        const automationResult = automationService.runAutomation(updatedClients);
        
        onClientsUpdate(automationResult.clients);
        
        // Show success notification
        console.log(`Client ${activeClient.name} moved to ${targetStatus}`);
        
      } catch (error) {
        console.error('Failed to update client status:', error);
        // Revert the change if it failed
        // The state should remain unchanged since we only update on success
      } finally {
        setIsUpdating(false);
      }
    }
    
    setActiveId(null);
  };

  // Run automation periodically - but prevent infinite loops
  useEffect(() => {
    let timeoutId;
    
    const runPeriodicAutomation = () => {
      if (clients.length > 0) {
        const result = automationService.runAutomation(clients);
        
        // Only update if there are meaningful changes (not just timestamps)
        const hasChanges = result.clients.some((newClient, index) => {
          const oldClient = clients[index];
          if (!oldClient) return true;
          
          // Compare important fields, ignore timestamps and risk assessments that change frequently
          return (
            newClient.status !== oldClient.status ||
            newClient.amountPaid !== oldClient.amountPaid ||
            newClient.loanAmount !== oldClient.loanAmount
          );
        });
        
        if (hasChanges) {
          onClientsUpdate(result.clients);
        }
      }
    };

    // Run automation only once on mount, then every 10 minutes
    if (clients.length > 0) {
      timeoutId = setTimeout(() => {
        runPeriodicAutomation();
        
        // Set up interval for periodic runs
        const interval = setInterval(runPeriodicAutomation, 10 * 60 * 1000);
        
        return () => clearInterval(interval);
      }, 1000); // Small delay to prevent immediate re-renders
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []); // Remove clients dependency to prevent infinite loops

  const activeClient = activeId ? clients.find(client => client.id === activeId) : null;

  const runManualAutomation = () => {
    setIsUpdating(true);
    const result = automationService.runAutomation(clients);
    onClientsUpdate(result.clients);
    setIsUpdating(false);
  };

  return (
    <div className="h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Client Pipeline</h2>
            <p className="text-sm text-gray-500 mt-1">
              Drag and drop clients between stages to update their status
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Automation Status */}
            <div className="text-xs text-gray-500">
              Auto-updates: <span className="text-green-600 font-medium">Active</span>
            </div>
            
            {/* Manual Refresh */}
            <button
              onClick={runManualAutomation}
              disabled={isUpdating}
              className="
                flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md
                hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors duration-200
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
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-xs text-gray-500">{column.title}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="p-4 h-full overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 h-full">
            {COLUMNS.map((column) => (
              <KanbanColumn
                key={column.id}
                status={column.id}
                title={column.title}
                clients={clientsByStatus[column.id] || []}
                onClientClick={onClientClick}
                onAddClient={column.id === 'new-lead' ? onAddClient : undefined}
              />
            ))}
          </div>
          
          <DragOverlay>
            {activeClient ? (
              <div className="transform rotate-3">
                <ClientCard client={activeClient} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
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