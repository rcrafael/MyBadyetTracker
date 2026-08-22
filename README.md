# 💰 MyBadyetTracker

> **A modern, intelligent personal finance and expense tracking application built entirely with Agentic AI.**

[![Firebase Hosting](https://img.shields.io/badge/Hosting-Firebase%20CDN-orange?logo=firebase)](https://mybadyettracker.web.app)
[![Cloud Firestore](https://img.shields.io/badge/Database-Cloud%20Firestore-yellow?logo=firebase)](https://firebase.google.com/docs/firestore)
[![React 19](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-blue?logo=react)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Styling-TailwindCSS%203.4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📖 About The Name

**"Badyet"** is the literal **Tagalog (Filipino)** spelling and phonetic adaptation of the English word **"Budget"**. 

**MyBadyetTracker** was born out of a desire to make personal financial management intuitive, precise, and culturally resonant — blending modern financial discipline with a localized identity.

---

## 🤖 Built with Agentic AI

This entire codebase — from the UI design system ingestion, responsive layout engineering, and state management down to the Cloud Firestore database partitioning, 6-month automated retention policies, and production deployment — was architected and built through **Agentic AI pair programming** using Google DeepMind's Advanced Agentic Coding system.

---

## ✨ Key Features & Functions

### 1. 📊 Real-Time Financial Overview (Dashboard)
- **Accurate Metric Calculations**: Computes exact spending for **This Month**, **Today**, and the **Past 7 Days** directly from active Cloud Firestore records.
- **Dynamic 5-Month Spending Chart**: Automatically aggregates monthly spending over the past 5 calendar months, highlights the active month, and auto-scales bar heights.
- **Budget Health Bar**: Visual progress track showing percentage of total monthly budget used.
- **Recent Activity Feed**: Quick overview of recent transactions with status badges (*Cleared* / *Pending*).

### 2. 💳 Transaction History & Soft Delete
- **Full CRUD Management**: View, create, search, and delete transactions.
- **Dynamic Category Filtering & Search**: Instant real-time filtering across expense categories and note descriptions.
- **Non-Destructive Soft Delete**: Deleting a transaction marks it as `isDeleted: true`, allowing instant **Undo / Restore** within the interface.

### 3. ➕ Fast Expense Logging
- **Streamlined Expense Form**: Log expenses with numeric amount, category picker, custom memo notes, date selection, and cleared/pending status.
- **Instant Cloud Sync**: Submits directly to the user's isolated Firestore partition.

### 4. 🧾 Bill Management & Smart Recurring Schedules
- **Bill Tracking & Due Dates**: Tracks upcoming, overdue, and paid utility bills and subscriptions.
- **Recurring Bills (Monthly)**: Toggle recurring status on any bill.
- **Auto-Cycle Generation**: When a recurring bill is paid via **"Pay Now"**, the system automatically marks the current bill as paid and schedules next month's upcoming bill (+1 month) in Cloud Firestore.

### 5. 🎯 Budget Planning & Category Limits
- **Category Spending Limits**: Set and adjust spending caps for each category (Grocery, Dining, Transport, Entertainment, etc.).
- **Live Status Badges**: Automatically tags each category budget as **On Track** (<75%), **Near Limit** (≥75%), or **Over Limit** (≥100%).
- **Custom Budget Creation**: Add custom category budgets on the fly.

### 6. 🏷️ Category Management
- **Pre-Configured & Custom Categories**: Includes standard categories with color-coded Material Symbols icons.
- **Custom Category Creator**: Add custom categories with custom icons directly from the Settings page.

### 7. 🛡️ 6-Month Data Retention Policy
- **Automated Lifecycle Management**: Soft-deleted transactions, bills, and budgets are retained for **6 months** before automated purge.
- **Manual Policy Trigger**: Administrators/users can run the retention cleanup policy on demand in **Settings**.

### 8. 🔐 Google Authentication & Multi-User Data Isolation
- **One-Click Google Sign-In**: Powered by Firebase `GoogleAuthProvider` (plus optional Email & Password authentication).
- **Strict User Partitioning**: All data is stored under user-scoped Firestore subcollections (`users/{userId}/...`), guaranteeing 100% data privacy between different user accounts.
- **Production Mode Security Rules**: Unauthorized read/write requests are strictly blocked at the database engine level.

### 9. 🌓 Adaptive Theming (Light / Dark Mode)
- **Fiscal Clarity Aesthetic**: Designed with Deep Navy (`#0c1e33`), Vibrant Teal (`#006a6a`), and soft glassmorphism.
- **Seamless Theme Toggle**: Switch between Light Mode and Dark Mode with persistent local storage state.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | [React 19](https://react.dev/) | Component architecture & modern hooks |
| **Build Tool** | [Vite 8](https://vite.dev/) | Lightning-fast development & optimized production bundling |
| **Styling** | [TailwindCSS 3.4](https://tailwindcss.com/) | Custom design tokens, dark mode variants & responsive utilities |
| **Icons & Typography** | Google Fonts & Material Symbols | Manrope, Inter, JetBrains Mono, Material Symbols Outlined |
| **Backend & API** | Node.js + Next.js App Router | Server-side endpoints & automated retention handlers |
| **Database** | [Google Cloud Firestore](https://firebase.google.com/docs/firestore) | Real-time NoSQL cloud database with production security rules |
| **Authentication** | [Firebase Auth](https://firebase.google.com/docs/auth) | Google OAuth 2.0 & Email/Password session management |
| **Hosting** | [Firebase Hosting](https://firebase.google.com/docs/hosting) | Global SSL CDN deployment with single-page app rewrites |

---

## 📂 Project Structure

```
MyBadyetTracker/
├── src/
│   ├── components/
│   │   └── layout/
│   │       ├── AppShell.jsx        # Main layout shell with responsive containers
│   │       ├── BottomNav.jsx       # Floating glassmorphic navigation bar
│   │       └── TopBar.jsx          # Header with user avatar and brand logo
│   ├── context/
│   │   ├── AuthContext.jsx         # Google & Email authentication state
│   │   └── ThemeContext.jsx        # Light/Dark mode state
│   ├── data/
│   │   └── demoData.js             # Formatting helpers & category catalog
│   ├── pages/
│   │   ├── Dashboard.jsx           # Real-time spending overview & dynamic chart
│   │   ├── Transactions.jsx        # Transaction list, search, filter & restore
│   │   ├── AddExpense.jsx          # Expense logging form
│   │   ├── Bills.jsx               # Bill tracker & recurring schedules
│   │   ├── Budget.jsx              # Category budget limits & health progress
│   │   ├── Settings.jsx            # Profile, categories, retention & clear data
│   │   └── Login.jsx               # Google Sign-In & Email registration
│   ├── services/
│   │   ├── firebase.js             # Firebase client SDK initialization
│   │   ├── firestoreService.js     # Unified barrel service export
│   │   └── firestore/
│   │       ├── firestoreBase.js    # User scoping & collection utilities
│   │       ├── transactionService.js
│   │       ├── billService.js
│   │       ├── budgetService.js
│   │       ├── categoryService.js
│   │       └── systemService.js    # Retention cleanup & database reset
│   ├── App.jsx                     # Router & protected route guards
│   ├── index.css                   # Fiscal Clarity design system tokens
│   └── main.jsx                    # Application entry point
├── firestore.rules                 # Production Firestore security rules
├── firebase.json                   # Hosting & Firestore deploy configuration
├── .firebaserc                     # Active Firebase project mapping
└── vite.config.js                  # Vite bundler configuration
```

---

## 🚀 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm or yarn

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/your-username/mybadyettracker.git
cd mybadyettracker

# 2. Install dependencies
npm install

# 3. Create .env file with your Firebase configuration
cp .env.example .env

# 4. Start the local development server
npm run dev
```

---

## 🌐 Live Application Links

- **Primary Web Application**: [https://mybadyettracker.web.app](https://mybadyettracker.web.app)
- **Alternative Mirror**: [https://mybadyettracker.firebaseapp.com](https://mybadyettracker.firebaseapp.com)
- **Firebase Project Console**: [https://console.firebase.google.com/project/mybadyettracker/overview](https://console.firebase.google.com/project/mybadyettracker/overview)

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
