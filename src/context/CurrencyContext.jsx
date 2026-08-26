import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { fetchLiveExchangeRate } from '../services/exchangeRateService';

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', locale: 'en-US' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', flag: '🇵🇭', locale: 'en-PH' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', locale: 'en-GB' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', locale: 'ja-JP' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', flag: '🇨🇦', locale: 'en-CA' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar', flag: '🇦🇺', locale: 'en-AU' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬', locale: 'en-SG' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', locale: 'en-IN' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', flag: '🇦🇪', locale: 'ar-AE' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭', locale: 'de-CH' },
  { code: 'CNY', symbol: 'CN¥', name: 'Chinese Yuan', flag: '🇨🇳', locale: 'zh-CN' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', flag: '🇭🇰', locale: 'zh-HK' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', flag: '🇰🇷', locale: 'ko-KR' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', flag: '🇲🇽', locale: 'es-MX' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷', locale: 'pt-BR' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', flag: '🇳🇿', locale: 'en-NZ' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', flag: '🇹🇭', locale: 'th-TH' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', flag: '🇲🇾', locale: 'ms-MY' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', flag: '🇮🇩', locale: 'id-ID' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', flag: '🇻🇳', locale: 'vi-VN' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', flag: '🇸🇪', locale: 'sv-SE' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', flag: '🇳🇴', locale: 'nb-NO' },
  { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal', flag: '🇸🇦', locale: 'ar-SA' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', flag: '🇹🇷', locale: 'tr-TR' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦', locale: 'en-ZA' },
];

const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
  const { user } = useAuth();

  // Main currency (defaults to USD or saved preference)
  const [mainCurrency, setMainCurrencyState] = useState(() => {
    return localStorage.getItem('mybadyet_main_currency') || localStorage.getItem('mybadyet_currency') || 'USD';
  });

  // Secondary currency (defaults to PHP or saved preference)
  const [secondaryCurrency, setSecondaryCurrencyState] = useState(() => {
    return localStorage.getItem('mybadyet_secondary_currency') || 'PHP';
  });

  // Exchange rate: 1 mainCurrency = exchangeRate secondaryCurrency
  const [exchangeRate, setExchangeRateState] = useState(() => {
    const saved = localStorage.getItem('mybadyet_exchange_rate');
    return saved ? parseFloat(saved) : 58.5;
  });

  const [lastRateUpdated, setLastRateUpdated] = useState(() => {
    return localStorage.getItem('mybadyet_rate_updated') || null;
  });

  const [isRateLoading, setIsRateLoading] = useState(false);
  const initialFetchDone = useRef(false);

  // Helper to fetch and update live rate
  const fetchAndUpdateRate = useCallback(async (base, target, bypassCache = false) => {
    if (!base || !target) return;
    setIsRateLoading(true);
    try {
      const result = await fetchLiveExchangeRate(base, target, bypassCache);
      if (result && typeof result.rate === 'number' && result.rate > 0) {
        setExchangeRateState(result.rate);
        setLastRateUpdated(result.timestamp);
        localStorage.setItem('mybadyet_exchange_rate', String(result.rate));
        localStorage.setItem('mybadyet_rate_updated', result.timestamp);

        // Optionally persist to Firestore if logged in
        if (user?.uid) {
          try {
            const userRef = doc(db, 'users', user.uid);
            await setDoc(
              userRef,
              { exchangeRate: result.rate, lastRateUpdated: result.timestamp },
              { merge: true }
            );
          } catch (err) {
            console.warn('Could not sync exchange rate to Firestore:', err);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch live exchange rate:', err);
    } finally {
      setIsRateLoading(false);
    }
  }, [user]);

  // Always fetch fresh live exchange rate on app open / refresh
  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchAndUpdateRate(mainCurrency, secondaryCurrency, true);
    }
  }, [mainCurrency, secondaryCurrency, fetchAndUpdateRate]);

  // Load preferences from Firestore on auth change
  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    async function loadUserCurrencyPreferences() {
      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists() && isMounted) {
          const data = snap.data();
          const userMain = data.mainCurrency || data.currency;
          const userSec = data.secondaryCurrency;

          let targetMain = mainCurrency;
          let targetSec = secondaryCurrency;

          if (userMain && CURRENCIES.some((c) => c.code === userMain)) {
            setMainCurrencyState(userMain);
            localStorage.setItem('mybadyet_main_currency', userMain);
            localStorage.setItem('mybadyet_currency', userMain);
            targetMain = userMain;
          }

          if (userSec && CURRENCIES.some((c) => c.code === userSec)) {
            setSecondaryCurrencyState(userSec);
            localStorage.setItem('mybadyet_secondary_currency', userSec);
            targetSec = userSec;
          }

          // Fetch fresh rate for the loaded currencies
          fetchAndUpdateRate(targetMain, targetSec, true);
        }
      } catch (err) {
        console.warn('Could not fetch currency preferences from Firestore:', err);
      }
    }

    loadUserCurrencyPreferences();
    return () => {
      isMounted = false;
    };
  }, [user, fetchAndUpdateRate]);

  // Sync state to Firestore helper
  const syncToFirestore = useCallback(
    async (updates) => {
      if (!user?.uid) return;
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, updates, { merge: true });
      } catch (err) {
        console.warn('Could not save currency preferences to Firestore:', err);
      }
    },
    [user]
  );

  // Set Main Currency
  const setMainCurrency = async (newCode) => {
    const found = CURRENCIES.find((c) => c.code === newCode);
    if (!found) return;

    setMainCurrencyState(newCode);
    localStorage.setItem('mybadyet_main_currency', newCode);
    localStorage.setItem('mybadyet_currency', newCode);

    const updates = { mainCurrency: newCode, currency: newCode };
    await syncToFirestore(updates);
    await fetchAndUpdateRate(newCode, secondaryCurrency, true);
  };

  // Set Secondary Currency
  const setSecondaryCurrency = async (newCode) => {
    const found = CURRENCIES.find((c) => c.code === newCode);
    if (!found) return;

    setSecondaryCurrencyState(newCode);
    localStorage.setItem('mybadyet_secondary_currency', newCode);

    const updates = { secondaryCurrency: newCode };
    await syncToFirestore(updates);
    await fetchAndUpdateRate(mainCurrency, newCode, true);
  };

  // Explicit refresh rate button
  const refreshExchangeRate = async () => {
    await fetchAndUpdateRate(mainCurrency, secondaryCurrency, true);
  };

  // Backward compatibility alias: setCurrency updates main currency
  const setCurrency = setMainCurrency;

  const mainCurrencyInfo = CURRENCIES.find((c) => c.code === mainCurrency) || CURRENCIES[0];
  const secondaryCurrencyInfo = CURRENCIES.find((c) => c.code === secondaryCurrency) || CURRENCIES[1] || CURRENCIES[0];

  // Backward compatibility alias for single currency readers
  const currency = mainCurrency;
  const currencyInfo = mainCurrencyInfo;

  // Conversion Helpers
  const convertAmount = useCallback(
    (amount, fromCode, toCode) => {
      const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
      const from = fromCode || mainCurrency;
      const to = toCode || secondaryCurrency;

      if (from === to) return num;

      const rate = exchangeRate > 0 ? exchangeRate : 1;

      if (from === mainCurrency && to === secondaryCurrency) {
        return num * rate;
      }
      if (from === secondaryCurrency && to === mainCurrency) {
        return num / rate;
      }

      return num;
    },
    [mainCurrency, secondaryCurrency, exchangeRate]
  );

  const convertToMain = useCallback(
    (amount, fromCurrencyCode) => {
      const code = fromCurrencyCode || mainCurrency;
      if (code === mainCurrency) return typeof amount === 'number' ? amount : parseFloat(amount) || 0;
      return convertAmount(amount, code, mainCurrency);
    },
    [mainCurrency, convertAmount]
  );

  const convertToSecondary = useCallback(
    (amount, fromCurrencyCode) => {
      const code = fromCurrencyCode || mainCurrency;
      if (code === secondaryCurrency) return typeof amount === 'number' ? amount : parseFloat(amount) || 0;
      return convertAmount(amount, code, secondaryCurrency);
    },
    [secondaryCurrency, convertAmount]
  );

  // Format Currency string
  const formatCurrency = useCallback(
    (amount, customCurrencyCode = null) => {
      const targetCur = customCurrencyCode
        ? CURRENCIES.find((c) => c.code === customCurrencyCode) || mainCurrencyInfo
        : mainCurrencyInfo;

      const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;

      try {
        return new Intl.NumberFormat(targetCur.locale, {
          style: 'currency',
          currency: targetCur.code,
        }).format(num);
      } catch {
        return `${targetCur.symbol}${num.toFixed(2)}`;
      }
    },
    [mainCurrencyInfo]
  );

  // Dual Currency Formatter
  const formatDualCurrency = useCallback(
    ({ amount, fromCurrency = null, primaryMode = 'assigned' }) => {
      const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
      const nativeCode = fromCurrency || mainCurrency;

      if (primaryMode === 'assigned' || primaryMode === 'native') {
        // Native assigned currency is primary (bigger), converted opposite is secondary (smaller)
        const primaryCode = nativeCode;
        const secondaryCode = nativeCode === secondaryCurrency ? mainCurrency : secondaryCurrency;
        const secondaryAmt = convertAmount(num, primaryCode, secondaryCode);

        return {
          primaryFormatted: formatCurrency(num, primaryCode),
          secondaryFormatted: formatCurrency(secondaryAmt, secondaryCode),
          primaryCode,
          secondaryCode,
          primaryAmount: num,
          secondaryAmount: secondaryAmt,
        };
      }

      // Default main: Main currency is primary (bigger), Secondary currency is smaller below
      const mainAmt = nativeCode === mainCurrency ? num : convertToMain(num, nativeCode);
      const secondaryAmt = convertToSecondary(mainAmt, mainCurrency);

      return {
        primaryFormatted: formatCurrency(mainAmt, mainCurrency),
        secondaryFormatted: formatCurrency(secondaryAmt, secondaryCurrency),
        primaryCode: mainCurrency,
        secondaryCode: secondaryCurrency,
        primaryAmount: mainAmt,
        secondaryAmount: secondaryAmt,
      };
    },
    [mainCurrency, secondaryCurrency, convertAmount, convertToMain, convertToSecondary, formatCurrency]
  );

  return (
    <CurrencyContext.Provider
      value={{
        // Dual Currency States
        mainCurrency,
        secondaryCurrency,
        exchangeRate,
        lastRateUpdated,
        isRateLoading,

        // Currency Objects
        mainCurrencyInfo,
        secondaryCurrencyInfo,
        currencies: CURRENCIES,

        // Setters & Actions
        setMainCurrency,
        setSecondaryCurrency,
        refreshExchangeRate,

        // Conversion & Formatting
        convertAmount,
        convertToMain,
        convertToSecondary,
        formatCurrency,
        formatDualCurrency,

        // Backward compatibility
        currency,
        currencyInfo,
        setCurrency,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
