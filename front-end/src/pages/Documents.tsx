import React from 'react';
import { FileText, Plus, Upload } from 'lucide-react';

const Documents: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">Store and manage important documents</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </button>
      </div>

      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Document Storage</h3>
        <p className="text-gray-600 mb-4">Document management system coming soon</p>
        <p className="text-sm text-gray-500">This feature will include contract storage, ID uploads, and property documents</p>
      </div>
    </div>
  );
};

export default Documents;