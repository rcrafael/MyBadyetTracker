import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

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
  const [currency, setCurrencyState] = useState(() => {
    return localStorage.getItem('mybadyet_currency') || 'USD';
  });

  // Load user preference from Firestore if logged in
  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    async function loadUserCurrency() {
      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists() && snap.data().currency && isMounted) {
          const userCur = snap.data().currency;
          if (CURRENCIES.some((c) => c.code === userCur)) {
            setCurrencyState(userCur);
            localStorage.setItem('mybadyet_currency', userCur);
          }
        }
      } catch (err) {
        console.warn('Could not fetch currency preference from Firestore:', err);
      }
    }

    loadUserCurrency();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const setCurrency = async (newCode) => {
    const found = CURRENCIES.find((c) => c.code === newCode);
    if (!found) return;

    setCurrencyState(newCode);
    localStorage.setItem('mybadyet_currency', newCode);

    if (user?.uid) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { currency: newCode }, { merge: true });
      } catch (err) {
        console.warn('Could not save currency to Firestore:', err);
      }
    }
  };

  const currencyInfo = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];

  const formatCurrency = useCallback(
    (amount, customCurrencyCode = null) => {
      const targetCur = customCurrencyCode
        ? CURRENCIES.find((c) => c.code === customCurrencyCode) || currencyInfo
        : currencyInfo;

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
    [currencyInfo]
  );

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencyInfo,
        currencies: CURRENCIES,
        setCurrency,
        formatCurrency,
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
