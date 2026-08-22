import { collection, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';

// Retention duration: 6 months (in milliseconds)
export const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;

export const INITIAL_CATEGORIES = [
  { id: 'grocery', name: 'Grocery', icon: 'shopping_basket', color: 'bg-secondary-container', textColor: 'text-on-secondary-container' },
  { id: 'transport', name: 'Transport', icon: 'directions_car', color: 'bg-surface-container', textColor: 'text-secondary' },
  { id: 'dining', name: 'Dining', icon: 'restaurant', color: 'bg-tertiary-fixed', textColor: 'text-on-tertiary-fixed-variant' },
  { id: 'shopping', name: 'Shopping', icon: 'shopping_bag', color: 'bg-primary-fixed', textColor: 'text-primary-container' },
  { id: 'entertainment', name: 'Fun', icon: 'movie', color: 'bg-tertiary-container', textColor: 'text-tertiary-fixed-dim' },
  { id: 'bills', name: 'Bills', icon: 'receipt_long', color: 'bg-error-container/30', textColor: 'text-error' },
  { id: 'health', name: 'Health', icon: 'favorite', color: 'bg-error-container', textColor: 'text-on-error-container' },
  { id: 'education', name: 'Education', icon: 'school', color: 'bg-surface-container-high', textColor: 'text-on-surface' },
];

export const INITIAL_BUDGETS = [
  { id: 'bg_grocery', category: 'grocery', limit: 500, period: 'monthly' },
  { id: 'bg_dining', category: 'dining', limit: 300, period: 'monthly' },
  { id: 'bg_transport', category: 'transport', limit: 200, period: 'monthly' },
  { id: 'bg_shopping', category: 'shopping', limit: 400, period: 'monthly' },
  { id: 'bg_entertainment', category: 'entertainment', limit: 150, period: 'monthly' },
  { id: 'bg_health', category: 'health', limit: 100, period: 'monthly' },
];

/**
 * Returns a user-scoped collection reference to guarantee data separation.
 */
export function getUserCollection(colName, explicitUserId = null) {
  const uid = explicitUserId || auth.currentUser?.uid || 'guest_user';
  return collection(db, 'users', uid, colName);
}

/**
 * Returns a user-scoped document reference to guarantee data separation.
 */
export function getUserDoc(colName, docId, explicitUserId = null) {
  const uid = explicitUserId || auth.currentUser?.uid || 'guest_user';
  return doc(db, 'users', uid, colName, docId);
}

/**
 * Helper to calculate 6-month retention expiry date.
 */
export function getRetentionExpiryDate() {
  return new Date(Date.now() + SIX_MONTHS_MS).toISOString();
}
