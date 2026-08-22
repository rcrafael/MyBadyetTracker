import { NextResponse } from 'next/server';

let DEMO_CATEGORIES = [
  { id: 'grocery', name: 'Grocery', icon: 'shopping_basket', color: 'bg-secondary-container', textColor: 'text-on-secondary-container' },
  { id: 'transport', name: 'Transport', icon: 'directions_car', color: 'bg-surface-container', textColor: 'text-secondary' },
  { id: 'dining', name: 'Dining', icon: 'restaurant', color: 'bg-tertiary-fixed', textColor: 'text-on-tertiary-fixed-variant' },
  { id: 'shopping', name: 'Shopping', icon: 'shopping_bag', color: 'bg-primary-fixed', textColor: 'text-primary-container' },
  { id: 'entertainment', name: 'Fun', icon: 'movie', color: 'bg-tertiary-container', textColor: 'text-tertiary-fixed-dim' },
  { id: 'bills', name: 'Bills', icon: 'receipt_long', color: 'bg-error-container/30', textColor: 'text-error' },
  { id: 'health', name: 'Health', icon: 'favorite', color: 'bg-error-container', textColor: 'text-on-error-container' },
  { id: 'education', name: 'Education', icon: 'school', color: 'bg-surface-container-high', textColor: 'text-on-surface' },
];

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: DEMO_CATEGORIES,
      total: DEMO_CATEGORIES.length,
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
    const { name, icon, color, textColor } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }

    const newCategory = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      icon: icon || 'category',
      color: color || 'bg-surface-container',
      textColor: textColor || 'text-on-surface',
      createdAt: new Date().toISOString(),
    };

    DEMO_CATEGORIES.push(newCategory);

    return NextResponse.json({
      success: true,
      data: newCategory,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
