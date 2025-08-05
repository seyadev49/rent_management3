import React from 'react';
import { Wrench, Plus, Filter } from 'lucide-react';

const Maintenance: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
          <p className="text-gray-600">Manage maintenance requests and work orders</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </button>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </button>
        </div>
      </div>

      <div className="text-center py-12">
        <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Maintenance Management</h3>
        <p className="text-gray-600 mb-4">Maintenance request system coming soon</p>
        <p className="text-sm text-gray-500">This feature will include request submission, assignment to workers, and status tracking</p>
      </div>
    </div>
  );
};

export default Maintenance;