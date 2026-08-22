import { NextResponse } from 'next/server';

const DASHBOARD_SUMMARY = {
  monthlySpending: 2840.00,
  monthlyBudget: 3500.00,
  dailySpending: 42.50,
  weeklySpending: 618.20,
  monthlyChange: -4.2,
  savingsGoal: 5000,
  currentSavings: 3250,
};

const SPENDING_CHART_DATA = [
  { month: 'JAN', amount: 2100, average: 2400 },
  { month: 'FEB', amount: 2350, average: 2400 },
  { month: 'MAR', amount: 1980, average: 2400 },
  { month: 'APR', amount: 2650, average: 2400 },
  { month: 'MAY', amount: 2840, average: 2400 },
];

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: {
        summary: DASHBOARD_SUMMARY,
        chartData: SPENDING_CHART_DATA,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
