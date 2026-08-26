import { useState, useEffect, useMemo } from 'react';
import {
  getBillsFromFirestore,
  addBillToFirestore,
  payBillInFirestore,
  softDeleteBillInFirestore,
  computeInstallmentEndDate,
  updateInstallmentPlanInFirestore,
  payInstallmentInFullInFirestore,
} from '../services/firestoreService';
import { useCurrency } from '../context/CurrencyContext';
import InstallmentDetailModal from '../components/bills/InstallmentDetailModal';
import InstallmentManagerModal from '../components/bills/InstallmentManagerModal';
import EditInstallmentModal from '../components/bills/EditInstallmentModal';

function BillCard({ bill, onPay, onDelete, onViewPlan, onEdit, onPayInFull }) {
  const { formatCurrency } = useCurrency();
  const isInstallment = Boolean(bill.isInstallment);

  const statusConfig = {
    overdue: {
      borderColor: 'border-l-error',
      iconBg: 'bg-error-container',
      iconColor: 'text-on-error-container',
      icon: 'warning',
      statusText: 'Overdue',
      statusColor: 'text-error',
    },
    upcoming: {
      borderColor: isInstallment ? 'border-l-secondary' : 'border-l-warning',
      iconBg: isInstallment ? 'bg-secondary/15' : 'bg-tertiary-fixed',
      iconColor: isInstallment ? 'text-secondary' : 'text-on-tertiary-fixed-variant',
      icon: isInstallment ? 'credit_card' : 'event_upcoming',
      statusText: isInstallment ? 'Installment Due' : 'Upcoming',
      statusColor: isInstallment ? 'text-secondary font-semibold' : 'text-warning',
    },
    paid: {
      borderColor: 'border-l-success',
      iconBg: 'bg-secondary-container/40',
      iconColor: 'text-secondary',
      icon: 'check_circle',
      statusText: 'Paid',
      statusColor: 'text-secondary',
    },
  };

  const config = statusConfig[bill.status] || statusConfig.upcoming;

  const totalMonths = parseInt(bill.totalMonths, 10) || 1;
  const currentInstallment = parseInt(bill.currentInstallment, 10) || 1;
  const paidCount =
    bill.paidInstallments !== undefined
      ? parseInt(bill.paidInstallments, 10)
      : bill.status === 'paid'
      ? currentInstallment
      : currentInstallment - 1;
  const remainingMonths = Math.max(0, totalMonths - paidCount);

  return (
    <div
      className={`app-card border-l-4 ${config.borderColor} flex items-center justify-between p-3.5 hover:bg-surface-container/40 transition-all duration-150 group`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className={`w-10 h-10 rounded-full ${config.iconBg} ${config.iconColor} flex items-center justify-center shrink-0`}
        >
          <span className="material-symbols-outlined text-xl">{config.icon}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs sm:text-sm font-bold text-on-surface truncate">
              {bill.name}
            </span>
            {isInstallment ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-secondary/15 text-secondary px-1.5 py-0.5 rounded shrink-0">
                <span className="material-symbols-outlined text-xs">credit_card</span>
                {bill.bankOrMerchant ? `${bill.bankOrMerchant} • ` : ''}Month {currentInstallment}/{totalMonths}
              </span>
            ) : bill.recurring ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-surface-container px-1.5 py-0.5 rounded text-outline shrink-0">
                <span className="material-symbols-outlined text-xs">repeat</span>
                Monthly
              </span>
            ) : null}
          </div>

          <p className={`text-xs font-semibold ${config.statusColor} truncate mt-0.5`}>
            {config.statusText} •{' '}
            {new Date(bill.dueDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>

          {isInstallment && (
            <p className="text-[11px] text-on-surface-variant truncate mt-0.5">
              {remainingMonths > 0 ? `${remainingMonths} months remaining` : 'Final installment'}
              {bill.endDate ? ` • Ends ${new Date(bill.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : ''}
            </p>
          )}

          {bill.note && !isInstallment && (
            <p className="text-[11px] text-on-surface-variant truncate mt-0.5">{bill.note}</p>
          )}
        </div>
      </div>

      <div className="text-right shrink-0 flex flex-col items-end gap-1.5 pl-2">
        <div className="text-sm sm:text-base font-mono font-bold text-on-surface">
          {formatCurrency(bill.amount)}
          {isInstallment && <span className="text-[10px] text-outline block font-normal font-sans">/ month</span>}
        </div>
        <div className="flex items-center gap-1">
          {isInstallment && (
            <button
              onClick={() => onViewPlan?.(bill)}
              className="text-[11px] font-semibold text-secondary hover:bg-secondary/10 px-2 py-1 rounded-lg transition-colors flex items-center gap-0.5"
            >
              <span className="material-symbols-outlined text-sm">visibility</span>
              <span>Plan</span>
            </button>
          )}
          {bill.status !== 'paid' && (
            <button
              onClick={() => onPay?.(bill)}
              className="bg-secondary text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-secondary/90 active:scale-95 transition-all shadow-xs"
            >
              Pay Now
            </button>
          )}
          <button
            title="Delete Bill (retained 6 months)"
            onClick={() => onDelete?.(bill.id, bill.name)}
            className="p-1 text-outline hover:text-error rounded-md hover:bg-error-container/20 opacity-70 group-hover:opacity-100 transition-opacity"
          >
            <span className="material-symbols-outlined text-base">delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Bills() {
  const { currencyInfo, formatCurrency } = useCurrency();
  const [billsList, setBillsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [selectedInstallmentBill, setSelectedInstallmentBill] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Form mode: 'standard' | 'installment'
  const [billType, setBillType] = useState('standard');

  // Form state
  const [newBillName, setNewBillName] = useState('');
  const [newBillBank, setNewBillBank] = useState('');
  const [newBillAmount, setNewBillAmount] = useState('');
  const [newBillDueDate, setNewBillDueDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [newBillMonths, setNewBillMonths] = useState('12');
  const [newBillRecurring, setNewBillRecurring] = useState(true);
  const [newBillNote, setNewBillNote] = useState('');

  const filters = ['All Bills', 'Unpaid', 'Paid', 'Installments', 'Recurring', 'Overdue'];

  useEffect(() => {
    loadBills();
  }, []);

  async function loadBills() {
    setLoading(true);
    try {
      const data = await getBillsFromFirestore();
      setBillsList(data);
    } catch (err) {
      console.error('Failed to load bills:', err);
    } finally {
      setLoading(false);
    }
  }

  const installmentPlans = useMemo(() => {
    return billsList.filter((b) => b.isInstallment);
  }, [billsList]);

  const filteredBills = useMemo(() => {
    if (activeFilter === 'all') return billsList;
    if (activeFilter === 'unpaid') return billsList.filter((b) => b.status !== 'paid');
    if (activeFilter === 'paid') return billsList.filter((b) => b.status === 'paid');
    if (activeFilter === 'installments') return billsList.filter((b) => b.isInstallment);
    if (activeFilter === 'recurring') return billsList.filter((b) => b.recurring && !b.isInstallment);
    if (activeFilter === 'overdue') return billsList.filter((b) => b.status === 'overdue');
    return billsList;
  }, [activeFilter, billsList]);

  const handlePay = async (bill) => {
    try {
      await payBillInFirestore(bill);
      await loadBills();
      if (bill.isInstallment) {
        const current = parseInt(bill.currentInstallment, 10) || 1;
        const total = parseInt(bill.totalMonths, 10) || 1;
        if (current >= total) {
          showToast(`Installment plan "${bill.name}" fully completed and paid! 🎉`);
        } else {
          showToast(`Month ${current} paid! Next installment (${current + 1}/${total}) scheduled.`);
        }
      } else if (bill.recurring) {
        showToast(`Bill marked as paid! Next month's cycle scheduled.`);
      } else {
        showToast('Bill marked as paid!');
      }
    } catch (err) {
      showToast('Error updating bill.', true);
    }
  };

  const handlePayInFull = async (plan) => {
    try {
      await payInstallmentInFullInFirestore(plan);
      await loadBills();
      showToast(`Installment plan "${plan.name}" settled in full early! 🎉`);
    } catch (err) {
      showToast('Error settling installment in full.', true);
    }
  };

  const handleSaveEditPlan = async (id, updates) => {
    try {
      await updateInstallmentPlanInFirestore(id, updates);
      await loadBills();
      showToast(`Installment plan "${updates.name}" updated successfully!`);
    } catch (err) {
      showToast('Failed to update installment plan.', true);
    }
  };

  const handleDelete = async (id, name) => {
    try {
      await softDeleteBillInFirestore(id);
      setBillsList((prev) => prev.filter((b) => b.id !== id));
      showToast(`Bill / Plan "${name}" soft-deleted (retained for 6 months).`);
    } catch (err) {
      showToast('Error deleting bill.', true);
    }
  };

  const computedEndDatePreview = useMemo(() => {
    if (billType !== 'installment' || !newBillDueDate || !newBillMonths) return '';
    return computeInstallmentEndDate(newBillDueDate, newBillMonths);
  }, [billType, newBillDueDate, newBillMonths]);

  const computedTotalAmountPreview = useMemo(() => {
    if (billType !== 'installment' || !newBillAmount || !newBillMonths) return 0;
    return (parseFloat(newBillAmount) || 0) * (parseInt(newBillMonths, 10) || 0);
  }, [billType, newBillAmount, newBillMonths]);

  const handleCreateBill = async (e) => {
    e.preventDefault();
    if (!newBillName.trim() || !newBillAmount || !newBillDueDate) return;

    try {
      if (billType === 'installment') {
        const months = parseInt(newBillMonths, 10) || 1;
        const monthlyAmt = parseFloat(newBillAmount);
        const totalAmt = monthlyAmt * months;
        const endDate = computeInstallmentEndDate(newBillDueDate, months);

        const created = await addBillToFirestore({
          name: newBillName.trim(),
          amount: monthlyAmt,
          monthlyAmount: monthlyAmt,
          totalAmount: totalAmt,
          dueDate: newBillDueDate,
          startDate: newBillDueDate,
          endDate: endDate,
          isInstallment: true,
          bankOrMerchant: newBillBank.trim(),
          totalMonths: months,
          currentInstallment: 1,
          paidInstallments: 0,
          category: 'installment',
          recurring: false,
          note: `${newBillBank.trim() ? `${newBillBank.trim()} • ` : ''}Installment 1 of ${months}`,
          status: new Date(newBillDueDate) < new Date() ? 'overdue' : 'upcoming',
        });
        setBillsList((prev) => [created, ...prev]);
        showToast(`Installment plan "${created.name}" created (${months} months)!`);
      } else {
        const created = await addBillToFirestore({
          name: newBillName.trim(),
          amount: parseFloat(newBillAmount),
          dueDate: newBillDueDate,
          recurring: newBillRecurring,
          note: newBillNote.trim(),
          status: new Date(newBillDueDate) < new Date() ? 'overdue' : 'upcoming',
        });
        setBillsList((prev) => [created, ...prev]);
        showToast('New bill added!');
      }

      setIsAddModalOpen(false);
      setNewBillName('');
      setNewBillBank('');
      setNewBillAmount('');
      setNewBillNote('');
      setNewBillMonths('12');
      setNewBillRecurring(true);
      setBillType('standard');
    } catch (err) {
      showToast('Failed to create bill.', true);
    }
  };

  function showToast(msg, isError = false) {
    setToastMessage({ text: msg, isError });
    setTimeout(() => setToastMessage(null), 4000);
  }

  const totalDue = billsList
    .filter((b) => b.status !== 'paid')
    .reduce((s, b) => s + (parseFloat(b.amount) || 0), 0);
  const totalPaid = billsList
    .filter((b) => b.status === 'paid')
    .reduce((s, b) => s + (parseFloat(b.amount) || 0), 0);
  const totalAll = totalDue + totalPaid;
  const paidPercent = totalAll > 0 ? Math.round((totalPaid / totalAll) * 100) : 0;

  return (
    <div className="space-y-4 pb-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-16 left-4 right-4 max-w-md mx-auto z-50 p-3.5 rounded-xl shadow-lg flex items-center justify-between text-xs font-semibold ${
            toastMessage.isError
              ? 'bg-error text-white'
              : 'bg-primary text-white dark:bg-surface-container-highest dark:text-primary-fixed'
          }`}
        >
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Installment Manager Maintenance Modal */}
      <InstallmentManagerModal
        isOpen={isManagerOpen}
        onClose={() => setIsManagerOpen(false)}
        plans={installmentPlans}
        onPay={handlePay}
        onPayInFull={handlePayInFull}
        onEdit={(plan) => setEditingPlan(plan)}
        onDelete={handleDelete}
        onAddNewPlan={() => {
          setBillType('installment');
          setIsAddModalOpen(true);
        }}
        onViewPlan={(plan) => setSelectedInstallmentBill(plan)}
      />

      {/* Edit Installment Plan Modal */}
      <EditInstallmentModal
        plan={editingPlan}
        isOpen={!!editingPlan}
        onClose={() => setEditingPlan(null)}
        onSave={handleSaveEditPlan}
      />

      {/* Installment Detail Modal */}
      <InstallmentDetailModal
        bill={selectedInstallmentBill}
        isOpen={!!selectedInstallmentBill}
        onClose={() => setSelectedInstallmentBill(null)}
        onPay={handlePay}
        onPayInFull={handlePayInFull}
        onEdit={(plan) => setEditingPlan(plan)}
        onDelete={handleDelete}
      />

      {/* Add Bill Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateBill}
            className="app-card max-w-md w-full space-y-4 shadow-xl border-secondary/40 max-h-[90vh] flex flex-col"
          >
            <div className="flex justify-between items-center shrink-0">
              <h3 className="font-headline text-base font-bold text-on-surface">
                {billType === 'installment' ? 'Create Installment Plan' : 'Add New Bill'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-outline hover:text-on-surface p-1"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Bill Type Switcher */}
            <div className="flex p-1 bg-surface-container rounded-xl shrink-0 gap-1">
              <button
                type="button"
                onClick={() => setBillType('standard')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  billType === 'standard'
                    ? 'bg-surface-container-lowest text-secondary shadow-xs font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-base">receipt_long</span>
                <span>Standard / Recurring</span>
              </button>
              <button
                type="button"
                onClick={() => setBillType('installment')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  billType === 'installment'
                    ? 'bg-surface-container-lowest text-secondary shadow-xs font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-base">credit_card</span>
                <span>Installment Plan</span>
              </button>
            </div>

            <div className="space-y-3 text-xs overflow-y-auto pr-1 flex-1 custom-scrollbar">
              <div>
                <label className="text-on-surface-variant font-semibold block mb-1">
                  {billType === 'installment' ? 'Particular / Item Name' : 'Bill Name / Service'}
                </label>
                <input
                  type="text"
                  value={newBillName}
                  onChange={(e) => setNewBillName(e.target.value)}
                  placeholder={
                    billType === 'installment'
                      ? 'e.g. iPhone 16 Pro, Laptop, Appliance'
                      : 'e.g. Electric Bill, Rent, Internet'
                  }
                  className="w-full bg-surface-container px-3 py-2 rounded-lg text-on-surface outline-none focus:ring-1 focus:ring-secondary"
                  required
                />
              </div>

              {billType === 'installment' && (
                <div>
                  <label className="text-on-surface-variant font-semibold block mb-1">
                    Bank or Merchant
                  </label>
                  <input
                    type="text"
                    value={newBillBank}
                    onChange={(e) => setNewBillBank(e.target.value)}
                    placeholder="e.g. BDO Credit Card, BPI, Maya, Shopee, Apple Store"
                    className="w-full bg-surface-container px-3 py-2 rounded-lg text-on-surface outline-none focus:ring-1 focus:ring-secondary"
                    required
                  />
                </div>
              )}

              <div>
                <label className="text-on-surface-variant font-semibold block mb-1">
                  {billType === 'installment' ? 'Monthly Payment Amount' : 'Amount'} ({currencyInfo.symbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={newBillAmount}
                  onChange={(e) => setNewBillAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-surface-container px-3 py-2 rounded-lg text-on-surface outline-none focus:ring-1 focus:ring-secondary font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-on-surface-variant font-semibold block mb-1">
                  {billType === 'installment' ? 'Date of 1st Payment' : 'Due Date'}
                </label>
                <input
                  type="date"
                  value={newBillDueDate}
                  onChange={(e) => setNewBillDueDate(e.target.value)}
                  className="w-full bg-surface-container px-3 py-2 rounded-lg text-on-surface outline-none focus:ring-1 focus:ring-secondary"
                  required
                />
              </div>

              {billType === 'installment' && (
                <div>
                  <label className="text-on-surface-variant font-semibold block mb-1">
                    Number of Months
                  </label>
                  <div className="flex gap-1.5 flex-wrap mb-2">
                    {['3', '6', '12', '18', '24', '36'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setNewBillMonths(m)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          newBillMonths === m
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
                    value={newBillMonths}
                    onChange={(e) => setNewBillMonths(e.target.value)}
                    placeholder="Enter number of months"
                    className="w-full bg-surface-container px-3 py-2 rounded-lg text-on-surface outline-none focus:ring-1 focus:ring-secondary font-mono"
                    required
                  />
                </div>
              )}

              {/* Installment Computed Preview */}
              {billType === 'installment' && computedEndDatePreview && (
                <div className="p-3 bg-secondary/10 border border-secondary/30 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-on-surface-variant font-medium">Computed End Date:</span>
                    <span className="font-bold text-secondary">
                      {new Date(computedEndDatePreview).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-on-surface-variant font-medium">Total Plan Value:</span>
                    <span className="font-mono font-bold text-on-surface">
                      {formatCurrency(computedTotalAmountPreview)}
                    </span>
                  </div>
                  <p className="text-[11px] text-outline pt-1 border-t border-outline-variant/20">
                    Auto-schedules monthly payments. Automatically graduates and leaves billing upon paying the {newBillMonths}th installment.
                  </p>
                </div>
              )}

              {/* Recurring Switch for Standard Bill */}
              {billType === 'standard' && (
                <div className="flex items-center justify-between p-2.5 bg-surface-container/60 rounded-xl">
                  <div>
                    <span className="text-xs font-semibold text-on-surface block">Recurring Bill</span>
                    <span className="text-[11px] text-outline block">Auto-schedules next month upon payment</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewBillRecurring(!newBillRecurring)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      newBillRecurring ? 'bg-secondary' : 'bg-surface-dim dark:bg-surface-container-highest'
                    }`}
                  >
                    <span
                      className={`${
                        newBillRecurring ? 'translate-x-5' : 'translate-x-0'
                      } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>
              )}

              {billType === 'standard' && (
                <div>
                  <label className="text-on-surface-variant font-semibold block mb-1">Note / Memo (Optional)</label>
                  <input
                    type="text"
                    value={newBillNote}
                    onChange={(e) => setNewBillNote(e.target.value)}
                    placeholder="e.g. Account #1234"
                    className="w-full bg-surface-container px-3 py-2 rounded-lg text-on-surface outline-none focus:ring-1 focus:ring-secondary"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 py-2 rounded-lg text-xs font-semibold bg-surface-container text-on-surface hover:bg-surface-container-high"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-lg text-xs font-semibold bg-secondary text-white hover:bg-secondary/90 shadow-xs"
              >
                {billType === 'installment' ? 'Create Installment Plan' : 'Create Bill'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Summary Section */}
      <section className="app-card space-y-3">
        <div className="flex justify-between items-end gap-2 flex-wrap">
          <div>
            <p className="text-xs text-on-surface-variant mb-0.5">Total due this month</p>
            <h2 className="font-headline text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
              {formatCurrency(totalDue)}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsManagerOpen(true)}
              className="bg-surface-container hover:bg-surface-container-high text-secondary border border-secondary/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold active:scale-95 transition-all shadow-xs"
            >
              <span className="material-symbols-outlined text-base">account_balance</span>
              <span>Manage Plans</span>
              {installmentPlans.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-secondary text-white text-[10px] font-bold flex items-center justify-center">
                  {installmentPlans.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-secondary text-white px-3 py-1.5 rounded-xl flex items-center gap-1.5 shrink-0 text-xs font-semibold hover:bg-secondary/90 active:scale-95 shadow-xs"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>New Bill / Plan</span>
            </button>
          </div>
        </div>

        {/* Progress Track */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-on-surface-variant font-medium">Payment Progress</span>
            <span className="font-bold text-secondary">{paidPercent}% Paid</span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill bg-secondary" style={{ width: `${paidPercent}%` }} />
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar py-1 px-1 -mx-1">
        {filters.map((f) => {
          const filterKey = f === 'All Bills' ? 'all' : f.toLowerCase();
          const isSelected = activeFilter === filterKey;
          return (
            <button
              key={f}
              onClick={() => setActiveFilter(filterKey)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all active:scale-95 ${
                isSelected
                  ? 'bg-primary text-white dark:bg-primary-fixed dark:text-primary-container shadow-xs'
                  : 'bg-surface-container-high/60 text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* Bill Cards */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="text-center py-10 app-card">
            <span className="material-symbols-outlined text-secondary animate-spin text-3xl mb-2 block">
              progress_activity
            </span>
            <p className="text-xs text-outline">Loading bills from Firestore...</p>
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="text-center py-10 app-card space-y-2">
            <span className="material-symbols-outlined text-outline text-4xl block">
              payments
            </span>
            <p className="text-sm font-semibold text-on-surface">No bills in this category</p>
            <p className="text-xs text-outline">
              Tap "New Bill / Plan" above to add recurring bills or installment plans.
            </p>
          </div>
        ) : (
          filteredBills.map((bill) => (
            <BillCard
              key={bill.id}
              bill={bill}
              onPay={handlePay}
              onPayInFull={handlePayInFull}
              onEdit={(b) => setEditingPlan(b)}
              onDelete={handleDelete}
              onViewPlan={(b) => setSelectedInstallmentBill(b)}
            />
          ))
        )}
      </div>
    </div>
  );
}
