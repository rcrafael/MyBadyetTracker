import { useState, useEffect, useMemo } from 'react';
import {
  getTransactionsFromFirestore,
  getCategoriesFromFirestore,
  softDeleteTransactionInFirestore,
  restoreTransactionInFirestore,
  updateTransactionInFirestore,
} from '../services/firestoreService';
import {
  CATEGORIES,
  getCategoryById,
  groupTransactionsByDate,
} from '../data/demoData';
import { useCurrency } from '../context/CurrencyContext';
import DualCurrencyDisplay from '../components/common/DualCurrencyDisplay';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export default function Transactions() {
  const { mainCurrency, formatCurrency } = useCurrency();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState(CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState(null);
  const [lastDeletedId, setLastDeletedId] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Month Picker State
  const now = useMemo(() => new Date(), []);
  const defaultYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(defaultYearMonth); // 'YYYY-MM' | 'all'
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(now.getFullYear());

  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    setLoading(true);
    try {
      const [data, cats] = await Promise.all([
        getTransactionsFromFirestore(),
        getCategoriesFromFirestore(),
      ]);
      setTransactions(data);
      if (cats && cats.length > 0) {
        setCategories(cats);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  }

  // Prev / Next month navigation handlers
  const handlePrevMonth = () => {
    if (selectedMonth === 'all') {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      setSelectedMonth(ym);
      setPickerYear(d.getFullYear());
      return;
    }
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(ym);
    setPickerYear(d.getFullYear());
  };

  const handleNextMonth = () => {
    if (selectedMonth === 'all') {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      setSelectedMonth(ym);
      setPickerYear(d.getFullYear());
      return;
    }
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(ym);
    setPickerYear(d.getFullYear());
  };

  const handleSelectMonth = (monthIndex) => {
    const ym = `${pickerYear}-${String(monthIndex + 1).padStart(2, '0')}`;
    setSelectedMonth(ym);
    setIsMonthPickerOpen(false);
  };

  const handleSelectAllMonths = () => {
    setSelectedMonth('all');
    setIsMonthPickerOpen(false);
  };

  const handleSelectCurrentMonth = () => {
    setSelectedMonth(defaultYearMonth);
    setPickerYear(now.getFullYear());
    setIsMonthPickerOpen(false);
  };

  const monthDisplayLabel = useMemo(() => {
    if (selectedMonth === 'all') return 'All Months';
    const [y, m] = selectedMonth.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  }, [selectedMonth]);

  const filters = [
    { id: 'all', label: 'All' },
    ...categories.map((c) => ({ id: c.id, label: c.name })),
  ];

  // Filtered transactions
  const filtered = useMemo(() => {
    let result = transactions;

    // Filter by selected month
    if (selectedMonth !== 'all') {
      result = result.filter((t) => (t.date || '').startsWith(selectedMonth));
    }

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (t) =>
          (t.description || '').toLowerCase().includes(s) ||
          (t.notes || '').toLowerCase().includes(s)
      );
    }

    if (activeFilter !== 'all') {
      result = result.filter((t) => t.category === activeFilter);
    }

    return result;
  }, [transactions, selectedMonth, search, activeFilter]);

  const totalSpentInView = useMemo(() => {
    return filtered.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  }, [filtered]);

  const grouped = useMemo(() => groupTransactionsByDate(filtered), [filtered]);

  const handleSoftDelete = async (id, description) => {
    try {
      await softDeleteTransactionInFirestore(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      setLastDeletedId(id);
      showToast(`"${description}" soft-deleted (retained for 6 months).`);
    } catch (err) {
      showToast('Error deleting transaction.', true);
    }
  };

  const handleUndo = async () => {
    if (!lastDeletedId) return;
    try {
      await restoreTransactionInFirestore(lastDeletedId);
      setLastDeletedId(null);
      await loadTransactions();
      showToast('Transaction restored successfully!');
    } catch (err) {
      showToast('Error restoring transaction.', true);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingTransaction) return;
    try {
      await updateTransactionInFirestore(editingTransaction.id, {
        description: editingTransaction.description,
        amount: editingTransaction.amount,
        category: editingTransaction.category,
        notes: editingTransaction.notes,
      });
      setTransactions((prev) =>
        prev.map((t) => (t.id === editingTransaction.id ? { ...t, ...editingTransaction } : t))
      );
      setEditingTransaction(null);
      showToast('Transaction updated!');
    } catch (err) {
      showToast('Error updating transaction.', true);
    }
  };

  function showToast(msg, isError = false) {
    setToastMessage({ text: msg, isError });
    setTimeout(() => setToastMessage(null), 4500);
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-16 left-4 right-4 max-w-md mx-auto z-50 p-3.5 rounded-xl shadow-lg flex items-center justify-between text-xs font-semibold 
            ${toastMessage.isError
              ? 'bg-error text-white'
              : 'bg-primary text-white dark:bg-surface-container-highest dark:text-primary-fixed'
            }`}
        >
          <span className="truncate pr-2">{toastMessage.text}</span>
          {lastDeletedId && (
            <button
              onClick={handleUndo}
              className="bg-secondary px-2.5 py-1 rounded-lg text-white font-bold shrink-0 hover:bg-secondary/90 active:scale-95"
            >
              Undo
            </button>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[70] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <form
            onSubmit={handleUpdate}
            className="app-card max-w-sm w-full space-y-4 shadow-2xl border-secondary/40 my-auto relative"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-headline text-base font-bold text-on-surface">Edit Transaction</h3>
              <button
                type="button"
                onClick={() => setEditingTransaction(null)}
                className="text-outline hover:text-on-surface p-1"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-on-surface-variant font-semibold block mb-1">Description</label>
                <input
                  type="text"
                  value={editingTransaction.description}
                  onChange={(e) =>
                    setEditingTransaction({ ...editingTransaction, description: e.target.value })
                  }
                  className="w-full bg-surface-container px-3 py-2 rounded-lg text-on-surface outline-none focus:ring-1 focus:ring-secondary"
                  required
                />
              </div>

              <div>
                <label className="text-on-surface-variant font-semibold block mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={editingTransaction.amount}
                  onChange={(e) =>
                    setEditingTransaction({ ...editingTransaction, amount: e.target.value })
                  }
                  className="w-full bg-surface-container px-3 py-2 rounded-lg text-on-surface outline-none focus:ring-1 focus:ring-secondary font-mono font-bold text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-on-surface-variant font-semibold block mb-1">Category</label>
                <select
                  value={editingTransaction.category}
                  onChange={(e) =>
                    setEditingTransaction({ ...editingTransaction, category: e.target.value })
                  }
                  className="w-full bg-surface-container px-3 py-2 rounded-lg text-on-surface outline-none focus:ring-1 focus:ring-secondary"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-on-surface-variant font-semibold block mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  value={editingTransaction.notes || ''}
                  onChange={(e) =>
                    setEditingTransaction({ ...editingTransaction, notes: e.target.value })
                  }
                  placeholder="e.g. Receipt #482"
                  className="w-full bg-surface-container px-3 py-2 rounded-lg text-on-surface outline-none focus:ring-1 focus:ring-secondary"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingTransaction(null)}
                className="flex-1 py-2 rounded-lg text-xs font-semibold bg-surface-container text-on-surface hover:bg-surface-container-high"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-lg text-xs font-semibold bg-secondary text-white hover:bg-secondary/90 shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Month Picker Modal */}
      {isMonthPickerOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[70] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="app-card max-w-xs w-full p-4 space-y-4 shadow-2xl border-secondary/40 my-auto relative animate-fadeIn">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20">
              <h3 className="font-headline text-base font-bold text-on-surface">Select Month</h3>
              <button
                type="button"
                onClick={() => setIsMonthPickerOpen(false)}
                className="text-outline hover:text-on-surface p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Year Selector */}
            <div className="flex items-center justify-between px-2">
              <button
                type="button"
                onClick={() => setPickerYear((y) => y - 1)}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
                title="Previous Year"
              >
                <span className="material-symbols-outlined text-xl">chevron_left</span>
              </button>
              <span className="font-headline text-base font-bold text-on-surface">
                {pickerYear}
              </span>
              <button
                type="button"
                onClick={() => setPickerYear((y) => y + 1)}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
                title="Next Year"
              >
                <span className="material-symbols-outlined text-xl">chevron_right</span>
              </button>
            </div>

            {/* 12 Months Grid */}
            <div className="grid grid-cols-3 gap-2">
              {MONTH_NAMES.map((mName, idx) => {
                const ymString = `${pickerYear}-${String(idx + 1).padStart(2, '0')}`;
                const isSelected = selectedMonth === ymString;
                const isCurrentMonth = defaultYearMonth === ymString;

                return (
                  <button
                    key={mName}
                    type="button"
                    onClick={() => handleSelectMonth(idx)}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold transition-all flex flex-col items-center justify-center gap-0.5 ${
                      isSelected
                        ? 'bg-secondary text-white shadow-xs font-bold'
                        : isCurrentMonth
                        ? 'bg-secondary/15 text-secondary border border-secondary/30 font-bold'
                        : 'bg-surface-container/60 hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    <span>{mName}</span>
                    {isCurrentMonth && (
                      <span className="text-[9px] opacity-80 leading-none">Current</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Shortcut Actions */}
            <div className="pt-2 border-t border-outline-variant/20 flex gap-2">
              <button
                type="button"
                onClick={handleSelectCurrentMonth}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={handleSelectAllMonths}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  selectedMonth === 'all'
                    ? 'bg-secondary text-white'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                }`}
              >
                All Months
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-xl pointer-events-none">
          search
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search transactions..."
          className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-sm transition-all text-on-surface placeholder:text-outline outline-none focus:border-secondary focus:ring-1 focus:ring-secondary shadow-xs"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-1"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        )}
      </div>

      {/* Interactive Date & Filter Row */}
      <div className="flex items-center justify-between gap-2 px-1 flex-wrap">
        <div className="flex items-center gap-1 bg-surface-container/70 dark:bg-surface-container-high rounded-full p-0.5 border border-outline-variant/20">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container transition-colors"
            title="Previous Month"
          >
            <span className="material-symbols-outlined text-base">chevron_left</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (selectedMonth !== 'all') {
                const [y] = selectedMonth.split('-').map(Number);
                setPickerYear(y);
              }
              setIsMonthPickerOpen(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-on-surface hover:text-secondary transition-colors"
          >
            <span className="material-symbols-outlined text-sm">calendar_month</span>
            <span>{monthDisplayLabel}</span>
            <span className="material-symbols-outlined text-sm">expand_more</span>
          </button>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container transition-colors"
            title="Next Month"
          >
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </button>
        </div>

        <div className="text-right">
          <span className="text-xs text-outline font-medium block">
            {filtered.length} {filtered.length === 1 ? 'record' : 'records'}
          </span>
          {filtered.length > 0 && (
            <span className="text-[11px] font-mono text-error font-bold block">
              - {formatCurrency(totalSpentInView)}
            </span>
          )}
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar py-1 px-1 -mx-1">
        {filters.map((f) => {
          const isSelected = activeFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all active:scale-95 ${
                isSelected
                  ? 'bg-secondary text-white shadow-xs'
                  : 'bg-surface-container-lowest border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Grouped Transactions */}
      <div className="space-y-4 pt-1">
        {loading ? (
          <div className="text-center py-12 app-card">
            <span className="material-symbols-outlined text-secondary animate-spin text-3xl mb-2 block">
              progress_activity
            </span>
            <p className="text-xs text-outline">Loading from Cloud Firestore...</p>
          </div>
        ) : Object.entries(grouped).length === 0 ? (
          <div className="text-center py-12 app-card space-y-2">
            <span className="material-symbols-outlined text-outline text-4xl block">
              search_off
            </span>
            <p className="text-sm font-medium text-on-surface">No transactions found</p>
            <p className="text-xs text-outline">
              {selectedMonth === 'all'
                ? 'No transactions match your current search or category filter.'
                : `No transactions found for ${monthDisplayLabel}.`}
            </p>
            {selectedMonth !== 'all' && (
              <button
                type="button"
                onClick={handleSelectAllMonths}
                className="mt-2 px-3 py-1.5 bg-surface-container text-secondary text-xs font-semibold rounded-xl hover:bg-surface-container-high transition-colors inline-block"
              >
                View All Months
              </button>
            )}
          </div>
        ) : (
          Object.entries(grouped).map(([date, items]) => (
            <section key={date} className="space-y-2">
              <h3 className="text-xs font-mono font-semibold text-outline uppercase tracking-wider px-1">
                {date}
              </h3>
              <div className="space-y-2">
                {items.map((t) => {
                  const cat = getCategoryById(t.category, categories);
                  const txCurrency = t.currency || mainCurrency;

                  return (
                    <div
                      key={t.id}
                      className="app-card flex items-center justify-between gap-3 p-3 sm:p-4 hover:border-secondary/30 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-11 h-11 rounded-full ${cat.color} flex items-center justify-center shrink-0`}
                        >
                          <span className={`material-symbols-outlined text-xl ${cat.textColor}`}>
                            {cat.icon}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-semibold text-on-surface truncate">{t.description}</h4>
                          <p className="text-xs text-on-surface-variant truncate">
                            {t.time || t.date} • {cat.name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <DualCurrencyDisplay
                            amount={t.amount}
                            fromCurrency={txCurrency}
                            primaryMode="assigned"
                            align="right"
                            prefix="- "
                            mainClassName="text-sm sm:text-base font-mono font-bold text-error"
                            secondaryClassName="text-[10px] font-mono text-outline"
                          />
                        </div>

                        {/* Action buttons: Edit & Soft Delete */}
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity ml-1">
                          <button
                            title="Edit"
                            onClick={() => setEditingTransaction(t)}
                            className="p-1 text-outline hover:text-secondary rounded-md hover:bg-surface-container transition-colors"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            title="Soft delete (retained 6 months)"
                            onClick={() => handleSoftDelete(t.id, t.description)}
                            className="p-1 text-outline hover:text-error rounded-md hover:bg-error-container/30 transition-colors"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
