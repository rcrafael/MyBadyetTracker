import { NextResponse } from 'next/server';

let DEMO_BUDGETS = [
  { id: 'bg1', category: 'grocery', limit: 600, spent: 387.30, period: 'monthly' },
  { id: 'bg2', category: 'dining', limit: 400, spent: 312.50, period: 'monthly' },
  { id: 'bg3', category: 'transport', limit: 300, spent: 218.20, period: 'monthly' },
  { id: 'bg4', category: 'shopping', limit: 500, spent: 456.00, period: 'monthly' },
  { id: 'bg5', category: 'entertainment', limit: 200, spent: 125.98, period: 'monthly' },
  { id: 'bg6', category: 'health', limit: 150, spent: 24.50, period: 'monthly' },
];

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: DEMO_BUDGETS,
      total: DEMO_BUDGETS.length,
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
    const { category, limit, period } = body;

    if (!category || !limit) {
      return NextResponse.json(
        { success: false, error: 'Category and limit are required' },
        { status: 400 }
      );
    }

    const newBudget = {
      id: `bg${Date.now()}`,
      category,
      limit: parseFloat(limit),
      spent: 0,
      period: period || 'monthly',
      createdAt: new Date().toISOString(),
    };

    DEMO_BUDGETS.push(newBudget);

    return NextResponse.json({
      success: true,
      data: newBudget,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
