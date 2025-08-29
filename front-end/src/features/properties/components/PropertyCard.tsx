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
    onDelete: (property: Property) => void; // Add this prop
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ 
    property, 
    onEdit, 
    onViewUnits, 
    onAddUnit, 
    onCreateContract,
    onDelete 
}) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-48 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Building2 className="h-16 w-16 text-white opacity-80" />
            </div>
            <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{property.name}</h3>
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">{property.type}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <MapPin className="h-4 w-4 mr-1" /> {property.city}, {property.subcity}
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                    <div>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{property.total_units}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Total Units</p>
                    </div>
                    <div>
                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">{property.occupied_units}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Occupied</p>
                    </div>
                    <div>
                        <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">{property.vacant_units}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Vacant</p>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <button 
                            onClick={() => onEdit(property)} 
                            className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <Edit className="h-4 w-4" />
                        </button>
                        <button 
                            onClick={() => onDelete(property)} 
                            className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button 
                            onClick={() => onViewUnits(property)} 
                            className="flex items-center px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg"
                        >
                            <Home className="h-4 w-4 mr-1" /> View Units
                        </button>
                        <button 
                            onClick={() => onAddUnit(property)} 
                            className="flex items-center px-3 py-1 text-sm text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30 rounded-lg"
                        >
                            <Plus className="h-4 w-4 mr-1" /> Add Unit
                        </button>
                    </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button 
                        onClick={() => onCreateContract(property)} 
                        className="w-full flex items-center justify-center px-3 py-2 text-sm text-white bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 rounded-lg"
                    >
                        <FileText className="h-4 w-4 mr-1" /> New Contract
                    </button>
                </div>
            </div>
        </div>
    );
};