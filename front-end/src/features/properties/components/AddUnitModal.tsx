
// =======================================================================
// 📂 src/features/properties/components/AddUnitModal.tsx
// Modal component for adding a new unit to a property.
// =======================================================================
import React from 'react';

interface UnitFormData {
    unitNumber: string;
    floorNumber: string;
    roomCount: string;
    monthlyRent: string;
    deposit: string;
}

interface AddUnitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    formData: UnitFormData;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    propertyName: string;
}

export const AddUnitModal: React.FC<AddUnitModalProps> = ({ isOpen, onClose, onSubmit, formData, onInputChange, propertyName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen">
                <div className="fixed inset-0 bg-gray-500 opacity-75"></div>
                <div className="inline-block bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full">
                    <form onSubmit={onSubmit}>
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Unit - {propertyName}</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Number *</label>
                                    <input type="text" name="unitNumber" required value={formData.unitNumber} onChange={onInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g., 101, A1"/>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Floor Number</label>
                                        <input type="number" name="floorNumber" min="0" value={formData.floorNumber} onChange={onInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Floor"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Room Count</label>
                                        <input type="number" name="roomCount" min="1" value={formData.roomCount} onChange={onInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Rooms"/>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent *</label>
                                        <input type="number" name="monthlyRent" required step="0.01" min="0" value={formData.monthlyRent} onChange={onInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="0.00"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Security Deposit *</label>
                                        <input type="number" name="deposit" required step="0.01" min="0" value={formData.deposit} onChange={onInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="0.00"/>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button type="submit" className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm">
                                Add Unit
                            </button>
                            <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

