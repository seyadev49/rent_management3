
// =======================================================================
// 📂 src/features/properties/components/PropertyCard.tsx
// Component to display a single property in the grid.
// =======================================================================
import React from 'react';
import { Building2, MapPin, Edit, Trash2, Home, Plus, FileText } from 'lucide-react';
import { Property } from '../types';

interface PropertyCardProps {
    property: Property;
    onEdit: (property: Property) => void;
    onViewUnits: (property: Property) => void;
    onAddUnit: (property: Property) => void;
    onCreateContract: (property: Property) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onEdit, onViewUnits, onAddUnit, onCreateContract }) => {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-48 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Building2 className="h-16 w-16 text-white opacity-80" />
            </div>
            <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{property.name}</h3>
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">{property.type}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 mb-3">
                    <MapPin className="h-4 w-4 mr-1" /> {property.city}, {property.subcity}
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                    <div>
                        <p className="text-lg font-semibold text-gray-900">{property.total_units}</p>
                        <p className="text-xs text-gray-600">Total Units</p>
                    </div>
                    <div>
                        <p className="text-lg font-semibold text-green-600">{property.occupied_units}</p>
                        <p className="text-xs text-gray-600">Occupied</p>
                    </div>
                    <div>
                        <p className="text-lg font-semibold text-blue-600">{property.vacant_units}</p>
                        <p className="text-xs text-gray-600">Vacant</p>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <button onClick={() => onEdit(property)} className="p-2 text-gray-600 hover:text-blue-600 rounded-lg"><Edit className="h-4 w-4" /></button>
                        <button className="p-2 text-gray-600 hover:text-red-600 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                    </div>
                    <div className="flex items-center space-x-2">
                         <button onClick={() => onViewUnits(property)} className="flex items-center px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg">
                            <Home className="h-4 w-4 mr-1" /> View Units
                        </button>
                        <button onClick={() => onAddUnit(property)} className="flex items-center px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded-lg">
                            <Plus className="h-4 w-4 mr-1" /> Add Unit
                        </button>
                    </div>
                </div>
                 <div className="mt-3 pt-3 border-t border-gray-200">
                    <button onClick={() => onCreateContract(property)} className="w-full flex items-center justify-center px-3 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg">
                        <FileText className="h-4 w-4 mr-1" /> New Contract
                    </button>
                </div>
            </div>
        </div>
    );
};

