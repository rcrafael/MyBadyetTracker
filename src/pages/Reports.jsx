import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { getTransactionsFromFirestore } from '../services/firestoreService';
import * as XLSX from 'xlsx';

export default function Reports() {
  const { user } = useAuth();
  const { mainCurrencyInfo } = useCurrency();
  const [reportType, setReportType] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tip, setTip] = useState('');

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await getTransactionsFromFirestore({ userId: user?.uid });
      setTransactions(data);
    } catch (err) {
      console.error('Error loading transactions', err);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTransactions = () => {
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      if (reportType === 'daily') {
        return t.date === selectedDate;
      } else {
        const sDate = new Date(startDate);
        const eDate = new Date(endDate);
        return tDate >= sDate && tDate <= eDate;
      }
    });
  };

  const generateReport = () => {
    const filtered = getFilteredTransactions();

    // Calculate total
    const totalAmount = filtered.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    // Category summary
    const categorySummary = {};
    filtered.forEach(t => {
      const cat = t.category || 'Uncategorized';
      categorySummary[cat] = (categorySummary[cat] || 0) + (parseFloat(t.amount) || 0);
    });

    // Determine tip
    if (Object.keys(categorySummary).length > 0) {
      const highestCategory = Object.keys(categorySummary).reduce((a, b) => categorySummary[a] > categorySummary[b] ? a : b);
      setTip(`Tip: You spent the most on "${highestCategory}" (${mainCurrencyInfo.symbol}${categorySummary[highestCategory].toFixed(2)}). Consider reducing expenses in this category to save more!`);
    } else {
      setTip('');
    }

    // Export to Excel
    const wb = XLSX.utils.book_new();

    // 1. Transaction Data
    let wsData = [];
    if (reportType === 'daily') {
      wsData.push(['Date', 'Time', 'Description', 'Category', 'Notes', 'Amount']);
      filtered.forEach(t => {
        wsData.push([t.date, t.time, t.description, t.category, t.notes, parseFloat(t.amount)]);
      });
      wsData.push([]);
      wsData.push(['', '', '', '', 'Grand Total', totalAmount]);
    } else {
      wsData.push(['Date', 'Description', 'Category', 'Amount']);
      filtered.forEach(t => {
        wsData.push([t.date, t.description, t.category, parseFloat(t.amount)]);
      });
      wsData.push([]);
      wsData.push(['', '', 'Grand Total', totalAmount]);
    }

    wsData.push([]);
    wsData.push(['Category Summary']);
    wsData.push(['Category', 'Total Amount']);
    Object.keys(categorySummary).forEach(cat => {
      wsData.push([cat, categorySummary[cat]]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Report");

    let filename = '';
    if (reportType === 'daily') {
      filename = `${selectedDate}-daily-report.xlsx`;
    } else {
      filename = `${startDate}-to-${endDate}-${reportType}-report.xlsx`;
    }

    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="space-y-5 pb-6">
      <h2 className="font-headline text-lg sm:text-xl font-bold text-on-surface">Reports</h2>

      <div className="app-card space-y-4">
        <div>
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-2">Report Type</label>
          <select
            value={reportType}
            onChange={e => setReportType(e.target.value)}
            className="w-full bg-surface-container/40 px-3 py-2 rounded-xl text-sm text-on-surface outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {reportType === 'daily' ? (
          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-2">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full bg-surface-container/40 px-3 py-2 rounded-xl text-sm text-on-surface outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-2">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-surface-container/40 px-3 py-2 rounded-xl text-sm text-on-surface outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-2">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full bg-surface-container/40 px-3 py-2 rounded-xl text-sm text-on-surface outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
              />
            </div>
          </div>
        )}

        <button
          onClick={generateReport}
          disabled={loading}
          className="w-full bg-secondary text-white text-sm font-semibold py-3 rounded-xl shadow hover:bg-secondary/90 transition-colors"
        >
          Generate & Download Report
        </button>

        {tip && (
          <div className="p-4 bg-secondary-container text-on-secondary-container rounded-xl text-sm mt-4">
            <strong>💡 Insight:</strong> {tip}
          </div>
        )}
      </div>
    </div>
  );
}
