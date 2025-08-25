
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Building, 
  Search,
  Users,
  Eye,
  MoreVertical,
  AlertCircle,
  UserX,
  UserCheck,
  Key,
  LogIn
} from 'lucide-react';

interface Organization {
  id: number;
  organization_name: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
  subscription_plan: string;
  subscription_status: string;
  trial_end_date?: string;
  total_users: number;
  total_properties: number;
  total_tenants: number;
  last_activity?: string;
}

interface OrganizationDetails {
  organization: Organization & {
    total_contracts: number;
    total_payments_received: number;
  };
  users: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
    last_login?: string;
    created_at: string;
    is_active: boolean;
  }>;
  activityLogs: Array<{
    action: string;
    details: string;
    created_at: string;
    user_name: string;
  }>;
}

const Organizations: React.FC = () => {
  const { token } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<OrganizationDetails | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchOrganizations();
  }, [token]);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/users/organizations', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrganizations(data);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizationDetails = async (orgId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/organizations/${orgId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedOrg(data);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Error fetching organization details:', error);
    }
  };

  const toggleOrganizationStatus = async (orgId: number, action: 'suspend' | 'reactivate', reason?: string) => {
    setActionLoading(`${action}-${orgId}`);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/organizations/${orgId}/toggle-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, reason }),
      });

      if (response.ok) {
        await fetchOrganizations();
        if (selectedOrg && selectedOrg.organization.id === orgId) {
          await fetchOrganizationDetails(orgId);
        }
      }
    } catch (error) {
      console.error('Error toggling organization status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const resetUserPassword = async (userId: number) => {
    const newPassword = prompt('Enter new password for user:');
    if (!newPassword) return;

    setActionLoading(`password-${userId}`);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      });

      if (response.ok) {
        alert('Password reset successfully');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const impersonateUser = async (userId: number) => {
    setActionLoading(`impersonate-${userId}`);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/users/${userId}/impersonate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Open user dashboard in new tab with impersonation token
        const newWindow = window.open(`http://localhost:5173/dashboard?impersonate=${data.impersonationToken}`, '_blank');
        if (newWindow) {
          alert(`Impersonating ${data.userDetails.name} (${data.userDetails.email})`);
        }
      }
    } catch (error) {
      console.error('Error impersonating user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredOrganizations = organizations.filter(org =>
    (org.organization_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     org.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterStatus === '' || org.subscription_status === filterStatus)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'basic': return 'bg-yellow-100 text-yellow-800';
      case 'professional': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
          <p className="text-gray-600">Manage client organizations and their subscriptions</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="cancelled">Cancelled</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrganizations.map((org) => (
          <div key={org.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{org.organization_name}</h3>
                  <p className="text-sm text-gray-600">{org.email}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(org.subscription_status)}`}>
                  {org.subscription_status}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Plan:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanColor(org.subscription_plan)}`}>
                  {org.subscription_plan}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Users:</span>
                <span className="text-sm font-medium text-gray-900">{org.total_users}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Properties:</span>
                <span className="text-sm font-medium text-gray-900">{org.total_properties}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tenants:</span>
                <span className="text-sm font-medium text-gray-900">{org.total_tenants}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
              <button
                onClick={() => fetchOrganizationDetails(org.id)}
                className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                <Eye className="h-4 w-4 mr-1" />
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredOrganizations.length === 0 && (
        <div className="text-center py-12">
          <Building className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No organizations found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search criteria.' : 'No organizations to display.'}
          </p>
        </div>
      )}

      {/* Organization Details Modal */}
      {showDetailsModal && selectedOrg && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Organization Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Organization Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <p className="text-sm text-gray-900">{selectedOrg.organization.organization_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-sm text-gray-900">{selectedOrg.organization.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <p className="text-sm text-gray-900">{selectedOrg.organization.phone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <p className="text-sm text-gray-900">{selectedOrg.organization.address}</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                  {selectedOrg.organization.subscription_status === 'active' ? (
                    <button
                      onClick={() => toggleOrganizationStatus(selectedOrg.organization.id, 'suspend', 'Admin suspended')}
                      disabled={actionLoading === `suspend-${selectedOrg.organization.id}`}
                      className="flex items-center px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors duration-200 disabled:opacity-50"
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Suspend
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleOrganizationStatus(selectedOrg.organization.id, 'reactivate')}
                      disabled={actionLoading === `reactivate-${selectedOrg.organization.id}`}
                      className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Reactivate
                    </button>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-5 gap-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{selectedOrg.organization.total_users}</div>
                    <div className="text-sm text-gray-600">Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{selectedOrg.organization.total_properties}</div>
                    <div className="text-sm text-gray-600">Properties</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{selectedOrg.organization.total_tenants}</div>
                    <div className="text-sm text-gray-600">Tenants</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{selectedOrg.organization.total_contracts}</div>
                    <div className="text-sm text-gray-600">Contracts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">${selectedOrg.organization.total_payments_received}</div>
                    <div className="text-sm text-gray-600">Revenue</div>
                  </div>
                </div>

                {/* Users */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Users</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Login
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedOrg.users.map((user) => (
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                              <button
                                onClick={() => resetUserPassword(user.id)}
                                disabled={actionLoading === `password-${user.id}`}
                                className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50"
                              >
                                <Key className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => impersonateUser(user.id)}
                                disabled={actionLoading === `impersonate-${user.id}`}
                                className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                              >
                                <LogIn className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedOrg.activityLogs.map((log, index) => (
                      <div key={index} className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{log.action}</div>
                          <div className="text-xs text-gray-500">by {log.user_name}</div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(log.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Organizations;
