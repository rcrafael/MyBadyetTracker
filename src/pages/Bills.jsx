import { useState, useEffect, useMemo } from 'react';
import {
  getBillsFromFirestore,
  addBillToFirestore,
  payBillInFirestore,
  softDeleteBillInFirestore,
} from '../services/firestoreService';
import { useCurrency } from '../context/CurrencyContext';

function BillCard({ bill, onPay, onDelete }) {
  const { formatCurrency } = useCurrency();
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
      borderColor: 'border-l-warning',
      iconBg: 'bg-tertiary-fixed',
      iconColor: 'text-on-tertiary-fixed-variant',
      icon: 'event_upcoming',
      statusText: 'Upcoming',
      statusColor: 'text-warning',
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

  return (
    <div
      className={`app-card border-l-4 ${config.borderColor} flex items-center justify-between p-3.5 hover:bg-surface-container/40 transition-all duration-150 group`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-10 h-10 rounded-full ${config.iconBg} ${config.iconColor} flex items-center justify-center shrink-0`}>
          <span className="material-symbols-outlined text-xl">{config.icon}</span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-on-surface truncate">{bill.name}</span>
            {bill.recurring && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-surface-container px-1.5 py-0.5 rounded text-outline shrink-0">
                <span className="material-symbols-outlined text-xs">repeat</span>
                Monthly
              </span>
            )}
          </div>
          <p className={`text-xs font-semibold ${config.statusColor} truncate mt-0.5`}>
            {config.statusText} • {new Date(bill.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
          {bill.note && (
            <p className="text-[11px] text-on-surface-variant truncate mt-0.5">{bill.note}</p>
          )}
        </div>
      </div>
      <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
        <div className="text-sm sm:text-base font-mono font-bold text-on-surface">
          {formatCurrency(bill.amount)}
        </div>
        <div className="flex items-center gap-1">
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
  const [toastMessage, setToastMessage] = useState(null);

  // New bill form state
  const [newBillName, setNewBillName] = useState('');
  const [newBillAmount, setNewBillAmount] = useState('');
  const [newBillDueDate, setNewBillDueDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [newBillRecurring, setNewBillRecurring] = useState(true);
  const [newBillNote, setNewBillNote] = useState('');

  const filters = ['All Bills', 'Unpaid', 'Paid', 'Recurring', 'Overdue'];

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

  const filteredBills = useMemo(() => {
    if (activeFilter === 'all') return billsList;
    if (activeFilter === 'unpaid') return billsList.filter((b) => b.status !== 'paid');
    if (activeFilter === 'paid') return billsList.filter((b) => b.status === 'paid');
    if (activeFilter === 'recurring') return billsList.filter((b) => b.recurring);
    if (activeFilter === 'overdue') return billsList.filter((b) => b.status === 'overdue');
    return billsList;
  }, [activeFilter, billsList]);

  const handlePay = async (bill) => {
    try {
      await payBillInFirestore(bill);
      await loadBills();
      showToast(
        bill.recurring
          ? `Bill marked as paid! Next month's cycle scheduled.`
          : 'Bill marked as paid in Cloud Firestore!'
      );
    } catch (err) {
      showToast('Error updating bill.', true);
    }
  };

  const handleDelete = async (id, name) => {
    try {
      await softDeleteBillInFirestore(id);
      setBillsList((prev) => prev.filter((b) => b.id !== id));
      showToast(`Bill "${name}" soft-deleted (retained for 6 months).`);
    } catch (err) {
      showToast('Error deleting bill.', true);
    }
  };

  const handleCreateBill = async (e) => {
    e.preventDefault();
    if (!newBillName || !newBillAmount || !newBillDueDate) return;

    try {
      const created = await addBillToFirestore({
        name: newBillName.trim(),
        amount: parseFloat(newBillAmount),
        dueDate: newBillDueDate,
        recurring: newBillRecurring,
        note: newBillNote.trim(),
        status: new Date(newBillDueDate) < new Date() ? 'overdue' : 'upcoming',
      });
      setBillsList((prev) => [created, ...prev]);
      setIsAddModalOpen(false);
      setNewBillName('');
      setNewBillAmount('');
      setNewBillNote('');
      setNewBillRecurring(true);
      showToast('New bill added to Cloud Firestore!');
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
  const upcomingCount = billsList.filter((b) => b.status === 'upcoming').length;

  return (
    <div className="space-y-4 pb-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-16 left-4 right-4 max-w-md mx-auto z-50 p-3.5 rounded-xl shadow-lg flex items-center justify-between text-xs font-semibold ${
            toastMessage.isError ? 'bg-error text-white' : 'bg-primary text-white dark:bg-surface-container-highest dark:text-primary-fixed'
          }`}
        >
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Add Bill Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateBill}
            className="app-card max-w-sm w-full space-y-4 shadow-xl border-secondary/40"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-headline text-base font-bold text-on-surface">Add New Bill</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-outline hover:text-on-surface p-1"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-on-surface-variant font-semibold block mb-1">Bill Name / Service</label>
                <input
                  type="text"
                  value={newBillName}
                  onChange={(e) => setNewBillName(e.target.value)}
                  placeholder="e.g. Electric Bill, Rent, Internet"
                  className="w-full bg-surface-container px-3 py-2 rounded-lg text-on-surface outline-none focus:ring-1 focus:ring-secondary"
                  required
                />
              </div>

              <div>
                <label className="text-on-surface-variant font-semibold block mb-1">
                  Amount ({currencyInfo.symbol})
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
                <label className="text-on-surface-variant font-semibold block mb-1">Due Date</label>
                <input
                  type="date"
                  value={newBillDueDate}
                  onChange={(e) => setNewBillDueDate(e.target.value)}
                  className="w-full bg-surface-container px-3 py-2 rounded-lg text-on-surface outline-none focus:ring-1 focus:ring-secondary"
                  required
                />
              </div>

              {/* Recurring Switch */}
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
            </div>

            <div className="flex gap-2 pt-2">
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
                Create Bill
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Summary Section */}
      <section className="app-card space-y-3">
        <div className="flex justify-between items-end gap-2">
          <div>
            <p className="text-xs text-on-surface-variant mb-0.5">Total due this month</p>
            <h2 className="font-headline text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
              {formatCurrency(totalDue)}
            </h2>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-secondary text-white px-3 py-1.5 rounded-xl flex items-center gap-1.5 shrink-0 text-xs font-semibold hover:bg-secondary/90 active:scale-95 shadow-xs"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>New Bill</span>
          </button>
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
            <p className="text-xs text-outline">Tap "New Bill" above to add upcoming expenses or recurring bills.</p>
          </div>
        ) : (
          filteredBills.map((bill) => (
            <BillCard key={bill.id} bill={bill} onPay={handlePay} onDelete={handleDelete} />
          ))
        )}
      </div>
    </div>
  );
}
