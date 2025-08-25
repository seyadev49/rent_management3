
// =======================================================================
// 📂 src/features/properties/Properties.tsx
// Main container component that manages state and renders child components.
// =======================================================================
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Adjust path as needed
import { useApiWithLimitCheck } from '../hooks/useApiWithLimitCheck'; // Adjust path as needed
import { Plus, Building2 } from 'lucide-react';
import { Property, Unit, Tenant } from './types';
import { PropertyCard } from './components/PropertyCard';
import { PropertyFormModal } from './components/PropertyFormModal';
import { AddUnitModal } from './components/AddUnitModal';
import { UnitsModal } from './components/UnitsModal';
import { ContractFormModal } from './components/ContractFormModal';

const API_BASE_URL = 'http://localhost:5000/api';

const Properties: React.FC = () => {
    const { token } = useAuth();
    const { apiCall } = useApiWithLimitCheck();

    // Component State
    const [properties, setProperties] = useState<Property[]>([]);
    const [propertyUnits, setPropertyUnits] = useState<Unit[]>([]);
    const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);
    const [formLoading, setFormLoading] = useState(false);

    // Modal Visibility State
    const [isPropertyModalOpen, setPropertyModalOpen] = useState(false);
    const [isUnitModalOpen, setUnitModalOpen] = useState(false);
    const [isUnitsViewerModalOpen, setUnitsViewerModalOpen] = useState(false);
    const [isContractModalOpen, setContractModalOpen] = useState(false);

    // Form Data State
    const initialPropertyFormData = { name: '', type: 'apartment', address: '', city: '', subcity: '', woreda: '', description: '' };
    const [propertyFormData, setPropertyFormData] = useState(initialPropertyFormData);

    const initialUnitFormData = { propertyId: '', unitNumber: '', floorNumber: '', roomCount: '', monthlyRent: '', deposit: '' };
    const [unitFormData, setUnitFormData] = useState(initialUnitFormData);

    const initialContractFormData = {
        propertyId: '', unitId: '', tenantId: '', leaseDuration: 12, contractStartDate: new Date().toISOString().split('T')[0], contractEndDate: '',
        monthlyRent: '', deposit: '', paymentTerm: 1, rentStartDate: new Date().toISOString().split('T')[0], rentEndDate: '',
        eeuPayment: 0, waterPayment: 0, generatorPayment: 0,
    };
    const [contractFormData, setContractFormData] = useState(initialContractFormData);

    // Data Fetching
    const fetchProperties = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/properties`, { headers: { Authorization: `Bearer ${token}` } });
            if (response.ok) {
                const data = await response.json();
                setProperties(data.properties);
            }
        } catch (error) {
            console.error('Failed to fetch properties:', error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    const fetchTenants = useCallback(async () => {
        try {
            const response = await apiCall(() => fetch(`${API_BASE_URL}/tenants`, { headers: { Authorization: `Bearer ${token}` } }), 'tenants');
            if (response.ok) {
                const data = await response.json();
                setTenants(data.tenants);
            }
        } catch (error) {
            console.error('Failed to fetch tenants:', error);
        }
    }, [token, apiCall]);
    
    useEffect(() => {
        fetchProperties();
        fetchTenants();
    }, [fetchProperties, fetchTenants]);

    // Handlers
    const handleOpenPropertyForm = (property: Property | null) => {
        setSelectedProperty(property);
        setPropertyFormData(property ? { ...property, woreda: property.woreda || '', description: property.description || '' } : initialPropertyFormData);
        setPropertyModalOpen(true);
    };

    const handlePropertySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        const url = selectedProperty ? `${API_BASE_URL}/properties/${selectedProperty.id}` : `${API_BASE_URL}/properties`;
        const method = selectedProperty ? 'PUT' : 'POST';

        try {
            const result = await apiCall(() => fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(propertyFormData),
            }), 'properties');

            if (result) {
                fetchProperties();
                setPropertyModalOpen(false);
            }
        } catch (error) {
            console.error('Failed to save property:', error);
        } finally {
            setFormLoading(false);
        }
    };
    
    // Render Logic
    if (loading) {
        return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Properties</h1>
                    <p className="text-gray-600">Manage your rental properties</p>
                </div>
                <button onClick={() => handleOpenPropertyForm(null)} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" /> Add Property
                </button>
            </div>

            {properties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {properties.map((prop) => (
                        <PropertyCard
                            key={prop.id}
                            property={prop}
                            onEdit={handleOpenPropertyForm}
                            onViewUnits={() => { /* Implement */ }}
                            onAddUnit={() => { /* Implement */ }}
                            onCreateContract={() => { /* Implement */ }}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No properties yet</h3>
                    <p className="text-gray-600 mb-4">Get started by adding your first property</p>
                    <button onClick={() => handleOpenPropertyForm(null)} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" /> Add Property
                    </button>
                </div>
            )}

            <PropertyFormModal
                isOpen={isPropertyModalOpen}
                onClose={() => setPropertyModalOpen(false)}
                onSubmit={handlePropertySubmit}
                formData={propertyFormData}
                onInputChange={(e) => setPropertyFormData({ ...propertyFormData, [e.target.name]: e.target.value })}
                isEditing={!!selectedProperty}
                isLoading={formLoading}
            />
            
            {/* Other modals would be rendered here, managed by their respective state */}
            
        </div>
    );
};

export default Properties;
