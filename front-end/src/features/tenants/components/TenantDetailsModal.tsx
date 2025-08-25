import React from 'react';
import { X, Phone, MapPin } from 'lucide-react';
import { Tenant } from '../types';

interface TenantDetailsModalProps {
  show: boolean;
  activeTab: 'active' | 'terminated';
  tenant: Tenant | null;
  onClose: () => void;
  onEdit: (tenant: Tenant) => void;
  onTerminate: (tenant: Tenant) => void;
}

export const TenantDetailsModal: React.FC<TenantDetailsModalProps> = ({
  show,
  activeTab,
  tenant,
  onClose,
  onEdit,
  onTerminate,
}) => {
  if (!show || !tenant) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full max-h-screen overflow-y-auto">
        <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-16 w-16">
                <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-xl font-medium text-white">
                    {tenant.full_name?.charAt(0)}
                  </span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {tenant.full_name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ID: {tenant.tenant_id} • {tenant.sex}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="space-y-6">
            {/* Contact Information */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Contact Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-900 dark:text-gray-100">{tenant.phone}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-900 dark:text-gray-100">
                    {tenant.city}, {tenant.subcity}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600 dark:text-gray-400">Address: </span>
                  <span className="text-gray-900 dark:text-gray-100">
                    Woreda {tenant.woreda}, House {tenant.house_no}
                  </span>
                </div>
                {tenant.organization && (
                  <div className="col-span-2">
                    <span className="text-gray-600 dark:text-gray-400">Organization: </span>
                    <span className="text-gray-900 dark:text-gray-100">{tenant.organization}</span>
                  </div>
                )}
              </div>
            </div>
            {/* Agent Information */}
            {tenant.has_agent && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Agent Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Name: </span>
                    <span className="text-gray-900 dark:text-gray-100">{tenant.agent_full_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Sex: </span>
                    <span className="text-gray-900 dark:text-gray-100">{tenant.agent_sex}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Phone: </span>
                    <span className="text-gray-900 dark:text-gray-100">{tenant.agent_phone}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">City: </span>
                    <span className="text-gray-900 dark:text-gray-100">{tenant.agent_city}</span>
                  </div>
                  {tenant.authentication_no && (
                    <div className="col-span-2">
                      <span className="text-gray-600 dark:text-gray-400">Authentication No: </span>
                      <span className="text-gray-900 dark:text-gray-100">{tenant.authentication_no}</span>
                    </div>
                  )}
                  {tenant.authentication_date && (
                    <div className="col-span-2">
                      <span className="text-gray-600 dark:text-gray-400">Authentication Date: </span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {new Date(tenant.authentication_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Property Information */}
            {tenant.property_name && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Property Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Property: </span>
                    <span className="text-gray-900 dark:text-gray-100">{tenant.property_name}</span>
                  </div>
                  {tenant.unit_number && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Unit: </span>
                      <span className="text-gray-900 dark:text-gray-100">{tenant.unit_number}</span>
                    </div>
                  )}
                  {tenant.monthly_rent && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Monthly Rent: </span>
                      <span className="text-gray-900 dark:text-gray-100">${tenant.monthly_rent}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Status: </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      tenant.contract_status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {tenant.contract_status || 'No active contract'}
                    </span>
                  </div>
                  {tenant.contract_start_date && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Contract Start: </span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {new Date(tenant.contract_start_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {tenant.contract_end_date && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Contract End: </span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {new Date(tenant.contract_end_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Termination Information */}
            {activeTab === 'terminated' && tenant.termination_date && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Termination Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Termination Date: </span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {new Date(tenant.termination_date).toLocaleDateString()}
                    </span>
                  </div>
                  {tenant.termination_reason && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Reason: </span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {tenant.termination_reason.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  )}
                  {tenant.termination_notes && (
                    <div className="col-span-2">
                      <span className="text-gray-600 dark:text-gray-400">Notes: </span>
                      <span className="text-gray-900 dark:text-gray-100">{tenant.termination_notes}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          {activeTab === 'active' && tenant.contract_status === 'active' && (
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  onClose();
                  onEdit(tenant);
                }}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Edit Tenant
              </button>
              <button
                onClick={() => {
                  onClose();
                  onTerminate(tenant);
                }}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-orange-600 text-base font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Terminate
              </button>
            </div>
          )}
          <button
            onClick={onClose}
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};