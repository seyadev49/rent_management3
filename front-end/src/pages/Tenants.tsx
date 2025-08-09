import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Users, Plus, Edit, Trash2, Phone, MapPin, User } from 'lucide-react';

interface Tenant {
  id: number;
  tenant_id: string;
  full_name: string;
  sex: string;
  phone: string;
  city: string;
  subcity: string;
  woreda?: string;
  house_no?: string;
  organization?: string;
  has_agent: boolean;
  agent_full_name?: string;
  agent_sex?: string;
  agent_phone?: string;
  agent_city?: string;
  agent_woreda?: string;
  agent_house_no?: string;
  authentication_no?: string;
  authentication_date?: string;
  property_name?: string;
  unit_number?: string;
  monthly_rent?: number;
  contract_status?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  days_until_expiry?: number | null;
  days_until_next_payment?: number | null;
}

const Tenants: React.FC = () => {
  const { token } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [terminatingTenant, setTerminatingTenant] = useState<Tenant | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    tenantId: '',
    fullName: '',
    sex: 'Male',
    phone: '',
    city: '',
    subcity: '',
    woreda: '',
    houseNo: '',
    organization: '',
    hasAgent: false,
    agentFullName: '',
    agentSex: 'Male',
    agentPhone: '',
    agentCity: '',
    agentSubcity: '',
    agentWoreda: '',
    agentHouseNo: '',
    authenticationNo: '',
    authenticationDate: '',
  });

  const [terminationFormData, setTerminationFormData] = useState({
    terminationDate: new Date().toISOString().split('T')[0],
    terminationReason: '',
    securityDepositAction: 'return_full',
    partialReturnAmount: '',
    deductions: [] as Array<{description: string, amount: number}>,
    notes: ''
  });

  useEffect(() => {
    fetchTenants();
  }, [token]);

  const fetchTenants = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/tenants', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTenants(data.tenants);
      }
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowAddModal(false);
        resetForm();
        fetchTenants();
      }
    } catch (error) {
      console.error('Failed to create tenant:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      tenantId: '',
      fullName: '',
      sex: 'Male',
      phone: '',
      city: '',
      subcity: '',
      woreda: '',
      houseNo: '',
      organization: '',
      hasAgent: false,
      agentFullName: '',
      agentSex: 'Male',
      agentPhone: '',
      agentCity: '',
      agentSubcity: '',
      agentWoreda: '',
      agentHouseNo: '',
      authenticationNo: '',
      authenticationDate: '',
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFormData({
      tenantId: tenant.tenant_id || '',
      fullName: tenant.full_name || '',
      sex: tenant.sex || 'Male',
      phone: tenant.phone || '',
      city: tenant.city || '',
      subcity: tenant.subcity || '',
      woreda: tenant.woreda || '',
      houseNo: tenant.house_no || '',
      organization: tenant.organization || '',
      hasAgent: tenant.has_agent || false,
      agentFullName: tenant.agent_full_name || '',
      agentSex: tenant.agent_sex || 'Male',
      agentPhone: tenant.agent_phone || '',
      agentCity: tenant.agent_city || '',
      agentSubcity: tenant.agent_subcity || '',
      agentWoreda: tenant.agent_woreda || '',
      agentHouseNo: tenant.agent_house_no || '',
      authenticationNo: tenant.authentication_no || '',
      authenticationDate: tenant.authentication_date || '',
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this tenant?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/tenants/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          fetchTenants();
        }
      } catch (error) {
        console.error('Failed to delete tenant:', error);
      }
    }
  };

  const handleTerminate = (tenant: Tenant) => {
    setTerminatingTenant(tenant);
    setShowTerminateModal(true);
  };

  const handleTerminationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminatingTenant) return;

    try {
      const response = await fetch(`http://localhost:5000/api/tenants/${terminatingTenant.id}/terminate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(terminationFormData),
      });

      if (response.ok) {
        setShowTerminateModal(false);
        setTerminatingTenant(null);
        setTerminationFormData({
          terminationDate: new Date().toISOString().split('T')[0],
          terminationReason: '',
          securityDepositAction: 'return_full',
          partialReturnAmount: '',
          deductions: [],
          notes: ''
        });
        fetchTenants();
      }
    } catch (error) {
      console.error('Failed to terminate tenant:', error);
    }
  };

  const addDeduction = () => {
    setTerminationFormData({
      ...terminationFormData,
      deductions: [...terminationFormData.deductions, { description: '', amount: 0 }]
    });
  };

  const removeDeduction = (index: number) => {
    setTerminationFormData({
      ...terminationFormData,
      deductions: terminationFormData.deductions.filter((_, i) => i !== index)
    });
  };

  const updateDeduction = (index: number, field: 'description' | 'amount', value: string | number) => {
    const updatedDeductions = [...terminationFormData.deductions];
    updatedDeductions[index] = { ...updatedDeductions[index], [field]: value };
    setTerminationFormData({ ...terminationFormData, deductions: updatedDeductions });
  };

  const filteredTenants = tenants.filter(tenant =>
    tenant.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.tenant_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.phone.includes(searchTerm) ||
    tenant.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tenants</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your tenant information</p>
        </div>
        <input
          type="text"
          placeholder="Search tenants..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
        />
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 dark:bg-blue-700 dark:hover:bg-blue-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Tenant
        </button>
      </div>

      {/* Tenants Table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Tenant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Contact & Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Property
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Contract & Timeline
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Days Left
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTenants.map((tenant) => (
              <tr key={tenant.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {tenant.full_name?.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {tenant.full_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        ID: {tenant.tenant_id} • {tenant.sex}
                      </div>
                      {tenant.organization && (
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {tenant.organization}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 dark:text-gray-100">{tenant.phone}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {tenant.city}, {tenant.subcity}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    Woreda {tenant.woreda}, House {tenant.house_no}
                  </div>
                  {tenant.has_agent && (
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Agent: {tenant.agent_full_name}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-gray-100">{tenant.property_name || 'No active contract'}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{tenant.unit_number && `Unit ${tenant.unit_number}`}</div>
                </td>
                <td className="px-6 py-4">
                  {tenant.contract_status === 'active' ? (
                    <div>
                      <div className="text-sm text-gray-900 dark:text-gray-100">${tenant.monthly_rent}/month</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(tenant.contract_start_date).toLocaleDateString()} - {new Date(tenant.contract_end_date).toLocaleDateString()}
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tenant.contract_status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {tenant.contract_status}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500 dark:text-gray-400">No active contract</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {tenant.contract_status === 'active' && (
                    <div className="space-y-1">
                      {tenant.days_until_expiry !== null && (
                        <div className={`text-sm ${
                          tenant.days_until_expiry <= 30
                            ? 'text-red-600 dark:text-red-400'
                            : tenant.days_until_expiry <= 60
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          Contract: {tenant.days_until_expiry} days
                        </div>
                      )}
                      {tenant.days_until_next_payment !== null && (
                        <div className={`text-sm ${
                          tenant.days_until_next_payment <= 0
                            ? 'text-red-600 dark:text-red-400'
                            : tenant.days_until_next_payment <= 7
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          Payment: {tenant.days_until_next_payment <= 0 ? 'Overdue' : `${tenant.days_until_next_payment} days`}
                        </div>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(tenant)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Edit
                    </button>
                    {tenant.contract_status === 'active' && (
                      <button
                        onClick={() => handleTerminate(tenant)}
                        className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                      >
                        Terminate
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(tenant.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredTenants.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No tenants found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Try adjusting your search or add a new tenant</p>
        </div>
      )}

      {/* Terminate Tenant Modal */}
      {showTerminateModal && terminatingTenant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full max-h-screen overflow-y-auto">
            <form onSubmit={handleTerminationSubmit}>
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                    Terminate Tenant: {terminatingTenant.full_name}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Termination Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={terminationFormData.terminationDate}
                        onChange={(e) => setTerminationFormData({...terminationFormData, terminationDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Termination Reason *
                      </label>
                      <select
                        required
                        value={terminationFormData.terminationReason}
                        onChange={(e) => setTerminationFormData({...terminationFormData, terminationReason: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                      >
                        <option value="">Select reason</option>
                        <option value="lease_expired">Lease Expired</option>
                        <option value="tenant_request">Tenant Request</option>
                        <option value="non_payment">Non-Payment</option>
                        <option value="lease_violation">Lease Violation</option>
                        <option value="property_sale">Property Sale</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Security Deposit Action *
                      </label>
                      <select
                        required
                        value={terminationFormData.securityDepositAction}
                        onChange={(e) => setTerminationFormData({...terminationFormData, securityDepositAction: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                      >
                        <option value="return_full">Return Full Deposit</option>
                        <option value="return_partial">Return Partial Deposit</option>
                        <option value="keep_full">Keep Full Deposit</option>
                      </select>
                    </div>

                    {terminationFormData.securityDepositAction === 'return_partial' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Partial Return Amount
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={terminationFormData.partialReturnAmount}
                          onChange={(e) => setTerminationFormData({...terminationFormData, partialReturnAmount: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Deductions
                      </label>
                      {terminationFormData.deductions.map((deduction, index) => (
                        <div key={index} className="flex space-x-2 mb-2">
                          <input
                            type="text"
                            placeholder="Description"
                            value={deduction.description}
                            onChange={(e) => updateDeduction(index, 'description', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                          />
                          <input
                            type="number"
                            placeholder="Amount"
                            min="0"
                            step="0.01"
                            value={deduction.amount}
                            onChange={(e) => updateDeduction(index, 'amount', parseFloat(e.target.value) || 0)}
                            className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                          />
                          <button
                            type="button"
                            onClick={() => removeDeduction(index)}
                            className="px-3 py-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addDeduction}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                      >
                        + Add Deduction
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Additional Notes
                      </label>
                      <textarea
                        value={terminationFormData.notes}
                        onChange={(e) => setTerminationFormData({...terminationFormData, notes: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="submit"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Terminate Tenant
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowTerminateModal(false);
                    setTerminatingTenant(null);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Tenant Modal */}
      {(showAddModal || editingTenant) && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full max-h-screen overflow-y-auto">
              <form onSubmit={handleSubmit}>
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">{editingTenant ? 'Edit Tenant' : 'Add New Tenant'}</h3>

                    <div className="space-y-6">
                      {/* Basic Information */}
                      <div>
                        <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">Basic Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Tenant ID *
                            </label>
                            <input
                              type="text"
                              name="tenantId"
                              required
                              value={formData.tenantId}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                              placeholder="e.g., TNT001"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Full Name *
                            </label>
                            <input
                              type="text"
                              name="fullName"
                              required
                              value={formData.fullName}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                              placeholder="Enter full name"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Sex *
                            </label>
                            <select
                              name="sex"
                              required
                              value={formData.sex}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Phone Number *
                            </label>
                            <input
                              type="tel"
                              name="phone"
                              required
                              value={formData.phone}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                              placeholder="09XXXXXXXX or 07XXXXXXXX"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              City *
                            </label>
                            <input
                              type="text"
                              name="city"
                              required
                              value={formData.city}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                              placeholder="Enter city"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Sub City *
                            </label>
                            <input
                              type="text"
                              name="subcity"
                              required
                              value={formData.subcity}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                              placeholder="Enter sub city"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Woreda *
                            </label>
                            <input
                              type="text"
                              name="woreda"
                              required
                              value={formData.woreda}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                              placeholder="Enter woreda"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              House No *
                            </label>
                            <input
                              type="text"
                              name="houseNo"
                              required
                              value={formData.houseNo}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                              placeholder="Enter house number"
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Organization
                          </label>
                          <input
                            type="text"
                            name="organization"
                            value={formData.organization}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                            placeholder="Organization (optional)"
                          />
                        </div>
                      </div>

                      {/* Agent Information */}
                      <div>
                        <div className="flex items-center mb-3">
                          <input
                            type="checkbox"
                            name="hasAgent"
                            checked={formData.hasAgent}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                          />
                          <label className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Tenant has an agent
                          </label>
                        </div>

                        {formData.hasAgent && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Agent Full Name *
                              </label>
                              <input
                                type="text"
                                name="agentFullName"
                                required={formData.hasAgent}
                                value={formData.agentFullName}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                                placeholder="Enter agent name"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Agent Sex *
                              </label>
                              <select
                                name="agentSex"
                                required={formData.hasAgent}
                                value={formData.agentSex}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                              >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Agent Phone *
                              </label>
                              <input
                                type="tel"
                                name="agentPhone"
                                required={formData.hasAgent}
                                value={formData.agentPhone}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                                placeholder="Agent phone number"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Agent City *
                              </label>
                              <input
                                type="text"
                                name="agentCity"
                                required={formData.hasAgent}
                                value={formData.agentCity}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                                placeholder="Agent city"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Authentication No *
                              </label>
                              <input
                                type="text"
                                name="authenticationNo"
                                required={formData.hasAgent}
                                value={formData.authenticationNo}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                                placeholder="Authentication number"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Authentication Date *
                              </label>
                              <input
                                type="date"
                                name="authenticationDate"
                                required={formData.hasAgent}
                                value={formData.authenticationDate}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm dark:bg-blue-700 dark:hover:bg-blue-600"
                  >
                    {editingTenant ? 'Update Tenant' : 'Add Tenant'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingTenant(null);
                      resetForm();
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tenants;