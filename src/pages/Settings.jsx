import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCategoriesFromFirestore,
  addCategoryToFirestore,
} from '../services/firestoreService';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

function SettingsItem({ icon, label, subtitle, trailing, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-3.5 sm:p-4 hover:bg-surface-container/50 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="material-symbols-outlined text-outline text-xl shrink-0">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium text-on-surface truncate block">{label}</span>
          {subtitle && (
            <span className="text-xs text-on-surface-variant truncate block">{subtitle}</span>
          )}
        </div>
      </div>
      <div className="shrink-0 flex items-center">
        {trailing || (
          <span className="material-symbols-outlined text-outline-variant text-xl">chevron_right</span>
        )}
      </div>
    </div>
  );
}

function Toggle({ enabled, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        enabled ? 'bg-secondary' : 'bg-surface-dim dark:bg-surface-container-highest'
      }`}
    >
      <span
        className={`${
          enabled ? 'translate-x-5' : 'translate-x-0'
        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out`}
      />
    </button>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [categories, setCategories] = useState([]);
  const [notifications, setNotifications] = useState(true);
  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('category');
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    loadCategories();
  }, [user]);

  async function loadCategories() {
    try {
      const data = await getCategoriesFromFirestore(user?.uid);
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const added = await addCategoryToFirestore(
        {
          name: newCatName.trim(),
          icon: newCatIcon,
          color: 'bg-secondary-container',
          textColor: 'text-on-secondary-container',
        },
        user?.uid
      );
      setCategories((prev) => [...prev, added]);
      setIsAddCatModalOpen(false);
      setNewCatName('');
      showToast(`Category "${added.name}" added!`);
    } catch (err) {
      showToast('Error adding category.', true);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      showToast('Failed to sign out.', true);
    }
  };

  function showToast(msg, isError = false) {
    setToastMessage({ text: msg, isError });
    setTimeout(() => setToastMessage(null), 4000);
  }

  return (
    <div className="space-y-5 pb-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-16 left-4 right-4 max-w-md mx-auto z-50 p-3.5 rounded-xl shadow-lg flex items-center justify-between text-xs font-semibold ${
            toastMessage.isError
              ? 'bg-error text-white'
              : 'bg-primary text-white dark:bg-surface-container-highest dark:text-primary-fixed'
          }`}
        >
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Add Category Modal */}
      {isAddCatModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddCategory}
            className="app-card max-w-sm w-full space-y-4 shadow-xl border-secondary/40"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-headline text-base font-bold text-on-surface">Add Category</h3>
              <button
                type="button"
                onClick={() => setIsAddCatModalOpen(false)}
                className="text-outline hover:text-on-surface p-1"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-on-surface-variant font-semibold block mb-1">Category Name</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Travel, Gym, Utilities"
                  className="w-full bg-surface-container px-3 py-2 rounded-lg text-on-surface outline-none focus:ring-1 focus:ring-secondary"
                  required
                />
              </div>

              <div>
                <label className="text-on-surface-variant font-semibold block mb-1">Icon Name</label>
                <select
                  value={newCatIcon}
                  onChange={(e) => setNewCatIcon(e.target.value)}
                  className="w-full bg-surface-container px-3 py-2 rounded-lg text-on-surface outline-none focus:ring-1 focus:ring-secondary"
                >
                  <option value="flight">flight (Travel)</option>
                  <option value="fitness_center">fitness_center (Gym)</option>
                  <option value="pets">pets (Pets)</option>
                  <option value="home">home (Home)</option>
                  <option value="medical_services">medical_services (Medical)</option>
                  <option value="work">work (Work)</option>
                  <option value="category">category (General)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddCatModalOpen(false)}
                className="flex-1 py-2 rounded-lg text-xs font-semibold bg-surface-container text-on-surface hover:bg-surface-container-high"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-lg text-xs font-semibold bg-secondary text-white hover:bg-secondary/90 shadow-xs"
              >
                Save Category
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User Profile Card */}
      {user && (
        <section className="app-card flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-12 h-12 rounded-full object-cover shrink-0 ring-2 ring-secondary/40 shadow-xs"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-headline text-base font-bold shrink-0">
                {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-headline text-sm sm:text-base font-bold text-on-surface truncate">
                {user.displayName || 'User Account'}
              </h3>
              <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="text-xs font-semibold text-error bg-error-container/40 hover:bg-error-container px-3 py-1.5 rounded-xl transition-colors shrink-0 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            <span>Sign Out</span>
          </button>
        </section>
      )}

      {/* Categories Grid Section */}
      <section className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h2 className="font-headline text-base sm:text-lg font-bold text-on-surface">Categories</h2>
          <button
            onClick={() => setIsAddCatModalOpen(true)}
            className="text-xs font-semibold text-secondary flex items-center gap-1 hover:underline active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            <span>Add Category</span>
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="app-card flex flex-col items-center justify-center p-3 text-center gap-1.5"
            >
              <div className={`w-10 h-10 rounded-full ${cat.color || 'bg-surface-container'} flex items-center justify-center shrink-0`}>
                <span className={`material-symbols-outlined filled ${cat.textColor || 'text-on-surface'} text-xl`}>
                  {cat.icon || 'category'}
                </span>
              </div>
              <span className="text-xs font-semibold text-on-surface truncate max-w-full px-1">
                {cat.name}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* App Preferences */}
      <section className="space-y-2">
        <h2 className="font-headline text-base sm:text-lg font-bold text-on-surface px-1">App Settings</h2>
        <div className="app-card p-0! overflow-hidden divide-y divide-outline-variant/20">
          <SettingsItem
            icon="notifications"
            label="Notifications"
            trailing={
              <Toggle enabled={notifications} onChange={() => setNotifications(!notifications)} />
            }
          />
          <SettingsItem
            icon="attach_money"
            label="Currency"
            trailing={
              <span className="text-xs font-semibold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-md">
                USD ($)
              </span>
            }
          />
          <SettingsItem
            icon="dark_mode"
            label="Dark Mode"
            trailing={<Toggle enabled={isDark} onChange={toggleTheme} />}
          />
          <SettingsItem icon="security" label="Privacy & Security" />
          <SettingsItem icon="help" label="Help & Support" />
        </div>
      </section>

      {/* Footer Info */}
      <div className="text-center py-2">
        <p className="text-xs font-mono font-medium text-outline">MyBadyetTracker v1.0.0</p>
        <p className="text-[11px] text-outline/70 mt-0.5">Automated 6-Month Data Retention</p>
      </div>
    </div>
  );
}
