import { useState, useEffect } from 'react';
import tipsData from '../../data/dailyTips.json';

const STORAGE_KEY_LAST_DATE = 'mybadyet_last_tip_date';
const STORAGE_KEY_TIPS_ENABLED = 'mybadyet_daily_tips_enabled';

/**
 * Category color/icon mapping
 */
const CATEGORY_STYLES = {
  'Budgeting & Tracking': { icon: 'account_balance_wallet', color: 'bg-secondary/15 text-secondary border-secondary/30' },
  'Food & Groceries': { icon: 'restaurant', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' },
  'Everyday Spending & Mindset': { icon: 'psychology', color: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30' },
  'Utilities & Household Expenses': { icon: 'home', color: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30' },
  'Bills, Banking & Debt': { icon: 'payments', color: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30' },
  'Shopping & Lifestyle': { icon: 'shopping_bag', color: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30' },
  'Transportation & Travel': { icon: 'directions_car', color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30' },
  'Financial Planning & Wealth Building': { icon: 'trending_up', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
  'Smart Shopping & Consumption': { icon: 'local_offer', color: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30' },
  'Home & Lifestyle Optimization': { icon: 'energy_savings_leaf', color: 'bg-lime-500/15 text-lime-600 dark:text-lime-400 border-lime-500/30' },
  'Health, Wellness & Personal Care': { icon: 'favorite', color: 'bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30' },
  'Digital Habits & Subscriptions': { icon: 'devices', color: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30' },
};

export default function DailyTipModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTip, setCurrentTip] = useState(null);

  useEffect(() => {
    // Check if daily tips are enabled (default: true)
    const isEnabled = localStorage.getItem(STORAGE_KEY_TIPS_ENABLED) !== 'false';
    if (!isEnabled) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const lastTipDate = localStorage.getItem(STORAGE_KEY_LAST_DATE);

    // If already shown today, do not auto-popup
    if (lastTipDate === todayStr) return;

    // Pick today's random tip
    const tipsList = tipsData.tips || [];
    if (tipsList.length === 0) return;

    const randomIndex = Math.floor(Math.random() * tipsList.length);
    const chosenTip = tipsList[randomIndex];

    setCurrentTip(chosenTip);

    // Small delay for smooth entry after initial page load
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  // Listen for manual trigger events (e.g. from Settings or Help)
  useEffect(() => {
    const handleOpenTip = (e) => {
      const tipsList = tipsData.tips || [];
      if (tipsList.length === 0) return;

      if (e.detail && e.detail.tipId) {
        const found = tipsList.find((t) => t.id === e.detail.tipId);
        if (found) setCurrentTip(found);
      } else {
        // Pick random tip
        const chosen = tipsList[Math.floor(Math.random() * tipsList.length)];
        setCurrentTip(chosen);
      }
      setIsOpen(true);
    };

    window.addEventListener('open-daily-tip', handleOpenTip);
    return () => window.removeEventListener('open-daily-tip', handleOpenTip);
  }, []);

  const handleClose = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem(STORAGE_KEY_LAST_DATE, todayStr);
    setIsOpen(false);
  };

  const handleShuffle = () => {
    const tipsList = tipsData.tips || [];
    if (tipsList.length <= 1) return;
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * tipsList.length);
    } while (currentTip && tipsList[nextIndex].id === currentTip.id);

    const nextTip = tipsList[nextIndex];
    setCurrentTip(nextTip);
  };

  if (!isOpen || !currentTip) return null;

  const styleConfig = CATEGORY_STYLES[currentTip.category] || {
    icon: 'lightbulb',
    color: 'bg-secondary/15 text-secondary border-secondary/30',
  };

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-xs z-[75] flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto animate-fadeIn">
      <div
        className="app-card max-w-sm sm:max-w-md w-full p-5 sm:p-6 shadow-2xl border border-secondary/40 my-auto relative space-y-4 animate-scaleUp"
        role="dialog"
        aria-modal="true"
        aria-labelledby="daily-tip-title"
      >
        {/* Header with Icon & Close */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-secondary/15 border border-secondary/30 text-secondary flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-2xl">
                tips_and_updates
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">
                Daily Budgeting Tip
              </span>
              <h3 className="text-xs font-semibold text-on-surface-variant">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close daily tip"
            className="p-1.5 text-outline hover:text-on-surface rounded-lg hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Category Pill */}
        <div>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${styleConfig.color}`}
          >
            <span className="material-symbols-outlined text-sm">{styleConfig.icon}</span>
            <span>{currentTip.category}</span>
          </span>
        </div>

        {/* Tip Title & Description */}
        <div className="space-y-2">
          <h4 id="daily-tip-title" className="font-headline text-base sm:text-lg font-bold text-on-surface leading-snug">
            {currentTip.title}
          </h4>
          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
            {currentTip.tip}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleShuffle}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors flex items-center gap-1.5"
            title="Get another random tip"
          >
            <span className="material-symbols-outlined text-base">shuffle</span>
            <span>Another Tip</span>
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-secondary text-white hover:bg-secondary/90 shadow-xs active:scale-98 transition-all flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-base">check</span>
            <span>Got It!</span>
          </button>
        </div>
      </div>
    </div>
  );
}
