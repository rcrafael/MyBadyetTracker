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
import DualCurrencyDisplay from '../components/common/DualCurrencyDisplay';

// Helper to compute remaining months for an installment plan
export function getBillRemainingMonths(bill) {
  if (!bill.isInstallment) return 999999;
  const totalMonths = parseInt(bill.totalMonths, 10) || 1;
  const currentInstallment = parseInt(bill.currentInstallment, 10) || 1;
  const paidCount =
    bill.paidInstallments !== undefined
      ? parseInt(bill.paidInstallments, 10)
      : bill.status === 'paid'
      ? currentInstallment
      : currentInstallment - 1;
  return Math.max(0, totalMonths - paidCount);
}

// Helper to get bill category type key
export function getBillTypeKey(bill) {
  if (bill.isInstallment) return 'plan';
  if (bill.recurring) return 'recurring';
  return 'standard';
}

function BillCard({ bill, onPay, onDelete, onViewPlan, onEdit, onPayInFull }) {
  const { mainCurrency, secondaryCurrencyInfo } = useCurrency();
  const isInstallment = Boolean(bill.isInstallment);
  const billCurrency = bill.currency || mainCurrency;
  const isSecondaryCurrency = billCurrency !== mainCurrency;

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
  const remainingMonths = getBillRemainingMonths(bill);

  return (
    <div
      className={`app-card border-l-4 ${config.borderColor} flex items-start justify-between p-3 hover:bg-surface-container/40 transition-all duration-150 group gap-2`}
    >
      {/* Left: small icon + text */}
      <div className="flex items-start gap-2 min-w-0 flex-1">
        {/* Smaller icon to save horizontal space */}
        <div
          className={`w-7 h-7 rounded-lg ${config.iconBg} ${config.iconColor} flex items-center justify-center shrink-0 mt-0.5`}
        >
          <span className="material-symbols-outlined text-base">{config.icon}</span>
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          {/* Particular / Name — wraps naturally, no truncation */}
          <h4 className="text-xs sm:text-sm font-bold text-on-surface break-words leading-snug">
            {bill.name}
          </h4>

          {/* Badges Row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {isInstallment ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-secondary/15 text-secondary px-1.5 py-0.5 rounded shrink-0">
                <span className="material-symbols-outlined text-xs">credit_card</span>
                {bill.bankOrMerchant ? `${bill.bankOrMerchant} • ` : ''}Month {currentInstallment}/{totalMonths}
              </span>
            ) : bill.recurring ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-surface-container px-1.5 py-0.5 rounded text-outline shrink-0">
                <span className="material-symbols-outlined text-xs">repeat</span>
                Recurring
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-surface-container px-1.5 py-0.5 rounded text-outline shrink-0">
                <span className="material-symbols-outlined text-xs">receipt_long</span>
                Standard
              </span>
            )}
            {isSecondaryCurrency && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-surface-container-high text-on-surface-variant px-1.5 py-0.2 rounded shrink-0">
                {billCurrency} Bill
              </span>
            )}
          </div>

          {/* Status & Due Date — one line */}
          <p className={`text-xs font-semibold ${config.statusColor} whitespace-nowrap overflow-hidden text-ellipsis`}>
            {config.statusText} •{' '}
            {new Date(bill.dueDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>

          {/* Remaining Months — one line, installment only */}
          {isInstallment && (
            <p className="text-[11px] font-semibold text-secondary whitespace-nowrap overflow-hidden text-ellipsis">
              {remainingMonths > 0
                ? `${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'} remaining`
                : 'Final installment'}
            </p>
          )}

          {/* End Month / Year — one line, installment only */}
          {isInstallment && bill.endDate && (
            <p className="text-[11px] text-on-surface-variant whitespace-nowrap overflow-hidden text-ellipsis">
              Ends {new Date(bill.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </p>
          )}

          {/* Memo / Note for Standard / Recurring Bills */}
          {bill.note && !isInstallment && (
            <p className="text-[11px] text-on-surface-variant break-words whitespace-pre-wrap">
              {bill.note}
            </p>
          )}
        </div>
      </div>

      {/* Right: eye (top) → amount → pay → delete */}
      <div className="shrink-0 flex flex-col items-end gap-1 pl-1">
        {/* View Plan at top-right — installment only */}
        {isInstallment ? (
          <button
            onClick={() => onViewPlan?.(bill)}
            className="p-0.5 text-secondary hover:bg-secondary/10 rounded-md opacity-70 group-hover:opacity-100 transition-opacity"
            title="View installment plan"
          >
            <span className="material-symbols-outlined text-sm">visibility</span>
          </button>
        ) : (
          <div className="h-5" />
        )}

        {/* Amount */}
        <DualCurrencyDisplay
          amount={bill.amount}
          fromCurrency={billCurrency}
          primaryMode="assigned"
          align="right"
          mainClassName="text-sm sm:text-base font-bold font-mono text-on-surface"
          secondaryClassName="text-[11px] font-mono font-medium text-on-surface-variant"
          suffix={isInstallment ? '/ mo' : ''}
        />

        {/* Pay Now */}
        {bill.status !== 'paid' && (
          <button
            onClick={() => onPay?.(bill)}
            className="bg-secondary text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-secondary/90 active:scale-95 transition-all shadow-xs whitespace-nowrap"
          >
            Pay Now
          </button>
        )}

        {/* Delete — below Pay Now */}
        <button
          title="Delete Bill (retained 6 months)"
          onClick={() => onDelete?.(bill.id, bill.name)}
          className="p-0.5 text-outline hover:text-error rounded-md hover:bg-error-container/20 opacity-60 group-hover:opacity-100 transition-opacity"
        >
          <span className="material-symbols-outlined text-sm">delete</span>
        </button>
      </div>
    </div>
  );
}

export default function Bills() {
  const {
    isDualCurrencyEnabled,
    mainCurrency,
    secondaryCurrency,
    mainCurrencyInfo,
    secondaryCurrencyInfo,
    convertToMain,
    formatCurrency,
  } = useCurrency();

  const [billsList, setBillsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('type'); // 'type' | 'remainingMonths' | 'dueDate' | 'amount' | 'name'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [selectedInstallmentBill, setSelectedInstallmentBill] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, name }

  // Form mode: 'standard' | 'installment'
  const [billType, setBillType] = useState('standard');

  // Form state
  const [newBillCurrency, setNewBillCurrency] = useState(mainCurrency);
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

  useEffect(() => {
    setNewBillCurrency(mainCurrency);
  }, [mainCurrency]);

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
    let list = [...billsList];

    // Status / Category filtering
    if (activeFilter === 'unpaid') list = list.filter((b) => b.status !== 'paid');
    else if (activeFilter === 'paid') list = list.filter((b) => b.status === 'paid');
    else if (activeFilter === 'installments') list = list.filter((b) => b.isInstallment);
    else if (activeFilter === 'recurring') list = list.filter((b) => b.recurring && !b.isInstallment);
    else if (activeFilter === 'overdue') list = list.filter((b) => b.status === 'overdue');

    // Sorting
    list.sort((a, b) => {
      const mult = sortOrder === 'asc' ? 1 : -1;

      if (sortBy === 'type') {
        const typeOrderAsc = { standard: 1, recurring: 2, plan: 3 };
        const typeOrderDesc = { plan: 1, recurring: 2, standard: 3 };
        const orderMap = sortOrder === 'asc' ? typeOrderAsc : typeOrderDesc;
        const typeA = getBillTypeKey(a);
        const typeB = getBillTypeKey(b);

        if (typeA !== typeB) {
          return (orderMap[typeA] || 0) - (orderMap[typeB] || 0);
        }

        // Inside the same type category:
        if (typeA === 'plan') {
          // Installment plans: default to remaining months ascending (fewer months on top)
          const remA = getBillRemainingMonths(a);
          const remB = getBillRemainingMonths(b);
          if (remA !== remB) return remA - remB;
          return new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
        }

        // For standard & recurring: sort by due date
        return new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
      }

      if (sortBy === 'remainingMonths') {
        const remA = getBillRemainingMonths(a);
        const remB = getBillRemainingMonths(b);
        if (remA !== remB) return (remA - remB) * mult;
        return (new Date(a.dueDate || 0) - new Date(b.dueDate || 0)) * mult;
      }

      if (sortBy === 'dueDate') {
        const dateA = new Date(a.dueDate || 0).getTime();
        const dateB = new Date(b.dueDate || 0).getTime();
        return (dateA - dateB) * mult;
      }

      if (sortBy === 'amount') {
        const amtA = parseFloat(a.amount) || 0;
        const amtB = parseFloat(b.amount) || 0;
        return (amtA - amtB) * mult;
      }

      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '') * mult;
      }

      return 0;
    });

    return list;
  }, [billsList, activeFilter, sortBy, sortOrder]);

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

  // Opens confirmation modal instead of deleting directly
  const requestDelete = (id, name) => {
    setDeleteConfirm({ id, name });
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const { id, name } = deleteConfirm;
    setDeleteConfirm(null);
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
          currency: newBillCurrency,
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
        showToast(`Installment plan "${created.name}" created (${months} months in ${newBillCurrency})!`);
      } else {
        const created = await addBillToFirestore({
          name: newBillName.trim(),
          amount: parseFloat(newBillAmount),
          currency: newBillCurrency,
          dueDate: newBillDueDate,
          recurring: newBillRecurring,
          note: newBillNote.trim(),
          status: new Date(newBillDueDate) < new Date() ? 'overdue' : 'upcoming',
        });
        setBillsList((prev) => [created, ...prev]);
        showToast(`New bill added in ${newBillCurrency}!`);
      }

      setIsAddModalOpen(false);
      setNewBillName('');
      setNewBillBank('');
      setNewBillAmount('');
      setNewBillNote('');
      setNewBillMonths('12');
      setNewBillRecurring(true);
      setBillType('standard');
      setNewBillCurrency(mainCurrency);
    } catch (err) {
      showToast('Failed to create bill.', true);
    }
  };

  function showToast(msg, isError = false) {
    setToastMessage({ text: msg, isError });
    setTimeout(() => setToastMessage(null), 4000);
  }

  // Calculate totals in Main Currency
  const totalDueInMain = billsList
    .filter((b) => b.status !== 'paid')
    .reduce((s, b) => s + convertToMain(b.amount, b.currency), 0);

  const totalPaidInMain = billsList
    .filter((b) => b.status === 'paid')
    .reduce((s, b) => s + convertToMain(b.amount, b.currency), 0);

  const totalAllInMain = totalDueInMain + totalPaidInMain;
  const paidPercent = totalAllInMain > 0 ? Math.round((totalPaidInMain / totalAllInMain) * 100) : 0;

  const currentActiveCurrencySymbol =
    newBillCurrency === secondaryCurrency
      ? secondaryCurrencyInfo.symbol
      : mainCurrencyInfo.symbol;

  return (
    <div className="space-y-4 pb-6">
      {/* Toast Notification (Top-most z-index to stay above modals) */}
      {toastMessage && (
        <div
          className={`fixed top-16 left-4 right-4 max-w-md mx-auto z-[9999] p-3.5 rounded-xl shadow-2xl ring-1 ring-black/10 flex items-center justify-between text-xs font-semibold animate-fadeIn ${
            toastMessage.isError
              ? 'bg-error text-white shadow-error/30'
              : 'bg-primary text-white dark:bg-surface-container-highest dark:text-primary-fixed shadow-primary/30'
          }`}
        >
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="app-card max-w-sm w-full p-5 shadow-2xl border border-error/30 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-error-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-on-error-container text-xl">delete_forever</span>
              </div>
              <div>
                <h3 className="font-headline text-sm font-bold text-on-surface">Are you sure?</h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  You're about to delete{' '}
                  <span className="font-semibold text-on-surface">&ldquo;{deleteConfirm.name}&rdquo;</span>.
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-error text-white hover:bg-error/90 active:scale-98 transition-all shadow-xs flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                Delete
              </button>
            </div>
          </div>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[70] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateBill}
            className="app-card max-w-md w-full p-4 sm:p-6 space-y-3.5 shadow-2xl border-secondary/40 max-h-[85vh] sm:max-h-[88vh] flex flex-col my-auto relative"
          >
            <div className="flex justify-between items-center shrink-0 pb-2 border-b border-outline-variant/20">
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

            {/* Currency Selector (Main vs Secondary) - Only when Dual Currency is Enabled */}
            {isDualCurrencyEnabled && (
              <div className="space-y-1.5 shrink-0">
                <label className="text-on-surface-variant font-semibold text-xs block">
                  Select Currency
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewBillCurrency(mainCurrency)}
                    className={`p-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${
                      newBillCurrency === mainCurrency
                        ? 'bg-secondary/15 border-secondary text-secondary font-bold shadow-xs'
                        : 'bg-surface-container/60 border-transparent text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    <span>{mainCurrencyInfo.flag}</span>
                    <span>
                      Main ({mainCurrencyInfo.code} {mainCurrencyInfo.symbol})
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewBillCurrency(secondaryCurrency)}
                    className={`p-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${
                      newBillCurrency === secondaryCurrency
                        ? 'bg-secondary/15 border-secondary text-secondary font-bold shadow-xs'
                        : 'bg-surface-container/60 border-transparent text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    <span>{secondaryCurrencyInfo.flag}</span>
                    <span>
                      Sec ({secondaryCurrencyInfo.code} {secondaryCurrencyInfo.symbol})
                    </span>
                  </button>
                </div>
              </div>
            )}

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
                  {billType === 'installment' ? 'Monthly Payment Amount' : 'Amount'} ({currentActiveCurrencySymbol})
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
                    <DualCurrencyDisplay
                      amount={computedTotalAmountPreview}
                      fromCurrency={newBillCurrency}
                      primaryMode="assigned"
                      align="right"
                      mainClassName="font-mono font-bold text-on-surface text-xs sm:text-sm"
                      secondaryClassName="text-[10px] font-mono text-outline"
                    />
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

            <div className="flex gap-2 pt-3 shrink-0 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-secondary text-white hover:bg-secondary/90 shadow-xs active:scale-98 transition-all"
              >
                {billType === 'installment' ? 'Create Installment Plan' : 'Create Bill'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Summary Section: Total due this month (Main Currency BIGGER, Secondary Converted SMALLER) */}
      <section className="app-card space-y-3">
        <div className="flex justify-between items-end gap-2 flex-wrap">
          <div>
            <p className="text-xs text-on-surface-variant mb-0.5">Total due this month</p>
            <DualCurrencyDisplay
              amount={totalDueInMain}
              fromCurrency={mainCurrency}
              primaryMode="main"
              align="left"
              mainClassName="font-headline text-2xl sm:text-3xl font-bold text-on-surface tracking-tight"
              secondaryClassName="text-xs sm:text-sm font-mono font-medium text-on-surface-variant mt-0.5"
            />
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

      {/* Filter Tabs & Sorting Toolbar */}
      <div className="space-y-2">
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

        {/* Sort Controls Bar */}
        <div className="flex items-center justify-between gap-2 px-1 text-xs w-full">
          <div className="flex items-center gap-1.5 text-on-surface-variant min-w-0 flex-1">
            <span className="material-symbols-outlined text-sm text-outline shrink-0">sort</span>
            <span className="font-semibold text-[11px] shrink-0">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs py-1 px-2 rounded-lg border border-outline-variant/20 outline-none focus:ring-1 focus:ring-secondary cursor-pointer min-w-0 flex-1 max-w-[150px] sm:max-w-[200px] truncate"
            >
              <option value="type">Bill Type</option>
              <option value="remainingMonths">Remaining Mos</option>
              <option value="dueDate">Due Date</option>
              <option value="amount">Amount</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface px-2.5 py-1 rounded-lg border border-outline-variant/20 font-semibold text-[11px] flex items-center gap-1 transition-colors shrink-0"
            title={sortOrder === 'asc' ? 'Ascending (fewer months / earliest date / A-Z)' : 'Descending'}
          >
            <span className="material-symbols-outlined text-sm">
              {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
            </span>
            <span>{sortOrder === 'asc' ? 'Asc' : 'Desc'}</span>
          </button>
        </div>
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
              onDelete={requestDelete}
              onViewPlan={(b) => setSelectedInstallmentBill(b)}
            />
          ))
        )}
      </div>
    </div>
  );
}
