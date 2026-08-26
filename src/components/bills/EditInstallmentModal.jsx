import { useState, useEffect, useMemo } from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import { computeInstallmentEndDate } from '../../services/firestoreService';

export default function EditInstallmentModal({ plan, isOpen, onClose, onSave }) {
  const { currencyInfo, formatCurrency } = useCurrency();

  const [name, setName] = useState('');
  const [bankOrMerchant, setBankOrMerchant] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [totalMonths, setTotalMonths] = useState('12');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (plan) {
      setName(plan.name || '');
      setBankOrMerchant(plan.bankOrMerchant || '');
      setMonthlyAmount(plan.monthlyAmount || plan.amount || '');
      setDueDate(plan.dueDate || plan.startDate || new Date().toISOString().split('T')[0]);
      setTotalMonths(String(plan.totalMonths || 12));
    }
  }, [plan, isOpen]);

  const computedEndDate = useMemo(() => {
    if (!dueDate || !totalMonths) return '';
    return computeInstallmentEndDate(dueDate, totalMonths);
  }, [dueDate, totalMonths]);

  const computedTotalAmount = useMemo(() => {
    if (!monthlyAmount || !totalMonths) return 0;
    return (parseFloat(monthlyAmount) || 0) * (parseInt(totalMonths, 10) || 0);
  }, [monthlyAmount, totalMonths]);

  if (!isOpen || !plan) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !monthlyAmount || !dueDate || !totalMonths) return;

    setIsSubmitting(true);
    try {
      const months = parseInt(totalMonths, 10) || 1;
      const monthlyAmt = parseFloat(monthlyAmount) || 0;
      const totalAmt = monthlyAmt * months;
      const endDate = computeInstallmentEndDate(dueDate, months);

      await onSave(plan.id, {
        name: name.trim(),
        bankOrMerchant: bankOrMerchant.trim(),
        amount: monthlyAmt,
        monthlyAmount: monthlyAmt,
        totalAmount: totalAmt,
        dueDate: dueDate,
        startDate: dueDate,
        endDate: endDate,
        totalMonths: months,
        note: `${bankOrMerchant.trim() ? `${bankOrMerchant.trim()} • ` : ''}Installment ${plan.currentInstallment || 1} of ${months}`,
      });
      onClose();
    } catch (err) {
      console.error('Failed to update installment plan:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <form
        onSubmit={handleSubmit}
        className="app-card max-w-md w-full p-5 sm:p-6 shadow-2xl border border-secondary/40 max-h-[90vh] flex flex-col relative space-y-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-installment-title"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-outline-variant/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-secondary text-2xl">edit_note</span>
            <h3 id="edit-installment-title" className="font-headline text-base sm:text-lg font-bold text-on-surface">
              Edit Installment Plan
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 text-outline hover:text-on-surface rounded-lg hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Inputs */}
        <div className="space-y-3 text-xs overflow-y-auto pr-1 flex-1 custom-scrollbar">
          <div>
            <label className="text-on-surface-variant font-semibold block mb-1">
              Particular / Item Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. iPhone 16 Pro, Laptop"
              className="w-full bg-surface-container px-3 py-2 rounded-lg text-on-surface outline-none focus:ring-1 focus:ring-secondary"
              required
            />
          </div>

          <div>
            <label className="text-on-surface-variant font-semibold block mb-1">
              Bank or Merchant
            </label>
            <input
              type="text"
              value={bankOrMerchant}
              onChange={(e) => setBankOrMerchant(e.target.value)}
              placeholder="e.g. BDO Credit Card, BPI, Maya"
              className="w-full bg-surface-container px-3 py-2 rounded-lg text-on-surface outline-none focus:ring-1 focus:ring-secondary"
              required
            />
          </div>

          <div>
            <label className="text-on-surface-variant font-semibold block mb-1">
              Monthly Payment Amount ({currencyInfo.symbol})
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={monthlyAmount}
              onChange={(e) => setMonthlyAmount(e.target.value)}
              className="w-full bg-surface-container px-3 py-2 rounded-lg text-on-surface outline-none focus:ring-1 focus:ring-secondary font-mono font-bold"
              required
            />
          </div>

          <div>
            <label className="text-on-surface-variant font-semibold block mb-1">
              Payment Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-surface-container px-3 py-2 rounded-lg text-on-surface outline-none focus:ring-1 focus:ring-secondary"
              required
            />
          </div>

          <div>
            <label className="text-on-surface-variant font-semibold block mb-1">
              Number of Months
            </label>
            <div className="flex gap-1.5 flex-wrap mb-2">
              {['3', '6', '12', '18', '24', '36'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTotalMonths(m)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    totalMonths === m
                      ? 'bg-secondary text-white shadow-xs'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {m} mos
                </button>
              ))}
            </div>
            <input
              type="number"
              min="1"
              max="120"
              value={totalMonths}
              onChange={(e) => setTotalMonths(e.target.value)}
              className="w-full bg-surface-container px-3 py-2 rounded-lg text-on-surface outline-none focus:ring-1 focus:ring-secondary font-mono"
              required
            />
          </div>

          {/* Computed Preview Card */}
          {computedEndDate && (
            <div className="p-3 bg-secondary/10 border border-secondary/30 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant font-medium">Recomputed End Date:</span>
                <span className="font-bold text-secondary">
                  {new Date(computedEndDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant font-medium">Total Contract Value:</span>
                <span className="font-mono font-bold text-on-surface">
                  {formatCurrency(computedTotalAmount)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 pt-2 border-t border-outline-variant/20 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-secondary text-white hover:bg-secondary/90 shadow-xs active:scale-98 transition-all flex items-center justify-center gap-1.5"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
