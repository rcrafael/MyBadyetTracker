import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', icon: 'dashboard', label: 'Home' },
  { to: '/transactions', icon: 'receipt_long', label: 'History' },
  { to: '/add', icon: 'add_circle', label: 'Add', isAdd: true },
  { to: '/bills', icon: 'payments', label: 'Bills' },
  { to: '/budget', icon: 'account_balance', label: 'Budget' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-nav border-t border-outline-variant/20 shadow-lg pb-safe">
      <div className="max-w-md md:max-w-lg mx-auto px-2 py-1 flex justify-around items-center">
        {navItems.map((item) => {
          if (item.isAdd) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                aria-label="Add Expense"
                className="flex flex-col items-center justify-center -mt-5 p-1 transition-transform active:scale-90 group cursor-pointer"
              >
                <div className="w-13 h-13 rounded-full bg-secondary text-white shadow-lg shadow-secondary/35 flex items-center justify-center group-hover:bg-secondary/90 transition-colors ring-4 ring-background">
                  <span className="material-symbols-outlined text-3xl filled">add</span>
                </div>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-w-[58px] py-1.5 px-2 rounded-xl transition-all cursor-pointer select-none active:scale-95 ${
                  isActive
                    ? 'bg-secondary-container/90 text-on-secondary-container font-semibold'
                    : 'text-on-surface-variant hover:bg-surface-container/60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`material-symbols-outlined text-2xl ${
                      isActive ? 'filled' : ''
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="text-[11px] leading-tight mt-0.5 tracking-tight text-center">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
