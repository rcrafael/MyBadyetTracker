import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCategoriesFromFirestore,
  addCategoryToFirestore,
} from '../services/firestoreService';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useInstall } from '../context/InstallContext';
import DualCurrencyDisplay from '../components/common/DualCurrencyDisplay';

function SettingsItem({ icon, label, subtitle, trailing, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-3.5 sm:p-4 hover:bg-surface-container/50 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="material-symbols-outlined text-outline text-xl shrink-0">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium text-on-surface truncate block">{label}</span>
          {subtitle && (
            <span className="text-xs text-on-surface-variant truncate block">{subtitle}</span>
          )}
        </div>
      </div>
      <div className="shrink-0 flex items-center">
        {trailing || (
          <span className="material-symbols-outlined text-outline-variant text-xl">chevron_right</span>
        )}
      </div>
    </div>
  );
}

function Toggle({ enabled, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        enabled ? 'bg-secondary' : 'bg-surface-dim dark:bg-surface-container-highest'
      }`}
    >
      <span
        className={`${
          enabled ? 'translate-x-5' : 'translate-x-0'
        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out`}
      />
    </button>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const {
    isDualCurrencyEnabled,
    setDualCurrencyEnabled,
    mainCurrency,
    secondaryCurrency,
    exchangeRate,
    lastRateUpdated,
    isRateLoading,
    mainCurrencyInfo,
    secondaryCurrencyInfo,
    currencies,
    setMainCurrency,
    setSecondaryCurrency,
    refreshExchangeRate,
  } = useCurrency();
  const { isStandalone, platform, openInstallModal } = useInstall();

  const [categories, setCategories] = useState([]);
  const [notifications, setNotifications] = useState(true);
  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);

  // Dual Currency Modal State
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [currencyTargetType, setCurrencyTargetType] = useState('main'); // 'main' | 'secondary'
  const [currencySearch, setCurrencySearch] = useState('');

  // Conflict Modal State when user tries to disable dual currency with active secondary records
  const [conflictWarning, setConflictWarning] = useState(null);

  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('category');
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    loadCategories();
  }, [user]);

  async function loadCategories() {
    try {
      const data = await getCategoriesFromFirestore(user?.uid);
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const added = await addCategoryToFirestore(
        {
          name: newCatName.trim(),
          icon: newCatIcon,
          color: 'bg-secondary-container',
          textColor: 'text-on-secondary-container',
        },
        user?.uid
      );
      setCategories((prev) => [...prev, added]);
      setIsAddCatModalOpen(false);
      setNewCatName('');
      showToast(`Category "${added.name}" added!`);
    } catch (err) {
      showToast('Error adding category.', true);
    }
  };

  const handleToggleDualCurrency = async () => {
    const nextState = !isDualCurrencyEnabled;
    const result = await setDualCurrencyEnabled(nextState);

    if (result.success) {
      showToast(
        nextState
          ? 'Dual Currency mode enabled!'
          : 'Dual Currency mode disabled. Single currency active.'
      );
    } else if (result.reason === 'has_secondary_items') {
      setConflictWarning(result.usage);
    }
  };

  const handleSelectCurrency = async (code) => {
    if (!isDualCurrencyEnabled || currencyTargetType === 'main') {
      if (isDualCurrencyEnabled && code === secondaryCurrency) {
        showToast('Main and Secondary currencies should ideally be distinct.', true);
      }
      await setMainCurrency(code);
      showToast(`${isDualCurrencyEnabled ? 'Main currency' : 'Primary currency'} set to ${code}`);
    } else {
      if (code === mainCurrency) {
        showToast('Main and Secondary currencies should ideally be distinct.', true);
      }
      await setSecondaryCurrency(code);
      showToast(`Secondary currency set to ${code}`);
    }
  };

  const handleRefreshLiveRate = async () => {
    await refreshExchangeRate();
    showToast(`Live exchange rate refreshed from open.er-api.com!`);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      showToast('Failed to sign out.', true);
    }
  };

  function showToast(msg, isError = false) {
    setToastMessage({ text: msg, isError });
    setTimeout(() => setToastMessage(null), 4000);
  }

  const filteredCurrencies = currencies.filter(
    (c) =>
      c.name.toLowerCase().includes(currencySearch.toLowerCase()) ||
      c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
      c.symbol.toLowerCase().includes(currencySearch.toLowerCase())
  );

  return (
    <div className="space-y-5 pb-6">
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

      {/* Conflict Warning Dialog Modal */}
      {conflictWarning && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[80] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="app-card max-w-md w-full p-5 space-y-4 shadow-2xl border border-error/40 my-auto relative animate-fadeIn">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-error/15 text-error flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">warning</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-headline text-base font-bold text-on-surface">
                  Cannot Disable Dual Currency
                </h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  You currently have existing records configured in a non-main currency (
                  <strong className="text-on-surface font-mono">{secondaryCurrency}</strong>).
                </p>
              </div>
            </div>

            <div className="p-3 bg-surface-container/60 rounded-xl border border-outline-variant/20 space-y-2 text-xs">
              <div className="flex justify-between font-semibold text-on-surface">
                <span>Active non-main bills/plans:</span>
                <span className="font-mono text-error font-bold">{conflictWarning.billCount}</span>
              </div>
              <div className="flex justify-between font-semibold text-on-surface">
                <span>Non-main transactions:</span>
                <span className="font-mono text-error font-bold">{conflictWarning.transactionCount}</span>
              </div>

              {conflictWarning.sampleItems && conflictWarning.sampleItems.length > 0 && (
                <div className="pt-2 border-t border-outline-variant/20 space-y-1">
                  <span className="text-[11px] text-outline uppercase font-bold tracking-wider block">
                    Affected items:
                  </span>
                  <ul className="text-[11px] text-on-surface-variant space-y-1 list-disc pl-4">
                    {conflictWarning.sampleItems.map((item, idx) => (
                      <li key={idx} className="truncate">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              To turn off dual currency mode, please edit or update these items to use your main currency (
              <strong className="text-on-surface font-mono">{mainCurrency}</strong>) first.
            </p>

            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={() => setConflictWarning(null)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-secondary text-white hover:bg-secondary/90 shadow-xs"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Currency Setup Modal */}
      {isCurrencyModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[70] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="app-card max-w-lg w-full space-y-3.5 shadow-2xl border-secondary/40 max-h-[85vh] sm:max-h-[88vh] flex flex-col my-auto relative">
            <div className="flex justify-between items-center shrink-0 pb-2 border-b border-outline-variant/20">
              <div>
                <h3 className="font-headline text-base font-bold text-on-surface">
                  {isDualCurrencyEnabled ? 'Dual Currency Configuration' : 'Currency Preferences'}
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {isDualCurrencyEnabled
                    ? 'Configure main and secondary currencies with live exchange rates'
                    : 'Select your standard primary currency'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCurrencyModalOpen(false)}
                className="text-outline hover:text-on-surface p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Master Toggle Banner */}
            <div className="p-3 bg-surface-container/60 rounded-xl flex items-center justify-between gap-3 shrink-0 border border-outline-variant/20">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-base">
                    currency_exchange
                  </span>
                  <span className="text-xs font-bold text-on-surface">Dual Currency Mode</span>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  Track bills and plans in two currencies with live exchange rates
                </p>
              </div>
              <Toggle enabled={isDualCurrencyEnabled} onChange={handleToggleDualCurrency} />
            </div>

            {/* Dual Currency Active Content */}
            {isDualCurrencyEnabled ? (
              <>
                {/* Currency Type Selector Tabs */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-surface-container rounded-xl shrink-0">
                  <button
                    type="button"
                    onClick={() => setCurrencyTargetType('main')}
                    className={`p-2.5 rounded-lg text-xs font-semibold flex flex-col items-center gap-0.5 transition-all ${
                      currencyTargetType === 'main'
                        ? 'bg-surface-container-lowest text-secondary shadow-xs font-bold border border-secondary/30'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{mainCurrencyInfo.flag}</span>
                      <span>Main Currency</span>
                    </div>
                    <span className="text-[11px] font-mono text-outline">
                      {mainCurrencyInfo.code} ({mainCurrencyInfo.symbol})
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrencyTargetType('secondary')}
                    className={`p-2.5 rounded-lg text-xs font-semibold flex flex-col items-center gap-0.5 transition-all ${
                      currencyTargetType === 'secondary'
                        ? 'bg-surface-container-lowest text-secondary shadow-xs font-bold border border-secondary/30'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{secondaryCurrencyInfo.flag}</span>
                      <span>Secondary Currency</span>
                    </div>
                    <span className="text-[11px] font-mono text-outline">
                      {secondaryCurrencyInfo.code} ({secondaryCurrencyInfo.symbol})
                    </span>
                  </button>
                </div>

                {/* Live Exchange Rate Box */}
                <div className="p-3 bg-secondary/10 border border-secondary/30 rounded-xl space-y-2 shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-secondary text-base">
                        currency_exchange
                      </span>
                      <span className="text-xs font-bold text-on-surface">Auto-Synced Exchange Rate</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRefreshLiveRate}
                      disabled={isRateLoading}
                      className="text-[11px] font-semibold text-secondary hover:underline flex items-center gap-1 active:scale-95 disabled:opacity-50"
                    >
                      <span
                        className={`material-symbols-outlined text-sm ${
                          isRateLoading ? 'animate-spin' : ''
                        }`}
                      >
                        sync
                      </span>
                      <span>{isRateLoading ? 'Updating...' : 'Refresh Live Rate'}</span>
                    </button>
                  </div>

                  <div className="pt-0.5">
                    <span className="font-mono text-base sm:text-lg font-bold text-secondary">
                      1 {mainCurrency} = {exchangeRate > 0 ? exchangeRate.toFixed(4) : '1.0000'} {secondaryCurrency}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-outline pt-1 border-t border-secondary/20 flex-wrap gap-1">
                    <span>Free Live API (open.er-api.com)</span>
                    <span>
                      {lastRateUpdated
                        ? `Live as of ${new Date(lastRateUpdated).toLocaleDateString()} ${new Date(
                            lastRateUpdated
                          ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : 'Updated on launch'}
                    </span>
                  </div>
                </div>

                {/* Live Dual Currency Display Preview */}
                <div className="p-3 bg-surface-container/60 rounded-xl flex items-center justify-between shrink-0 border border-outline-variant/15">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-outline tracking-wider block">
                      Dual Currency Preview
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      Assigned currency bigger, converted below
                    </span>
                  </div>
                  <DualCurrencyDisplay amount={100} fromCurrency={mainCurrency} primaryMode="assigned" align="right" />
                </div>
              </>
            ) : (
              /* Single Currency Active Content */
              <div className="p-3 bg-surface-container/40 rounded-xl border border-outline-variant/15 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-outline tracking-wider block">
                    Current Currency
                  </span>
                  <span className="text-xs font-semibold text-on-surface">
                    {mainCurrencyInfo.flag} {mainCurrencyInfo.name} ({mainCurrencyInfo.symbol})
                  </span>
                </div>
                <span className="text-base font-mono font-bold text-secondary">
                  {mainCurrencyInfo.code}
                </span>
              </div>
            )}

            {/* Search Input for Currency Selection */}
            <div className="relative shrink-0">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
                search
              </span>
              <input
                type="text"
                value={currencySearch}
                onChange={(e) => setCurrencySearch(e.target.value)}
                placeholder={`Search ${
                  isDualCurrencyEnabled
                    ? currencyTargetType === 'main'
                      ? 'Main'
                      : 'Secondary'
                    : 'Primary'
                } currency (e.g. USD, PHP, EUR, ₱)...`}
                className="w-full bg-surface-container pl-9 pr-3 py-2 rounded-xl text-xs sm:text-sm text-on-surface placeholder:text-outline/70 border border-outline-variant/30 outline-none focus:ring-1 focus:ring-secondary"
              />
            </div>

            {/* Currencies List */}
            <div className="overflow-y-auto space-y-1.5 flex-1 pr-1 max-h-52 custom-scrollbar">
              {filteredCurrencies.map((c) => {
                const isSelected = !isDualCurrencyEnabled
                  ? c.code === mainCurrency
                  : currencyTargetType === 'main'
                  ? c.code === mainCurrency
                  : c.code === secondaryCurrency;

                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelectCurrency(c.code)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'bg-secondary/15 border border-secondary text-on-surface font-semibold shadow-xs'
                        : 'bg-surface-container/40 hover:bg-surface-container border border-transparent text-on-surface'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl shrink-0 select-none">{c.flag}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-on-surface">
                            {c.code}
                          </span>
                          <span className="text-xs font-mono px-1.5 py-0.2 bg-surface-container-high rounded text-on-surface-variant font-medium">
                            {c.symbol}
                          </span>
                        </div>
                        <span className="text-[11px] text-on-surface-variant block truncate">
                          {c.name}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="material-symbols-outlined text-secondary text-lg shrink-0">
                        check_circle
                      </span>
                    )}
                  </button>
                );
              })}

              {filteredCurrencies.length === 0 && (
                <div className="text-center py-8 text-on-surface-variant text-xs">
                  No currencies match "{currencySearch}"
                </div>
              )}
            </div>

            <div className="pt-2 shrink-0 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setIsCurrencyModalOpen(false)}
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {isAddCatModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[70] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <form
            onSubmit={handleAddCategory}
            className="app-card max-w-sm w-full space-y-4 shadow-2xl border-secondary/40 my-auto relative"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-headline text-base font-bold text-on-surface">Add Category</h3>
              <button
                type="button"
                onClick={() => setIsAddCatModalOpen(false)}
                className="text-outline hover:text-on-surface p-1"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-on-surface-variant font-semibold block mb-1">Category Name</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Travel, Gym, Utilities"
                  className="w-full bg-surface-container px-3 py-2 rounded-lg text-on-surface outline-none focus:ring-1 focus:ring-secondary"
                  required
                />
              </div>

              <div>
                <label className="text-on-surface-variant font-semibold block mb-1">Icon Name</label>
                <select
                  value={newCatIcon}
                  onChange={(e) => setNewCatIcon(e.target.value)}
                  className="w-full bg-surface-container px-3 py-2 rounded-lg text-on-surface outline-none focus:ring-1 focus:ring-secondary"
                >
                  <option value="flight">flight (Travel)</option>
                  <option value="fitness_center">fitness_center (Gym)</option>
                  <option value="pets">pets (Pets)</option>
                  <option value="home">home (Home)</option>
                  <option value="medical_services">medical_services (Medical)</option>
                  <option value="work">work (Work)</option>
                  <option value="category">category (General)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddCatModalOpen(false)}
                className="flex-1 py-2 rounded-lg text-xs font-semibold bg-surface-container text-on-surface hover:bg-surface-container-high"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-lg text-xs font-semibold bg-secondary text-white hover:bg-secondary/90 shadow-xs"
              >
                Save Category
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User Profile Card */}
      {user && (
        <section className="app-card flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-12 h-12 rounded-full object-cover shrink-0 ring-2 ring-secondary/40 shadow-xs"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-headline text-base font-bold shrink-0">
                {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-headline text-sm sm:text-base font-bold text-on-surface truncate">
                {user.displayName || 'User Account'}
              </h3>
              <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="text-xs font-semibold text-error bg-error-container/40 hover:bg-error-container px-3 py-1.5 rounded-xl transition-colors shrink-0 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            <span>Sign Out</span>
          </button>
        </section>
      )}

      {/* Categories Grid Section */}
      <section className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h2 className="font-headline text-base sm:text-lg font-bold text-on-surface">Categories</h2>
          <button
            onClick={() => setIsAddCatModalOpen(true)}
            className="text-xs font-semibold text-secondary flex items-center gap-1 hover:underline active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            <span>Add Category</span>
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="app-card flex flex-col items-center justify-center p-3 text-center gap-1.5"
            >
              <div className={`w-10 h-10 rounded-full ${cat.color || 'bg-surface-container'} flex items-center justify-center shrink-0`}>
                <span className={`material-symbols-outlined filled ${cat.textColor || 'text-on-surface'} text-xl`}>
                  {cat.icon || 'category'}
                </span>
              </div>
              <span className="text-xs font-semibold text-on-surface truncate max-w-full px-1">
                {cat.name}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* App Preferences */}
      <section className="space-y-2">
        <h2 className="font-headline text-base sm:text-lg font-bold text-on-surface px-1">App Settings</h2>
        <div className="app-card p-0! overflow-hidden divide-y divide-outline-variant/20">
          <SettingsItem
            icon="notifications"
            label="Notifications"
            trailing={
              <Toggle enabled={notifications} onChange={() => setNotifications(!notifications)} />
            }
          />
          <SettingsItem
            icon="currency_exchange"
            label={isDualCurrencyEnabled ? 'Dual Currency Support' : 'Currency Preferences'}
            subtitle={
              isDualCurrencyEnabled
                ? `Main: ${mainCurrencyInfo.code} (${mainCurrencyInfo.symbol}) • Sec: ${secondaryCurrencyInfo.code} (${secondaryCurrencyInfo.symbol}) • Rate: 1 ${mainCurrency} = ${exchangeRate.toFixed(2)} ${secondaryCurrency}`
                : `Active: ${mainCurrencyInfo.code} (${mainCurrencyInfo.symbol}) • Dual currency disabled`
            }
            onClick={() => setIsCurrencyModalOpen(true)}
            trailing={
              <div className="flex items-center gap-1.5 bg-surface-container hover:bg-surface-container-high px-2.5 py-1 rounded-lg border border-outline-variant/30 transition-colors">
                <span className="text-xs font-bold text-on-surface">
                  {isDualCurrencyEnabled
                    ? `${mainCurrencyInfo.flag} ${mainCurrencyInfo.code} / ${secondaryCurrencyInfo.flag} ${secondaryCurrencyInfo.code}`
                    : `${mainCurrencyInfo.flag} ${mainCurrencyInfo.code}`}
                </span>
                <span className="material-symbols-outlined text-outline text-base">chevron_right</span>
              </div>
            }
          />
          <SettingsItem
            icon={platform === 'ios' ? 'phone_iphone' : 'add_to_home_screen'}
            label="Home Screen Shortcut"
            subtitle={
              isStandalone
                ? 'Active as installed app'
                : platform === 'ios'
                ? 'Add shortcut to iPhone / iPad'
                : platform === 'android'
                ? 'Install app on Android'
                : 'Install app shortcut'
            }
            onClick={openInstallModal}
            trailing={
              isStandalone ? (
                <div className="flex items-center gap-1 text-xs font-semibold text-secondary bg-secondary/15 px-2.5 py-1 rounded-lg">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>Installed</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-secondary text-white hover:bg-secondary/90 px-3 py-1 rounded-lg text-xs font-semibold shadow-xs transition-colors">
                  <span>{platform === 'ios' ? 'How to Add' : 'Install'}</span>
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </div>
              )
            }
          />
          <SettingsItem
            icon="dark_mode"
            label="Dark Mode"
            trailing={<Toggle enabled={isDark} onChange={toggleTheme} />}
          />
          <SettingsItem
            icon="security"
            label="Privacy & Security"
            subtitle="Learn how we protect and isolate your data"
            onClick={() => navigate('/privacy-security')}
          />
          <SettingsItem icon="help" label="Help & Support" />
        </div>
      </section>

      {/* Footer Info */}
      <div className="text-center py-2">
        <p className="text-xs font-mono font-medium text-outline">My Badyet Tracker v1.0.0</p>
      </div>
    </div>
  );
}
