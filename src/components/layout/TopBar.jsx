import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function TopBar() {
  const navigate = useNavigate();
  const { user } = useAuth();

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
        <div className="flex items-center gap-2.5">
          {user && (
            <button
              onClick={() => navigate('/settings')}
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
        </div>
      </div>
    </header>
  );
}
