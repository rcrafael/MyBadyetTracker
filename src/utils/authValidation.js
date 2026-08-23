/**
 * Password Criteria & Auth Validation Utilities
 * 
 * Criteria:
 * - Does not contain username or email
 * - Minimum length: 8 characters
 * - At least 1 UPPERCASE letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character (period, comma, number sign, question mark, exclamation mark, at sign, etc.)
 */

export function validatePassword(password = '', { email = '', displayName = '' } = {}) {
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  // Special characters: period (.), comma (,), number sign (#), question mark (?), exclamation mark (!), at sign (@), etc.
  const hasSpecial = /[.,#?!@$%^&*()_+\-=[\]{};':"\\|<>/~`]/.test(password);

  let containsUserOrEmail = false;
  const lowerPassword = password.toLowerCase();

  // Check email and email local prefix (e.g., user in user@example.com)
  if (email && typeof email === 'string' && email.trim()) {
    const cleanEmail = email.trim().toLowerCase();
    const emailPrefix = cleanEmail.split('@')[0];

    if (lowerPassword.includes(cleanEmail)) {
      containsUserOrEmail = true;
    }
    if (emailPrefix && emailPrefix.length >= 3 && lowerPassword.includes(emailPrefix)) {
      containsUserOrEmail = true;
    }
  }

  // Check display name / username parts
  if (displayName && typeof displayName === 'string' && displayName.trim()) {
    const cleanName = displayName.trim().toLowerCase();
    if (cleanName.length >= 3 && lowerPassword.includes(cleanName)) {
      containsUserOrEmail = true;
    }
    const nameParts = cleanName.split(/[\s._-]+/).filter((p) => p.length >= 3);
    for (const part of nameParts) {
      if (lowerPassword.includes(part)) {
        containsUserOrEmail = true;
        break;
      }
    }
  }

  const checks = {
    minLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
    notContainsUserInfo: !containsUserOrEmail,
  };

  const errors = [];
  if (!minLength) errors.push('Password must be at least 8 characters.');
  if (!hasUpper) errors.push('Password must contain at least 1 uppercase letter.');
  if (!hasLower) errors.push('Password must contain at least 1 lowercase letter.');
  if (!hasNumber) errors.push('Password must contain at least 1 number.');
  if (!hasSpecial) errors.push('Password must contain at least 1 special character (e.g. ., ,, #, ?, !, @).');
  if (containsUserOrEmail) errors.push('Password must not contain your name or email address.');

  const isValid = Object.values(checks).every(Boolean);

  return {
    isValid,
    checks,
    errors,
  };
}

/**
 * Maps Firebase Auth error codes into clear, user-friendly and actionable messages.
 */
export function getFirebaseErrorMessage(error) {
  if (!error) return 'An unexpected error occurred.';

  const code = error.code || '';
  const message = error.message || '';

  switch (code) {
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled in Firebase Console. Please go to Firebase Console > Authentication > Sign-in method and enable the "Email/Password" provider.';
    
    case 'auth/configuration-not-found':
      return 'Firebase Authentication is not initialized or configured yet in Firebase Console. Please enable Authentication in your Firebase project.';
    
    case 'auth/email-already-in-use':
      return 'This email address is already registered. If you registered previously with Google, you can sign in with Google or set a new password.';

    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Please check your credentials or reset your password.';

    case 'auth/weak-password':
      return 'Password should be at least 8 characters and meet the security criteria.';

    case 'auth/invalid-email':
      return 'The email address is not valid. Please enter a valid email format.';

    case 'auth/user-disabled':
      return 'This user account has been disabled. Please contact support.';

    case 'auth/too-many-requests':
      return 'Access to this account has been temporarily disabled due to many failed login attempts. You can reset your password or try again later.';

    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled by closing the popup.';

    case 'auth/popup-blocked':
      return 'Popup was blocked by the browser. Please allow popups for this site and try again.';

    default:
      if (message.includes('auth/operation-not-allowed')) {
        return 'Email/Password sign-in is disabled in your Firebase project. Please enable Email/Password provider in Firebase Console > Authentication > Sign-in method.';
      }
      return message || 'Authentication failed. Please try again.';
  }
}
