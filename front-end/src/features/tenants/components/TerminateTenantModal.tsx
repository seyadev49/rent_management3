import React, { useEffect, useState } from 'react';

interface Deduction {
  id: number | string;
  description: string;
  amount: number;
}

interface TerminationFormData {
  terminationDate: string;
  terminationReason: string;
  securityDepositAction: string;
  partialReturnAmount: string;
  deductions: Deduction[];
  notes: string;
}

interface TerminateTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: TerminationFormData;
  onFormChange: (data: Partial<TerminationFormData>) => void;
  tenantName: string;
  tenantId?: string | number;
  token?: string;
}

export const TerminateTenantModal: React.FC<TerminateTenantModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onFormChange,
  tenantName,
  tenantId,
  token,
}) => {
  const [securityDeposit, setSecurityDeposit] = useState<number | null>(null);
const [depositLoading, setDepositLoading] = useState(false);
const [depositError, setDepositError] = useState<string | null>(null);
useEffect(() => {
  if (!isOpen || !tenantId || !token) return;

  let isCancelled = false; // to avoid state update after unmount
  setDepositLoading(true);
  setDepositError(null);
  setSecurityDeposit(null);

  const fetchDeposit = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/tenants/${tenantId}/security-deposit`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log('[DepositEffect] Response status:', res.status);

      if (!res.ok) {
        // handle non-200 responses
        const errText = await res.text();
        throw new Error(`Server error ${res.status}: ${errText}`);
      }

      const data = await res.json();
      console.log('[DepositEffect] Data received:', data);

      if (!isCancelled) {
        if (data && typeof data.securityDeposit === 'number') {
          setSecurityDeposit(data.securityDeposit);
        } else {
          setSecurityDeposit(null); // fallback if field missing
        }
      }
    } catch (error: any) {
      console.error('[DepositEffect] Error fetching deposit:', error);
      if (!isCancelled) setDepositError('Could not retrieve security deposit.');
    } finally {
      if (!isCancelled) setDepositLoading(false);
    }
  };

  // set a fail-safe timeout so Loading never stays forever
  const timeout = setTimeout(() => {
    if (!isCancelled && depositLoading) {
      setDepositLoading(false);
      setDepositError('Request timed out.');
    }
  }, 7000); // 7 seconds timeout

  fetchDeposit();

  return () => {
    isCancelled = true;
    clearTimeout(timeout);
  };
}, [isOpen, tenantId, token]);


  if (!isOpen) return null;

  // Add deduction with unique id
  const addDeduction = () => {
    onFormChange({
      deductions: [
        ...formData.deductions,
        { id: Date.now() + Math.random(), description: '', amount: 0 }
      ]
    });
  };

  // Remove deduction by id
  const removeDeduction = (id: number | string) => {
    onFormChange({ deductions: formData.deductions.filter((d) => d.id !== id) });
  };

  // Update deduction by id
  const updateDeduction = (
    id: number | string,
    field: 'description' | 'amount',
    value: string | number
  ) => {
    const updatedDeductions = formData.deductions.map((d) =>
      d.id === id ? { ...d, [field]: value } : d
    );
    onFormChange({ deductions: updatedDeductions });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen">
        <div className="fixed inset-0 bg-gray-500 opacity-75"></div>
        <div className="inline-block bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full">
          <form onSubmit={onSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Terminate Tenant: {tenantName}
              </h3>
              {/* Security Deposit Info */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Security Deposit:
                </label>
                {depositError ? (
  <div className="text-red-600 text-sm">{depositError}</div>
) : securityDeposit !== null ? (
  <div className="text-green-700 font-semibold text-lg">
    {securityDeposit} ETB
  </div>
) : (
  <div className="text-gray-500 text-sm">No security deposit info.</div>
)}

              </div>
              <div className="space-y-4">
                <input
                  type="date"
                  name="terminationDate"
                  required
                  value={formData.terminationDate}
                  onChange={(e) => onFormChange({ terminationDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <select
                  name="terminationReason"
                  required
                  value={formData.terminationReason}
                  onChange={(e) => onFormChange({ terminationReason: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select reason</option>
                  <option value="lease_expired">Lease Expired</option>
                  <option value="tenant_request">Tenant Request</option>
                  <option value="non_payment">Non-Payment</option>
                  <option value="lease_violation">Lease Violation</option>
                  <option value="property_sale">Property Sale</option>
                  <option value="other">Other</option>
                </select>
                <select
                  name="securityDepositAction"
                  required
                  value={formData.securityDepositAction}
                  onChange={(e) => onFormChange({ securityDepositAction: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="return_full">Return Full Deposit</option>
                  <option value="return_partial">Return Partial Deposit</option>
                  <option value="keep_full">Keep Full Deposit</option>
                </select>
                {formData.securityDepositAction === 'return_partial' && (
                  <input
                    type="number"
                    value={formData.partialReturnAmount}
                    min="0"
                    step="0.01"
                    onChange={(e) =>
                      onFormChange({ partialReturnAmount: e.target.value })
                    }
                    placeholder="Partial Return Amount"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                )}
                <div>
                  <label className="block text-sm">Deductions</label>
                  {formData.deductions.map((d) => (
                    <div key={d.id} className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        placeholder="Description"
                        value={d.description}
                        onChange={(e) =>
                          updateDeduction(d.id, 'description', e.target.value)
                        }
                        className="flex-1 px-3 py-2 border rounded-lg"
                      />
                      <input
                        type="number"
                        placeholder="Amount"
                        min="0"
                        step="0.01"
                        value={d.amount}
                        onChange={(e) =>
                          updateDeduction(d.id, 'amount', parseFloat(e.target.value) || 0)
                        }
                        className="w-24 px-3 py-2 border rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeDeduction(d.id)}
                        className="text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addDeduction}
                    className="text-blue-600 text-sm"
                  >
                    + Add Deduction
                  </button>
                </div>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    onFormChange({ notes: e.target.value })
                  }
                  rows={3}
                  placeholder="Additional Notes"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-lg border shadow-sm px-4 py-2 bg-red-600 text-white sm:ml-3 sm:w-auto"
              >
                Terminate Tenant
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-lg border shadow-sm px-4 py-2 bg-white text-gray-700 sm:mt-0 sm:ml-3 sm:w-auto"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};