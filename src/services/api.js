const API_BASE = '/api';

export const api = {
  // Dashboard
  async getDashboard() {
    try {
      const res = await fetch(`${API_BASE}/dashboard`);
      if (!res.ok) throw new Error('Network response not ok');
      return await res.json();
    } catch {
      return null;
    }
  },

  // Transactions
  async getTransactions(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/transactions${query ? `?${query}` : ''}`);
      if (!res.ok) throw new Error('Network response not ok');
      return await res.json();
    } catch {
      return null;
    }
  },

  async createTransaction(data) {
    try {
      const res = await fetch(`${API_BASE}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Network response not ok');
      return await res.json();
    } catch {
      return null;
    }
  },

  async deleteTransaction(id) {
    try {
      const res = await fetch(`${API_BASE}/transactions/${id}`, {
        method: 'DELETE',
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  // Bills
  async getBills(status = 'all') {
    try {
      const res = await fetch(`${API_BASE}/bills?status=${status}`);
      if (!res.ok) throw new Error('Network response not ok');
      return await res.json();
    } catch {
      return null;
    }
  },

  async createBill(data) {
    try {
      const res = await fetch(`${API_BASE}/bills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Network response not ok');
      return await res.json();
    } catch {
      return null;
    }
  },

  async payBill(id) {
    try {
      const res = await fetch(`${API_BASE}/bills/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' }),
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  // Budgets
  async getBudgets() {
    try {
      const res = await fetch(`${API_BASE}/budgets`);
      if (!res.ok) throw new Error('Network response not ok');
      return await res.json();
    } catch {
      return null;
    }
  },

  async createBudget(data) {
    try {
      const res = await fetch(`${API_BASE}/budgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  // Categories
  async getCategories() {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      if (!res.ok) throw new Error('Network response not ok');
      return await res.json();
    } catch {
      return null;
    }
  },
};
