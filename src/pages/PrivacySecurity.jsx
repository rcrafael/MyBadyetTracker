import { useNavigate } from 'react-router-dom';

export default function PrivacySecurity() {
  const navigate = useNavigate();

  return (
    <div className="space-y-5 pb-8 animate-fadeIn">
      {/* Header with Navigation */}
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
            Privacy & Security
          </h2>
          <p className="text-xs text-on-surface-variant">
            How we protect your data and respect your personal privacy
          </p>
        </div>
      </div>

      {/* Trust Hero Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-secondary/10 border border-secondary/30 flex items-start gap-3.5 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-secondary text-white flex items-center justify-center shrink-0 shadow-sm">
          <span className="material-symbols-outlined text-2xl">verified_user</span>
        </div>
        <div className="space-y-1 min-w-0 flex-1">
          <h3 className="font-headline text-sm sm:text-base font-bold text-on-surface">
            Your Financial Data Belongs to You
          </h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            My Badyet Tracker is built with a simple promise: we track your budget for you, not for advertisers. We do not sell your personal information, display ads, or profile your spending habits.
          </p>
        </div>
      </div>

      {/* Core Privacy & Security Pillars */}
      <div className="space-y-3">
        {/* Section 1: What We Collect */}
        <section className="app-card p-4 sm:p-5 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-secondary text-xl">folder_shared</span>
            <h4 className="font-headline text-sm sm:text-base font-bold text-on-surface">
              1. What Information We Store
            </h4>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            We only store the information you explicitly provide to make the app work for you:
          </p>
          <ul className="text-xs text-on-surface-variant space-y-1.5 list-disc pl-5 leading-relaxed">
            <li>
              <strong className="text-on-surface">Account Details:</strong> Your name and email address when you sign in via Google or Email, used solely to identify your private account.
            </li>
            <li>
              <strong className="text-on-surface">Financial Entries:</strong> The expenses, categories, bills, installment plans, and budget limits that you record.
            </li>
            <li>
              <strong className="text-on-surface">Preferences:</strong> Your selected currency (or dual currencies), theme mode (dark/light), and app settings.
            </li>
          </ul>
        </section>

        {/* Section 2: How We Protect Your Data */}
        <section className="app-card p-4 sm:p-5 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-secondary text-xl">lock</span>
            <h4 className="font-headline text-sm sm:text-base font-bold text-on-surface">
              2. Bank-Grade Encryption & Cloud Security
            </h4>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            We utilize world-class Google Cloud & Firebase infrastructure to ensure your data stays secure:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div className="p-3 rounded-xl bg-surface-container/60 border border-outline-variant/20 space-y-1">
              <div className="flex items-center gap-1.5 text-secondary font-semibold text-xs">
                <span className="material-symbols-outlined text-base">shield</span>
                <span>Encrypted in Transit</span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                100% of network traffic between your device and our servers is encrypted using modern HTTPS (TLS 1.3).
              </p>
            </div>

            <div className="p-3 rounded-xl bg-surface-container/60 border border-outline-variant/20 space-y-1">
              <div className="flex items-center gap-1.5 text-secondary font-semibold text-xs">
                <span className="material-symbols-outlined text-base">database</span>
                <span>Encrypted at Rest</span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                All stored documents, budgets, and logs are encrypted on Google Cloud persistent disks using 256-bit AES encryption.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Isolation */}
        <section className="app-card p-4 sm:p-5 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-secondary text-xl">admin_panel_settings</span>
            <h4 className="font-headline text-sm sm:text-base font-bold text-on-surface">
              3. Strict Personal Data Isolation
            </h4>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Your data is isolated in a private user partition. Database-level security rules strictly enforce that only your authenticated account has permission to view, edit, or delete your records. No other user can ever view or access your budget.
          </p>
        </section>

        {/* Section 4: Soft Deletion & Safety Net */}
        <section className="app-card p-4 sm:p-5 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-secondary text-xl">restore_from_trash</span>
            <h4 className="font-headline text-sm sm:text-base font-bold text-on-surface">
              4. Accidental Deletion Protection
            </h4>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            When you delete an expense, bill, or installment plan, it is moved to a protected retention archive with an instant <strong className="text-on-surface">"Undo"</strong> option. Deleted items are kept in a safe quarantine for 6 months before being permanently erased, safeguarding you from accidental data loss.
          </p>
        </section>

        {/* Section 5: Live Exchange Rates & External Services */}
        <section className="app-card p-4 sm:p-5 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-secondary text-xl">currency_exchange</span>
            <h4 className="font-headline text-sm sm:text-base font-bold text-on-surface">
              5. Live Currency Exchange Rates
            </h4>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            When Dual Currency mode is enabled, the app checks the current conversion rate from a free public currency API. This lookup is completely anonymous: no account details, transaction amounts, or personal data are ever sent.
          </p>
        </section>

        {/* Section 6: Your Control & Rights */}
        <section className="app-card p-4 sm:p-5 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-secondary text-xl">manage_accounts</span>
            <h4 className="font-headline text-sm sm:text-base font-bold text-on-surface">
              6. You Are in Total Control
            </h4>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            You can modify, update, or remove your entries at any time directly through the app. Signing out immediately terminates your active session on that device.
          </p>
        </section>
      </div>

      {/* Footer Info */}
      <div className="text-center py-2 space-y-1">
        <p className="text-xs text-outline">
          My Badyet Tracker • v1.0.0
        </p>
        <p className="text-[11px] text-outline/80">
          Last updated: August 2026
        </p>
      </div>
    </div>
  );
}
