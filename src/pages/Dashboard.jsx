import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getTransactionsFromFirestore,
  getBudgetsFromFirestore,
} from '../services/firestoreService';
import { getCategoryById, formatCurrency } from '../data/demoData';

function SpendingCards({ summary }) {
  const budgetProgress =
    summary.monthlyBudget > 0
      ? Math.min(Math.round((summary.monthlySpending / summary.monthlyBudget) * 100), 100)
      : 0;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {/* Monthly Spending Card */}
      <div className="col-span-2 app-card">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-mono font-semibold text-on-surface-variant uppercase tracking-wider">
            This Month's Spending
          </span>
          <span className="inline-flex items-center text-secondary text-xs font-bold bg-secondary-container/40 px-2 py-0.5 rounded-full shrink-0">
            {summary.monthlySpendingCount} {summary.monthlySpendingCount === 1 ? 'txn' : 'txns'}
          </span>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-2xl sm:text-3xl font-headline font-bold text-on-surface">
            {formatCurrency(summary.monthlySpending)}
          </span>
          <span className="text-xs sm:text-sm text-outline font-medium">
            / {formatCurrency(summary.monthlyBudget)} budget
          </span>
        </div>
        <div className="mt-3">
          <div className="progress-bar-track">
            <div
              className={`progress-bar-fill ${
                budgetProgress >= 90 ? 'bg-error' : budgetProgress >= 75 ? 'bg-warning' : 'bg-secondary'
              }`}
              style={{ width: `${budgetProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Daily Card */}
      <div className="app-card flex flex-col justify-between">
        <div>
          <span className="text-xs font-mono font-semibold text-on-surface-variant block mb-1">
            Today
          </span>
          <div className="text-lg sm:text-xl font-headline font-bold text-on-surface truncate">
            {formatCurrency(summary.dailySpending)}
          </div>
        </div>
        <div className="mt-2 text-xs text-outline font-medium">
          {summary.dailyCount} {summary.dailyCount === 1 ? 'expense' : 'expenses'} today
        </div>
      </div>

      {/* Weekly Card */}
      <div className="app-card flex flex-col justify-between">
        <div>
          <span className="text-xs font-mono font-semibold text-on-surface-variant block mb-1">
            Past 7 Days
          </span>
          <div className="text-lg sm:text-xl font-headline font-bold text-on-surface truncate">
            {formatCurrency(summary.weeklySpending)}
          </div>
        </div>
        <div className="mt-2 text-xs text-outline font-medium">
          {summary.weeklyCount} {summary.weeklyCount === 1 ? 'expense' : 'expenses'}
        </div>
      </div>
    </div>
  );
}

function SpendingChart({ transactions }) {
  const [animated, setAnimated] = useState(false);

  // Generate the last 5 calendar months dynamically (e.g. ['APR', 'MAY', 'JUN', 'JUL', 'AUG'])
  const now = new Date();
  const monthsData = [];
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  for (let i = 4; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = monthNames[d.getMonth()];
    monthsData.push({ key: monthKey, label, amount: 0, isCurrent: i === 0 });
  }

  // Aggregate actual spend per month
  transactions.forEach((t) => {
    if (!t.date) return;
    const txMonthKey = t.date.substring(0, 7); // 'YYYY-MM'
    const target = monthsData.find((m) => m.key === txMonthKey);
    if (target) {
      target.amount += parseFloat(t.amount) || 0;
    }
  });

  const maxAmount = Math.max(...monthsData.map((d) => d.amount), 100);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="app-card space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-headline text-base sm:text-lg font-bold text-on-surface">Spending Analysis</h3>
          <span className="text-xs text-outline">Last 5 months actual totals</span>
        </div>
      </div>

      <div className="h-44 sm:h-48 flex items-end justify-between px-2 pt-6 gap-2 w-full">
        {monthsData.map((item) => {
          const barHeightPercent = (item.amount / maxAmount) * 100;
          const displayHeight = item.amount > 0 ? Math.max(barHeightPercent, 8) : 4;

          return (
            <div key={item.key} className="flex-1 flex flex-col items-center gap-2 min-w-0">
              <div
                className={`w-full max-w-[36px] sm:max-w-[44px] rounded-t-lg relative ${
                  item.isCurrent ? 'bg-secondary-container/30' : 'bg-surface-container-high'
                }`}
                style={{ height: `${displayHeight}%` }}
              >
                <div
                  className={`absolute bottom-0 left-0 right-0 rounded-t-lg chart-bar-transition ${
                    item.isCurrent ? 'bg-secondary shadow-md shadow-secondary/30' : 'bg-secondary-container'
                  }`}
                  style={{ height: animated ? '100%' : '0%' }}
                />
                {item.amount > 0 && (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-[10px] px-1.5 py-0.5 rounded-md font-bold whitespace-nowrap shadow-xs font-mono">
                    ${item.amount >= 1000 ? `${(item.amount / 1000).toFixed(1)}k` : Math.round(item.amount)}
                  </div>
                )}
              </div>
              <span
                className={`text-[11px] font-mono leading-none ${
                  item.isCurrent ? 'text-secondary font-bold' : 'text-outline font-medium'
                }`}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecentExpenses({ transactions }) {
  const navigate = useNavigate();
  const recent = transactions.slice(0, 4);

  return (
    <section className="space-y-2.5">
      <div className="flex justify-between items-center px-1">
        <h3 className="font-headline text-base sm:text-lg font-bold text-on-surface">Recent Expenses</h3>
        {transactions.length > 0 && (
          <button
            onClick={() => navigate('/transactions')}
            className="text-xs font-semibold text-secondary hover:underline transition-all"
          >
            See All
          </button>
        )}
      </div>

      <div className="space-y-2">
        {recent.length === 0 ? (
          <div className="app-card text-center py-8 space-y-3">
            <span className="material-symbols-outlined text-outline text-4xl block">
              account_balance_wallet
            </span>
            <div>
              <p className="text-sm font-semibold text-on-surface">No expenses logged yet</p>
              <p className="text-xs text-outline mt-0.5">Start tracking your spending to see accurate metrics!</p>
            </div>
            <button
              onClick={() => navigate('/add')}
              className="bg-secondary text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-secondary/90 shadow-xs active:scale-95 transition-all inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>Add Your First Expense</span>
            </button>
          </div>
        ) : (
          recent.map((t) => {
            const cat = getCategoryById(t.category);
            return (
              <div
                key={t.id}
                onClick={() => navigate('/transactions')}
                className="app-card app-card-interactive flex items-center justify-between gap-3 p-3 sm:p-4 hover:border-secondary/30"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-11 h-11 rounded-full ${cat.color} flex items-center justify-center shrink-0`}>
                    <span className={`material-symbols-outlined text-xl ${cat.textColor}`}>
                      {cat.icon}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-on-surface truncate">{t.description}</h4>
                    <p className="text-xs text-outline truncate">
                      {t.date} • {cat.name}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm sm:text-base font-mono font-bold text-on-surface">
                    -{formatCurrency(t.amount)}
                  </div>
                  <span
                    className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium mt-0.5 ${
                      t.status === 'pending' ? 'badge-pending' : 'badge-cleared'
                    }`}
                  >
                    {t.status === 'pending' ? 'Pending' : 'Cleared'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [txs, bgs] = await Promise.all([
          getTransactionsFromFirestore(),
          getBudgetsFromFirestore(),
        ]);
        setTransactions(txs);
        setBudgets(bgs);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // --- Accurate Metrics Calculations ---
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthKey = todayStr.substring(0, 7); // 'YYYY-MM'
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // 1. Monthly Spending (current month)
  const monthlyTransactions = transactions.filter(
    (t) => t.date && t.date.startsWith(currentMonthKey)
  );
  const monthlySpending = monthlyTransactions.reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);

  // 2. Daily Spending (today)
  const dailyTransactions = transactions.filter((t) => t.date === todayStr);
  const dailySpending = dailyTransactions.reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);

  // 3. Weekly Spending (last 7 days)
  const weeklyTransactions = transactions.filter(
    (t) => t.date && new Date(t.date) >= sevenDaysAgo
  );
  const weeklySpending = weeklyTransactions.reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);

  // 4. Monthly Budget Total from Firestore
  const totalMonthlyBudget = budgets.reduce((acc, b) => acc + (parseFloat(b.limit) || 0), 0);

  const summary = {
    monthlySpending,
    monthlySpendingCount: monthlyTransactions.length,
    monthlyBudget: totalMonthlyBudget || 1500,
    dailySpending,
    dailyCount: dailyTransactions.length,
    weeklySpending,
    weeklyCount: weeklyTransactions.length,
  };

  return (
    <div className="space-y-4 sm:space-y-5 pb-6">
      {/* Header */}
      <section className="px-1 flex justify-between items-center">
        <div>
          <h2 className="font-headline text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
            Financial Overview
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Real-time Cloud Firestore Data
          </p>
        </div>
      </section>

      {/* Spending Cards */}
      <SpendingCards summary={summary} />

      {/* Chart */}
      <SpendingChart transactions={transactions} />

      {/* Recent Expenses */}
      <RecentExpenses transactions={transactions} />
    </div>
  );
}
