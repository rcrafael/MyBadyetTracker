import { useState, useEffect } from 'react';
import {
  getBudgetsFromFirestore,
  getTransactionsFromFirestore,
  getCategoriesFromFirestore,
  saveBudgetToFirestore,
} from '../services/firestoreService';
import { formatCurrency } from '../data/demoData';

function BudgetCard({ budget, categoryMeta, onEdit }) {
  const catName = categoryMeta?.name || budget.category;
  const catColor = categoryMeta?.color || 'bg-surface-container';
  const catTextColor = categoryMeta?.textColor || 'text-on-surface';
  const catIcon = categoryMeta?.icon || 'category';

  const limit = parseFloat(budget.limit) || 0;
  const spent = parseFloat(budget.spent) || 0;
  const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
  const remaining = limit - spent;

  let statusColor = 'bg-secondary';
  let statusLabel = 'On Track';
  let statusBadgeStyle = 'badge-paid';

  if (percent >= 100) {
    statusColor = 'bg-error';
    statusLabel = 'Over Limit';
    statusBadgeStyle = 'badge-overdue';
  } else if (percent >= 75) {
    statusColor = 'bg-warning';
    statusLabel = 'Near Limit';
    statusBadgeStyle = 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200';
  }

  return (
    <div className="app-card space-y-2.5 group">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className={`w-9 h-9 rounded-full ${catColor} flex items-center justify-center shrink-0`}>
            <span className={`material-symbols-outlined filled ${catTextColor} text-lg`}>
              {catIcon}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-on-surface truncate capitalize">{catName}</h4>
            <p className="text-xs text-outline truncate">
              {formatCurrency(spent)} of {formatCurrency(limit)}
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-block ${statusBadgeStyle}`}>
            {statusLabel}
          </span>
          <button
            title="Edit Budget Limit"
            onClick={() => onEdit(budget)}
            className="p-1 text-outline hover:text-secondary rounded-md opacity-70 group-hover:opacity-100 transition-opacity"
          >
            <span className="material-symbols-outlined text-base">edit</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar-track">
        <div
          className={`progress-bar-fill ${statusColor}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>

      <div className="flex justify-between text-xs font-medium">
        <span className="text-on-surface-variant">{percent}% used</span>
        <span className={remaining >= 0 ? 'text-secondary font-semibold' : 'text-error font-semibold'}>
          {remaining >= 0 ? `${formatCurrency(remaining)} left` : `${formatCurrency(Math.abs(remaining))} over`}
        </span>
      </div>
    </div>
  );
}

export default function Budget() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBudget, setEditingBudget] = useState(null);
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newLimit, setNewLimit] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    loadBudgetsData();
  }, []);

  async function loadBudgetsData() {
    setLoading(true);
    try {
      const [rawBudgets, transactions, rawCategories] = await Promise.all([
        getBudgetsFromFirestore(),
        getTransactionsFromFirestore(),
        getCategoriesFromFirestore(),
      ]);

      setCategories(rawCategories);

      // Aggregate current month's actual spending per category
      const currentMonthKey = new Date().toISOString().substring(0, 7); // 'YYYY-MM'
      const monthlyTxs = transactions.filter((t) => t.date && t.date.startsWith(currentMonthKey));

      const spendingMap = {};
      monthlyTxs.forEach((t) => {
        const cat = t.category || 'other';
        spendingMap[cat] = (spendingMap[cat] || 0) + (parseFloat(t.amount) || 0);
      });

      const updatedBudgets = rawBudgets.map((b) => ({
        ...b,
        spent: spendingMap[b.category] || 0,
      }));

      setBudgets(updatedBudgets);
    } catch (err) {
      console.error('Failed to load budgets data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!editingBudget) return;
    try {
      await saveBudgetToFirestore(editingBudget);
      setBudgets((prev) =>
        prev.map((b) =>
          b.id === editingBudget.id || b.category === editingBudget.category
            ? { ...b, limit: parseFloat(editingBudget.limit) }
            : b
        )
      );
      setEditingBudget(null);
      showToast('Budget limit updated in Cloud Firestore!');
    } catch (err) {
      showToast('Failed to save budget.', true);
    }
  };

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    if (!newCategory || !newLimit) return;
    try {
      const saved = await saveBudgetToFirestore({
        category: newCategory,
        limit: parseFloat(newLimit),
        spent: 0,
        period: 'monthly',
      });
      setBudgets((prev) => [...prev.filter((b) => b.category !== newCategory), saved]);
      setIsAddBudgetOpen(false);
      setNewCategory('');
      setNewLimit('');
      showToast('New category budget created in Firestore!');
    } catch (err) {
      showToast('Failed to create budget.', true);
    }
  };

  function showToast(msg, isError = false) {
    setToastMessage({ text: msg, isError });
    setTimeout(() => setToastMessage(null), 4000);
  }

  const totalBudget = budgets.reduce((s, b) => s + (parseFloat(b.limit) || 0), 0);
  const totalSpent = budgets.reduce((s, b) => s + (parseFloat(b.spent) || 0), 0);
  const overallPercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

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

      {/* Edit Budget Limit Modal */}
      {editingBudget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveBudget}
            className="app-card max-w-sm w-full space-y-4 shadow-xl border-secondary/40"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-headline text-base font-bold text-on-surface capitalize">
                Edit {editingBudget.category} Budget
              </h3>
              <button
                type="button"
                onClick={() => setEditingBudget(null)}
                className="text-outline hover:text-on-surface p-1"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-on-surface-variant font-semibold block mb-1">
                  Monthly Spending Limit ($)
                </label>
                <input
                  type="number"
                  step="10"
                  min="0"
                  value={editingBudget.limit}
                  onChange={(e) =>
                    setEditingBudget({ ...editingBudget, limit: e.target.value })
                  }
                  className="w-full bg-surface-container px-3 py-2 rounded-lg text-on-surface outline-none focus:ring-1 focus:ring-secondary font-mono font-bold text-sm"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingBudget(null)}
                className="flex-1 py-2 rounded-lg text-xs font-semibold bg-surface-container text-on-surface hover:bg-surface-container-high"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-lg text-xs font-semibold bg-secondary text-white hover:bg-secondary/90 shadow-xs"
              >
                Save Limit
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add New Budget Modal */}
      {isAddBudgetOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateBudget}
            className="app-card max-w-sm w-full space-y-4 shadow-xl border-secondary/40"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-headline text-base font-bold text-on-surface">
                Set Category Budget
              </h3>
              <button
                type="button"
                onClick={() => setIsAddBudgetOpen(false)}
                className="text-outline hover:text-on-surface p-1"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-on-surface-variant font-semibold block mb-1">
                  Select Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-surface-container px-3 py-2 rounded-lg text-on-surface outline-none focus:ring-1 focus:ring-secondary capitalize"
                  required
                >
                  <option value="">-- Choose Category --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-on-surface-variant font-semibold block mb-1">
                  Monthly Limit ($)
                </label>
                <input
                  type="number"
                  step="10"
                  min="1"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  placeholder="e.g. 400"
                  className="w-full bg-surface-container px-3 py-2 rounded-lg text-on-surface outline-none focus:ring-1 focus:ring-secondary font-mono font-bold text-sm"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddBudgetOpen(false)}
                className="flex-1 py-2 rounded-lg text-xs font-semibold bg-surface-container text-on-surface hover:bg-surface-container-high"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-lg text-xs font-semibold bg-secondary text-white hover:bg-secondary/90 shadow-xs"
              >
                Create Budget
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Header */}
      <section className="px-1">
        <h2 className="font-headline text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
          Budget Overview
        </h2>
        <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
          You've used {overallPercent}% of your total budget this month.
        </p>
      </section>

      {/* Overall Budget Card */}
      <div className="rounded-2xl p-4 sm:p-5 bg-primary-container text-surface shadow-md">
        <div className="flex justify-between items-start gap-3 mb-3">
          <div>
            <span className="text-xs font-mono font-semibold text-on-primary-container uppercase tracking-wider block">
              Total Monthly Budget
            </span>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mt-1">
              <span className="text-2xl sm:text-3xl font-headline font-bold text-primary-fixed">
                {formatCurrency(totalSpent)}
              </span>
              <span className="text-xs sm:text-sm text-on-primary-container font-medium">
                / {formatCurrency(totalBudget)}
              </span>
            </div>
          </div>
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full border-3 border-secondary flex items-center justify-center shrink-0">
            <span className="font-mono text-primary-fixed text-xs sm:text-sm font-bold">{overallPercent}%</span>
          </div>
        </div>
        <div className="h-2 w-full bg-on-primary-container/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-secondary rounded-full transition-all duration-800"
            style={{ width: `${Math.min(overallPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Category Budgets */}
      <section className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-headline text-base sm:text-lg font-bold text-on-surface">Category Budgets</h3>
          <button
            onClick={() => {
              if (categories.length > 0) setNewCategory(categories[0].id);
              setIsAddBudgetOpen(true);
            }}
            className="text-xs font-semibold text-secondary flex items-center gap-1 hover:underline active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            <span>Add Budget</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {loading ? (
            <div className="text-center py-10 app-card">
              <span className="material-symbols-outlined text-secondary animate-spin text-3xl mb-2 block">
                progress_activity
              </span>
              <p className="text-xs text-outline">Calculating live budget spending...</p>
            </div>
          ) : (
            budgets.map((b) => {
              const meta = categories.find((c) => c.id === b.category);
              return (
                <BudgetCard
                  key={b.id || b.category}
                  budget={b}
                  categoryMeta={meta}
                  onEdit={setEditingBudget}
                />
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
