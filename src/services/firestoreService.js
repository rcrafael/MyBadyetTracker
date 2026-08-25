/**
 * Modularized Firestore Service Entry Point
 * Re-exports all domain-specific modules for backward compatibility and clean architecture.
 */

// 1. Base Constants & Helpers
export {
  SIX_MONTHS_MS,
  INITIAL_CATEGORIES,
  INITIAL_BUDGETS,
  getUserCollection,
  getUserDoc,
  getRetentionExpiryDate,
} from './firestore/firestoreBase';

// 2. Transactions & Expenses (Dashboard, Transactions, AddExpense pages)
export {
  getTransactionsFromFirestore,
  addTransactionToFirestore,
  updateTransactionInFirestore,
  softDeleteTransactionInFirestore,
  restoreTransactionInFirestore,
  hardDeleteTransactionInFirestore,
} from './firestore/transactionService';

// 3. Bills & Recurring Payments (Bills page)
export {
  getBillsFromFirestore,
  addBillToFirestore,
  updateBillInFirestore,
  payBillInFirestore,
  softDeleteBillInFirestore,
  computeInstallmentEndDate,
  generateInstallmentSchedule,
} from './firestore/billService';

// 4. Budgets & Limits (Budget page, Dashboard)
export {
  getBudgetsFromFirestore,
  saveBudgetToFirestore,
} from './firestore/budgetService';

// 5. Categories (Settings page, AddExpense, Transactions)
export {
  getCategoriesFromFirestore,
  addCategoryToFirestore,
} from './firestore/categoryService';

// 6. System & Retention Policies (Settings page, Data Retention)
export {
  runDataRetentionCleanupInFirestore,
  clearDatabaseAndStartFresh,
} from './firestore/systemService';
