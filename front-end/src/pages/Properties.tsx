import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Plus, Edit, Trash2, MapPin, FileText, Home } from 'lucide-react';

interface Property {
  id: number;
  name: string;
  type: string;
  address: string;
  city: string;
  subcity: string;
  total_units: number;
  occupied_units: number;
  vacant_units: number;
  created_at: string;
}

interface Unit {
  id: number;
  unit_number: string;
  floor_number?: number;
  room_count?: number;
  monthly_rent: number;
  deposit: number;
  is_occupied: boolean;
  tenant_name?: string;
}
interface Contract {
  id: number;
  tenant_name: string;
  property_name: string;
  unit_number: string;
  monthly_rent: number;
  status: string;
}

const Properties: React.FC = () => {
  const { token } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [propertyUnits, setPropertyUnits] = useState<Unit[]>([]);
  const [showContractModal, setShowContractModal] = useState(false);
  const [availableUnits, setAvailableUnits] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [unitFormData, setUnitFormData] = useState({
    propertyId: '',
    unitNumber: '',
    floorNumber: '',
    roomCount: '',
    monthlyRent: '',
    deposit: '',
  });
  const [contractFormData, setContractFormData] = useState({
    propertyId: '',
    unitId: '',
    tenantId: '',
    leaseDuration: 12,
    contractStartDate: new Date().toISOString().split('T')[0],
    contractEndDate: '',
    monthlyRent: '',
    deposit: '',
    paymentTerm: 1,
    rentStartDate: new Date().toISOString().split('T')[0],
    rentEndDate: '',
    eeuPayment: 0,
    waterPayment: 0,
    generatorPayment: 0,
  });
  const [formData, setFormData] = useState({
    name: '',
    type: 'apartment',
    address: '',
    city: '',
    subcity: '',
    woreda: '',
    description: '',
    totalUnits: 1,
    amenities: [] as string[],
    units: [] as any[],
  });

  useEffect(() => {
    fetchProperties();
    fetchTenants();
  }, [token]);

  const fetchProperties = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/properties', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProperties(data.properties);
      }
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPropertyUnits = async (propertyId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/units?propertyId=${propertyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPropertyUnits(data.units);
      }
    } catch (error) {
      console.error('Failed to fetch property units:', error);
    }
  };
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
    }
  };

  const fetchAvailableUnits = async (propertyId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/units?propertyId=${propertyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const vacantUnits = data.units?.filter((unit: any) => !unit.is_occupied) || [];
        setAvailableUnits(vacantUnits);
      }
    } catch (error) {
      console.error('Failed to fetch property units:', error);
    }
  };

  const handleViewUnits = (property: Property) => {
    setSelectedProperty(property);
    fetchPropertyUnits(property.id);
    setShowUnitsModal(true);
  };

  const handleAddUnit = (property: Property) => {
    setSelectedProperty(property);
    setUnitFormData(prev => ({
      ...prev,
      propertyId: property.id.toString(),
    }));
    setShowAddUnitModal(true);
  };

  const handleUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5000/api/units', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...unitFormData,
          floorNumber: unitFormData.floorNumber ? parseInt(unitFormData.floorNumber) : null,
          roomCount: unitFormData.roomCount ? parseInt(unitFormData.roomCount) : null,
          monthlyRent: parseFloat(unitFormData.monthlyRent),
          deposit: parseFloat(unitFormData.deposit),
        }),
      });

      if (response.ok) {
        setShowAddUnitModal(false);
        resetUnitForm();
        fetchProperties(); // Refresh to update unit counts
        if (showUnitsModal && selectedProperty) {
          fetchPropertyUnits(selectedProperty.id); // Refresh units list if modal is open
        }
      }
    } catch (error) {
      console.error('Failed to create unit:', error);
    }
  };

  const resetUnitForm = () => {
    setUnitFormData({
      propertyId: '',
      unitNumber: '',
      floorNumber: '',
      roomCount: '',
      monthlyRent: '',
      deposit: '',
    });
  };
  const handleCreateContract = (property: Property) => {
    setSelectedProperty(property);
    setContractFormData(prev => ({
      ...prev,
      propertyId: property.id.toString(),
    }));
    fetchAvailableUnits(property.id);
    setShowContractModal(true);
  };

  const handleContractSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5000/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(contractFormData),
      });

      if (response.ok) {
        setShowContractModal(false);
        resetContractForm();
        fetchProperties(); // Refresh to update occupancy
      }
    } catch (error) {
      console.error('Failed to create contract:', error);
    }
  };

  const resetContractForm = () => {
    setContractFormData({
      propertyId: '',
      unitId: '',
      tenantId: '',
      leaseDuration: 12,
      contractStartDate: new Date().toISOString().split('T')[0],
      contractEndDate: '',
      monthlyRent: '',
      deposit: '',
      paymentTerm: 1,
      rentStartDate: new Date().toISOString().split('T')[0],
      rentEndDate: '',
      eeuPayment: 0,
      waterPayment: 0,
      generatorPayment: 0,
    });
  };

  const handleUnitInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUnitFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleContractInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setContractFormData(prev => ({
      ...prev,
      [name]: name === 'leaseDuration' || name === 'paymentTerm' ? parseInt(value) : value,
    }));

    // Auto-calculate end dates
    if (name === 'contractStartDate' || name === 'leaseDuration') {
      const startDate = name === 'contractStartDate' ? new Date(value) : new Date(contractFormData.contractStartDate);
      const duration = name === 'leaseDuration' ? parseInt(value) : contractFormData.leaseDuration;
      
      if (startDate && duration) {
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + duration);
        setContractFormData(prev => ({
          ...prev,
          contractEndDate: endDate.toISOString().split('T')[0],
          rentEndDate: endDate.toISOString().split('T')[0],
        }));
      }
    }

    // Auto-fill rent amount from selected unit
    if (name === 'unitId' && value) {
      const selectedUnit = availableUnits.find(unit => unit.id === parseInt(value));
      if (selectedUnit) {
        setContractFormData(prev => ({
          ...prev,
          monthlyRent: selectedUnit.monthly_rent.toString(),
          deposit: selectedUnit.deposit.toString(),
        }));
      }
    }
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const response = await fetch('http://localhost:5000/api/properties', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      // Reset form and refresh list
      setShowAddModal(false);
      setFormData({
        name: '',
        type: 'apartment',
        address: '',
        city: '',
        subcity: '',
        woreda: '',
        description: '',
        totalUnits: 1,
        amenities: [],
        units: [],
      });
      fetchProperties();
    } else {
      // Try to read the error JSON from backend
      let errorMessage = 'Something went wrong. Please try again.';
      try {
        const data = await response.json();
        if (data?.message) {
          errorMessage = data.message;
        }
      } catch {
        // If response isn't JSON, ignore and use default
      }
      alert(errorMessage);
    }
  } catch (error) {
    console.error('Failed to create property:', error);
    alert('Failed to create property. Please check your network connection.');
  }
};

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'totalUnits' ? parseInt(value) : value,
    }));
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-600">Manage your rental properties</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </button>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <div key={property.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
            <div className="h-48 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Building2 className="h-16 w-16 text-white opacity-80" />
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{property.name}</h3>
                <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {property.type}
                </span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600 mb-3">
                <MapPin className="h-4 w-4 mr-1" />
                {property.city}, {property.subcity}
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">{property.total_units}</p>
                  <p className="text-xs text-gray-600">Total Units</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-green-600">{property.occupied_units}</p>
                  <p className="text-xs text-gray-600">Occupied</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-blue-600">{property.vacant_units}</p>
                  <p className="text-xs text-gray-600">Vacant</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handleViewUnits(property)}
                    className="flex items-center px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                  >
                    <Home className="h-4 w-4 mr-1" />
                    View Units
                  </button>
                  <button 
                    onClick={() => handleAddUnit(property)}
                    className="flex items-center px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Unit
                  </button>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-200">
                <button 
                  onClick={() => handleCreateContract(property)}
                  className="w-full flex items-center justify-center px-3 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors duration-200"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  New Contract
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {properties.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No properties yet</h3>
          <p className="text-gray-600 mb-4">Get started by adding your first property</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </button>
        </div>
      )}

      {/* View Units Modal */}
      {showUnitsModal && selectedProperty && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Units - {selectedProperty.name}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleAddUnit(selectedProperty)}
                      className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Unit
                    </button>
                    <button
                      onClick={() => setShowUnitsModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rent
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tenant
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {propertyUnits.map((unit) => (
                        <tr key={unit.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              Unit {unit.unit_number}
                            </div>
                            {unit.floor_number && (
                              <div className="text-sm text-gray-500">
                                Floor {unit.floor_number}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {unit.room_count && (
                              <div className="text-sm text-gray-900">
                                {unit.room_count} rooms
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              ${unit.monthly_rent}/mo
                            </div>
                            <div className="text-sm text-gray-500">
                              Deposit: ${unit.deposit}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              unit.is_occupied
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {unit.is_occupied ? 'Occupied' : 'Vacant'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {unit.tenant_name || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button className="text-indigo-600 hover:text-indigo-900">
                                <Edit className="h-4 w-4" />
                              </button>
                              {!unit.is_occupied && (
                                <button className="text-red-600 hover:text-red-900">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {propertyUnits.length === 0 && (
                  <div className="text-center py-8">
                    <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No units yet</h3>
                    <p className="text-gray-600 mb-4">Add units to this property to get started</p>
                    <button
                      onClick={() => handleAddUnit(selectedProperty)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Unit
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Unit Modal */}
      {showAddUnitModal && selectedProperty && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleUnitSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Add Unit - {selectedProperty.name}
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Unit Number *
                        </label>
                        <input
                          type="text"
                          name="unitNumber"
                          required
                          value={unitFormData.unitNumber}
                          onChange={handleUnitInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., 101, A1, etc."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Floor Number
                          </label>
                          <input
                            type="number"
                            name="floorNumber"
                            min="0"
                            value={unitFormData.floorNumber}
                            onChange={handleUnitInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Floor"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Room Count
                          </label>
                          <input
                            type="number"
                            name="roomCount"
                            min="1"
                            value={unitFormData.roomCount}
                            onChange={handleUnitInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Rooms"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Monthly Rent *
                          </label>
                          <input
                            type="number"
                            name="monthlyRent"
                            required
                            step="0.01"
                            min="0"
                            value={unitFormData.monthlyRent}
                            onChange={handleUnitInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0.00"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Security Deposit *
                          </label>
                          <input
                            type="number"
                            name="deposit"
                            required
                            step="0.01"
                            min="0"
                            value={unitFormData.deposit}
                            onChange={handleUnitInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Add Unit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddUnitModal(false);
                      resetUnitForm();
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
      {/* Add Property Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Property</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Property Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter property name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Property Type
                        </label>
                        <select
                          name="type"
                          value={formData.type}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="apartment">Apartment</option>
                          <option value="house">House</option>
                          <option value="shop">Shop</option>
                          <option value="office">Office</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address
                        </label>
                        <textarea
                          name="address"
                          required
                          value={formData.address}
                          onChange={handleInputChange}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter full address"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            City
                          </label>
                          <input
                            type="text"
                            name="city"
                            required
                            value={formData.city}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="City"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sub City
                          </label>
                          <input
                            type="text"
                            name="subcity"
                            value={formData.subcity}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Sub city"
                          />
                        </div>
                      </div>


                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Property description"
                        />
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                          <strong>Note:</strong> After creating the property, you can add individual units with specific details like rent amounts, floor numbers, and room counts.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Add Property
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
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

      {/* Create Contract Modal */}
      {showContractModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full max-h-screen overflow-y-auto">
              <form onSubmit={handleContractSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Create Contract - {selectedProperty?.name}
                    </h3>
                    
                    <div className="space-y-6">
                      {/* Basic Contract Info */}
                      <div>
                        <h4 className="text-md font-medium text-gray-800 mb-3">Contract Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Unit *
                            </label>
                            <select
                              name="unitId"
                              required
                              value={contractFormData.unitId}
                              onChange={handleContractInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select a unit</option>
                              {availableUnits.map((unit) => (
                                <option key={unit.id} value={unit.id}>
                                  Unit {unit.unit_number} - ${unit.monthly_rent}/month
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tenant *
                            </label>
                            <select
                              name="tenantId"
                              required
                              value={contractFormData.tenantId}
                              onChange={handleContractInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select a tenant</option>
                              {tenants.map((tenant) => (
                                <option key={tenant.id} value={tenant.id}>
                                  {tenant.full_name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Lease Duration (months) *
                            </label>
                            <input
                              type="number"
                              name="leaseDuration"
                              required
                              min="1"
                              value={contractFormData.leaseDuration}
                              onChange={handleContractInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Payment Term (months) *
                            </label>
                            <select
                              name="paymentTerm"
                              required
                              value={contractFormData.paymentTerm}
                              onChange={handleContractInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value={1}>Monthly</option>
                              <option value={3}>Quarterly</option>
                              <option value={6}>Semi-Annual</option>
                              <option value={12}>Annual</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Contract Start Date *
                            </label>
                            <input
                              type="date"
                              name="contractStartDate"
                              required
                              value={contractFormData.contractStartDate}
                              onChange={handleContractInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Contract End Date *
                            </label>
                            <input
                              type="date"
                              name="contractEndDate"
                              required
                              value={contractFormData.contractEndDate}
                              onChange={handleContractInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Financial Details */}
                      <div>
                        <h4 className="text-md font-medium text-gray-800 mb-3">Financial Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Monthly Rent *
                            </label>
                            <input
                              type="number"
                              name="monthlyRent"
                              required
                              step="0.01"
                              value={contractFormData.monthlyRent}
                              onChange={handleContractInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Security Deposit *
                            </label>
                            <input
                              type="number"
                              name="deposit"
                              required
                              step="0.01"
                              value={contractFormData.deposit}
                              onChange={handleContractInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              EEU Payment
                            </label>
                            <input
                              type="number"
                              name="eeuPayment"
                              step="0.01"
                              value={contractFormData.eeuPayment}
                              onChange={handleContractInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Water Payment
                            </label>
                            <input
                              type="number"
                              name="waterPayment"
                              step="0.01"
                              value={contractFormData.waterPayment}
                              onChange={handleContractInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Generator Payment
                            </label>
                            <input
                              type="number"
                              name="generatorPayment"
                              step="0.01"
                              value={contractFormData.generatorPayment}
                              onChange={handleContractInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Rent Period */}
                      <div>
                        <h4 className="text-md font-medium text-gray-800 mb-3">Rent Period</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Rent Start Date *
                            </label>
                            <input
                              type="date"
                              name="rentStartDate"
                              required
                              value={contractFormData.rentStartDate}
                              onChange={handleContractInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Rent End Date *
                            </label>
                            <input
                              type="date"
                              name="rentEndDate"
                              required
                              value={contractFormData.rentEndDate}
                              onChange={handleContractInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Create Contract
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowContractModal(false);
                      resetContractForm();
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

export default Properties;