
// =======================================================================
// 📂 src/features/properties/components/ContractFormModal.tsx
// Modal component for creating a new lease contract.
// =======================================================================
import React from 'react';
import { Unit, Tenant } from '../types';

interface ContractFormData {
    unitId: string;
    tenantId: string;
    leaseDuration: number;
    paymentTerm: number;
    contractStartDate: string;
    contractEndDate: string;
    monthlyRent: string;
    deposit: string;
    eeuPayment: number;
    waterPayment: number;
    generatorPayment: number;
    rentStartDate: string;
    rentEndDate: string;
}

interface ContractFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    formData: ContractFormData;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    propertyName: string;
    availableUnits: Unit[];
    tenants: Tenant[];
}

export const ContractFormModal: React.FC<ContractFormModalProps> = ({
    isOpen, onClose, onSubmit, formData, onInputChange, propertyName, availableUnits, tenants
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen">
                <div className="fixed inset-0 bg-gray-500 opacity-75"></div>
                <div className="inline-block bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-2xl sm:w-full">
                    <form onSubmit={onSubmit}>
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 max-h-[80vh] overflow-y-auto">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Create Contract - {propertyName}</h3>
                            <div className="space-y-6">
                                {/* Contract Details */}
                                <div>
                                    <h4 className="text-md font-medium text-gray-800 mb-3">Contract Details</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <select name="unitId" required value={formData.unitId} onChange={onInputChange} className="w-full px-3 py-2 border rounded-lg" aria-label="Unit"><option value="">Select a unit</option>{availableUnits.map(u => <option key={u.id} value={u.id}>Unit {u.unit_number}</option>)}</select>
                                        <select name="tenantId" required value={formData.tenantId} onChange={onInputChange} className="w-full px-3 py-2 border rounded-lg" aria-label="Tenant"><option value="">Select a tenant</option>{tenants.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}</select>
                                        <input type="number" name="leaseDuration" required min="1" value={formData.leaseDuration} onChange={onInputChange} placeholder="Lease Duration (months)" className="w-full px-3 py-2 border rounded-lg"/>
                                        <select name="paymentTerm" required value={formData.paymentTerm} onChange={onInputChange} className="w-full px-3 py-2 border rounded-lg" aria-label="Payment Term"><option value={1}>Monthly</option><option value={3}>Quarterly</option><option value={6}>Semi-Annual</option><option value={12}>Annual</option></select>
                                        <input type="date" name="contractStartDate" required value={formData.contractStartDate} onChange={onInputChange} className="w-full px-3 py-2 border rounded-lg"/>
                                        <input type="date" name="contractEndDate" required value={formData.contractEndDate} onChange={onInputChange} className="w-full px-3 py-2 border rounded-lg"/>
                                    </div>
                                </div>
                                {/* Financial Details */}
                                <div>
                                    <h4 className="text-md font-medium text-gray-800 mb-3">Financial Details</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input type="number" name="monthlyRent" required value={formData.monthlyRent} onChange={onInputChange} placeholder="Monthly Rent" className="w-full px-3 py-2 border rounded-lg"/>
                                        <input type="number" name="deposit" required value={formData.deposit} onChange={onInputChange} placeholder="Security Deposit" className="w-full px-3 py-2 border rounded-lg"/>
                                        <input type="number" name="eeuPayment" value={formData.eeuPayment} onChange={onInputChange} placeholder="EEU Payment" className="w-full px-3 py-2 border rounded-lg"/>
                                        <input type="number" name="waterPayment" value={formData.waterPayment} onChange={onInputChange} placeholder="Water Payment" className="w-full px-3 py-2 border rounded-lg"/>
                                        <input type="number" name="generatorPayment" value={formData.generatorPayment} onChange={onInputChange} placeholder="Generator Payment" className="w-full px-3 py-2 border rounded-lg"/>
                                    </div>
                                </div>
                                {/* Rent Period */}
                                <div>
                                    <h4 className="text-md font-medium text-gray-800 mb-3">Rent Period</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input type="date" name="rentStartDate" required value={formData.rentStartDate} onChange={onInputChange} className="w-full px-3 py-2 border rounded-lg"/>
                                        <input type="date" name="rentEndDate" required value={formData.rentEndDate} onChange={onInputChange} className="w-full px-3 py-2 border rounded-lg"/>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button type="submit" className="w-full inline-flex justify-center rounded-lg border shadow-sm px-4 py-2 bg-blue-600 text-white sm:ml-3 sm:w-auto">Create Contract</button>
                            <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-lg border shadow-sm px-4 py-2 bg-white text-gray-700 sm:mt-0 sm:ml-3 sm:w-auto">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

