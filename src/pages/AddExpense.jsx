import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategoriesFromFirestore, addTransactionToFirestore } from '../services/firestoreService';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';

export default function AddExpense() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    isDualCurrencyEnabled,
    mainCurrency,
    mainCurrencyInfo,
    secondaryCurrencyInfo,
    convertToSecondary,
    formatCurrency,
  } = useCurrency();
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadCategories() {
      setLoadingCategories(true);
      try {
        const data = await getCategoriesFromFirestore(user?.uid);
        setCategories(data);
        if (data && data.length > 0) {
          setSelectedCategory(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    }
    loadCategories();
  }, [user]);

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    setSaving(true);
    setError(null);

    const chosenCat = selectedCategory || (categories[0]?.id || 'other');
    const matchedCategory = categories.find((c) => c.id === chosenCat);
    const catName = matchedCategory ? matchedCategory.name : chosenCat;

    try {
      await addTransactionToFirestore({
        amount: parseFloat(amount),
        currency: mainCurrency,
        description: description.trim() || `${catName.charAt(0).toUpperCase() + catName.slice(1)} Expense`,
        category: chosenCat,
        date,
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        recurring,
        notes: notes.trim(),
        status: 'cleared',
      });
      navigate('/transactions');
    } catch (err) {
      console.error('Failed to add transaction to Firestore:', err);
      setError('Could not save to Cloud Firestore. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const parsedAmount = parseFloat(amount) || 0;
  const convertedSecondaryAmount = convertToSecondary(parsedAmount, mainCurrency);

  return (
    <form onSubmit={handleSave} className="space-y-5 pb-6">
      {error && (
        <div className="p-3 bg-error-container text-on-error-container text-xs font-semibold rounded-xl">
          {error}
        </div>
      )}

      {/* Amount Hero Section */}
      <section className="app-card text-center py-6 px-4 flex flex-col items-center justify-center space-y-1">
        <label
          htmlFor="amount-input"
          className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block"
        >
          Amount Spent ({mainCurrencyInfo.code})
        </label>
        <div className="flex items-center justify-center w-full max-w-xs">
          <span className="text-3xl sm:text-4xl font-headline font-bold text-on-surface-variant mr-1 select-none">
            {mainCurrencyInfo.symbol}
          </span>
          <input
            id="amount-input"
            autoFocus
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full text-3xl sm:text-4xl font-headline font-bold text-center bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 text-on-surface placeholder:text-surface-dim"
            required
          />
        </div>

        {/* Secondary Converted Preview for day-to-day reference (Only when Dual Currency is Enabled) */}
        {isDualCurrencyEnabled && parsedAmount > 0 && mainCurrency !== secondaryCurrencyInfo.code && (
          <p className="text-xs font-mono font-medium text-on-surface-variant pt-1 animate-fadeIn">
            ≈ {formatCurrency(convertedSecondaryAmount, secondaryCurrencyInfo.code)}
          </p>
        )}
      </section>

      {/* Description / Merchant */}
      <div className="app-card space-y-1.5">
        <label
          htmlFor="desc-input"
          className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block"
        >
          Merchant / Title
        </label>
        <input
          id="desc-input"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Whole Foods, Uber, Artisan Kitchen"
          className="w-full bg-surface-container/40 dark:bg-surface-container-low px-3 py-2 rounded-xl text-sm text-on-surface placeholder:text-outline/70 border border-outline-variant/30 outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
        />
      </div>

      {/* Category Selector */}
      <section className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <label className="text-sm font-bold text-on-surface block">
            Category
          </label>
          <span className="text-xs text-on-surface-variant font-medium">
            {categories.find((c) => c.id === selectedCategory)?.name || ''}
          </span>
        </div>
        <div className="flex gap-3 overflow-x-auto hide-scrollbar py-1 px-1 -mx-1">
          {loadingCategories ? (
            <div className="flex items-center gap-2 py-4 px-2 text-xs text-outline">
              <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
              <span>Loading categories...</span>
            </div>
          ) : (
            categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex flex-col items-center justify-center min-w-[76px] w-[76px] h-20 rounded-2xl shrink-0 transition-all border-2 active:scale-95 ${
                    isSelected
                      ? 'bg-secondary-container text-on-secondary-container border-secondary shadow-sm font-semibold'
                      : 'bg-surface-container-lowest text-on-surface-variant border-transparent hover:bg-surface-container/60'
                  }`}
                >
                  <span className={`material-symbols-outlined text-2xl mb-1 ${isSelected ? 'filled' : ''}`}>
                    {cat.icon || 'category'}
                  </span>
                  <span className="text-xs leading-none tracking-tight truncate max-w-[68px] px-1 text-center">
                    {cat.name}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* Date and Recurring */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Date Picker Card */}
        <div className="app-card flex flex-col justify-center">
          <label
            htmlFor="date-input"
            className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5 block"
          >
            Transaction Date
          </label>
          <div className="flex items-center gap-2.5 bg-surface-container/50 dark:bg-surface-container-low px-3 py-2 rounded-xl">
            <span className="material-symbols-outlined text-outline shrink-0 text-xl">
              calendar_today
            </span>
            <input
              id="date-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full min-w-0 bg-transparent border-none text-sm sm:text-base text-on-surface font-medium outline-none focus:ring-0 p-0"
            />
          </div>
        </div>

        {/* Recurring Toggle Card */}
        <div className="app-card flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Make Recurring
            </span>
            <button
              type="button"
              onClick={() => setRecurring(!recurring)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                recurring ? 'bg-secondary' : 'bg-surface-dim dark:bg-surface-container-highest'
              }`}
            >
              <span
                className={`${
                  recurring ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out`}
              />
            </button>
          </div>
          <p className="text-xs text-on-surface-variant mt-2">
            {recurring ? 'Repeats monthly on this day' : 'One-time transaction'}
          </p>
        </div>
      </div>

      {/* Notes Field */}
      <div className="app-card space-y-1.5">
        <label
          htmlFor="notes-input"
          className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block"
        >
          Notes & Memo
        </label>
        <textarea
          id="notes-input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add memo or payment details..."
          rows={3}
          className="w-full bg-surface-container/40 dark:bg-surface-container-low px-3 py-2 rounded-xl text-sm text-on-surface placeholder:text-outline/70 border border-outline-variant/30 outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all resize-none"
        />
      </div>

      {/* Save Button */}
      <button
        type="submit"
        disabled={!amount || parseFloat(amount) <= 0 || saving}
        className="w-full bg-secondary text-white text-base font-semibold py-3.5 px-4 rounded-xl hover:bg-secondary/90 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-secondary/20 flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
            <span>Saving...</span>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-xl">check</span>
            <span>Save Expense</span>
          </>
        )}
      </button>
    </form>
  );
}
