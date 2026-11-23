import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  Globe,
  Menu,
  Moon,
  Search,
  Sun,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EXAM_CATEGORIES, LOGO_URL } from '../data/demoData';
import { LANGUAGE_OPTIONS, type LanguageCode } from '../i18n';
import {
  FooterSocialLinks,
  SESSION_POPUP_KEY,
  WelcomeNotificationPopup,
} from './SocialCommunity';
import { OfflineIndicator, PWAInstallButton } from './PWAInstall';
import { SeoHead } from './SeoHead';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    state,
    t,
    toastMessage,
    toggleTheme,
    setLanguage,
    unreadNotificationsCount,
    firebaseUser,
    isAdmin,
    liveVisitorCount,
    totalVisitorCount,
    reportVisitorPath,
  } = useApp();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickQuery, setQuickQuery] = useState('');
  const [welcomePopupOpen, setWelcomePopupOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    reportVisitorPath(location.pathname);
  }, [location.pathname, reportVisitorPath]);

  useEffect(() => {
    setDrawerOpen(false);
    setMoreOpen(false);
    setSearchOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (isAdminRoute || !state.communityConfig.popupEnabled) return;
    try {
      if (sessionStorage.getItem(SESSION_POPUP_KEY) === '1') return;
    } catch {
      // Ignore storage access restrictions
    }
    const timer = window.setTimeout(() => {
      setWelcomePopupOpen(true);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [isAdminRoute, state.communityConfig.popupEnabled]);

  const dismissWelcomePopup = () => {
    setWelcomePopupOpen(false);
    try {
      sessionStorage.setItem(SESSION_POPUP_KEY, '1');
    } catch {
      // Ignore storage access restrictions
    }
  };

  const primaryLinks = [
    { to: '/', label: t.nav.home },
    { to: '/exams', label: t.nav.exams },
    { to: '/tests?type=Mock+Test', label: t.nav.mockTests },
    { to: '/tests?type=Daily+Quiz', label: t.nav.quizzes },
    { to: '/materials', label: t.nav.materials },
  ];

  const secondaryLinks = [
    { to: '/courses', label: t.nav.courses },
    { to: '/flashcards', label: 'Flashcards' },
    { to: '/affairs', label: t.nav.affairs },
    { to: '/jobs', label: t.nav.jobs },
    { to: '/typing', label: t.nav.typing },
    { to: '/planner', label: t.nav.planner },
    { to: '/leaderboard', label: t.nav.leaderboard },
    { to: '/dashboard', label: t.nav.dashboard },
    { to: '/about', label: t.nav.about },
    ...(isAdmin ? [{ to: '/admin', label: t.nav.admin }] : []),
  ];

  const allDrawerLinks = [...primaryLinks, ...secondaryLinks];

  const searchResults = quickQuery.trim()
    ? [
        ...EXAM_CATEGORIES.filter((e) =>
          e.name.toLowerCase().includes(quickQuery.toLowerCase()) ||
          e.description.toLowerCase().includes(quickQuery.toLowerCase())
        ).map((e) => ({ title: e.name, type: t.nav.exams, to: `/exams/${e.id}` })),
        ...state.materials
          .filter((m) => m.title.toLowerCase().includes(quickQuery.toLowerCase()))
          .map((m) => ({ title: m.title, type: t.nav.materials, to: '/materials' })),
        ...state.affairs
          .filter((a) => a.title.toLowerCase().includes(quickQuery.toLowerCase()))
          .map((a) => ({ title: a.title, type: t.nav.affairs, to: '/affairs' })),
      ].slice(0, 6)
    : [];

  if (isAdminRoute) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] dark:bg-[#0b1730] dark:text-[#f1f5f9]">
        <SeoHead />
        {children}
        <OfflineIndicator />
        {toastMessage && (
          <div
            role="status"
            className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-[#facc15] bg-[#102544] px-5 py-2.5 text-sm font-medium text-white shadow-lg"
          >
            {toastMessage}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-[#f8fafc] text-[#0f172a] dark:bg-[#0b1730] dark:text-[#f1f5f9]">
      <SeoHead />
      {/* Announcement Bar */}
      <div className="bg-[#102544] px-3 py-2 text-center text-[11px] leading-snug text-white sm:px-4 sm:text-sm">
        <span className="font-bold text-[#facc15]">{t.brand.freeBannerPrefix}</span>{' '}
        <span className="text-slate-100">{t.brand.freeBannerText}</span>
      </div>

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-[#24385c] dark:bg-[#122443]/95">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-3 sm:h-16 sm:gap-4 sm:px-6">
          {/* Brand */}
          <Link
            to="/"
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap font-display text-sm font-extrabold tracking-tight text-[#102544] sm:gap-2.5 sm:text-lg dark:text-white"
          >
            <img
              src={LOGO_URL}
              alt={t.brand.logoAlt}
              className="h-8 w-8 shrink-0 rounded-full object-cover sm:h-10 sm:w-10"
              referrerPolicy="no-referrer"
            />
            <span className="sm:hidden">Learn TG</span>
            <span className="hidden sm:inline">{t.brand.name}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
            {primaryLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `whitespace-nowrap shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#eef2f8] text-[#102544] font-semibold dark:bg-[#16294b] dark:text-[#facc15]'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-[#9fb0c8] dark:hover:bg-[#16294b] dark:hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}

            {/* More Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                aria-expanded={moreOpen}
                className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-[#9fb0c8] dark:hover:bg-[#16294b] dark:hover:text-white"
              >
                <span>{t.nav.more}</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {moreOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setMoreOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute left-0 top-full z-30 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-[#24385c] dark:bg-[#122443]">
                    {secondaryLinks.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-[#eef2f8] hover:text-[#102544] dark:text-slate-200 dark:hover:bg-[#16294b] dark:hover:text-[#facc15]"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </nav>

          {/* Header Tools */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label={t.common.search}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 sm:h-9 sm:w-9 dark:border-[#24385c] dark:bg-[#16294b] dark:text-slate-200 dark:hover:bg-[#1b3a6b]"
            >
              <Search className="h-4 w-4" />
            </button>

            <div className="relative flex items-center">
              <Globe className="pointer-events-none absolute left-2.5 hidden h-3.5 w-3.5 text-slate-500 sm:block dark:text-[#9fb0c8]" />
              <select
                aria-label={t.nav.languageLabel}
                value={state.language}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                className="h-8 max-w-[74px] cursor-pointer rounded-lg border border-slate-200 bg-white px-1.5 text-xs font-medium text-slate-800 sm:h-9 sm:max-w-none sm:pl-8 sm:pr-2.5 sm:text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-slate-100"
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={t.nav.toggleTheme}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 sm:h-9 sm:w-9 dark:border-[#24385c] dark:bg-[#16294b] dark:text-[#facc15] dark:hover:bg-[#1b3a6b]"
            >
              {state.theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <Link
              to="/notifications"
              aria-label={t.nav.notifications}
              className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 sm:h-9 sm:w-9 dark:border-[#24385c] dark:bg-[#16294b] dark:text-slate-200 dark:hover:bg-[#1b3a6b]"
            >
              <Bell className="h-4 w-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#facc15] px-1 font-mono-num text-[10px] font-bold text-[#102544]">
                  {unreadNotificationsCount}
                </span>
              )}
            </Link>

            <PWAInstallButton variant="header" />

            <Link
              to="/account"
              className="hidden h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-[#102544] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1b3a6b] sm:inline-flex dark:bg-[#facc15] dark:text-[#102544] dark:hover:brightness-95"
            >
              {firebaseUser ? state.profile.name : t.nav.login}
            </Link>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label={t.nav.menu}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 sm:h-9 sm:w-9 lg:hidden dark:border-[#24385c] dark:bg-[#16294b] dark:text-slate-100"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Expandable Quick Search Bar */}
        {searchOpen && (
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-[#24385c] dark:bg-[#0b1730]">
            <div className="mx-auto max-w-2xl">
              <div className="relative flex items-center gap-2">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  type="search"
                  autoFocus
                  value={quickQuery}
                  onChange={(e) => setQuickQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && quickQuery.trim()) {
                      navigate(`/exams?q=${encodeURIComponent(quickQuery.trim())}`);
                      setSearchOpen(false);
                    }
                  }}
                  placeholder={t.nav.searchPlaceholder}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-[#24385c] dark:bg-[#122443] dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  aria-label={t.nav.close}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 dark:text-[#9fb0c8] dark:hover:bg-[#16294b]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {searchResults.length > 0 && (
                <div className="mt-2 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white dark:divide-[#24385c] dark:border-[#24385c] dark:bg-[#122443]">
                  {searchResults.map((res, idx) => (
                    <Link
                      key={idx}
                      to={res.to}
                      className="flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-[#16294b]"
                    >
                      <span className="font-medium text-slate-900 dark:text-slate-100">{res.title}</span>
                      <span className="text-xs text-slate-500 dark:text-[#9fb0c8]">{res.type}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 right-0 flex w-72 max-w-[85vw] flex-col bg-white p-5 shadow-2xl dark:bg-[#122443]">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-[#24385c]">
              <div className="flex items-center gap-2.5">
                <img
                  src={LOGO_URL}
                  alt={t.brand.logoAlt}
                  className="h-9 w-9 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="font-display text-base font-extrabold text-[#102544] dark:text-white">
                  {t.brand.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label={t.nav.close}
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#16294b]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-4 flex-1 space-y-1 overflow-y-auto" aria-label="Mobile navigation">
              {allDrawerLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-[#eef2f8] hover:text-[#102544] dark:text-slate-200 dark:hover:bg-[#16294b] dark:hover:text-[#facc15]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="space-y-2 border-t border-slate-200 pt-4 dark:border-[#24385c]">
              <PWAInstallButton variant="drawer" />
              <Link
                to="/account"
                className="flex w-full items-center justify-center rounded-lg bg-[#facc15] px-4 py-2.5 text-sm font-bold text-[#102544]"
              >
                {t.nav.login} / {t.nav.account}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-[#102544] text-slate-300">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="md:col-span-1">
              <div className="flex items-center gap-3">
                <img
                  src={LOGO_URL}
                  alt={t.brand.logoAlt}
                  className="h-14 w-14 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="font-display text-lg font-extrabold text-white">{t.brand.name}</div>
                  <div className="text-xs text-[#facc15]">{t.brand.tagline}</div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-300">{t.footer.aboutText}</p>
              <FooterSocialLinks onOpenPopup={() => setWelcomePopupOpen(true)} />
            </div>

            <div>
              <h4 className="mb-3 font-display text-sm font-bold text-white">{t.footer.learnCol}</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/exams" className="hover:text-[#facc15]">{t.nav.exams}</Link></li>
                <li><Link to="/tests" className="hover:text-[#facc15]">{t.nav.mockTests}</Link></li>
                <li><Link to="/materials" className="hover:text-[#facc15]">{t.nav.materials}</Link></li>
                <li><Link to="/courses" className="hover:text-[#facc15]">{t.nav.courses}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 font-display text-sm font-bold text-white">{t.footer.toolsCol}</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/flashcards" className="hover:text-[#facc15]">Flashcards</Link></li>
                <li><Link to="/typing" className="hover:text-[#facc15]">{t.nav.typing}</Link></li>
                <li><Link to="/planner" className="hover:text-[#facc15]">{t.nav.planner}</Link></li>
                <li><Link to="/affairs" className="hover:text-[#facc15]">{t.nav.affairs}</Link></li>
                <li><Link to="/jobs" className="hover:text-[#facc15]">{t.nav.jobs}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 font-display text-sm font-bold text-white">{t.footer.platformCol}</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/dashboard" className="hover:text-[#facc15]">{t.nav.dashboard}</Link></li>
                <li><Link to="/leaderboard" className="hover:text-[#facc15]">{t.nav.leaderboard}</Link></li>
                <li><Link to="/about" className="hover:text-[#facc15]">{t.nav.about}</Link></li>
                <li><Link to="/account" className="hover:text-[#facc15]">{t.nav.account}</Link></li>
                {isAdmin && (
                  <li><Link to="/admin" className="hover:text-[#facc15]">{t.nav.admin}</Link></li>
                )}
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[#24385c] pt-6 text-xs text-slate-400">
            <span>{t.footer.copyright}</span>
            <div className="flex flex-wrap items-center gap-3">
              <PWAInstallButton variant="footer" />
              <span className="inline-flex items-center gap-2 font-mono-num text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                <span>{liveVisitorCount} live online · {totalVisitorCount.toLocaleString()} total visits</span>
              </span>
            </div>
          </div>
        </div>
      </footer>

      <WelcomeNotificationPopup open={welcomePopupOpen} onClose={dismissWelcomePopup} />
      <OfflineIndicator />

      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-50 w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-xl border border-[#facc15] bg-[#102544] px-4 py-2.5 text-center text-sm font-medium text-white shadow-lg"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
};
