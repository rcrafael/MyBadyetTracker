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

export default function Transactions() {
  const { currencyInfo, formatCurrency } = useCurrency();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState(CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState(null);
  const [lastDeletedId, setLastDeletedId] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);

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

  const filters = [
    { id: 'all', label: 'All' },
    ...categories.map((c) => ({ id: c.id, label: c.name })),
  ];

  const filtered = useMemo(() => {
    let result = transactions;
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
  }, [transactions, search, activeFilter]);

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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdate}
            className="app-card max-w-sm w-full space-y-4 shadow-xl border-secondary/40"
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
                <label className="text-on-surface-variant font-semibold block mb-1">
                  Amount ({currencyInfo.symbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editingTransaction.amount}
                  onChange={(e) =>
                    setEditingTransaction({ ...editingTransaction, amount: e.target.value })
                  }
                  className="w-full bg-surface-container px-3 py-2 rounded-lg text-on-surface outline-none focus:ring-1 focus:ring-secondary"
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
                <label className="text-on-surface-variant font-semibold block mb-1">Notes</label>
                <input
                  type="text"
                  value={editingTransaction.notes || ''}
                  onChange={(e) =>
                    setEditingTransaction({ ...editingTransaction, notes: e.target.value })
                  }
                  placeholder="Memo..."
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

      {/* Date & Filter Row */}
      <div className="flex items-center justify-between gap-2 px-1">
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container/70 dark:bg-surface-container-high rounded-full hover:bg-surface-container transition-colors active:scale-95 text-xs font-semibold text-on-surface">
          <span className="material-symbols-outlined text-base">calendar_month</span>
          <span>May 2024</span>
          <span className="material-symbols-outlined text-base">expand_more</span>
        </button>
        <div className="text-xs text-outline font-medium">
          {filtered.length} {filtered.length === 1 ? 'record' : 'records'}
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
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all active:scale-95 ${isSelected
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
          <div className="text-center py-12 app-card">
            <span className="material-symbols-outlined text-outline text-4xl mb-2 block">
              search_off
            </span>
            <p className="text-sm font-medium text-outline">No transactions found</p>
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
                          <p className="text-sm sm:text-base font-mono font-bold text-error">
                            - {formatCurrency(t.amount)}
                          </p>
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
