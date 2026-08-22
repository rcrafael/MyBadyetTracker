import { NextResponse } from 'next/server';

let DEMO_BILLS = [
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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let bills = [...DEMO_BILLS];

    if (status && status !== 'all') {
      if (status === 'unpaid') {
        bills = bills.filter(b => b.status !== 'paid');
      } else {
        bills = bills.filter(b => b.status === status);
      }
    }

    return NextResponse.json({
      success: true,
      data: bills,
      total: bills.length,
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
    const { name, amount, dueDate, category, recurring, autopay, note } = body;

    if (!name || !amount || !dueDate) {
      return NextResponse.json(
        { success: false, error: 'Name, amount, and due date are required' },
        { status: 400 }
      );
    }

    const newBill = {
      id: `b${Date.now()}`,
      name,
      amount: parseFloat(amount),
      dueDate,
      status: 'upcoming',
      category: category || 'bills',
      recurring: recurring || false,
      autopay: autopay || false,
      note: note || '',
      createdAt: new Date().toISOString(),
    };

    DEMO_BILLS.unshift(newBill);

    return NextResponse.json({
      success: true,
      data: newBill,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
