import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApiWithLimitCheck } from '../hooks/useApiWithLimitCheck';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  UserX,
  Calendar,
  MapPin,
  Phone,
  Building2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface Tenant {
  id: number;
  tenant_id: string;
  full_name: string;
  sex: string;
  phone: string;
  city: string;
  subcity: string;
  woreda: string;
  house_no: string;
  organization: string;
  has_agent: boolean;
  agent_full_name?: string;
  agent_phone?: string;
  property_name?: string;
  unit_number?: string;
  monthly_rent?: number;
  contract_start_date?: string;
  contract_end_date?: string;
  contract_status?: string;
  days_until_expiry?: number;
  contract_id?: number;
  created_at: string;
}

interface Contract {
  id: number;
  property_name: string;
  unit_number: string;
  monthly_rent: number;
  contract_start_date: string;
  contract_end_date: string;
  status: string;
}

const Tenants: React.FC = () => {
  const { token } = useAuth();
  const { apiCall } = useApiWithLimitCheck();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
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
  const [terminationData, setTerminationData] = useState({
    terminationDate: new Date().toISOString().split('T')[0],
    terminationReason: '',
    securityDepositAction: 'return_full',
    partialReturnAmount: '',
    deductions: [] as Array<{description: string, amount: number}>,
    notes: '',
  });
  const [renewalData, setRenewalData] = useState({
    newEndDate: '',
    monthlyRent: '',
    deposit: '',
    notes: '',
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
      const createFn = async () => {
        const response = await fetch('http://localhost:5000/api/tenants', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw { response: { status: response.status, data: errorData } };
        }
        return response.json();
      };

      const result = await apiCall(createFn, 'tenants');

      if (result) {
        setShowAddModal(false);
        resetForm();
        fetchTenants();
      }
    } catch (error: any) {
      console.error('Failed to create tenant:', error);
      if (error?.response?.status !== 403) {
        alert('Failed to create tenant');
      }
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTenant) return;

    try {
      const response = await fetch(`http://localhost:5000/api/tenants/${selectedTenant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowEditModal(false);
        setSelectedTenant(null);
        resetForm();
        fetchTenants();
      }
    } catch (error) {
      console.error('Failed to update tenant:', error);
      alert('Failed to update tenant');
    }
  };

  const handleDelete = async (tenantId: number) => {
    if (!confirm('Are you sure you want to delete this tenant?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/tenants/${tenantId}`, {
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
      alert('Failed to delete tenant');
    }
  };

  const handleTerminate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTenant) return;

    try {
      const response = await fetch(`http://localhost:5000/api/tenants/${selectedTenant.id}/terminate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(terminationData),
      });

      if (response.ok) {
        setShowTerminateModal(false);
        setSelectedTenant(null);
        resetTerminationForm();
        fetchTenants();
        alert('Tenant terminated successfully');
      }
    } catch (error) {
      console.error('Failed to terminate tenant:', error);
      alert('Failed to terminate tenant');
    }
  };

  const handleRenewLease = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTenant?.contract_id) return;

    try {
      const response = await fetch(`http://localhost:5000/api/contracts/${selectedTenant.contract_id}/renew`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          newEndDate: renewalData.newEndDate,
          monthlyRent: parseFloat(renewalData.monthlyRent),
          deposit: parseFloat(renewalData.deposit),
          notes: renewalData.notes,
        }),
      });

      if (response.ok) {
        setShowRenewModal(false);
        setSelectedTenant(null);
        resetRenewalForm();
        fetchTenants();
        alert('Lease renewed successfully');
      }
    } catch (error) {
      console.error('Failed to renew lease:', error);
      alert('Failed to renew lease');
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

  const resetTerminationForm = () => {
    setTerminationData({
      terminationDate: new Date().toISOString().split('T')[0],
      terminationReason: '',
      securityDepositAction: 'return_full',
      partialReturnAmount: '',
      deductions: [],
      notes: '',
    });
  };

  const resetRenewalForm = () => {
    setRenewalData({
      newEndDate: '',
      monthlyRent: '',
      deposit: '',
      notes: '',
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const openEditModal = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setFormData({
      tenantId: tenant.tenant_id,
      fullName: tenant.full_name,
      sex: tenant.sex,
      phone: tenant.phone,
      city: tenant.city,
      subcity: tenant.subcity,
      woreda: tenant.woreda,
      houseNo: tenant.house_no,
      organization: tenant.organization || '',
      hasAgent: tenant.has_agent,
      agentFullName: tenant.agent_full_name || '',
      agentSex: 'Male',
      agentPhone: tenant.agent_phone || '',
      agentCity: '',
      agentSubcity: '',
      agentWoreda: '',
      agentHouseNo: '',
      authenticationNo: '',
      authenticationDate: '',
    });
    setShowEditModal(true);
  };

  const openTerminateModal = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setShowTerminateModal(true);
  };

  const openRenewModal = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setRenewalData({
      newEndDate: '',
      monthlyRent: tenant.monthly_rent?.toString() || '',
      deposit: '',
      notes: '',
    });
    setShowRenewModal(true);
  };

  const filteredTenants = tenants.filter(tenant =>
    tenant.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.phone.includes(searchTerm) ||
    (tenant.property_name && tenant.property_name.toLowerCase().includes(searchTerm.toLowerCase()))
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
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-gray-600">Manage your tenants and their information</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Tenant
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Search tenants..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Tenants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTenants.map((tenant) => (
          <div key={tenant.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{tenant.full_name}</h3>
                <p className="text-sm text-gray-600">ID: {tenant.tenant_id}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => openEditModal(tenant)}
                  className="text-yellow-600 hover:text-yellow-800"
                  title="Edit Tenant"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(tenant.id)}
                  className="text-red-600 hover:text-red-800"
                  title="Delete Tenant"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="h-4 w-4 mr-2" />
                <span>{tenant.phone}</span>
              </div>

              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2" />
                <span className="truncate">{tenant.city}, {tenant.subcity}</span>
              </div>

              {tenant.property_name && (
                <div className="flex items-center text-sm text-gray-600">
                  <Building2 className="h-4 w-4 mr-2" />
                  <span className="truncate">{tenant.property_name} - Unit {tenant.unit_number}</span>
                </div>
              )}

              {tenant.has_agent && (
                <div className="text-sm text-blue-600">
                  Agent: {tenant.agent_full_name}
                </div>
              )}
            </div>

            {/* Contract Info */}
            {tenant.contract_status === 'active' && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">Monthly Rent</span>
                  <span className="text-sm font-medium text-gray-900">${tenant.monthly_rent}</span>
                </div>
                
                {tenant.days_until_expiry !== null && (
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-gray-500">Contract Expires</span>
                    <span className={`text-sm font-medium ${
                      tenant.days_until_expiry <= 30 ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {tenant.days_until_expiry > 0 ? `${tenant.days_until_expiry} days` : 'Expired'}
                    </span>
                  </div>
                )}

                <div className="flex space-x-2">
                  {tenant.days_until_expiry <= 60 && tenant.days_until_expiry > 0 && (
                    <button
                      onClick={() => openRenewModal(tenant)}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Renew
                    </button>
                  )}
                  <button
                    onClick={() => openTerminateModal(tenant)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm"
                  >
                    <UserX className="h-3 w-3 mr-1" />
                    Terminate
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredTenants.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tenants found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'Try adjusting your search criteria' : 'Get started by adding your first tenant'}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Tenant
          </button>
        </div>
      )}

      {/* Add Tenant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 max-h-96 overflow-y-auto">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Tenant</h3>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tenant ID *
                          </label>
                          <input
                            type="text"
                            name="tenantId"
                            required
                            value={formData.tenantId}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="T001"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            name="fullName"
                            required
                            value={formData.fullName}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="John Doe"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sex *
                          </label>
                          <select
                            name="sex"
                            required
                            value={formData.sex}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone *
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            required
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0911123456"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            City *
                          </label>
                          <input
                            type="text"
                            name="city"
                            required
                            value={formData.city}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Addis Ababa"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Subcity *
                          </label>
                          <input
                            type="text"
                            name="subcity"
                            required
                            value={formData.subcity}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Bole"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Woreda *
                          </label>
                          <input
                            type="text"
                            name="woreda"
                            required
                            value={formData.woreda}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="01"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            House No *
                          </label>
                          <input
                            type="text"
                            name="houseNo"
                            required
                            value={formData.houseNo}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="123"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Organization
                        </label>
                        <input
                          type="text"
                          name="organization"
                          value={formData.organization}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Company name"
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="hasAgent"
                          checked={formData.hasAgent}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-900">
                          Has Agent
                        </label>
                      </div>

                      {formData.hasAgent && (
                        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-900">Agent Information</h4>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Agent Name
                              </label>
                              <input
                                type="text"
                                name="agentFullName"
                                value={formData.agentFullName}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Agent full name"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Agent Phone
                              </label>
                              <input
                                type="tel"
                                name="agentPhone"
                                value={formData.agentPhone}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="0911123456"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Add Tenant
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tenant Modal */}
      {showEditModal && selectedTenant && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <form onSubmit={handleUpdate}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 max-h-96 overflow-y-auto">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Tenant</h3>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tenant ID *
                          </label>
                          <input
                            type="text"
                            name="tenantId"
                            required
                            value={formData.tenantId}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            name="fullName"
                            required
                            value={formData.fullName}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sex *
                          </label>
                          <select
                            name="sex"
                            required
                            value={formData.sex}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone *
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            required
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            City *
                          </label>
                          <input
                            type="text"
                            name="city"
                            required
                            value={formData.city}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Subcity *
                          </label>
                          <input
                            type="text"
                            name="subcity"
                            required
                            value={formData.subcity}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Woreda *
                          </label>
                          <input
                            type="text"
                            name="woreda"
                            required
                            value={formData.woreda}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            House No *
                          </label>
                          <input
                            type="text"
                            name="houseNo"
                            required
                            value={formData.houseNo}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Organization
                        </label>
                        <input
                          type="text"
                          name="organization"
                          value={formData.organization}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="hasAgent"
                          checked={formData.hasAgent}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-900">
                          Has Agent
                        </label>
                      </div>

                      {formData.hasAgent && (
                        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-900">Agent Information</h4>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Agent Name
                              </label>
                              <input
                                type="text"
                                name="agentFullName"
                                value={formData.agentFullName}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Agent Phone
                              </label>
                              <input
                                type="tel"
                                name="agentPhone"
                                value={formData.agentPhone}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Update Tenant
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedTenant(null);
                      resetForm();
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Terminate Tenant Modal */}
      {showTerminateModal && selectedTenant && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleTerminate}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center mb-4">
                    <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900">Terminate Tenant</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Termination Date *
                      </label>
                      <input
                        type="date"
                        value={terminationData.terminationDate}
                        onChange={(e) => setTerminationData(prev => ({...prev, terminationDate: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Termination Reason *
                      </label>
                      <textarea
                        value={terminationData.terminationReason}
                        onChange={(e) => setTerminationData(prev => ({...prev, terminationReason: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        required
                        placeholder="Reason for termination..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Security Deposit Action *
                      </label>
                      <select
                        value={terminationData.securityDepositAction}
                        onChange={(e) => setTerminationData(prev => ({...prev, securityDepositAction: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="return_full">Return Full Deposit</option>
                        <option value="return_partial">Return Partial Deposit</option>
                        <option value="keep_full">Keep Full Deposit</option>
                      </select>
                    </div>

                    {terminationData.securityDepositAction === 'return_partial' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Partial Return Amount *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={terminationData.partialReturnAmount}
                          onChange={(e) => setTerminationData(prev => ({...prev, partialReturnAmount: e.target.value}))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                          placeholder="0.00"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Additional Notes
                      </label>
                      <textarea
                        value={terminationData.notes}
                        onChange={(e) => setTerminationData(prev => ({...prev, notes: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        placeholder="Additional notes..."
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Terminate Tenant
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTerminateModal(false);
                      setSelectedTenant(null);
                      resetTerminationForm();
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Renew Lease Modal */}
      {showRenewModal && selectedTenant && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleRenewLease}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center mb-4">
                    <RefreshCw className="h-6 w-6 text-green-600 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900">Renew Lease</h3>
                  </div>
                  
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900">Current Contract</h4>
                    <p className="text-sm text-blue-800">
                      {selectedTenant.full_name} - {selectedTenant.property_name} Unit {selectedTenant.unit_number}
                    </p>
                    <p className="text-sm text-blue-800">
                      Current End Date: {selectedTenant.contract_end_date ? new Date(selectedTenant.contract_end_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New End Date *
                      </label>
                      <input
                        type="date"
                        value={renewalData.newEndDate}
                        onChange={(e) => setRenewalData(prev => ({...prev, newEndDate: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Monthly Rent *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={renewalData.monthlyRent}
                          onChange={(e) => setRenewalData(prev => ({...prev, monthlyRent: e.target.value}))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                          placeholder="1000.00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Security Deposit
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={renewalData.deposit}
                          onChange={(e) => setRenewalData(prev => ({...prev, deposit: e.target.value}))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="2000.00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Renewal Notes
                      </label>
                      <textarea
                        value={renewalData.notes}
                        onChange={(e) => setRenewalData(prev => ({...prev, notes: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        placeholder="Notes about the renewal..."
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Renew Lease
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRenewModal(false);
                      setSelectedTenant(null);
                      resetRenewalForm();
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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