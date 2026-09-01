import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { getTransactionsFromFirestore } from '../services/firestoreService';
import * as XLSX from 'xlsx';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default function Reports() {
  const { user } = useAuth();
  const { mainCurrencyInfo } = useCurrency();
  const [reportType, setReportType] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
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

  const generateReport = async () => {
    const filtered = getFilteredTransactions();

    // Calculate total
    const totalAmount = filtered.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    // Category summary
    const categorySummary = {};
    filtered.forEach(t => {
      const cat = t.category || 'Uncategorized';
      categorySummary[cat] = (categorySummary[cat] || 0) + (parseFloat(t.amount) || 0);
    });

    // Agentic AI Tip Generation
    if (filtered.length > 0) {
      setAnalyzing(true);
      setTip('');
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error("Missing Gemini API Key in environment variables.");
        }
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
          Act as a helpful and insightful financial advisor. I am generating a ${reportType} expense report.
          Here is a summary of my spending by category in ${mainCurrencyInfo.code}:
          ${JSON.stringify(categorySummary, null, 2)}
          Total Spent: ${totalAmount.toFixed(2)} ${mainCurrencyInfo.code}

          Analyze this spending data and provide a concise, meaningful, and actionable tip (max 2-3 sentences) on how I might improve my spending habits or reduce expenses based on these specific categories and amounts.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        setTip(response.text());
      } catch (err) {
        console.error("AI Analysis Error:", err);
        setTip("Could not generate AI tip at this time. Please check your API key and connection.");
      } finally {
        setAnalyzing(false);
      }
    } else {
      setTip("No transactions found for this period to analyze.");
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
          disabled={loading || analyzing}
          className="w-full bg-secondary text-white text-sm font-semibold py-3 rounded-xl shadow hover:bg-secondary/90 transition-colors flex items-center justify-center gap-2"
        >
          {analyzing && <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>}
          <span>{analyzing ? 'Analyzing Data & Generating Report...' : 'Generate & Download Report'}</span>
        </button>

        {tip && (
          <div className="p-4 bg-secondary-container text-on-secondary-container rounded-xl text-sm mt-4 animate-fadeIn">
            <strong className="flex items-center gap-1 mb-1 text-secondary">
              <span className="material-symbols-outlined text-base">smart_toy</span>
              AI Advisor Insight:
            </strong>
            <p className="leading-relaxed">{tip}</p>
          </div>
        )}
      </div>
    </div>
  );
}
