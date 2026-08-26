import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HELP_SECTIONS = [
  {
    id: 'dashboard',
    icon: 'dashboard',
    title: '1. Dashboard & Budget Overview',
    subtitle: 'Track monthly progress, spending health, and daily allowances',
    content: (
      <div className="space-y-2 text-xs text-on-surface-variant leading-relaxed">
        <p>
          The Dashboard is your financial command center. At a glance, you can monitor:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong className="text-on-surface">Monthly Budget Gauge:</strong> Visualizes the percentage of your total budget used this month.
          </li>
          <li>
            <strong className="text-on-surface">Total Spent & Remaining Balance:</strong> Shows exactly how much cash is left to spend.
          </li>
          <li>
            <strong className="text-on-surface">Daily Recommended Budget:</strong> Dynamically calculates your safe daily spending limit for the remaining days of the month.
          </li>
          <li>
            <strong className="text-on-surface">Quick Add (`+`):</strong> The floating center button allows logging expenses in just a few taps.
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'expenses',
    icon: 'add_card',
    title: '2. Logging Day-to-Day Expenses',
    subtitle: 'Record purchases, categorize items, and view live currency estimates',
    content: (
      <div className="space-y-2 text-xs text-on-surface-variant leading-relaxed">
        <ol className="list-decimal pl-5 space-y-1">
          <li>Tap the central <strong className="text-on-surface">+ (Add)</strong> icon in the navigation bar.</li>
          <li>Enter the <strong className="text-on-surface">Amount</strong> and type a <strong className="text-on-surface">Merchant / Title</strong> (e.g. *Supermarket*, *Coffee*).</li>
          <li>Select a <strong className="text-on-surface">Category</strong> (e.g. *Grocery*, *Dining*, *Transport*).</li>
          <li>*(Optional)* Pick a past date or add a note/receipt reference.</li>
          <li>Tap <strong className="text-on-surface">Save Expense</strong>.</li>
        </ol>
        <p className="pt-1 text-[11px] text-secondary font-medium">
          💡 <strong>Tip:</strong> If Dual Currency is enabled, a real-time converted estimate in your secondary currency appears under the amount input.
        </p>
      </div>
    ),
  },
  {
    id: 'history',
    icon: 'history',
    title: '3. Transaction History & Filtering',
    subtitle: 'Search past logs, filter by month/year, edit, and recover deleted items',
    content: (
      <div className="space-y-2 text-xs text-on-surface-variant leading-relaxed">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong className="text-on-surface">Interactive Month Picker:</strong> Tap the month badge (e.g. *Aug 2026*) to pick any month across different years, or use the <strong>&lt;</strong> and <strong>&gt;</strong> arrows to step month by month.
          </li>
          <li>
            <strong className="text-on-surface">Instant Search:</strong> Type in the search box to find transactions by title, note, or receipt number.
          </li>
          <li>
            <strong className="text-on-surface">Category Filter Chips:</strong> Tap any category chip to isolate specific spending areas.
          </li>
          <li>
            <strong className="text-on-surface">Edit / Modify:</strong> Tap the <span className="font-semibold text-secondary">Pencil icon</span> to change amount, category, or note.
          </li>
          <li>
            <strong className="text-on-surface">Accidental Deletion Undo:</strong> Tap the <span className="font-semibold text-error">Trash icon</span> to delete. An instant "Undo" toast lets you restore it immediately. Deleted records are retained in quarantine for 6 months.
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'bills',
    icon: 'receipt_long',
    title: '4. Bills & Installment Plans',
    subtitle: 'Stay ahead of recurring monthly bills and track multi-month amortization',
    content: (
      <div className="space-y-2 text-xs text-on-surface-variant leading-relaxed">
        <div className="p-2.5 rounded-xl bg-surface-container/60 border border-outline-variant/20 space-y-1">
          <span className="font-bold text-on-surface block text-xs">Standard Recurring Bills</span>
          <p className="text-[11px]">
            For recurring expenses like Electricity, Water, Rent, or Subscriptions. Mark bills as paid monthly, view countdowns to due dates, and track overdue items.
          </p>
        </div>
        <div className="p-2.5 rounded-xl bg-surface-container/60 border border-outline-variant/20 space-y-1">
          <span className="font-bold text-on-surface block text-xs">Installment Plans (BNPL / Amortization)</span>
          <p className="text-[11px]">
            For items paid in installments (e.g., gadgets, appliances, 12-month card plans). Tracks current progress (e.g., <em>Month 4 of 12</em>), total settled to date, and remaining commitment. Supports <strong>Pay in Full Early</strong> when settled ahead of schedule.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'currency',
    icon: 'currency_exchange',
    title: '5. Dual Currency & Live Exchange Rates',
    subtitle: 'Track spending and commitments in two currencies with live auto-sync',
    content: (
      <div className="space-y-2 text-xs text-on-surface-variant leading-relaxed">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong className="text-on-surface">Enabling Dual Currency:</strong> Navigate to <em>Settings ➔ Currency Preferences</em> and switch on <strong>Dual Currency Mode</strong>.
          </li>
          <li>
            <strong className="text-on-surface">Auto-Synced Exchange Rate:</strong> Live conversion rates are automatically refreshed from a free public exchange rate provider on launch.
          </li>
          <li>
            <strong className="text-on-surface">Visual Hierarchy:</strong> The assigned currency is displayed in <strong>bold on top</strong>, with the converted equivalent displayed <strong>smaller below</strong>.
          </li>
          <li>
            <strong className="text-on-surface">Disable Protection:</strong> Dual currency cannot be turned off if you have active secondary currency records, preventing calculation conflicts until converted.
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'budget',
    icon: 'pie_chart',
    title: '6. Category Budgets & Spending Limits',
    subtitle: 'Set monthly limits and prevent overspending with color-coded alerts',
    content: (
      <div className="space-y-2 text-xs text-on-surface-variant leading-relaxed">
        <p>
          Assign monthly spending limits to specific categories (e.g. $400 for Groceries, $200 for Dining).
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><span className="text-success font-semibold">Green (Safe):</span> Spending is well under budget.</li>
          <li><span className="text-warning font-semibold">Yellow / Orange (Warning):</span> Spending has exceeded 80% of the limit.</li>
          <li><span className="text-error font-semibold">Red (Overbudget):</span> Spending has surpassed the target limit.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'pwa',
    icon: 'install_mobile',
    title: '7. Installing on iOS, Android & Desktop',
    subtitle: 'Add My Badyet Tracker to your home screen for quick offline-ready access',
    content: (
      <div className="space-y-2 text-xs text-on-surface-variant leading-relaxed">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong className="text-on-surface">iOS (iPhone/iPad):</strong> Open in Safari ➔ Tap the <strong>Share button</strong> (square with arrow up) ➔ Scroll down and tap <strong>"Add to Home Screen"</strong>.
          </li>
          <li>
            <strong className="text-on-surface">Android:</strong> Tap the <strong>"Install"</strong> button in Settings or open Chrome options (three dots) ➔ Tap <strong>"Install App"</strong>.
          </li>
          <li>
            <strong className="text-on-surface">Desktop (Chrome/Edge):</strong> Click the install icon inside the browser URL address bar.
          </li>
        </ul>
      </div>
    ),
  },
];

const FAQS = [
  {
    q: 'Is my financial data secure and private?',
    a: 'Yes. All records are isolated in private user partitions protected by database-level security rules and encrypted in transit (TLS 1.3) and at rest (AES-256). We never sell your data or serve ads.',
  },
  {
    q: 'Can I sync my budget across multiple phones or laptops?',
    a: 'Yes. Sign in with the same Google or Email account on any device, and all transactions, bills, and budgets will synchronize in real time.',
  },
  {
    q: 'What happens if I accidentally delete a bill or expense?',
    a: 'Every deletion has an instant "Undo" button on the notification toast. Soft-deleted items are safely quarantined for 6 months before being permanently purged.',
  },
  {
    q: 'How does the Daily Budgeting Tip work?',
    a: 'A new practical tip from our 60-tip money-saving library appears once a day on app launch. You can also re-read or shuffle tips anytime from Settings.',
  },
];

export default function HelpSupport() {
  const navigate = useNavigate();
  const [openSectionId, setOpenSectionId] = useState('dashboard');
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSection = (id) => {
    setOpenSectionId((prev) => (prev === id ? null : id));
  };

  const toggleFaq = (idx) => {
    setOpenFaqIndex((prev) => (prev === idx ? null : idx));
  };

  const filteredSections = HELP_SECTIONS.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5 pb-8 animate-fadeIn">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors shrink-0"
          title="Go back"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
        </button>
        <div>
          <h2 className="font-headline text-lg sm:text-xl font-bold text-on-surface">
            Help & User Guide
          </h2>
          <p className="text-xs text-on-surface-variant">
            Learn how to use features, track expenses, and manage plans
          </p>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-secondary/10 border border-secondary/30 flex items-start gap-3.5 shadow-xs">
        <div className="w-11 h-11 rounded-2xl bg-secondary text-white flex items-center justify-center shrink-0 shadow-sm">
          <span className="material-symbols-outlined text-2xl">menu_book</span>
        </div>
        <div className="space-y-1 min-w-0 flex-1">
          <h3 className="font-headline text-sm sm:text-base font-bold text-on-surface">
            Mastering Your Budget
          </h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Explore step-by-step guides for every feature, from day-to-day spending logs to multi-month installment commitments and dual currency tracking.
          </p>
        </div>
      </div>

      {/* Search Guides */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">
          search
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search guides (e.g. Installment, Month Filter, Dual Currency)..."
          className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-xs sm:text-sm text-on-surface placeholder:text-outline outline-none focus:border-secondary focus:ring-1 focus:ring-secondary shadow-xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-1"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        )}
      </div>

      {/* Feature Walkthrough Accordions */}
      <div className="space-y-3">
        <h3 className="font-headline text-sm font-bold text-on-surface px-1">
          Feature Walkthroughs
        </h3>

        {filteredSections.map((sec) => {
          const isOpen = openSectionId === sec.id;
          return (
            <div
              key={sec.id}
              className={`app-card p-0! overflow-hidden transition-all border ${
                isOpen ? 'border-secondary/40 shadow-xs' : 'border-outline-variant/20'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleSection(sec.id)}
                className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-surface-container/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isOpen
                        ? 'bg-secondary text-white'
                        : 'bg-surface-container text-secondary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{sec.icon}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-headline text-xs sm:text-sm font-bold text-on-surface truncate">
                      {sec.title}
                    </h4>
                    <p className="text-[11px] text-on-surface-variant truncate">
                      {sec.subtitle}
                    </p>
                  </div>
                </div>
                <span
                  className={`material-symbols-outlined text-outline transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-secondary' : ''
                  }`}
                >
                  expand_more
                </span>
              </button>

              {isOpen && (
                <div className="p-4 pt-1 border-t border-outline-variant/15 animate-fadeIn">
                  {sec.content}
                </div>
              )}
            </div>
          );
        })}

        {filteredSections.length === 0 && (
          <div className="text-center py-8 app-card text-xs text-on-surface-variant">
            No guides match "{searchQuery}"
          </div>
        )}
      </div>

      {/* FAQ Section */}
      <div className="space-y-3 pt-2">
        <h3 className="font-headline text-sm font-bold text-on-surface px-1">
          Frequently Asked Questions
        </h3>
        <div className="app-card p-0! overflow-hidden divide-y divide-outline-variant/20 border border-outline-variant/20">
          {FAQS.map((faq, idx) => {
            const isFaqOpen = openFaqIndex === idx;
            return (
              <div key={idx} className="transition-colors">
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-left hover:bg-surface-container/30 transition-colors"
                >
                  <span className="text-xs sm:text-sm font-semibold text-on-surface flex-1">
                    {faq.q}
                  </span>
                  <span
                    className={`material-symbols-outlined text-outline text-lg shrink-0 transition-transform ${
                      isFaqOpen ? 'rotate-180 text-secondary' : ''
                    }`}
                  >
                    expand_more
                  </span>
                </button>
                {isFaqOpen && (
                  <div className="px-4 pb-3.5 text-xs text-on-surface-variant leading-relaxed animate-fadeIn">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Links Footer */}
      <div className="pt-2 flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={() => navigate('/privacy-security')}
          className="flex-1 p-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <span className="material-symbols-outlined text-base text-secondary">security</span>
          <span>Privacy & Security Architecture</span>
        </button>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-daily-tip'))}
          className="flex-1 p-3 rounded-xl bg-secondary/15 hover:bg-secondary/25 text-secondary text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <span className="material-symbols-outlined text-base">tips_and_updates</span>
          <span>Read Daily Tip</span>
        </button>
      </div>

      {/* Version info */}
      <div className="text-center py-2">
        <p className="text-[11px] text-outline">
          My Badyet Tracker v1.0.0 • Help Center
        </p>
      </div>
    </div>
  );
}
