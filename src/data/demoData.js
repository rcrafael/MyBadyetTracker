/**
 * Demo data store for MyBadyetTracker
 * This serves as the local data layer before Firestore integration.
 */

export const CATEGORIES = [
  { id: 'grocery', name: 'Grocery', icon: 'shopping_basket', color: 'bg-secondary-container', textColor: 'text-on-secondary-container' },
  { id: 'transport', name: 'Transport', icon: 'directions_car', color: 'bg-surface-container', textColor: 'text-secondary' },
  { id: 'dining', name: 'Dining', icon: 'restaurant', color: 'bg-tertiary-fixed', textColor: 'text-on-tertiary-fixed-variant' },
  { id: 'shopping', name: 'Shopping', icon: 'shopping_bag', color: 'bg-primary-fixed', textColor: 'text-primary-container' },
  { id: 'entertainment', name: 'Fun', icon: 'movie', color: 'bg-tertiary-container', textColor: 'text-tertiary-fixed-dim' },
  { id: 'bills', name: 'Bills', icon: 'receipt_long', color: 'bg-error-container/30', textColor: 'text-error' },
  { id: 'health', name: 'Health', icon: 'favorite', color: 'bg-error-container', textColor: 'text-on-error-container' },
  { id: 'education', name: 'Education', icon: 'school', color: 'bg-surface-container-high', textColor: 'text-on-surface' },
];

export const TRANSACTIONS = [
  {
    id: 't1',
    description: 'Artisan Kitchen',
    amount: 42.50,
    category: 'dining',
    date: '2024-05-15',
    time: '12:45 PM',
    status: 'cleared',
  },
  {
    id: 't2',
    description: 'Uber Trip',
    amount: 18.20,
    category: 'transport',
    date: '2024-05-15',
    time: '08:20 AM',
    status: 'cleared',
  },
  {
    id: 't3',
    description: 'Whole Foods Market',
    amount: 87.30,
    category: 'grocery',
    date: '2024-05-14',
    time: '06:15 PM',
    status: 'cleared',
  },
  {
    id: 't4',
    description: 'Netflix Subscription',
    amount: 15.99,
    category: 'entertainment',
    date: '2024-05-14',
    time: '12:00 AM',
    status: 'cleared',
  },
  {
    id: 't5',
    description: 'Downtown Parking',
    amount: 12.00,
    category: 'transport',
    date: '2024-05-13',
    time: '09:30 AM',
    status: 'cleared',
  },
  {
    id: 't6',
    description: 'Retail Purchase',
    amount: 156.00,
    category: 'shopping',
    date: '2024-05-13',
    time: '04:20 PM',
    status: 'pending',
  },
  {
    id: 't7',
    description: 'Sushi Delight',
    amount: 38.90,
    category: 'dining',
    date: '2024-05-12',
    time: '07:30 PM',
    status: 'cleared',
  },
  {
    id: 't8',
    description: 'Gas Station',
    amount: 55.00,
    category: 'transport',
    date: '2024-05-12',
    time: '10:15 AM',
    status: 'cleared',
  },
  {
    id: 't9',
    description: 'Pharmacy',
    amount: 24.50,
    category: 'health',
    date: '2024-05-11',
    time: '02:00 PM',
    status: 'cleared',
  },
  {
    id: 't10',
    description: 'Online Course',
    amount: 29.99,
    category: 'education',
    date: '2024-05-11',
    time: '11:00 AM',
    status: 'cleared',
  },
];

export const BILLS = [
  {
    id: 'b1',
    name: 'Bank Loan',
    amount: 1200.00,
    dueDate: '2024-05-15',
    status: 'overdue',
    category: 'bills',
    recurring: true,
    autopay: false,
    note: 'Automatic deduction failed',
  },
  {
    id: 'b2',
    name: 'Electric Bill',
    amount: 145.00,
    dueDate: '2024-05-20',
    status: 'upcoming',
    category: 'bills',
    recurring: true,
    autopay: true,
    note: 'PG&E monthly',
  },
  {
    id: 'b3',
    name: 'Internet Service',
    amount: 79.99,
    dueDate: '2024-05-22',
    status: 'upcoming',
    category: 'bills',
    recurring: true,
    autopay: true,
    note: 'Comcast Xfinity',
  },
  {
    id: 'b4',
    name: 'Car Insurance',
    amount: 210.00,
    dueDate: '2024-05-25',
    status: 'upcoming',
    category: 'bills',
    recurring: true,
    autopay: false,
    note: 'Quarterly payment',
  },
  {
    id: 'b5',
    name: 'Gym Membership',
    amount: 49.99,
    dueDate: '2024-05-01',
    status: 'paid',
    category: 'bills',
    recurring: true,
    autopay: true,
    note: 'Planet Fitness',
  },
  {
    id: 'b6',
    name: 'Spotify Premium',
    amount: 9.99,
    dueDate: '2024-05-05',
    status: 'paid',
    category: 'entertainment',
    recurring: true,
    autopay: true,
    note: 'Family plan',
  },
];

export const BUDGETS = [
  { id: 'bg1', category: 'grocery', limit: 600, spent: 387.30, period: 'monthly' },
  { id: 'bg2', category: 'dining', limit: 400, spent: 312.50, period: 'monthly' },
  { id: 'bg3', category: 'transport', limit: 300, spent: 218.20, period: 'monthly' },
  { id: 'bg4', category: 'shopping', limit: 500, spent: 456.00, period: 'monthly' },
  { id: 'bg5', category: 'entertainment', limit: 200, spent: 125.98, period: 'monthly' },
  { id: 'bg6', category: 'health', limit: 150, spent: 24.50, period: 'monthly' },
];

export const SPENDING_CHART_DATA = [
  { month: 'JAN', amount: 2100, average: 2400 },
  { month: 'FEB', amount: 2350, average: 2400 },
  { month: 'MAR', amount: 1980, average: 2400 },
  { month: 'APR', amount: 2650, average: 2400 },
  { month: 'MAY', amount: 2840, average: 2400 },
];

export const DASHBOARD_SUMMARY = {
  monthlySpending: 2840.00,
  monthlyBudget: 3500.00,
  dailySpending: 42.50,
  weeklySpending: 618.20,
  monthlyChange: -4.2,
  savingsGoal: 5000,
  currentSavings: 3250,
};

export function getCategoryById(id) {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES[0];
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function groupTransactionsByDate(transactions) {
  const groups = {};
  transactions.forEach(t => {
    const label = formatDate(t.date);
    if (!groups[label]) groups[label] = [];
    groups[label].push(t);
  });
  return groups;
}
