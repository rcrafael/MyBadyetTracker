import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function TopBar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <header className="w-full top-0 sticky z-40 bg-surface/95 dark:bg-surface/95 backdrop-blur-md border-b border-outline-variant/20 shadow-xs">
      <div className="flex justify-between items-center px-4 sm:px-6 py-3 max-w-lg md:max-w-xl lg:max-w-2xl mx-auto w-full">
        {/* Brand */}
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 cursor-pointer select-none active:opacity-80 transition-opacity"
        >
          <img
            src="/pwa-192x192.png"
            alt="MyBadyet Logo"
            className="w-8 h-8 rounded-lg shadow-xs object-cover shrink-0 ring-1 ring-secondary/20"
          />
          <h1 className="font-headline text-lg sm:text-xl font-bold text-secondary tracking-tight">
            My Badyet Tracker
          </h1>
        </div>

        {/* User Info & Settings */}
        <div className="flex items-center gap-2.5 relative" ref={dropdownRef}>
          {user && (
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1 pl-2 pr-1.5 rounded-full hover:bg-surface-container transition-colors max-w-[150px] sm:max-w-[200px]"
            >
              <span className="text-xs font-semibold text-on-surface truncate hidden sm:inline">
                {user.displayName || user.email?.split('@')[0]}
              </span>
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-secondary/30"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-xs font-bold shrink-0">
                  {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </button>
          )}

          <button
            aria-label="Settings"
            onClick={() => navigate('/settings')}
            className="p-1.5 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant flex items-center justify-center shrink-0"
          >
            <span className="material-symbols-outlined text-xl">settings</span>
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-surface dark:bg-surface-container rounded-xl shadow-lg border border-outline-variant/20 z-50 overflow-hidden">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/reports');
                }}
                className="w-full text-left px-4 py-3 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">assessment</span>
                Reports
              </button>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/settings');
                }}
                className="w-full text-left px-4 py-3 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2 border-t border-outline-variant/20"
              >
                <span className="material-symbols-outlined text-base">settings</span>
                Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
