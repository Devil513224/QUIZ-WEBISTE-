import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Check,
  KeyRound,
  LogIn,
  LogOut,
  Mail,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LoadingState } from '../components/CommonUI';
import { EXAM_CATEGORIES, LOGO_URL } from '../data/demoData';
import {
  formatFirebaseAuthError,
  isInAppBrowser,
  isValidEmailFormat,
} from '../utils/authHelpers';

type AuthMode = 'login' | 'register' | 'reset';

export const AccountPage: React.FC<{ initialTab?: string }> = () => {
  const {
    state,
    t,
    authReady,
    firebaseUser,
    isAdmin,
    signInWithGoogle,
    registerWithEmail,
    signInWithEmail,
    resetPassword,
    signOutUser,
    updateProfile,
    showToast,
  } = useApp();

  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [fullName, setFullName] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [profName, setProfName] = useState(state.profile.name);
  const [profExam, setProfExam] = useState(state.profile.exam);
  const [profLang, setProfLang] = useState(state.profile.language);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  const inAppBrowser = isInAppBrowser();

  useEffect(() => {
    setProfName(state.profile.name);
    setProfExam(state.profile.exam);
    setProfLang(state.profile.language);
  }, [state.profile.name, state.profile.exam, state.profile.language]);

  // Safety reset if Google popup is closed/cancelled cleanly or silently when window regains focus
  useEffect(() => {
    if (!googleBusy) return;
    let timer: number | undefined;
    const handleFocus = () => {
      timer = window.setTimeout(() => {
        setGoogleBusy(false);
      }, 1500);
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      if (timer) window.clearTimeout(timer);
    };
  }, [googleBusy]);

  const switchAuthMode = (nextMode: AuthMode) => {
    setAuthMode(nextMode);
    setErrorMsg(null);
    setInfoMsg(null);
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    setGoogleBusy(true);
    try {
      await signInWithGoogle();
      showToast('Signed in with Google.');
    } catch (err) {
      setErrorMsg(formatFirebaseAuthError(err));
    } finally {
      setGoogleBusy(false);
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const cleanEmail = emailInput.trim();
    if (!isValidEmailFormat(cleanEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (authMode === 'reset') {
      setBusy(true);
      try {
        await resetPassword(cleanEmail);
        setInfoMsg(
          `Password reset link sent to ${cleanEmail}. Check your inbox (and spam folder).`
        );
        showToast('Password reset email sent.');
      } catch (err) {
        setErrorMsg(formatFirebaseAuthError(err));
      } finally {
        setBusy(false);
      }
      return;
    }

    if (passwordInput.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (authMode === 'register') {
      const cleanName = fullName.trim();
      if (cleanName.length < 2) {
        setErrorMsg('Please enter your full name (at least 2 characters).');
        return;
      }
      if (cleanName.includes('@')) {
        setErrorMsg('Display name should not be an email address.');
        return;
      }
      if (passwordInput !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
    }

    setBusy(true);
    try {
      if (authMode === 'register') {
        await registerWithEmail(fullName, cleanEmail, passwordInput);
        showToast('Account created and signed in!');
      } else {
        await signInWithEmail(cleanEmail, passwordInput);
        showToast('Signed in successfully.');
      }
    } catch (err) {
      setErrorMsg(formatFirebaseAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSavedNote(null);
    const trimmed = profName.trim();
    if (trimmed.length < 3) {
      setErrorMsg(t.account.errors.nameShort);
      return;
    }
    if (trimmed.includes('@')) {
      setErrorMsg(t.account.errors.nameEmail);
      return;
    }
    setBusy(true);
    try {
      await updateProfile({
        name: trimmed,
        email: firebaseUser?.email || state.profile.email,
        exam: profExam,
        language: profLang,
      });
      setSavedNote('Profile saved to your Firebase account.');
      showToast('Profile updated.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not update profile.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid lg:grid-cols-12 dark:border-[#24385c] dark:bg-[#122443]">
        {/* Brand Side Panel */}
        <div className="flex flex-col justify-between bg-[#102544] p-7 text-white lg:col-span-5 lg:p-10">
          <div>
            <div className="flex items-center gap-3">
              <img
                src={LOGO_URL}
                alt={t.brand.logoAlt}
                className="h-12 w-12 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div>
                <div className="font-display text-lg font-extrabold">{t.brand.name}</div>
                <div className="text-xs text-[#facc15]">{t.brand.tagline}</div>
              </div>
            </div>

            <h1 className="mt-8 font-display text-2xl font-extrabold leading-tight">
              {t.account.sideTitle}
            </h1>
            <p className="mt-2 text-sm text-[#c7d3e6]">{t.account.sideSub}</p>

            <ul className="mt-6 space-y-3 text-sm text-slate-200">
              {t.account.sideBullets.map((line) => (
                <li key={line} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#facc15]" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 rounded-xl bg-[#16294b] p-3.5 text-xs text-[#c7d3e6]">
            Secured with Firebase Authentication &amp; Cloud Firestore.
          </div>
        </div>

        {/* Account Pane */}
        <div className="p-6 sm:p-8 lg:col-span-7">
          {!authReady ? (
            <LoadingState />
          ) : !firebaseUser ? (
            <div className="space-y-5 py-2">
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                  {authMode === 'register'
                    ? 'Create your free account'
                    : authMode === 'reset'
                      ? 'Reset your password'
                      : t.account.welcomeBack}
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-[#9fb0c8]">
                  Sign in with Google or your email to sync mock tests, saved PDFs, typing speed, and study planner across devices.
                </p>
              </div>

              {inAppBrowser && (
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900 sm:text-sm dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>
                    Open this page in Chrome or Safari to use Google login, or log in with email.
                  </span>
                </div>
              )}

              {errorMsg && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {infoMsg && (
                <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{infoMsg}</span>
                </div>
              )}

              <button
                type="button"
                disabled={googleBusy || busy}
                onClick={handleGoogleSignIn}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-[#102544] transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-[#24385c] dark:bg-[#16294b] dark:text-white dark:hover:bg-[#1b3a6b]"
              >
                <LogIn className="h-4 w-4" />
                <span>{googleBusy ? 'Signing in…' : 'Continue with Google'}</span>
              </button>

              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-slate-200 dark:border-[#24385c]" />
                <span className="mx-3 shrink-0 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-[#9fb0c8]">
                  Or with email
                </span>
                <div className="flex-grow border-t border-slate-200 dark:border-[#24385c]" />
              </div>

              {/* Auth Mode Tabs */}
              <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-[#0b1730]">
                <button
                  type="button"
                  onClick={() => switchAuthMode('login')}
                  className={`rounded-lg py-2 text-xs font-bold transition-colors sm:text-sm ${
                    authMode === 'login'
                      ? 'bg-white text-[#102544] shadow-xs dark:bg-[#16294b] dark:text-[#facc15]'
                      : 'text-slate-600 hover:text-slate-900 dark:text-[#9fb0c8] dark:hover:text-white'
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => switchAuthMode('register')}
                  className={`rounded-lg py-2 text-xs font-bold transition-colors sm:text-sm ${
                    authMode === 'register'
                      ? 'bg-white text-[#102544] shadow-xs dark:bg-[#16294b] dark:text-[#facc15]'
                      : 'text-slate-600 hover:text-slate-900 dark:text-[#9fb0c8] dark:hover:text-white'
                  }`}
                >
                  Register
                </button>
                <button
                  type="button"
                  onClick={() => switchAuthMode('reset')}
                  className={`rounded-lg py-2 text-xs font-bold transition-colors sm:text-sm ${
                    authMode === 'reset'
                      ? 'bg-white text-[#102544] shadow-xs dark:bg-[#16294b] dark:text-[#facc15]'
                      : 'text-slate-600 hover:text-slate-900 dark:text-[#9fb0c8] dark:hover:text-white'
                  }`}
                >
                  Forgot
                </button>
              </div>

              <form onSubmit={handleEmailAuthSubmit} noValidate className="space-y-3.5">
                {authMode === 'register' && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ananya Roy"
                      autoComplete="name"
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
                  />
                </div>

                {authMode !== 'reset' && (
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Password
                      </label>
                      {authMode === 'login' && (
                        <button
                          type="button"
                          onClick={() => switchAuthMode('reset')}
                          className="text-xs font-semibold text-[#102544] hover:underline dark:text-[#facc15]"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="At least 6 characters"
                      autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
                    />
                  </div>
                )}

                {authMode === 'register' && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy || googleBusy}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#102544] px-5 text-sm font-bold text-white transition-colors hover:bg-[#1b3a6b] disabled:opacity-60 dark:bg-[#facc15] dark:text-[#102544]"
                >
                  {authMode === 'register' ? (
                    <>
                      <UserPlus className="h-4 w-4" />
                      <span>{busy ? 'Creating account…' : 'Create Account'}</span>
                    </>
                  ) : authMode === 'reset' ? (
                    <>
                      <KeyRound className="h-4 w-4" />
                      <span>{busy ? 'Sending reset link…' : 'Send Password Reset Email'}</span>
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      <span>{busy ? 'Signing in…' : 'Sign in with Email'}</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-[#24385c]">
                <div>
                  <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                    {t.account.profileTitle}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-[#9fb0c8]">
                    Signed in as{' '}
                    <strong className="text-slate-800 dark:text-slate-100">
                      {firebaseUser.email}
                    </strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#facc15] px-3.5 py-2 text-xs font-bold text-[#102544] hover:brightness-95"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>{t.nav.admin}</span>
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => void signOutUser()}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#24385c] dark:text-slate-200 dark:hover:bg-[#16294b]"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {savedNote && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                  {savedNote}
                </div>
              )}

              <form onSubmit={handleProfileSave} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {t.account.displayName}
                    </label>
                    <input
                      type="text"
                      value={profName}
                      onChange={(e) => setProfName(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {t.account.email}
                    </label>
                    <input
                      type="email"
                      disabled
                      value={firebaseUser.email || ''}
                      className="h-10 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 dark:border-[#24385c] dark:bg-[#0b1730] dark:text-[#9fb0c8]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {t.account.targetExam}
                    </label>
                    <select
                      value={profExam}
                      onChange={(e) => setProfExam(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
                    >
                      {EXAM_CATEGORIES.map((ex) => (
                        <option key={ex.id} value={ex.name}>
                          {ex.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {t.account.preferredLang}
                    </label>
                    <select
                      value={profLang}
                      onChange={(e) => setProfLang(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
                    >
                      <option value="English">English</option>
                      <option value="Bengali">বাংলা</option>
                      <option value="Hindi">हिन्दी</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-xl bg-[#102544] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1b3a6b] disabled:opacity-60 dark:bg-[#facc15] dark:text-[#102544]"
                >
                  {busy ? 'Saving…' : t.account.saveProfile}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
