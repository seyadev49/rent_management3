
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  BarChart3, 
  Download, 
  Filter, 
  Calendar,
  DollarSign,
  Users,
  Building2,
  Wrench,
  FileText,
  TrendingUp,
  AlertTriangle,
  Home
} from 'lucide-react';

interface ReportData {
  financial: {
    totalCollected: number;
    outstanding: number;
    securityDeposits: number;
    expenses: number;
    revenue: any[];
  };
  tenant: {
    currentTenants: number;
    pastTenants: number;
    tenantList: any[];
    paymentHistory: any[];
  };
  property: {
    occupancyRate: number;
    vacantUnits: any[];
    propertyIncome: any[];
    expiringLeases: any[];
  };
  maintenance: {
    openRequests: number;
    completedRequests: number;
    averageResolutionTime: number;
    requestsByProperty: any[];
  };
}

const Reports: React.FC = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('financial');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: 'month',
    startDate: '',
    endDate: '',
    propertyId: '',
    tenantId: ''
  });
  const [properties, setProperties] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);

  const tabs = [
    { id: 'financial', name: 'Financial Reports', icon: DollarSign },
    { id: 'tenant', name: 'Tenant Reports', icon: Users },
    { id: 'property', name: 'Property Reports', icon: Building2 },
    { id: 'maintenance', name: 'Maintenance Reports', icon: Wrench }
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    generateReport();
  }, [filters, activeTab]);

  const fetchInitialData = async () => {
    try {
      const [propertiesRes, tenantsRes] = await Promise.all([
        fetch('http://localhost:5000/api/properties', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/tenants', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const propertiesData = await propertiesRes.json();
      const tenantsData = await tenantsRes.json();

      setProperties(propertiesData.properties || []);
      setTenants(tenantsData.tenants || []);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        type: activeTab,
        dateRange: filters.dateRange,
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.propertyId && { propertyId: filters.propertyId }),
        ...(filters.tenantId && { tenantId: filters.tenantId })
      });

      const response = await fetch(`http://localhost:5000/api/reports?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'pdf' | 'excel') => {
    try {
      const queryParams = new URLSearchParams({
        type: activeTab,
        format,
        dateRange: filters.dateRange,
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.propertyId && { propertyId: filters.propertyId }),
        ...(filters.tenantId && { tenantId: filters.tenantId })
      });

      const response = await fetch(`http://localhost:5000/api/reports/export?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}-report.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const renderFinancialReports = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Collected</p>
              <p className="text-2xl font-bold text-gray-900">
                ${reportData?.financial.totalCollected?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Outstanding</p>
              <p className="text-2xl font-bold text-gray-900">
                ${reportData?.financial.outstanding?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Security Deposits</p>
              <p className="text-2xl font-bold text-gray-900">
                ${reportData?.financial.securityDeposits?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Expenses</p>
              <p className="text-2xl font-bold text-gray-900">
                ${reportData?.financial.expenses?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue by Property */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Revenue by Property</h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monthly Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Occupied Units
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Occupancy Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData?.financial.revenue?.map((property: any, index: number) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {property.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${property.monthlyRevenue?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {property.occupiedUnits}/{property.totalUnits}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {property.occupancyRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTenantReports = () => (
    <div className="space-y-6">
      {/* Tenant Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Current Tenants</p>
              <p className="text-2xl font-bold text-gray-900">
                {reportData?.tenant.currentTenants || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Users className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Past Tenants</p>
              <p className="text-2xl font-bold text-gray-900">
                {reportData?.tenant.pastTenants || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tenant List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Tenant Information</h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lease Start
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lease End
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Outstanding Balance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData?.tenant.tenantList?.map((tenant: any, index: number) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {tenant.full_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tenant.property_name} - Unit {tenant.unit_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(tenant.contract_start_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(tenant.contract_end_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${tenant.outstanding_balance?.toLocaleString() || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPropertyReports = () => (
    <div className="space-y-6">
      {/* Property Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Home className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Occupancy Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {reportData?.property.occupancyRate || 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Vacant Units</p>
              <p className="text-2xl font-bold text-gray-900">
                {reportData?.property.vacantUnits?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Expiring Leases</p>
              <p className="text-2xl font-bold text-gray-900">
                {reportData?.property.expiringLeases?.length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Property Income */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Property Income Analysis</h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Units
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Occupied
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monthly Income
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Potential Income
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData?.property.propertyIncome?.map((property: any, index: number) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {property.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {property.totalUnits}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {property.occupiedUnits}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${property.monthlyIncome?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${property.potentialIncome?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMaintenanceReports = () => (
    <div className="space-y-6">
      {/* Maintenance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Wrench className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Open Requests</p>
              <p className="text-2xl font-bold text-gray-900">
                {reportData?.maintenance.openRequests || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Wrench className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {reportData?.maintenance.completedRequests || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Resolution Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {reportData?.maintenance.averageResolutionTime || 0} days
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance by Property */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Maintenance Requests by Property</h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Open
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    In Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Cost
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData?.maintenance.requestsByProperty?.map((property: any, index: number) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {property.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {property.openRequests}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {property.inProgressRequests}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {property.completedRequests}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${property.totalCost?.toLocaleString() || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Generate comprehensive reports for your properties</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => exportReport('excel')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </button>
          <button
            onClick={() => exportReport('pdf')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 flex-1">
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>

            {filters.dateRange === 'custom' && (
              <>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </>
            )}

            <select
              value={filters.propertyId}
              onChange={(e) => setFilters({ ...filters, propertyId: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Properties</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>

            <select
              value={filters.tenantId}
              onChange={(e) => setFilters({ ...filters, tenantId: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Tenants</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div>
          {activeTab === 'financial' && renderFinancialReports()}
          {activeTab === 'tenant' && renderTenantReports()}
          {activeTab === 'property' && renderPropertyReports()}
          {activeTab === 'maintenance' && renderMaintenanceReports()}
        </div>
      )}
    </div>
  );
};

export default Reports;
