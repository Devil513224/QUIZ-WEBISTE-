export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /WhatsApp|Telegram|Instagram|FBAN|FBAV|FB_IAB|FBIOS|Messenger|Line\//i.test(ua);
}

export function formatFirebaseAuthError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code || '')
      : '';
  const message = error instanceof Error ? error.message : String(error || '');

  const extractCode = (str: string): string => {
    const match = str.match(/auth\/[a-z0-9-]+/i);
    return match ? match[0].toLowerCase() : '';
  };

  const resolvedCode = (code || extractCode(message)).toLowerCase();

  switch (resolvedCode) {
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please check your details or use Forgot password.';
    case 'auth/user-not-found':
      return 'No account found with this email address. Please create an account first.';
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in or reset your password.';
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a password with at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Google sign-in popup was closed or cancelled before completing.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser. Allow popups or sign in with email and password.';
    case 'auth/network-request-failed':
      return 'Network error while connecting to Firebase. Please check your internet connection and try again.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for Google Sign-In (auth/unauthorized-domain). Add this domain under Firebase Console → Authentication → Settings → Authorized domains, or sign in with email.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes and try again.';
    default:
      if (!resolvedCode && message.toLowerCase().includes('not configured')) {
        return 'Firebase is not configured yet. Add the VITE_FIREBASE_* environment variables.';
      }
      return message || 'Authentication could not be completed. Please try again.';
  }
}

export function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
