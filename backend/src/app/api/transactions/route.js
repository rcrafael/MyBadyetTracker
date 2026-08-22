import { NextResponse } from 'next/server';

// Demo data for when Firestore is not configured
const DEMO_TRANSACTIONS = [
  { id: 't1', description: 'Artisan Kitchen', amount: 42.50, category: 'dining', date: '2024-05-15', time: '12:45 PM', status: 'cleared' },
  { id: 't2', description: 'Uber Trip', amount: 18.20, category: 'transport', date: '2024-05-15', time: '08:20 AM', status: 'cleared' },
  { id: 't3', description: 'Whole Foods Market', amount: 87.30, category: 'grocery', date: '2024-05-14', time: '06:15 PM', status: 'cleared' },
  { id: 't4', description: 'Netflix Subscription', amount: 15.99, category: 'entertainment', date: '2024-05-14', time: '12:00 AM', status: 'cleared' },
  { id: 't5', description: 'Downtown Parking', amount: 12.00, category: 'transport', date: '2024-05-13', time: '09:30 AM', status: 'cleared' },
  { id: 't6', description: 'Retail Purchase', amount: 156.00, category: 'shopping', date: '2024-05-13', time: '04:20 PM', status: 'pending' },
  { id: 't7', description: 'Sushi Delight', amount: 38.90, category: 'dining', date: '2024-05-12', time: '07:30 PM', status: 'cleared' },
  { id: 't8', description: 'Gas Station', amount: 55.00, category: 'transport', date: '2024-05-12', time: '10:15 AM', status: 'cleared' },
  { id: 't9', description: 'Pharmacy', amount: 24.50, category: 'health', date: '2024-05-11', time: '02:00 PM', status: 'cleared' },
  { id: 't10', description: 'Online Course', amount: 29.99, category: 'education', date: '2024-05-11', time: '11:00 AM', status: 'cleared' },
];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let transactions = [...DEMO_TRANSACTIONS];

    // Filter by category
    if (category && category !== 'all') {
      transactions = transactions.filter(t => t.category === category);
    }

    // Search filter
    if (search) {
      const s = search.toLowerCase();
      transactions = transactions.filter(t =>
        t.description.toLowerCase().includes(s)
      );
    }

    return NextResponse.json({
      success: true,
      data: transactions,
      total: transactions.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { amount, category, description, date, recurring, notes } = body;

    if (!amount || !category) {
      return NextResponse.json(
        { success: false, error: 'Amount and category are required' },
        { status: 400 }
      );
    }

    const newTransaction = {
      id: `t${Date.now()}`,
      description: description || 'Expense',
      amount: parseFloat(amount),
      category,
      date: date || new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      status: 'pending',
      recurring: recurring || false,
      notes: notes || '',
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: newTransaction,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
