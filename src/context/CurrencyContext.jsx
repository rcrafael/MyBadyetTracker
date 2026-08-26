import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
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

  // Dual currency master enable switch (defaults to false for single currency users)
  const [isDualCurrencyEnabled, setIsDualCurrencyEnabledState] = useState(() => {
    return localStorage.getItem('mybadyet_dual_currency_enabled') === 'true';
  });

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

        // Persist to Firestore if logged in
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

  // Fetch live exchange rate on app open / refresh when dual currency is enabled
  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      if (isDualCurrencyEnabled) {
        fetchAndUpdateRate(mainCurrency, secondaryCurrency, true);
      }
    }
  }, [isDualCurrencyEnabled, mainCurrency, secondaryCurrency, fetchAndUpdateRate]);

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
          const userDualEnabled = Boolean(data.isDualCurrencyEnabled);
          const userMain = data.mainCurrency || data.currency;
          const userSec = data.secondaryCurrency;

          setIsDualCurrencyEnabledState(userDualEnabled);
          localStorage.setItem('mybadyet_dual_currency_enabled', String(userDualEnabled));

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

          if (userDualEnabled) {
            fetchAndUpdateRate(targetMain, targetSec, true);
          }
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

  // Checks if user has any existing bills, plans, or transactions in secondary/different currency
  const checkDualCurrencyUsage = useCallback(async () => {
    if (!user?.uid) {
      return { canDisable: true, billCount: 0, transactionCount: 0, sampleItems: [] };
    }

    try {
      // 1. Fetch user's bills & plans
      const billsRef = collection(db, 'users', user.uid, 'bills');
      const billsSnap = await getDocs(billsRef);
      const nonMainBills = [];
      billsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (!data.isDeleted && data.currency && data.currency.toUpperCase() !== mainCurrency.toUpperCase()) {
          nonMainBills.push({ id: docSnap.id, ...data });
        }
      });

      // 2. Fetch user's transactions
      const txRef = collection(db, 'users', user.uid, 'transactions');
      const txSnap = await getDocs(txRef);
      const nonMainTransactions = [];
      txSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (!data.isDeleted && data.currency && data.currency.toUpperCase() !== mainCurrency.toUpperCase()) {
          nonMainTransactions.push({ id: docSnap.id, ...data });
        }
      });

      const hasSecondary = nonMainBills.length > 0 || nonMainTransactions.length > 0;

      const sampleItems = [
        ...nonMainBills.slice(0, 3).map((b) => `Bill/Plan: "${b.name}" (${b.currency})`),
        ...nonMainTransactions.slice(0, 3).map((t) => `Expense: "${t.description}" (${t.currency})`),
      ];

      return {
        canDisable: !hasSecondary,
        billCount: nonMainBills.length,
        transactionCount: nonMainTransactions.length,
        sampleItems,
      };
    } catch (err) {
      console.warn('Error checking dual currency usage:', err);
      return { canDisable: true, billCount: 0, transactionCount: 0, sampleItems: [] };
    }
  }, [user, mainCurrency]);

  // Master Toggle for Dual Currency
  const setDualCurrencyEnabled = async (enable) => {
    if (enable) {
      setIsDualCurrencyEnabledState(true);
      localStorage.setItem('mybadyet_dual_currency_enabled', 'true');
      await syncToFirestore({ isDualCurrencyEnabled: true });
      await fetchAndUpdateRate(mainCurrency, secondaryCurrency, true);
      return { success: true };
    }

    // If disabling, check for existing items using secondary currency
    const usage = await checkDualCurrencyUsage();
    if (!usage.canDisable) {
      return {
        success: false,
        reason: 'has_secondary_items',
        usage,
      };
    }

    setIsDualCurrencyEnabledState(false);
    localStorage.setItem('mybadyet_dual_currency_enabled', 'false');
    await syncToFirestore({ isDualCurrencyEnabled: false });
    return { success: true };
  };

  // Set Main Currency
  const setMainCurrency = async (newCode) => {
    const found = CURRENCIES.find((c) => c.code === newCode);
    if (!found) return;

    setMainCurrencyState(newCode);
    localStorage.setItem('mybadyet_main_currency', newCode);
    localStorage.setItem('mybadyet_currency', newCode);

    const updates = { mainCurrency: newCode, currency: newCode };
    await syncToFirestore(updates);

    if (isDualCurrencyEnabled) {
      await fetchAndUpdateRate(newCode, secondaryCurrency, true);
    }
  };

  // Set Secondary Currency
  const setSecondaryCurrency = async (newCode) => {
    const found = CURRENCIES.find((c) => c.code === newCode);
    if (!found) return;

    setSecondaryCurrencyState(newCode);
    localStorage.setItem('mybadyet_secondary_currency', newCode);

    const updates = { secondaryCurrency: newCode };
    await syncToFirestore(updates);

    if (isDualCurrencyEnabled) {
      await fetchAndUpdateRate(mainCurrency, newCode, true);
    }
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

      if (!isDualCurrencyEnabled) {
        const formatted = formatCurrency(num, nativeCode);
        return {
          primaryFormatted: formatted,
          secondaryFormatted: formatted,
          primaryCode: nativeCode,
          secondaryCode: nativeCode,
          primaryAmount: num,
          secondaryAmount: num,
        };
      }

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
    [isDualCurrencyEnabled, mainCurrency, secondaryCurrency, convertAmount, convertToMain, convertToSecondary, formatCurrency]
  );

  return (
    <CurrencyContext.Provider
      value={{
        // Dual Currency Master Switch
        isDualCurrencyEnabled,
        setDualCurrencyEnabled,
        checkDualCurrencyUsage,

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
