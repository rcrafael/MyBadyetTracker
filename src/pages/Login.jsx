import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validatePassword, getFirebaseErrorMessage } from '../utils/authValidation';

export default function Login() {
  const navigate = useNavigate();
  const {
    signInWithGoogle,
    loginWithEmail,
    registerWithEmail,
    sendPasswordReset,
  } = useAuth();

  // Mode: 'login' | 'register' | 'forgot'
  const [authMode, setAuthMode] = useState('login');
  const isRegister = authMode === 'register';
  const isForgot = authMode === 'forgot';

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [existingAccountDetected, setExistingAccountDetected] = useState(false);

  // Live password validation state
  const passwordValidation = validatePassword(password, {
    email,
    displayName,
  });

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMessage(null);
    setExistingAccountDetected(false);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (err) {
      console.error('Google login failed:', err);
      setError(getFirebaseErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email) return;
    setError(null);
    setSuccessMessage(null);
    setExistingAccountDetected(false);

    // Password reset / setup mode
    if (isForgot) {
      setLoading(true);
      try {
        await sendPasswordReset(email.trim());
        setSuccessMessage(
          `A password setup and reset link has been sent to ${email}. Check your inbox to enter a new password.`
        );
      } catch (err) {
        console.error('Password reset failed:', err);
        setError(getFirebaseErrorMessage(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    // Strict validation for registration
    if (isRegister) {
      if (!displayName.trim()) {
        setError('Please enter your full name.');
        return;
      }

      if (!passwordValidation.isValid) {
        setError(
          passwordValidation.errors[0] ||
            'Please ensure your password meets all security criteria below.'
        );
        return;
      }
    }

    setLoading(true);

    try {
      if (isRegister) {
        await registerWithEmail(email.trim(), password, displayName.trim());
      } else {
        await loginWithEmail(email.trim(), password);
      }
      navigate('/');
    } catch (err) {
      console.error('Auth failed:', err);
      if (err.code === 'auth/email-already-in-use') {
        setExistingAccountDetected(true);
        setError(
          'An account with this email is already registered (e.g. via Google Sign-In or earlier sign-up).'
        );
      } else {
        setError(getFirebaseErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendPasswordSetup = async () => {
    if (!email) {
      setError('Please enter your email address to receive the password setup link.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await sendPasswordReset(email.trim());
      setSuccessMessage(
        `A password link was sent to ${email}. Open the link to set your new password, then sign in with it.`
      );
      setExistingAccountDetected(false);
    } catch (err) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (mode) => {
    setAuthMode(mode);
    setError(null);
    setSuccessMessage(null);
    setExistingAccountDetected(false);
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center py-6 px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
            <span className="material-symbols-outlined text-secondary text-3xl">
              account_balance_wallet
            </span>
          </div>
          <h1 className="font-headline text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            {isRegister
              ? 'Create Your Account'
              : isForgot
              ? 'Set or Reset Password'
              : 'Welcome to MyBadyetTracker'}
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-xs mx-auto">
            {isRegister
              ? 'Start tracking your personal finances with real-time cloud sync'
              : isForgot
              ? 'Enter your email to receive a secure link to set or reset your password'
              : 'Precision personal expense & budget tracking powered by Cloud Firestore'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="app-card space-y-4 shadow-lg border-outline-variant/30">
          {/* Error Message Alert */}
          {error && (
            <div className="p-3 bg-error-container text-on-error-container text-xs font-semibold rounded-xl flex items-start gap-2 animate-in fade-in">
              <span className="material-symbols-outlined text-base shrink-0 mt-0.5">error</span>
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Success Message Alert */}
          {successMessage && (
            <div className="p-3 bg-primary-container text-on-primary-container text-xs font-semibold rounded-xl flex items-start gap-2 animate-in fade-in">
              <span className="material-symbols-outlined text-base shrink-0 mt-0.5 text-primary">
                check_circle
              </span>
              <span className="leading-relaxed">{successMessage}</span>
            </div>
          )}

          {/* Existing Google/Account Detected Quick Action Card */}
          {existingAccountDetected && (
            <div className="p-3.5 bg-surface-container-high border border-secondary/30 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 text-secondary text-xs font-bold">
                <span className="material-symbols-outlined text-base">info</span>
                <span>Account Already Exists</span>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                If you registered using Google Sign-In, you can sign in directly with Google or set a new password for this email.
              </p>
              <div className="flex flex-col gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading || loading}
                  className="w-full bg-secondary/15 hover:bg-secondary/25 text-secondary text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">account_circle</span>
                  <span>Sign In with Google</span>
                </button>
                <button
                  type="button"
                  onClick={handleSendPasswordSetup}
                  disabled={loading}
                  className="w-full bg-surface-container hover:bg-surface-container-highest text-on-surface text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-2 border border-outline-variant/30 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">lock_reset</span>
                  <span>Send Link to Set Password</span>
                </button>
              </div>
            </div>
          )}

          {/* Google Sign In Button (hidden in forgot mode) */}
          {!isForgot && (
            <>
              <button
                type="button"
                disabled={googleLoading || loading}
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/40 rounded-xl py-3 px-4 text-xs font-bold transition-all active:scale-[0.98] shadow-xs disabled:opacity-60"
              >
                {googleLoading ? (
                  <span className="material-symbols-outlined animate-spin text-lg">
                    progress_activity
                  </span>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-2">
                <div className="h-px bg-outline-variant/30 flex-1" />
                <span className="text-[11px] font-mono text-outline uppercase">Or with email</span>
                <div className="h-px bg-outline-variant/30 flex-1" />
              </div>
            </>
          )}

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            {isRegister && (
              <div>
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full bg-surface-container px-3 py-2.5 rounded-xl text-xs sm:text-sm text-on-surface placeholder:text-outline/70 border border-outline-variant/30 outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
                  required
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-surface-container px-3 py-2.5 rounded-xl text-xs sm:text-sm text-on-surface placeholder:text-outline/70 border border-outline-variant/30 outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
                required
              />
            </div>

            {!isForgot && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-on-surface-variant">
                    Password
                  </label>
                  {!isRegister && (
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-[11px] font-medium text-secondary hover:underline"
                    >
                      Forgot / Set Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-surface-container px-3 py-2.5 pr-10 rounded-xl text-xs sm:text-sm text-on-surface placeholder:text-outline/70 border border-outline-variant/30 outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-1 text-sm"
                  >
                    <span className="material-symbols-outlined text-base">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Password Criteria Checklist (Real-time feedback when registering) */}
            {isRegister && password.length > 0 && (
              <div className="p-3 bg-surface-container-high/60 border border-outline-variant/20 rounded-xl space-y-1.5 text-[11px]">
                <span className="font-semibold text-on-surface-variant block mb-1">
                  Password Criteria:
                </span>
                <div className="grid grid-cols-1 gap-1">
                  <div
                    className={`flex items-center gap-1.5 ${
                      passwordValidation.checks.minLength
                        ? 'text-emerald-500 font-medium'
                        : 'text-outline'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">
                      {passwordValidation.checks.minLength ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <span>At least 8 characters</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 ${
                      passwordValidation.checks.hasUpper
                        ? 'text-emerald-500 font-medium'
                        : 'text-outline'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">
                      {passwordValidation.checks.hasUpper ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <span>At least 1 uppercase letter (A-Z)</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 ${
                      passwordValidation.checks.hasLower
                        ? 'text-emerald-500 font-medium'
                        : 'text-outline'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">
                      {passwordValidation.checks.hasLower ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <span>At least 1 lowercase letter (a-z)</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 ${
                      passwordValidation.checks.hasNumber
                        ? 'text-emerald-500 font-medium'
                        : 'text-outline'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">
                      {passwordValidation.checks.hasNumber ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <span>At least 1 number (0-9)</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 ${
                      passwordValidation.checks.hasSpecial
                        ? 'text-emerald-500 font-medium'
                        : 'text-outline'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">
                      {passwordValidation.checks.hasSpecial ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <span>At least 1 special character (. , # ? ! @)</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 ${
                      passwordValidation.checks.notContainsUserInfo
                        ? 'text-emerald-500 font-medium'
                        : 'text-error font-medium'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">
                      {passwordValidation.checks.notContainsUserInfo
                        ? 'check_circle'
                        : 'cancel'}
                    </span>
                    <span>Does not contain username or email</span>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full bg-secondary text-white font-semibold py-3 px-4 rounded-xl text-xs sm:text-sm hover:bg-secondary/90 active:scale-[0.99] transition-all shadow-md shadow-secondary/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">
                    progress_activity
                  </span>
                  <span>
                    {isRegister
                      ? 'Creating Account...'
                      : isForgot
                      ? 'Sending Link...'
                      : 'Signing In...'}
                  </span>
                </>
              ) : (
                <span>
                  {isRegister
                    ? 'Sign Up'
                    : isForgot
                    ? 'Send Password Link'
                    : 'Sign In'}
                </span>
              )}
            </button>
          </form>

          {/* Toggle between Modes */}
          <div className="text-center pt-2 space-y-1.5">
            {isForgot ? (
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-xs font-medium text-secondary hover:underline transition-all"
              >
                Back to Sign In
              </button>
            ) : (
              <button
                type="button"
                onClick={() => switchMode(isRegister ? 'login' : 'register')}
                className="text-xs font-medium text-secondary hover:underline transition-all"
              >
                {isRegister
                  ? 'Already have an account? Sign In'
                  : "Don't have an account? Sign Up"}
              </button>
            )}
          </div>
        </div>

        {/* Privacy Note */}
        <p className="text-[11px] text-center text-outline/80 leading-relaxed px-4">
          Each account has its own isolated Cloud Firestore partition. Your financial data is private to you.
        </p>
      </div>
    </div>
  );
}
