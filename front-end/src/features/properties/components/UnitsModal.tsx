// =======================================================================
// 📂 src/features/properties/components/UnitsModal.tsx
// Modal component to display a list of units for a selected property.
// =======================================================================
import React from 'react';
import { Plus, Edit, Trash2, Home } from 'lucide-react';
import { Unit } from '../types';

interface UnitsModalProps {
    isOpen: boolean;
    onClose: () => void;
    units: Unit[];
    propertyName: string;
    onAddUnit: () => void;
    onEditUnit: (unit: Unit) => void;
    onDeleteUnit: (unit: Unit) => void;
}

export const UnitsModal: React.FC<UnitsModalProps> = ({ 
    isOpen, 
    onClose, 
    units, 
    propertyName, 
    onAddUnit,
    onEditUnit,
    onDeleteUnit
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen">
                <div className="fixed inset-0 bg-gray-500 opacity-75 dark:bg-gray-900"></div>
                <div className="inline-block bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-4xl sm:w-full">
                    <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Units - {propertyName}</h3>
                            <div className="flex items-center space-x-2">
                                <button 
                                    onClick={onAddUnit} 
                                    className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                                >
                                    <Plus className="h-4 w-4 mr-1" /> Add Unit
                                </button>
                                <button 
                                    onClick={onClose} 
                                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Unit</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Details</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Rent</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tenant</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {units.map((unit) => (
                                        <tr key={unit.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">Unit {unit.unit_number}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">{unit.room_count} rooms</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">${unit.monthly_rent}/mo</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs rounded-full ${unit.is_occupied ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}>
                                                    {unit.is_occupied ? 'Occupied' : 'Vacant'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">{unit.tenant_name || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button 
                                                        onClick={() => onEditUnit(unit)}
                                                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    {!unit.is_occupied && (
                                                        <button 
                                                            onClick={() => onDeleteUnit(unit)}
                                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                        >
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
                        {units.length === 0 && (
                            <div className="text-center py-8">
                                <Home className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No units yet</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">Add units to this property to get started</p>
                                <button 
                                    onClick={onAddUnit} 
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                                >
                                    <Plus className="h-4 w-4 mr-2" /> Add Unit
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};