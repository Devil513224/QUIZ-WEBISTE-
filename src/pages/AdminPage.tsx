import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  Bell,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ClipboardList,
  Database,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  FolderTree,
  Globe,
  HelpCircle,
  Image as ImageIcon,
  Keyboard,
  LayoutDashboard,
  LayoutTemplate,
  Lock,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Newspaper,
  Plus,
  Search,
  Settings,
  ShieldAlert,
  Sliders,
  Sun,
  Trash2,
  TrendingUp,
  Upload,
  Users,
  Video,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { type GenericRow, useApp } from '../context/AppContext';
import { EmptyState, LoadingState } from '../components/CommonUI';
import {
  type BannerItem,
  type CourseItem,
  type CurrentAffairItem,
  type JobUpdateItem,
  LOGO_URL,
  type NotificationItem,
  type QuestionItem,
  type StudyMaterialItem,
  type TestDefinition,
  type TypingPassageItem,
} from '../data/demoData';
import { uploadMaterialPdf } from '../firebase';
import { LANGUAGE_OPTIONS, type LanguageCode } from '../i18n';

type SectionKey =
  | 'dash'
  | 'students'
  | 'exams'
  | 'subjects'
  | 'categories'
  | 'qb'
  | 'quizzes'
  | 'mocks'
  | 'materials'
  | 'courses'
  | 'affairs'
  | 'jobs'
  | 'typing'
  | 'banners'
  | 'hb'
  | 'notify'
  | 'reports'
  | 'sitesettings'
  | 'logs';

interface ColumnSpec {
  key: string;
  label: string;
  required?: boolean;
}

const CATALOG_SCHEMA: Record<'exams' | 'subjects' | 'categories' | 'sitesettings', ColumnSpec[]> = {
  exams: [
    { key: 'name', label: 'Exam Name', required: true },
    { key: 'cat', label: 'Group (All India / State & WB / Computer)', required: true },
  ],
  subjects: [
    { key: 'name', label: 'Subject Name', required: true },
    { key: 'desc', label: 'Description' },
  ],
  categories: [
    { key: 'name', label: 'Category Name', required: true },
    { key: 'desc', label: 'Description' },
  ],
  sitesettings: [
    { key: 'key', label: 'Setting Key', required: true },
    { key: 'val', label: 'Value', required: true },
  ],
};

const WEEKLY_CHART_DATA = [
  { day: 'Mon', attempts: 145 },
  { day: 'Tue', attempts: 198 },
  { day: 'Wed', attempts: 176 },
  { day: 'Thu', attempts: 242 },
  { day: 'Fri', attempts: 268 },
  { day: 'Sat', attempts: 315 },
  { day: 'Sun', attempts: 290 },
];

const PAGE_SIZE = 6;

export const AdminPage: React.FC = () => {
  const {
    state,
    t,
    authReady,
    firebaseUser,
    isAdmin,
    signInWithGoogle,
    signOutUser,
    toggleTheme,
    setLanguage,
    showToast,
    saveQuestionDoc,
    deleteQuestionDoc,
    saveTestDoc,
    deleteTestDoc,
    saveMaterialDoc,
    deleteMaterialDoc,
    saveCourseDoc,
    deleteCourseDoc,
    saveAffairDoc,
    deleteAffairDoc,
    saveJobDoc,
    deleteJobDoc,
    saveBannerDoc,
    deleteBannerDoc,
    saveHomepageSectionsOrder,
    saveNotificationDoc,
    deleteNotificationDoc,
    saveTypingPassageDoc,
    deleteTypingPassageDoc,
    saveCatalogRowDoc,
    deleteCatalogRowDoc,
    saveReportDoc,
    deleteReportDoc,
    toggleStudentStatusDoc,
    seedFirestoreCatalog,
  } = useApp();

  const [section, setSection] = useState<SectionKey>('dash');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [authBusy, setAuthBusy] = useState(false);
  const [savingBusy, setSavingBusy] = useState(false);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfUploadError, setPdfUploadError] = useState<string | null>(null);

  // Modals
  const [deleteTarget, setDeleteTarget] = useState<{ kind: string; id: string; label: string } | null>(null);
  const [qbModal, setQbModal] = useState<{ mode: 'add' | 'edit'; item: QuestionItem } | null>(null);
  const [testModal, setTestModal] = useState<{ mode: 'add' | 'edit'; item: TestDefinition } | null>(null);
  const [materialModal, setMaterialModal] = useState<{ mode: 'add' | 'edit'; item: StudyMaterialItem } | null>(null);
  const [courseModal, setCourseModal] = useState<{ mode: 'add' | 'edit'; item: CourseItem; lessonsText: string } | null>(null);
  const [affairModal, setAffairModal] = useState<{ mode: 'add' | 'edit'; item: CurrentAffairItem } | null>(null);
  const [jobModal, setJobModal] = useState<{ mode: 'add' | 'edit'; item: JobUpdateItem } | null>(null);
  const [typingModal, setTypingModal] = useState<{ mode: 'add' | 'edit'; item: TypingPassageItem } | null>(null);
  const [notifModal, setNotifModal] = useState<{ mode: 'add' | 'edit'; item: NotificationItem } | null>(null);
  const [catalogModal, setCatalogModal] = useState<{ mode: 'add' | 'edit'; kind: 'exams' | 'subjects' | 'categories' | 'sitesettings'; row: GenericRow } | null>(null);
  const [reportModal, setReportModal] = useState<{ mode: 'add' | 'edit'; row: GenericRow } | null>(null);

  // Banner & Homepage Builder state
  const [selectedBannerId, setSelectedBannerId] = useState<string>(state.banners[0]?.id || 'b1');
  const [draftBanner, setDraftBanner] = useState<BannerItem | null>(null);
  const [newSectionName, setNewSectionName] = useState('');

  // Filtered lists — hooks must stay above early returns
  const qFiltered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return state.questions.filter(
      (item) =>
        !q ||
        item.question.toLowerCase().includes(q) ||
        item.subjectName.toLowerCase().includes(q)
    );
  }, [state.questions, searchTerm]);

  const quizFiltered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return state.tests.filter(
      (tItem) =>
        tItem.type === 'Daily Quiz' &&
        (!q || tItem.name.toLowerCase().includes(q))
    );
  }, [state.tests, searchTerm]);

  const mockFiltered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return state.tests.filter(
      (tItem) =>
        tItem.type !== 'Daily Quiz' &&
        (!q || tItem.name.toLowerCase().includes(q) || tItem.type.toLowerCase().includes(q))
    );
  }, [state.tests, searchTerm]);

  const matFiltered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return state.materials.filter(
      (m) =>
        !q || m.title.toLowerCase().includes(q) || m.subject.toLowerCase().includes(q)
    );
  }, [state.materials, searchTerm]);

  const courseFiltered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return state.courses.filter(
      (c) =>
        !q || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    );
  }, [state.courses, searchTerm]);

  const affairFiltered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return state.affairs.filter(
      (a) =>
        !q || a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)
    );
  }, [state.affairs, searchTerm]);

  const jobFiltered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return state.jobs.filter(
      (j) =>
        !q ||
        j.title.toLowerCase().includes(q) ||
        j.organization.toLowerCase().includes(q) ||
        j.tab.toLowerCase().includes(q)
    );
  }, [state.jobs, searchTerm]);

  const typingFiltered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return state.typingPassages.filter(
      (tp) =>
        !q ||
        tp.title.toLowerCase().includes(q) ||
        tp.langLabel.toLowerCase().includes(q)
    );
  }, [state.typingPassages, searchTerm]);

  const notifFiltered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return state.notificationsList.filter(
      (n) =>
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.audience.toLowerCase().includes(q)
    );
  }, [state.notificationsList, searchTerm]);

  const genericRows = useMemo(() => {
    const rows = state.adminTables[section] || [];
    const q = searchTerm.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      Object.values(r).some((val) => String(val).toLowerCase().includes(q))
    );
  }, [state.adminTables, section, searchTerm]);

  /* -------------------- STRICT ADMIN ACCESS GATE -------------------- */
  if (!authReady) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20">
        <LoadingState message="Checking administrator credentials…" />
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 dark:bg-[#0b1730]">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-lg dark:border-[#24385c] dark:bg-[#122443]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#102544] text-[#facc15]">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            Admin Access Restricted
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-[#9fb0c8]">
            This Admin Panel is locked. Sign in with the authorized administrator Google account to manage quizzes, PDF study materials, and site content.
          </p>

          <button
            type="button"
            disabled={authBusy}
            onClick={async () => {
              setAuthBusy(true);
              try {
                await signInWithGoogle();
              } catch (err) {
                showToast(err instanceof Error ? err.message : 'Sign-in cancelled.');
              } finally {
                setAuthBusy(false);
              }
            }}
            className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#102544] px-5 text-sm font-bold text-white hover:bg-[#1b3a6b] disabled:opacity-60 dark:bg-[#facc15] dark:text-[#102544]"
          >
            <LogIn className="h-4 w-4" />
            <span>{authBusy ? 'Signing in…' : 'Sign in with Google'}</span>
          </button>

          <Link
            to="/"
            className="mt-4 inline-block text-sm font-semibold text-slate-600 hover:underline dark:text-[#9fb0c8]"
          >
            ← Back to Website
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 dark:bg-[#0b1730]">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-7 text-center shadow-lg dark:border-red-900/40 dark:bg-[#122443]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            Access Denied
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-[#9fb0c8]">
            You are signed in as <strong className="text-slate-900 dark:text-white">{firebaseUser.email}</strong>, which does not have administrator privileges.
          </p>

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <Link
              to="/"
              className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-[#102544] px-4 text-sm font-bold text-white hover:bg-[#1b3a6b] dark:bg-[#facc15] dark:text-[#102544]"
            >
              Back to Website
            </Link>
            <button
              type="button"
              onClick={() => void signOutUser()}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#24385c] dark:text-slate-200"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------- AUTHENTICATED ADMIN WORKSPACE -------------------- */
  const sidebarItems: Array<{ key: SectionKey; label: string; icon: React.ReactNode }> = [
    { key: 'dash', label: t.admin.sections.dash, icon: <LayoutDashboard className="h-4 w-4" /> },
    { key: 'students', label: t.admin.sections.students, icon: <Users className="h-4 w-4" /> },
    { key: 'exams', label: t.admin.sections.exams, icon: <BookOpen className="h-4 w-4" /> },
    { key: 'subjects', label: t.admin.sections.subjects, icon: <Sliders className="h-4 w-4" /> },
    { key: 'categories', label: t.admin.sections.categories, icon: <FolderTree className="h-4 w-4" /> },
    { key: 'qb', label: t.admin.sections.qb, icon: <HelpCircle className="h-4 w-4" /> },
    { key: 'quizzes', label: t.admin.sections.quizzes, icon: <CheckCircle2 className="h-4 w-4" /> },
    { key: 'mocks', label: t.admin.sections.mocks, icon: <ClipboardList className="h-4 w-4" /> },
    { key: 'materials', label: t.admin.sections.materials, icon: <FileText className="h-4 w-4" /> },
    { key: 'courses', label: t.admin.sections.courses, icon: <Video className="h-4 w-4" /> },
    { key: 'affairs', label: t.admin.sections.affairs, icon: <Newspaper className="h-4 w-4" /> },
    { key: 'jobs', label: t.admin.sections.jobs, icon: <Briefcase className="h-4 w-4" /> },
    { key: 'typing', label: t.admin.sections.typing, icon: <Keyboard className="h-4 w-4" /> },
    { key: 'banners', label: t.admin.sections.banners, icon: <ImageIcon className="h-4 w-4" /> },
    { key: 'hb', label: t.admin.sections.hb, icon: <LayoutTemplate className="h-4 w-4" /> },
    { key: 'notify', label: t.admin.sections.notify, icon: <Bell className="h-4 w-4" /> },
    { key: 'reports', label: t.admin.sections.reports, icon: <TrendingUp className="h-4 w-4" /> },
    { key: 'sitesettings', label: t.admin.sections.sitesettings, icon: <Settings className="h-4 w-4" /> },
    { key: 'logs', label: t.admin.sections.logs, icon: <FileText className="h-4 w-4" /> },
  ];

  const switchSection = (key: SectionKey) => {
    setSection(key);
    setSidebarOpen(false);
    setSearchTerm('');
    setPage(1);
  };

  const isDark = state.theme === 'dark';
  const gridColor = isDark ? '#24385c' : '#e2e8f0';
  const tickColor = isDark ? '#9fb0c8' : '#64748b';

  const currentBanner =
    draftBanner && draftBanner.id === selectedBannerId
      ? draftBanner
      : state.banners.find((b) => b.id === selectedBannerId) || state.banners[0] || null;

  const updateDraftBanner = <K extends keyof BannerItem>(key: K, val: BannerItem[K]) => {
    if (!currentBanner) return;
    setDraftBanner({ ...currentBanner, [key]: val });
  };

  const saveCurrentBanner = async () => {
    if (!currentBanner) return;
    setSavingBusy(true);
    try {
      await saveBannerDoc(currentBanner);
      setDraftBanner(null);
      showToast('Banner saved to Firebase!');
    } finally {
      setSavingBusy(false);
    }
  };

  const addNewBanner = async () => {
    const newItem: BannerItem = {
      id: `ban_${Date.now()}`,
      title: 'New Free Prep Campaign',
      subtitle: 'Highlight quizzes, courses or announcements here.',
      buttonText: 'Explore Now',
      bgColor: '#102544',
      align: 'left',
      visible: true,
    };
    await saveBannerDoc(newItem);
    setSelectedBannerId(newItem.id);
    setDraftBanner(newItem);
    showToast('Banner created in Firebase.');
  };

  const moveHomepageSection = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= state.homepageSections.length) return;
    const next = [...state.homepageSections];
    const [removed] = next.splice(index, 1);
    next.splice(target, 0, removed);
    await saveHomepageSectionsOrder(next);
  };

  const addHomepageSection = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSectionName.trim();
    if (!trimmed) return;
    const next = [
      ...state.homepageSections,
      {
        id: `hb_${Date.now()}`,
        key: `custom_${Date.now()}`,
        name: trimmed,
        heading: trimmed,
        order: state.homepageSections.length,
        visible: true,
      },
    ];
    await saveHomepageSectionsOrder(next);
    setNewSectionName('');
    showToast('Homepage section saved to Firebase.');
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { kind, id } = deleteTarget;
    setSavingBusy(true);
    try {
      if (kind === 'qb') await deleteQuestionDoc(id);
      else if (kind === 'quizzes' || kind === 'mocks') await deleteTestDoc(id);
      else if (kind === 'materials') await deleteMaterialDoc(id);
      else if (kind === 'courses') await deleteCourseDoc(id);
      else if (kind === 'affairs') await deleteAffairDoc(id);
      else if (kind === 'jobs') await deleteJobDoc(id);
      else if (kind === 'typing') await deleteTypingPassageDoc(id);
      else if (kind === 'notify') await deleteNotificationDoc(id);
      else if (kind === 'banners') await deleteBannerDoc(id);
      else if (kind === 'reports') await deleteReportDoc(id);
      else await deleteCatalogRowDoc(id);
      showToast('Deleted from Firebase.');
      setDeleteTarget(null);
    } finally {
      setSavingBusy(false);
    }
  };

  const paginate = <T,>(items: T[]) => {
    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const slice = items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    return { slice, totalPages, safePage, totalCount: items.length };
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-[#0f172a] dark:bg-[#0b1730] dark:text-[#f1f5f9]">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-[#102544] text-white transition-transform lg:static lg:translate-x-0 dark:border-[#24385c] ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-[#24385c] px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src={LOGO_URL}
              alt={t.brand.logoAlt}
              className="h-9 w-9 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="font-display text-sm font-extrabold">{t.brand.name}</div>
              <div className="text-[11px] font-semibold text-[#facc15]">{t.nav.admin}</div>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-[#1b3a6b] lg:hidden"
            aria-label={t.nav.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Admin sections">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => switchSection(item.key)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs sm:text-sm font-medium transition-colors ${
                section === item.key
                  ? 'bg-[#facc15] font-bold text-[#102544]'
                  : 'text-slate-200 hover:bg-[#1b3a6b]'
              }`}
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 dark:border-[#24385c] dark:bg-[#122443]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label={t.nav.menu}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 lg:hidden dark:border-[#24385c] dark:text-slate-200"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                Firebase Connected · {firebaseUser.email}
              </div>
              <h1 className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
                {t.admin.sections[section]}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void seedFirestoreCatalog(false)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#24385c] dark:bg-[#16294b] dark:text-slate-100"
            >
              <Database className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Sync Starter Data</span>
            </button>

            <div className="relative flex items-center">
              <Globe className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-500 dark:text-[#9fb0c8]" />
              <select
                aria-label={t.nav.languageLabel}
                value={state.language}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                className="h-9 rounded-lg border border-slate-200 bg-white pl-8 pr-2 text-xs font-medium text-slate-800 dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
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
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 dark:border-[#24385c] dark:bg-[#16294b] dark:text-[#facc15]"
            >
              {state.theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={() => void signOutUser()}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#24385c] dark:bg-[#16294b] dark:text-slate-100"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>

            <Link
              to="/"
              className="inline-flex h-9 items-center rounded-lg bg-[#102544] px-3.5 text-xs font-bold text-white hover:bg-[#1b3a6b] dark:bg-[#facc15] dark:text-[#102544]"
            >
              {t.admin.viewWebsite}
            </Link>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 p-4 sm:p-6">
          {/* 1. DASHBOARD */}
          {section === 'dash' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#24385c] dark:bg-[#122443]">
                  <div className="text-xs text-slate-500 dark:text-[#9fb0c8]">Registered Students</div>
                  <div className="mt-1 font-mono-num text-2xl font-extrabold text-slate-900 dark:text-white">
                    {state.adminTables.students?.length || 0}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#24385c] dark:bg-[#122443]">
                  <div className="text-xs text-slate-500 dark:text-[#9fb0c8]">Quizzes & Mocks</div>
                  <div className="mt-1 font-mono-num text-2xl font-extrabold text-slate-900 dark:text-white">
                    {state.tests.length}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#24385c] dark:bg-[#122443]">
                  <div className="text-xs text-slate-500 dark:text-[#9fb0c8]">{t.admin.totalQuestions}</div>
                  <div className="mt-1 font-mono-num text-2xl font-extrabold text-slate-900 dark:text-white">
                    {state.questions.length}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#24385c] dark:bg-[#122443]">
                  <div className="text-xs text-slate-500 dark:text-[#9fb0c8]">Study Materials / PDFs</div>
                  <div className="mt-1 font-mono-num text-2xl font-extrabold text-slate-900 dark:text-white">
                    {state.materials.length}
                  </div>
                </div>
                <div className="col-span-2 lg:col-span-1 rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#24385c] dark:bg-[#122443]">
                  <div className="text-xs text-slate-500 dark:text-[#9fb0c8]">{t.admin.totalBanners}</div>
                  <div className="mt-1 font-mono-num text-2xl font-extrabold text-slate-900 dark:text-white">
                    {state.banners.length}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-7 dark:border-[#24385c] dark:bg-[#122443]">
                  <h2 className="mb-4 font-display text-base font-bold text-slate-900 dark:text-white">
                    {t.admin.weeklyChart}
                  </h2>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={WEEKLY_CHART_DATA}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis dataKey="day" tick={{ fill: tickColor, fontSize: 12 }} />
                        <YAxis tick={{ fill: tickColor, fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? '#122443' : '#ffffff',
                            borderColor: gridColor,
                            color: isDark ? '#f1f5f9' : '#0f172a',
                            borderRadius: 12,
                          }}
                        />
                        <Bar dataKey="attempts" fill={isDark ? '#facc15' : '#102544'} radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-5 dark:border-[#24385c] dark:bg-[#122443]">
                  <h2 className="mb-4 font-display text-base font-bold text-slate-900 dark:text-white">
                    Recent Firebase Activity
                  </h2>
                  {(state.adminTables.logs || []).length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-[#9fb0c8]">
                      Activity logs appear here automatically as you add or edit content.
                    </p>
                  ) : (
                    <ul className="divide-y divide-slate-200 dark:divide-[#24385c]">
                      {(state.adminTables.logs || []).slice(0, 6).map((log) => (
                        <li key={log.id} className="py-3 text-sm">
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {String(log.act || '')}
                          </div>
                          <div className="mt-0.5 font-mono-num text-xs text-slate-500 dark:text-[#9fb0c8]">
                            {String(log.time || '')} · {String(log.who || '')}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. STUDENTS */}
          {section === 'students' && (() => {
            const { slice, totalPages, safePage, totalCount } = paginate(genericRows);
            return (
              <div className="space-y-4">
                <SearchBar value={searchTerm} onChange={(v) => { setSearchTerm(v); setPage(1); }} />
                {slice.length === 0 ? (
                  <EmptyState
                    title="No signed-in students recorded yet"
                    subtitle="Students appear here automatically after signing in with Google."
                    onReset={() => setSearchTerm('')}
                  />
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-[#24385c] dark:bg-[#122443]">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500 dark:border-[#24385c] dark:bg-[#16294b] dark:text-[#9fb0c8]">
                        <tr>
                          <th className="px-4 py-3">Display Name</th>
                          <th className="px-4 py-3">Target Exam</th>
                          <th className="px-4 py-3">Points</th>
                          <th className="px-4 py-3">{t.common.status}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-[#24385c]">
                        {slice.map((row) => (
                          <tr key={row.id}>
                            <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                              {String(row.name || row.id)}
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-[#9fb0c8]">
                              {String(row.exam || 'SSC')}
                            </td>
                            <td className="px-4 py-3 font-mono-num text-slate-700 dark:text-slate-200">
                              {String(row.points || '0')}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() =>
                                  void toggleStudentStatusDoc(
                                    row.id,
                                    row.status === 'Active' ? 'Suspended' : 'Active'
                                  )
                                }
                                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                  row.status === 'Active'
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                    : 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                                }`}
                              >
                                {String(row.status || 'Active')}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <PaginationBar page={safePage} totalPages={totalPages} totalCount={totalCount} onPageChange={setPage} />
              </div>
            );
          })()}

          {/* 3. QUESTION BANK */}
          {section === 'qb' && (() => {
            const { slice, totalPages, safePage, totalCount } = paginate(qFiltered);
            return (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <SearchBar value={searchTerm} onChange={(v) => { setSearchTerm(v); setPage(1); }} />
                  <button
                    type="button"
                    onClick={() =>
                      setQbModal({
                        mode: 'add',
                        item: {
                          id: `q_${Date.now()}`,
                          subjectKey: 'gk',
                          subjectName: 'General Knowledge',
                          question: '',
                          options: ['', '', '', ''],
                          correctIndex: 0,
                          explanation: '',
                          published: true,
                        },
                      })
                    }
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#102544] px-4 text-sm font-bold text-white hover:bg-[#1b3a6b] dark:bg-[#facc15] dark:text-[#102544]"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{t.admin.addQuestion}</span>
                  </button>
                </div>

                {slice.length === 0 ? (
                  <EmptyState onReset={() => setSearchTerm('')} />
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-[#24385c] dark:bg-[#122443]">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500 dark:border-[#24385c] dark:bg-[#16294b] dark:text-[#9fb0c8]">
                        <tr>
                          <th className="px-4 py-3">Question</th>
                          <th className="px-4 py-3">Subject</th>
                          <th className="px-4 py-3">{t.common.status}</th>
                          <th className="px-4 py-3 text-right">{t.common.actions}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-[#24385c]">
                        {slice.map((q) => (
                          <tr key={q.id}>
                            <td className="max-w-md px-4 py-3 font-medium text-slate-900 dark:text-white">
                              {q.question}
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-[#9fb0c8]">
                              {q.subjectName}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => void saveQuestionDoc({ ...q, published: !q.published })}
                                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                  q.published
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-[#16294b] dark:text-[#9fb0c8]'
                                }`}
                              >
                                {q.published ? t.common.published : t.common.draft}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <ActionButtons
                                onEdit={() => setQbModal({ mode: 'edit', item: { ...q } })}
                                onDelete={() => setDeleteTarget({ kind: 'qb', id: q.id, label: q.question })}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <PaginationBar page={safePage} totalPages={totalPages} totalCount={totalCount} onPageChange={setPage} />
              </div>
            );
          })()}

          {/* 4. QUIZZES & MOCK TESTS (REAL TEST SET BUILDER) */}
          {(section === 'quizzes' || section === 'mocks') && (() => {
            const list = section === 'quizzes' ? quizFiltered : mockFiltered;
            const { slice, totalPages, safePage, totalCount } = paginate(list);
            const defaultType = section === 'quizzes' ? 'Daily Quiz' : 'Mock Test';
            return (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <SearchBar value={searchTerm} onChange={(v) => { setSearchTerm(v); setPage(1); }} />
                  <button
                    type="button"
                    onClick={() =>
                      setTestModal({
                        mode: 'add',
                        item: {
                          id: `tst_${Date.now()}`,
                          type: defaultType,
                          name: '',
                          subjectKeys: ['gk'],
                          questionIds: [],
                          minutes: section === 'quizzes' ? 5 : 15,
                          negativeMarking: section === 'quizzes' ? 0 : 0.25,
                          note: '',
                          published: true,
                        },
                      })
                    }
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#102544] px-4 text-sm font-bold text-white hover:bg-[#1b3a6b] dark:bg-[#facc15] dark:text-[#102544]"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{section === 'quizzes' ? 'Create Quiz' : 'Create Mock Test'}</span>
                  </button>
                </div>

                {slice.length === 0 ? (
                  <EmptyState onReset={() => setSearchTerm('')} />
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-[#24385c] dark:bg-[#122443]">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500 dark:border-[#24385c] dark:bg-[#16294b] dark:text-[#9fb0c8]">
                        <tr>
                          <th className="px-4 py-3">Test Title</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Duration</th>
                          <th className="px-4 py-3">Questions</th>
                          <th className="px-4 py-3">{t.common.status}</th>
                          <th className="px-4 py-3 text-right">{t.common.actions}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-[#24385c]">
                        {slice.map((tst) => {
                          const qCount =
                            tst.questionIds && tst.questionIds.length > 0
                              ? tst.questionIds.length
                              : state.questions.filter(
                                  (q) => q.published && tst.subjectKeys.includes(q.subjectKey)
                                ).length;
                          return (
                            <tr key={tst.id}>
                              <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                                {tst.name}
                              </td>
                              <td className="px-4 py-3 text-slate-600 dark:text-[#9fb0c8]">
                                {tst.type}
                              </td>
                              <td className="px-4 py-3 font-mono-num text-slate-600 dark:text-[#9fb0c8]">
                                {tst.minutes} min
                              </td>
                              <td className="px-4 py-3 font-mono-num text-slate-600 dark:text-[#9fb0c8]">
                                {qCount} {tst.questionIds?.length ? '(Curated)' : '(By subject)'}
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    void saveTestDoc({ ...tst, published: !(tst.published ?? true) })
                                  }
                                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                    tst.published !== false
                                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                      : 'bg-slate-100 text-slate-600 dark:bg-[#16294b] dark:text-[#9fb0c8]'
                                  }`}
                                >
                                  {tst.published !== false ? t.common.published : t.common.draft}
                                </button>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <ActionButtons
                                  onEdit={() => setTestModal({ mode: 'edit', item: { ...tst } })}
                                  onDelete={() =>
                                    setDeleteTarget({ kind: section, id: tst.id, label: tst.name })
                                  }
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <PaginationBar page={safePage} totalPages={totalPages} totalCount={totalCount} onPageChange={setPage} />
              </div>
            );
          })()}

          {/* 5. STUDY MATERIALS + PDF UPLOAD */}
          {section === 'materials' && (() => {
            const { slice, totalPages, safePage, totalCount } = paginate(matFiltered);
            return (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <SearchBar value={searchTerm} onChange={(v) => { setSearchTerm(v); setPage(1); }} />
                  <button
                    type="button"
                    onClick={() => {
                      setPdfUploadError(null);
                      setMaterialModal({
                        mode: 'add',
                        item: {
                          id: `mat_${Date.now()}`,
                          title: '',
                          subject: 'General Knowledge',
                          pages: 20,
                          summary: '',
                          published: true,
                        },
                      });
                    }}
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#102544] px-4 text-sm font-bold text-white hover:bg-[#1b3a6b] dark:bg-[#facc15] dark:text-[#102544]"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Upload PDF / Add Note</span>
                  </button>
                </div>

                {slice.length === 0 ? (
                  <EmptyState onReset={() => setSearchTerm('')} />
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-[#24385c] dark:bg-[#122443]">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500 dark:border-[#24385c] dark:bg-[#16294b] dark:text-[#9fb0c8]">
                        <tr>
                          <th className="px-4 py-3">Title</th>
                          <th className="px-4 py-3">Subject</th>
                          <th className="px-4 py-3">PDF File</th>
                          <th className="px-4 py-3">{t.common.status}</th>
                          <th className="px-4 py-3 text-right">{t.common.actions}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-[#24385c]">
                        {slice.map((m) => (
                          <tr key={m.id}>
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                              {m.title}
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-[#9fb0c8]">
                              {m.subject}
                            </td>
                            <td className="px-4 py-3 text-xs">
                              {m.pdfUrl || m.pdfDataUrl ? (
                                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                                  {m.fileName || 'PDF Uploaded'}
                                </span>
                              ) : (
                                <span className="text-slate-400">Summary only</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => void saveMaterialDoc({ ...m, published: !m.published })}
                                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                  m.published
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-[#16294b] dark:text-[#9fb0c8]'
                                }`}
                              >
                                {m.published ? t.common.published : t.common.draft}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <ActionButtons
                                onEdit={() => {
                                  setPdfUploadError(null);
                                  setMaterialModal({ mode: 'edit', item: { ...m } });
                                }}
                                onDelete={() =>
                                  setDeleteTarget({ kind: 'materials', id: m.id, label: m.title })
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <PaginationBar page={safePage} totalPages={totalPages} totalCount={totalCount} onPageChange={setPage} />
              </div>
            );
          })()}

          {/* 6. COURSES */}
          {section === 'courses' && (() => {
            const { slice, totalPages, safePage, totalCount } = paginate(courseFiltered);
            return (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <SearchBar value={searchTerm} onChange={(v) => { setSearchTerm(v); setPage(1); }} />
                  <button
                    type="button"
                    onClick={() =>
                      setCourseModal({
                        mode: 'add',
                        item: {
                          id: `crs_${Date.now()}`,
                          title: '',
                          description: '',
                          lessons: ['01. Introduction'],
                          published: true,
                        },
                        lessonsText: '01. Introduction',
                      })
                    }
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#102544] px-4 text-sm font-bold text-white hover:bg-[#1b3a6b] dark:bg-[#facc15] dark:text-[#102544]"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Course</span>
                  </button>
                </div>

                {slice.length === 0 ? (
                  <EmptyState onReset={() => setSearchTerm('')} />
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-[#24385c] dark:bg-[#122443]">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500 dark:border-[#24385c] dark:bg-[#16294b] dark:text-[#9fb0c8]">
                        <tr>
                          <th className="px-4 py-3">Course Title</th>
                          <th className="px-4 py-3">Lessons</th>
                          <th className="px-4 py-3">{t.common.status}</th>
                          <th className="px-4 py-3 text-right">{t.common.actions}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-[#24385c]">
                        {slice.map((c) => (
                          <tr key={c.id}>
                            <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                              {c.title}
                            </td>
                            <td className="px-4 py-3 font-mono-num text-slate-600 dark:text-[#9fb0c8]">
                              {c.lessons.length}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => void saveCourseDoc({ ...c, published: !c.published })}
                                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                  c.published
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-[#16294b] dark:text-[#9fb0c8]'
                                }`}
                              >
                                {c.published ? t.common.published : t.common.draft}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <ActionButtons
                                onEdit={() =>
                                  setCourseModal({
                                    mode: 'edit',
                                    item: { ...c },
                                    lessonsText: c.lessons.join('\n'),
                                  })
                                }
                                onDelete={() =>
                                  setDeleteTarget({ kind: 'courses', id: c.id, label: c.title })
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <PaginationBar page={safePage} totalPages={totalPages} totalCount={totalCount} onPageChange={setPage} />
              </div>
            );
          })()}

          {/* 7. CURRENT AFFAIRS */}
          {section === 'affairs' && (() => {
            const { slice, totalPages, safePage, totalCount } = paginate(affairFiltered);
            return (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <SearchBar value={searchTerm} onChange={(v) => { setSearchTerm(v); setPage(1); }} />
                  <button
                    type="button"
                    onClick={() =>
                      setAffairModal({
                        mode: 'add',
                        item: {
                          id: `ca_${Date.now()}`,
                          title: '',
                          category: 'Economy',
                          period: 'Daily',
                          date: new Date().toISOString().slice(0, 10),
                          summary: '',
                          published: true,
                        },
                      })
                    }
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#102544] px-4 text-sm font-bold text-white hover:bg-[#1b3a6b] dark:bg-[#facc15] dark:text-[#102544]"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{t.common.add}</span>
                  </button>
                </div>

                {slice.length === 0 ? (
                  <EmptyState onReset={() => setSearchTerm('')} />
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-[#24385c] dark:bg-[#122443]">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500 dark:border-[#24385c] dark:bg-[#16294b] dark:text-[#9fb0c8]">
                        <tr>
                          <th className="px-4 py-3">Headline</th>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3">Period</th>
                          <th className="px-4 py-3">{t.common.status}</th>
                          <th className="px-4 py-3 text-right">{t.common.actions}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-[#24385c]">
                        {slice.map((a) => (
                          <tr key={a.id}>
                            <td className="max-w-md px-4 py-3 font-medium text-slate-900 dark:text-white">
                              {a.title}
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-[#9fb0c8]">{a.category}</td>
                            <td className="px-4 py-3 text-slate-600 dark:text-[#9fb0c8]">{a.period}</td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => void saveAffairDoc({ ...a, published: !a.published })}
                                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                  a.published
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-[#16294b] dark:text-[#9fb0c8]'
                                }`}
                              >
                                {a.published ? t.common.published : t.common.draft}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <ActionButtons
                                onEdit={() => setAffairModal({ mode: 'edit', item: { ...a } })}
                                onDelete={() =>
                                  setDeleteTarget({ kind: 'affairs', id: a.id, label: a.title })
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <PaginationBar page={safePage} totalPages={totalPages} totalCount={totalCount} onPageChange={setPage} />
              </div>
            );
          })()}

          {/* 8. JOB UPDATES */}
          {section === 'jobs' && (() => {
            const { slice, totalPages, safePage, totalCount } = paginate(jobFiltered);
            return (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <SearchBar value={searchTerm} onChange={(v) => { setSearchTerm(v); setPage(1); }} />
                  <button
                    type="button"
                    onClick={() =>
                      setJobModal({
                        mode: 'add',
                        item: {
                          id: `job_${Date.now()}`,
                          tab: 'Vacancies',
                          title: '',
                          organization: '',
                          publishedDate: new Date().toISOString().slice(0, 10),
                          startDate: new Date().toISOString().slice(0, 10),
                          deadline: '2026-12-30',
                          eligibility: '',
                          officialLink: '',
                          published: true,
                        },
                      })
                    }
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#102544] px-4 text-sm font-bold text-white hover:bg-[#1b3a6b] dark:bg-[#facc15] dark:text-[#102544]"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{t.common.add}</span>
                  </button>
                </div>

                {slice.length === 0 ? (
                  <EmptyState onReset={() => setSearchTerm('')} />
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-[#24385c] dark:bg-[#122443]">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500 dark:border-[#24385c] dark:bg-[#16294b] dark:text-[#9fb0c8]">
                        <tr>
                          <th className="px-4 py-3">Title</th>
                          <th className="px-4 py-3">Tab</th>
                          <th className="px-4 py-3">Deadline</th>
                          <th className="px-4 py-3">{t.common.status}</th>
                          <th className="px-4 py-3 text-right">{t.common.actions}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-[#24385c]">
                        {slice.map((j) => (
                          <tr key={j.id}>
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{j.title}</td>
                            <td className="px-4 py-3 text-slate-600 dark:text-[#9fb0c8]">{j.tab}</td>
                            <td className="px-4 py-3 font-mono-num text-slate-600 dark:text-[#9fb0c8]">{j.deadline}</td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => void saveJobDoc({ ...j, published: !j.published })}
                                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                  j.published
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-[#16294b] dark:text-[#9fb0c8]'
                                }`}
                              >
                                {j.published ? t.common.published : t.common.draft}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <ActionButtons
                                onEdit={() => setJobModal({ mode: 'edit', item: { ...j } })}
                                onDelete={() => setDeleteTarget({ kind: 'jobs', id: j.id, label: j.title })}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <PaginationBar page={safePage} totalPages={totalPages} totalCount={totalCount} onPageChange={setPage} />
              </div>
            );
          })()}

          {/* 9. TYPING PASSAGES */}
          {section === 'typing' && (() => {
            const { slice, totalPages, safePage, totalCount } = paginate(typingFiltered);
            return (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <SearchBar value={searchTerm} onChange={(v) => { setSearchTerm(v); setPage(1); }} />
                  <button
                    type="button"
                    onClick={() =>
                      setTypingModal({
                        mode: 'add',
                        item: {
                          id: `tp_${Date.now()}`,
                          title: '',
                          lang: 'en',
                          langLabel: 'English',
                          text: '',
                          published: true,
                        },
                      })
                    }
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#102544] px-4 text-sm font-bold text-white hover:bg-[#1b3a6b] dark:bg-[#facc15] dark:text-[#102544]"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Passage</span>
                  </button>
                </div>

                {slice.length === 0 ? (
                  <EmptyState onReset={() => setSearchTerm('')} />
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-[#24385c] dark:bg-[#122443]">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500 dark:border-[#24385c] dark:bg-[#16294b] dark:text-[#9fb0c8]">
                        <tr>
                          <th className="px-4 py-3">Title</th>
                          <th className="px-4 py-3">Language</th>
                          <th className="px-4 py-3">{t.common.status}</th>
                          <th className="px-4 py-3 text-right">{t.common.actions}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-[#24385c]">
                        {slice.map((tp) => (
                          <tr key={tp.id}>
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{tp.title}</td>
                            <td className="px-4 py-3 text-slate-600 dark:text-[#9fb0c8]">{tp.langLabel}</td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => void saveTypingPassageDoc({ ...tp, published: !tp.published })}
                                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                  tp.published
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-[#16294b] dark:text-[#9fb0c8]'
                                }`}
                              >
                                {tp.published ? t.common.published : t.common.draft}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <ActionButtons
                                onEdit={() => setTypingModal({ mode: 'edit', item: { ...tp } })}
                                onDelete={() => setDeleteTarget({ kind: 'typing', id: tp.id, label: tp.title })}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <PaginationBar page={safePage} totalPages={totalPages} totalCount={totalCount} onPageChange={setPage} />
              </div>
            );
          })()}

          {/* 10. NOTIFICATIONS */}
          {section === 'notify' && (() => {
            const { slice, totalPages, safePage, totalCount } = paginate(notifFiltered);
            return (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <SearchBar value={searchTerm} onChange={(v) => { setSearchTerm(v); setPage(1); }} />
                  <button
                    type="button"
                    onClick={() =>
                      setNotifModal({
                        mode: 'add',
                        item: {
                          id: Date.now(),
                          docId: `nt_${Date.now()}`,
                          type: 'Announcement',
                          title: '',
                          message: '',
                          audience: 'All students',
                          date: new Date().toISOString().slice(0, 10),
                          published: true,
                        },
                      })
                    }
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#102544] px-4 text-sm font-bold text-white hover:bg-[#1b3a6b] dark:bg-[#facc15] dark:text-[#102544]"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Send Notification</span>
                  </button>
                </div>

                {slice.length === 0 ? (
                  <EmptyState onReset={() => setSearchTerm('')} />
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-[#24385c] dark:bg-[#122443]">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500 dark:border-[#24385c] dark:bg-[#16294b] dark:text-[#9fb0c8]">
                        <tr>
                          <th className="px-4 py-3">Title</th>
                          <th className="px-4 py-3">Audience</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">{t.common.status}</th>
                          <th className="px-4 py-3 text-right">{t.common.actions}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-[#24385c]">
                        {slice.map((n) => {
                          const docId = n.docId || `nt_${n.id}`;
                          return (
                            <tr key={docId}>
                              <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{n.title}</td>
                              <td className="px-4 py-3 text-slate-600 dark:text-[#9fb0c8]">{n.audience}</td>
                              <td className="px-4 py-3 text-slate-600 dark:text-[#9fb0c8]">{n.type}</td>
                              <td className="px-4 py-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    void saveNotificationDoc({ ...n, published: !(n.published ?? true) })
                                  }
                                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                    n.published !== false
                                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                      : 'bg-slate-100 text-slate-600 dark:bg-[#16294b] dark:text-[#9fb0c8]'
                                  }`}
                                >
                                  {n.published !== false ? t.common.published : t.common.draft}
                                </button>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <ActionButtons
                                  onEdit={() => setNotifModal({ mode: 'edit', item: { ...n } })}
                                  onDelete={() =>
                                    setDeleteTarget({ kind: 'notify', id: docId, label: n.title })
                                  }
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <PaginationBar page={safePage} totalPages={totalPages} totalCount={totalCount} onPageChange={setPage} />
              </div>
            );
          })()}

          {/* 11. BANNERS MANAGER */}
          {section === 'banners' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="space-y-3 lg:col-span-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                    {t.admin.sections.banners} ({state.banners.length})
                  </h2>
                  <button
                    type="button"
                    onClick={() => void addNewBanner()}
                    className="inline-flex items-center gap-1 rounded-xl bg-[#102544] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1b3a6b] dark:bg-[#facc15] dark:text-[#102544]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{t.admin.bannerAdd}</span>
                  </button>
                </div>

                {state.banners.map((b) => (
                  <div
                    key={b.id}
                    className={`flex items-center justify-between rounded-xl border p-3.5 transition-colors ${
                      currentBanner?.id === b.id
                        ? 'border-[#102544] bg-[#eef2f8]/60 dark:border-[#facc15] dark:bg-[#16294b]'
                        : 'border-slate-200 bg-white dark:border-[#24385c] dark:bg-[#122443]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBannerId(b.id);
                        setDraftBanner({ ...b });
                      }}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {b.title}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-[#9fb0c8]">
                        {b.visible ? t.common.published : t.common.hide}
                      </div>
                    </button>
                    {state.banners.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({ kind: 'banners', id: b.id, label: b.title })
                        }
                        className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400"
                        aria-label={t.common.delete}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {currentBanner && (
                <div className="space-y-5 lg:col-span-7">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-[#24385c] dark:bg-[#122443]">
                    <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9fb0c8]">
                      {t.admin.bannerPreview}
                    </div>
                    <div
                      className={`rounded-xl p-6 text-white ${
                        currentBanner.align === 'center'
                          ? 'text-center'
                          : currentBanner.align === 'right'
                            ? 'text-right'
                            : 'text-left'
                      }`}
                      style={{ backgroundColor: currentBanner.bgColor }}
                    >
                      <h3 className="font-display text-xl font-extrabold">{currentBanner.title}</h3>
                      <p className="mt-1 text-sm text-slate-200">{currentBanner.subtitle}</p>
                      <span className="mt-4 inline-block rounded-lg bg-[#facc15] px-4 py-2 text-xs font-bold text-[#102544]">
                        {currentBanner.buttonText}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-[#24385c] dark:bg-[#122443]">
                    <div>
                      <label className="mb-1 block text-xs font-semibold">Title</label>
                      <input
                        type="text"
                        value={currentBanner.title}
                        onChange={(e) => updateDraftBanner('title', e.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold">Subtitle</label>
                      <input
                        type="text"
                        value={currentBanner.subtitle}
                        onChange={(e) => updateDraftBanner('subtitle', e.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-xs font-semibold">Button text</label>
                        <input
                          type="text"
                          value={currentBanner.buttonText}
                          onChange={(e) => updateDraftBanner('buttonText', e.target.value)}
                          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold">Background</label>
                        <input
                          type="color"
                          value={currentBanner.bgColor}
                          onChange={(e) => updateDraftBanner('bgColor', e.target.value)}
                          className="h-10 w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-1 dark:border-[#24385c] dark:bg-[#16294b]"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold">Alignment</label>
                        <select
                          value={currentBanner.align}
                          onChange={(e) =>
                            updateDraftBanner('align', e.target.value as 'left' | 'center' | 'right')
                          }
                          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <input
                          type="checkbox"
                          checked={currentBanner.visible}
                          onChange={(e) => updateDraftBanner('visible', e.target.checked)}
                          className="h-4 w-4 accent-[#102544]"
                        />
                        <span>{t.admin.bannerVisible}</span>
                      </label>
                      <button
                        type="button"
                        disabled={savingBusy}
                        onClick={() => void saveCurrentBanner()}
                        className="rounded-xl bg-[#102544] px-5 py-2 text-sm font-bold text-white hover:bg-[#1b3a6b] disabled:opacity-60 dark:bg-[#facc15] dark:text-[#102544]"
                      >
                        {savingBusy ? 'Saving…' : 'Save Banner'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 12. HOMEPAGE BUILDER */}
          {section === 'hb' && (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600 dark:text-[#9fb0c8]">{t.admin.hbSub}</p>
                <button
                  type="button"
                  onClick={async () => {
                    await saveHomepageSectionsOrder(state.homepageSections);
                    showToast('Homepage layout published to Firebase!');
                  }}
                  className="rounded-xl bg-[#102544] px-4 py-2 text-sm font-bold text-white hover:bg-[#1b3a6b] dark:bg-[#facc15] dark:text-[#102544]"
                >
                  Save & Publish Layout
                </button>
              </div>

              <div className="space-y-3">
                {state.homepageSections.map((sec, idx) => (
                  <div
                    key={sec.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-[#24385c] dark:bg-[#122443]"
                  >
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="text-xs font-semibold text-slate-500 dark:text-[#9fb0c8]">
                        {sec.name}
                      </div>
                      <input
                        type="text"
                        defaultValue={sec.heading}
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (!val || val === sec.heading) return;
                          const next = state.homepageSections.map((item) =>
                            item.id === sec.id ? { ...item, heading: val } : item
                          );
                          void saveHomepageSectionsOrder(next);
                        }}
                        className="h-9 w-full max-w-md rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void moveHomepageSection(idx, -1)}
                        disabled={idx === 0}
                        aria-label="Move up"
                        className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:opacity-40 dark:border-[#24385c] dark:text-slate-200"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void moveHomepageSection(idx, 1)}
                        disabled={idx === state.homepageSections.length - 1}
                        aria-label="Move down"
                        className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:opacity-40 dark:border-[#24385c] dark:text-slate-200"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const next = state.homepageSections.map((item) =>
                            item.id === sec.id ? { ...item, visible: !item.visible } : item
                          );
                          void saveHomepageSectionsOrder(next);
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                          sec.visible
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-[#16294b] dark:text-[#9fb0c8]'
                        }`}
                      >
                        {sec.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        <span>{sec.visible ? t.common.show : t.common.hide}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={(e) => void addHomepageSection(e)} className="flex max-w-md gap-2">
                <input
                  type="text"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  placeholder={t.admin.newSectionPlaceholder}
                  className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-[#24385c] dark:bg-[#122443] dark:text-white"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#102544] px-4 text-sm font-bold text-white hover:bg-[#1b3a6b] dark:bg-[#facc15] dark:text-[#102544]"
                >
                  <Plus className="h-4 w-4" />
                  <span>{t.admin.addSection}</span>
                </button>
              </form>
            </div>
          )}

          {/* 13. CATALOG TABLES (EXAMS, SUBJECTS, CATEGORIES, WEBSITE SETTINGS) */}
          {(section === 'exams' ||
            section === 'subjects' ||
            section === 'categories' ||
            section === 'sitesettings') && (() => {
            const cols = CATALOG_SCHEMA[section];
            const { slice, totalPages, safePage, totalCount } = paginate(genericRows);
            return (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <SearchBar value={searchTerm} onChange={(v) => { setSearchTerm(v); setPage(1); }} />
                  <button
                    type="button"
                    onClick={() => {
                      const blank: GenericRow = { id: `${section}_${Date.now()}`, pub: true };
                      cols.forEach((c) => {
                        blank[c.key] = '';
                      });
                      setCatalogModal({ mode: 'add', kind: section, row: blank });
                    }}
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#102544] px-4 text-sm font-bold text-white hover:bg-[#1b3a6b] dark:bg-[#facc15] dark:text-[#102544]"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{t.common.add}</span>
                  </button>
                </div>

                {slice.length === 0 ? (
                  <EmptyState onReset={() => setSearchTerm('')} />
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-[#24385c] dark:bg-[#122443]">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500 dark:border-[#24385c] dark:bg-[#16294b] dark:text-[#9fb0c8]">
                        <tr>
                          {cols.map((c) => (
                            <th key={c.key} className="px-4 py-3">{c.label}</th>
                          ))}
                          <th className="px-4 py-3">{t.common.status}</th>
                          <th className="px-4 py-3 text-right">{t.common.actions}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-[#24385c]">
                        {slice.map((row) => (
                          <tr key={row.id}>
                            {cols.map((c) => (
                              <td key={c.key} className="max-w-xs truncate px-4 py-3 text-slate-800 dark:text-slate-100">
                                {String(row[c.key] ?? '')}
                              </td>
                            ))}
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => void saveCatalogRowDoc(section, { ...row, pub: !row.pub })}
                                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                  row.pub
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-[#16294b] dark:text-[#9fb0c8]'
                                }`}
                              >
                                {row.pub ? t.common.published : t.common.draft}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <ActionButtons
                                onEdit={() => setCatalogModal({ mode: 'edit', kind: section, row: { ...row } })}
                                onDelete={() =>
                                  setDeleteTarget({
                                    kind: section,
                                    id: row.id,
                                    label: String(row[cols[0].key] || row.id),
                                  })
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <PaginationBar page={safePage} totalPages={totalPages} totalCount={totalCount} onPageChange={setPage} />
              </div>
            );
          })()}

          {/* 14. REPORTS */}
          {section === 'reports' && (() => {
            const { slice, totalPages, safePage, totalCount } = paginate(genericRows);
            return (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <SearchBar value={searchTerm} onChange={(v) => { setSearchTerm(v); setPage(1); }} />
                  <button
                    type="button"
                    onClick={() =>
                      setReportModal({
                        mode: 'add',
                        row: { id: `rp_${Date.now()}`, name: '', period: 'Nov 2026', status: 'Ready', pub: true },
                      })
                    }
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#102544] px-4 text-sm font-bold text-white hover:bg-[#1b3a6b] dark:bg-[#facc15] dark:text-[#102544]"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Report</span>
                  </button>
                </div>

                {slice.length === 0 ? (
                  <EmptyState onReset={() => setSearchTerm('')} />
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-[#24385c] dark:bg-[#122443]">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500 dark:border-[#24385c] dark:bg-[#16294b] dark:text-[#9fb0c8]">
                        <tr>
                          <th className="px-4 py-3">Report Name</th>
                          <th className="px-4 py-3">Period</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">{t.common.actions}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-[#24385c]">
                        {slice.map((row) => (
                          <tr key={row.id}>
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{String(row.name || '')}</td>
                            <td className="px-4 py-3 text-slate-600 dark:text-[#9fb0c8]">{String(row.period || '')}</td>
                            <td className="px-4 py-3 text-slate-600 dark:text-[#9fb0c8]">{String(row.status || '')}</td>
                            <td className="px-4 py-3 text-right">
                              <ActionButtons
                                onEdit={() => setReportModal({ mode: 'edit', row: { ...row } })}
                                onDelete={() =>
                                  setDeleteTarget({ kind: 'reports', id: row.id, label: String(row.name || row.id) })
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <PaginationBar page={safePage} totalPages={totalPages} totalCount={totalCount} onPageChange={setPage} />
              </div>
            );
          })()}

          {/* 15. ACTIVITY LOGS */}
          {section === 'logs' && (() => {
            const { slice, totalPages, safePage, totalCount } = paginate(genericRows);
            return (
              <div className="space-y-4">
                <SearchBar value={searchTerm} onChange={(v) => { setSearchTerm(v); setPage(1); }} />
                {slice.length === 0 ? (
                  <EmptyState
                    title="No activity logs yet"
                    subtitle="Every admin save, PDF upload, quiz edit, or deletion records an audit entry here."
                    onReset={() => setSearchTerm('')}
                  />
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-[#24385c] dark:bg-[#122443]">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500 dark:border-[#24385c] dark:bg-[#16294b] dark:text-[#9fb0c8]">
                        <tr>
                          <th className="px-4 py-3">Timestamp</th>
                          <th className="px-4 py-3">Admin</th>
                          <th className="px-4 py-3">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-[#24385c]">
                        {slice.map((row) => (
                          <tr key={row.id}>
                            <td className="px-4 py-3 font-mono-num text-xs text-slate-600 dark:text-[#9fb0c8]">
                              {String(row.time || '')}
                            </td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                              {String(row.who || '')}
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                              {String(row.act || '')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <PaginationBar page={safePage} totalPages={totalPages} totalCount={totalCount} onPageChange={setPage} />
              </div>
            );
          })()}
        </div>
      </div>

      {/* -------------------- MODALS -------------------- */}

      {/* Delete Modal */}
      {deleteTarget && (
        <ModalShell title={t.admin.deleteConfirmTitle} onClose={() => setDeleteTarget(null)}>
          <p className="text-sm text-slate-600 dark:text-[#9fb0c8]">
            This permanently removes the entry from Firebase Firestore.
          </p>
          <p className="mt-2 rounded-lg bg-slate-100 p-2.5 text-xs font-semibold text-slate-800 dark:bg-[#16294b] dark:text-slate-200">
            {deleteTarget.label}
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-[#24385c] dark:text-slate-200"
            >
              {t.common.cancel}
            </button>
            <button
              type="button"
              disabled={savingBusy}
              onClick={() => void confirmDelete()}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {savingBusy ? 'Deleting…' : t.common.delete}
            </button>
          </div>
        </ModalShell>
      )}

      {/* Question Bank Modal */}
      {qbModal && (
        <ModalShell
          title={qbModal.mode === 'add' ? t.admin.addQuestion : t.admin.editQuestion}
          onClose={() => setQbModal(null)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!qbModal.item.question.trim()) return;
              setSavingBusy(true);
              try {
                await saveQuestionDoc(qbModal.item);
                setQbModal(null);
                showToast('Question saved to Firebase!');
              } finally {
                setSavingBusy(false);
              }
            }}
            className="space-y-3"
          >
            <div>
              <label className="mb-1 block text-xs font-semibold">Subject</label>
              <select
                value={qbModal.item.subjectKey}
                onChange={(e) => {
                  const key = e.target.value as 'gk' | 'cs';
                  setQbModal({
                    ...qbModal,
                    item: {
                      ...qbModal.item,
                      subjectKey: key,
                      subjectName: key === 'gk' ? 'General Knowledge' : 'Computer Knowledge',
                    },
                  });
                }}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
              >
                <option value="gk">General Knowledge</option>
                <option value="cs">Computer Knowledge</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Question</label>
              <textarea
                rows={2}
                required
                value={qbModal.item.question}
                onChange={(e) =>
                  setQbModal({ ...qbModal, item: { ...qbModal.item, question: e.target.value } })
                }
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
              />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {qbModal.item.options.map((opt, idx) => (
                <div key={idx}>
                  <label className="mb-0.5 block text-[11px] font-semibold">
                    Option {String.fromCharCode(65 + idx)}
                  </label>
                  <input
                    type="text"
                    required
                    value={opt}
                    onChange={(e) => {
                      const nextOpts = [...qbModal.item.options];
                      nextOpts[idx] = e.target.value;
                      setQbModal({ ...qbModal, item: { ...qbModal.item, options: nextOpts } });
                    }}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold">Correct Option</label>
                <select
                  value={qbModal.item.correctIndex}
                  onChange={(e) =>
                    setQbModal({
                      ...qbModal,
                      item: { ...qbModal.item, correctIndex: Number(e.target.value) },
                    })
                  }
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
                >
                  <option value={0}>Option A</option>
                  <option value={1}>Option B</option>
                  <option value={2}>Option C</option>
                  <option value={3}>Option D</option>
                </select>
              </div>
              <div className="flex items-end pb-1.5">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={qbModal.item.published}
                    onChange={(e) =>
                      setQbModal({
                        ...qbModal,
                        item: { ...qbModal.item, published: e.target.checked },
                      })
                    }
                    className="h-4 w-4 accent-[#102544]"
                  />
                  <span>{t.common.published}</span>
                </label>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Explanation</label>
              <input
                type="text"
                value={qbModal.item.explanation}
                onChange={(e) =>
                  setQbModal({
                    ...qbModal,
                    item: { ...qbModal.item, explanation: e.target.value },
                  })
                }
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setQbModal(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-[#24385c]"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={savingBusy}
                className="rounded-xl bg-[#102544] px-4 py-2 text-sm font-bold text-white disabled:opacity-60 dark:bg-[#facc15] dark:text-[#102544]"
              >
                {savingBusy ? 'Saving…' : t.common.save}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* Quiz / Mock Test Builder Modal */}
      {testModal && (
        <ModalShell
          title={testModal.mode === 'add' ? 'Create Quiz / Mock Test' : 'Edit Quiz / Mock Test'}
          onClose={() => setTestModal(null)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!testModal.item.name.trim()) return;
              setSavingBusy(true);
              try {
                await saveTestDoc(testModal.item);
                setTestModal(null);
                showToast('Test saved to Firebase!');
              } finally {
                setSavingBusy(false);
              }
            }}
            className="space-y-3"
          >
            <div>
              <label className="mb-1 block text-xs font-semibold">Test Title</label>
              <input
                type="text"
                required
                value={testModal.item.name}
                onChange={(e) =>
                  setTestModal({ ...testModal, item: { ...testModal.item, name: e.target.value } })
                }
                placeholder="e.g. WBCS Prelims Mock Set 2"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="mb-1 block text-xs font-semibold">Type</label>
                <select
                  value={testModal.item.type}
                  onChange={(e) =>
                    setTestModal({
                      ...testModal,
                      item: {
                        ...testModal.item,
                        type: e.target.value as TestDefinition['type'],
                      },
                    })
                  }
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs sm:text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
                >
                  <option value="Daily Quiz">Daily Quiz</option>
                  <option value="Mock Test">Mock Test</option>
                  <option value="Sectional Test">Sectional Test</option>
                  <option value="Previous-Year Paper">Previous-Year Paper</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Minutes</label>
                <input
                  type="number"
                  min={1}
                  max={360}
                  value={testModal.item.minutes}
                  onChange={(e) =>
                    setTestModal({
                      ...testModal,
                      item: { ...testModal.item, minutes: Number(e.target.value) || 5 },
                    })
                  }
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Neg. Mark</label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  step={0.25}
                  value={testModal.item.negativeMarking}
                  onChange={(e) =>
                    setTestModal({
                      ...testModal,
                      item: { ...testModal.item, negativeMarking: Number(e.target.value) || 0 },
                    })
                  }
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold">Included Subjects</label>
              <div className="flex gap-4 text-sm">
                {(['gk', 'cs'] as const).map((sk) => {
                  const checked = testModal.item.subjectKeys.includes(sk);
                  return (
                    <label key={sk} className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...testModal.item.subjectKeys, sk]
                            : testModal.item.subjectKeys.filter((x) => x !== sk);
                          setTestModal({
                            ...testModal,
                            item: {
                              ...testModal.item,
                              subjectKeys: next.length ? next : [sk],
                            },
                          });
                        }}
                        className="h-4 w-4 accent-[#102544]"
                      />
                      <span>{sk === 'gk' ? 'General Knowledge' : 'Computer Knowledge'}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold">
                Pick Specific Questions (optional — leave empty to auto-include by subject)
              </label>
              <div className="max-h-36 space-y-1.5 overflow-y-auto rounded-lg border border-slate-200 p-2.5 text-xs dark:border-[#24385c]">
                {state.questions.map((q) => {
                  const selected = (testModal.item.questionIds || []).includes(q.id);
                  return (
                    <label key={q.id} className="flex cursor-pointer items-start gap-2">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) => {
                          const prevIds = testModal.item.questionIds || [];
                          const nextIds = e.target.checked
                            ? [...prevIds, q.id]
                            : prevIds.filter((id) => id !== q.id);
                          setTestModal({
                            ...testModal,
                            item: { ...testModal.item, questionIds: nextIds },
                          });
                        }}
                        className="mt-0.5 h-3.5 w-3.5 accent-[#102544]"
                      />
                      <span className="text-slate-700 dark:text-slate-200">
                        <strong>[{q.subjectKey.toUpperCase()}]</strong> {q.question}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={testModal.item.published !== false}
                onChange={(e) =>
                  setTestModal({
                    ...testModal,
                    item: { ...testModal.item, published: e.target.checked },
                  })
                }
                className="h-4 w-4 accent-[#102544]"
              />
              <span>{t.common.published}</span>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTestModal(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-[#24385c]"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={savingBusy}
                className="rounded-xl bg-[#102544] px-4 py-2 text-sm font-bold text-white disabled:opacity-60 dark:bg-[#facc15] dark:text-[#102544]"
              >
                {savingBusy ? 'Saving…' : t.common.save}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* Study Material + PDF Upload Modal */}
      {materialModal && (
        <ModalShell
          title={materialModal.mode === 'add' ? 'Upload PDF / Add Study Material' : 'Edit Study Material'}
          onClose={() => setMaterialModal(null)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!materialModal.item.title.trim()) return;
              setSavingBusy(true);
              try {
                await saveMaterialDoc(materialModal.item);
                setMaterialModal(null);
                showToast('Study material saved to Firebase!');
              } finally {
                setSavingBusy(false);
              }
            }}
            className="space-y-3"
          >
            <div>
              <label className="mb-1 block text-xs font-semibold">Title</label>
              <input
                type="text"
                required
                value={materialModal.item.title}
                onChange={(e) =>
                  setMaterialModal({
                    ...materialModal,
                    item: { ...materialModal.item, title: e.target.value },
                  })
                }
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold">Subject</label>
                <input
                  type="text"
                  required
                  value={materialModal.item.subject}
                  onChange={(e) =>
                    setMaterialModal({
                      ...materialModal,
                      item: { ...materialModal.item, subject: e.target.value },
                    })
                  }
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Pages</label>
                <input
                  type="number"
                  min={1}
                  value={materialModal.item.pages}
                  onChange={(e) =>
                    setMaterialModal({
                      ...materialModal,
                      item: { ...materialModal.item, pages: Number(e.target.value) || 1 },
                    })
                  }
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
                />
              </div>
            </div>

            {/* Real PDF File Picker */}
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 dark:border-[#24385c] dark:bg-[#16294b]">
              <label className="mb-1 block text-xs font-semibold text-slate-800 dark:text-slate-100">
                Upload PDF File (.pdf)
              </label>
              <input
                type="file"
                accept="application/pdf,.pdf"
                disabled={pdfUploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setPdfUploadError(null);
                  setPdfUploading(true);
                  try {
                    const uploaded = await uploadMaterialPdf(materialModal.item.id, file);
                    setMaterialModal((prev) =>
                      prev
                        ? {
                            ...prev,
                            item: {
                              ...prev.item,
                              fileName: uploaded.fileName,
                              fileSizeBytes: uploaded.fileSizeBytes,
                              pdfUrl: uploaded.pdfUrl,
                              pdfDataUrl: uploaded.pdfDataUrl,
                            },
                          }
                        : null
                    );
                    showToast(`PDF "${uploaded.fileName}" attached!`);
                  } catch (err) {
                    setPdfUploadError(
                      err instanceof Error ? err.message : 'PDF upload failed.'
                    );
                  } finally {
                    setPdfUploading(false);
                  }
                }}
                className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#102544] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white dark:text-[#9fb0c8] dark:file:bg-[#facc15] dark:file:text-[#102544]"
              />
              {pdfUploading && (
                <p className="mt-1.5 text-xs font-medium text-[#102544] dark:text-[#facc15]">
                  Uploading PDF to Firebase…
                </p>
              )}
              {pdfUploadError && (
                <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                  {pdfUploadError}
                </p>
              )}
              {(materialModal.item.pdfUrl || materialModal.item.pdfDataUrl) && !pdfUploading && (
                <div className="mt-2 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400">
                  <span>
                    Attached: <strong>{materialModal.item.fileName || 'Document.pdf'}</strong>
                    {materialModal.item.fileSizeBytes
                      ? ` (${Math.round(materialModal.item.fileSizeBytes / 1024)} KB)`
                      : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setMaterialModal({
                        ...materialModal,
                        item: {
                          ...materialModal.item,
                          fileName: undefined,
                          fileSizeBytes: undefined,
                          pdfUrl: undefined,
                          pdfDataUrl: undefined,
                        },
                      })
                    }
                    className="font-semibold text-red-600 hover:underline dark:text-red-400"
                  >
                    Remove PDF
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold">
                Or External PDF Link (optional)
              </label>
              <input
                type="url"
                value={materialModal.item.pdfUrl || ''}
                onChange={(e) =>
                  setMaterialModal({
                    ...materialModal,
                    item: { ...materialModal.item, pdfUrl: e.target.value || undefined },
                  })
                }
                placeholder="https://..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold">Summary</label>
              <textarea
                rows={2}
                value={materialModal.item.summary}
                onChange={(e) =>
                  setMaterialModal({
                    ...materialModal,
                    item: { ...materialModal.item, summary: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMaterialModal(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-[#24385c]"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={savingBusy || pdfUploading}
                className="rounded-xl bg-[#102544] px-4 py-2 text-sm font-bold text-white disabled:opacity-60 dark:bg-[#facc15] dark:text-[#102544]"
              >
                {savingBusy ? 'Saving…' : t.common.save}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* Course Modal */}
      {courseModal && (
        <ModalShell
          title={courseModal.mode === 'add' ? 'Add Course' : 'Edit Course'}
          onClose={() => setCourseModal(null)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!courseModal.item.title.trim()) return;
              const lessons = courseModal.lessonsText
                .split('\n')
                .map((l) => l.trim())
                .filter(Boolean);
              setSavingBusy(true);
              try {
                await saveCourseDoc({ ...courseModal.item, lessons });
                setCourseModal(null);
                showToast('Course saved to Firebase!');
              } finally {
                setSavingBusy(false);
              }
            }}
            className="space-y-3"
          >
            <div>
              <label className="mb-1 block text-xs font-semibold">Course Title</label>
              <input
                type="text"
                required
                value={courseModal.item.title}
                onChange={(e) =>
                  setCourseModal({
                    ...courseModal,
                    item: { ...courseModal.item, title: e.target.value },
                  })
                }
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Description</label>
              <textarea
                rows={2}
                value={courseModal.item.description}
                onChange={(e) =>
                  setCourseModal({
                    ...courseModal,
                    item: { ...courseModal.item, description: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">
                Lessons (one per line)
              </label>
              <textarea
                rows={4}
                value={courseModal.lessonsText}
                onChange={(e) =>
                  setCourseModal({ ...courseModal, lessonsText: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCourseModal(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-[#24385c]"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={savingBusy}
                className="rounded-xl bg-[#102544] px-4 py-2 text-sm font-bold text-white disabled:opacity-60 dark:bg-[#facc15] dark:text-[#102544]"
              >
                {savingBusy ? 'Saving…' : t.common.save}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* Current Affairs Modal */}
      {affairModal && (
        <ModalShell
          title={affairModal.mode === 'add' ? t.common.add : t.common.edit}
          onClose={() => setAffairModal(null)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!affairModal.item.title.trim()) return;
              setSavingBusy(true);
              try {
                await saveAffairDoc(affairModal.item);
                setAffairModal(null);
                showToast('Current affair saved to Firebase!');
              } finally {
                setSavingBusy(false);
              }
            }}
            className="space-y-3"
          >
            <div>
              <label className="mb-1 block text-xs font-semibold">Headline</label>
              <input
                type="text"
                required
                value={affairModal.item.title}
                onChange={(e) =>
                  setAffairModal({
                    ...affairModal,
                    item: { ...affairModal.item, title: e.target.value },
                  })
                }
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="mb-1 block text-xs font-semibold">Category</label>
                <input
                  type="text"
                  value={affairModal.item.category}
                  onChange={(e) =>
                    setAffairModal({
                      ...affairModal,
                      item: { ...affairModal.item, category: e.target.value },
                    })
                  }
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Period</label>
                <select
                  value={affairModal.item.period}
                  onChange={(e) =>
                    setAffairModal({
                      ...affairModal,
                      item: {
                        ...affairModal.item,
                        period: e.target.value as 'Daily' | 'Weekly' | 'Monthly',
                      },
                    })
                  }
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Date</label>
                <input
                  type="text"
                  value={affairModal.item.date}
                  onChange={(e) =>
                    setAffairModal({
                      ...affairModal,
                      item: { ...affairModal.item, date: e.target.value },
                    })
                  }
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Summary</label>
              <textarea
                rows={2}
                value={affairModal.item.summary}
                onChange={(e) =>
                  setAffairModal({
                    ...affairModal,
                    item: { ...affairModal.item, summary: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAffairModal(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-[#24385c]"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={savingBusy}
                className="rounded-xl bg-[#102544] px-4 py-2 text-sm font-bold text-white disabled:opacity-60 dark:bg-[#facc15] dark:text-[#102544]"
              >
                {savingBusy ? 'Saving…' : t.common.save}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* Job Update Modal */}
      {jobModal && (
        <ModalShell
          title={jobModal.mode === 'add' ? t.common.add : t.common.edit}
          onClose={() => setJobModal(null)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!jobModal.item.title.trim()) return;
              setSavingBusy(true);
              try {
                await saveJobDoc(jobModal.item);
                setJobModal(null);
                showToast('Job update saved to Firebase!');
              } finally {
                setSavingBusy(false);
              }
            }}
            className="space-y-3"
          >
            <div>
              <label className="mb-1 block text-xs font-semibold">Title</label>
              <input
                type="text"
                required
                value={jobModal.item.title}
                onChange={(e) =>
                  setJobModal({ ...jobModal, item: { ...jobModal.item, title: e.target.value } })
                }
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold">Tab</label>
                <select
                  value={jobModal.item.tab}
                  onChange={(e) =>
                    setJobModal({
                      ...jobModal,
                      item: { ...jobModal.item, tab: e.target.value as JobUpdateItem['tab'] },
                    })
                  }
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
                >
                  <option value="Vacancies">Vacancies</option>
                  <option value="Admit Cards">Admit Cards</option>
                  <option value="Results">Results</option>
                  <option value="Answer Keys">Answer Keys</option>
                  <option value="Exam Dates">Exam Dates</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Deadline</label>
                <input
                  type="text"
                  value={jobModal.item.deadline}
                  onChange={(e) =>
                    setJobModal({
                      ...jobModal,
                      item: { ...jobModal.item, deadline: e.target.value },
                    })
                  }
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Organization</label>
              <input
                type="text"
                value={jobModal.item.organization}
                onChange={(e) =>
                  setJobModal({
                    ...jobModal,
                    item: { ...jobModal.item, organization: e.target.value },
                  })
                }
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Eligibility</label>
              <input
                type="text"
                value={jobModal.item.eligibility}
                onChange={(e) =>
                  setJobModal({
                    ...jobModal,
                    item: { ...jobModal.item, eligibility: e.target.value },
                  })
                }
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setJobModal(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-[#24385c]"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={savingBusy}
                className="rounded-xl bg-[#102544] px-4 py-2 text-sm font-bold text-white disabled:opacity-60 dark:bg-[#facc15] dark:text-[#102544]"
              >
                {savingBusy ? 'Saving…' : t.common.save}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* Typing Passage Modal */}
      {typingModal && (
        <ModalShell
          title={typingModal.mode === 'add' ? 'Add Typing Passage' : 'Edit Typing Passage'}
          onClose={() => setTypingModal(null)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!typingModal.item.title.trim() || typingModal.item.text.trim().length < 10) {
                showToast('Passage must be at least 10 characters.');
                return;
              }
              setSavingBusy(true);
              try {
                await saveTypingPassageDoc(typingModal.item);
                setTypingModal(null);
                showToast('Typing passage saved to Firebase!');
              } finally {
                setSavingBusy(false);
              }
            }}
            className="space-y-3"
          >
            <div>
              <label className="mb-1 block text-xs font-semibold">Title</label>
              <input
                type="text"
                required
                value={typingModal.item.title}
                onChange={(e) =>
                  setTypingModal({
                    ...typingModal,
                    item: { ...typingModal.item, title: e.target.value },
                  })
                }
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Language</label>
              <select
                value={typingModal.item.lang}
                onChange={(e) => {
                  const lang = e.target.value as 'en' | 'bn' | 'hi';
                  const langLabel = lang === 'en' ? 'English' : lang === 'bn' ? 'Bengali' : 'Hindi';
                  setTypingModal({
                    ...typingModal,
                    item: { ...typingModal.item, lang, langLabel },
                  });
                }}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
              >
                <option value="en">English</option>
                <option value="bn">Bengali (বাংলা)</option>
                <option value="hi">Hindi (हिन्दी)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Passage Text (min 10 chars)</label>
              <textarea
                rows={4}
                required
                value={typingModal.item.text}
                onChange={(e) =>
                  setTypingModal({
                    ...typingModal,
                    item: { ...typingModal.item, text: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTypingModal(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-[#24385c]"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={savingBusy}
                className="rounded-xl bg-[#102544] px-4 py-2 text-sm font-bold text-white disabled:opacity-60 dark:bg-[#facc15] dark:text-[#102544]"
              >
                {savingBusy ? 'Saving…' : t.common.save}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* Notification Modal */}
      {notifModal && (
        <ModalShell
          title={notifModal.mode === 'add' ? 'Send Notification' : 'Edit Notification'}
          onClose={() => setNotifModal(null)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!notifModal.item.title.trim()) return;
              setSavingBusy(true);
              try {
                await saveNotificationDoc(notifModal.item);
                setNotifModal(null);
                showToast('Notification saved to Firebase!');
              } finally {
                setSavingBusy(false);
              }
            }}
            className="space-y-3"
          >
            <div>
              <label className="mb-1 block text-xs font-semibold">Title</label>
              <input
                type="text"
                required
                value={notifModal.item.title}
                onChange={(e) =>
                  setNotifModal({
                    ...notifModal,
                    item: { ...notifModal.item, title: e.target.value },
                  })
                }
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-semibold">Type</label>
                <input
                  type="text"
                  value={notifModal.item.type}
                  onChange={(e) =>
                    setNotifModal({
                      ...notifModal,
                      item: { ...notifModal.item, type: e.target.value },
                    })
                  }
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Audience</label>
                <input
                  type="text"
                  value={notifModal.item.audience}
                  onChange={(e) =>
                    setNotifModal({
                      ...notifModal,
                      item: { ...notifModal.item, audience: e.target.value },
                    })
                  }
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Message</label>
              <textarea
                rows={3}
                value={notifModal.item.message}
                onChange={(e) =>
                  setNotifModal({
                    ...notifModal,
                    item: { ...notifModal.item, message: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNotifModal(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-[#24385c]"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={savingBusy}
                className="rounded-xl bg-[#102544] px-4 py-2 text-sm font-bold text-white disabled:opacity-60 dark:bg-[#facc15] dark:text-[#102544]"
              >
                {savingBusy ? 'Saving…' : t.common.save}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* Catalog Modal (Exams, Subjects, Categories, Site Settings) */}
      {catalogModal && (
        <ModalShell
          title={catalogModal.mode === 'add' ? t.common.add : t.common.edit}
          onClose={() => setCatalogModal(null)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setSavingBusy(true);
              try {
                await saveCatalogRowDoc(catalogModal.kind, catalogModal.row);
                setCatalogModal(null);
                showToast('Saved to Firebase!');
              } finally {
                setSavingBusy(false);
              }
            }}
            className="space-y-3"
          >
            {CATALOG_SCHEMA[catalogModal.kind].map((col) => (
              <div key={col.key}>
                <label className="mb-1 block text-xs font-semibold">{col.label}</label>
                <input
                  type="text"
                  required={Boolean(col.required)}
                  value={String(catalogModal.row[col.key] ?? '')}
                  onChange={(e) =>
                    setCatalogModal({
                      ...catalogModal,
                      row: { ...catalogModal.row, [col.key]: e.target.value },
                    })
                  }
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
                />
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCatalogModal(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-[#24385c]"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={savingBusy}
                className="rounded-xl bg-[#102544] px-4 py-2 text-sm font-bold text-white disabled:opacity-60 dark:bg-[#facc15] dark:text-[#102544]"
              >
                {savingBusy ? 'Saving…' : t.common.save}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* Report Modal */}
      {reportModal && (
        <ModalShell
          title={reportModal.mode === 'add' ? 'Add Report' : 'Edit Report'}
          onClose={() => setReportModal(null)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setSavingBusy(true);
              try {
                await saveReportDoc(reportModal.row);
                setReportModal(null);
                showToast('Report saved to Firebase!');
              } finally {
                setSavingBusy(false);
              }
            }}
            className="space-y-3"
          >
            <div>
              <label className="mb-1 block text-xs font-semibold">Report Name</label>
              <input
                type="text"
                required
                value={String(reportModal.row.name ?? '')}
                onChange={(e) =>
                  setReportModal({
                    ...reportModal,
                    row: { ...reportModal.row, name: e.target.value },
                  })
                }
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-semibold">Period</label>
                <input
                  type="text"
                  value={String(reportModal.row.period ?? '')}
                  onChange={(e) =>
                    setReportModal({
                      ...reportModal,
                      row: { ...reportModal.row, period: e.target.value },
                    })
                  }
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Status</label>
                <input
                  type="text"
                  value={String(reportModal.row.status ?? '')}
                  onChange={(e) =>
                    setReportModal({
                      ...reportModal,
                      row: { ...reportModal.row, status: e.target.value },
                    })
                  }
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReportModal(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-[#24385c]"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={savingBusy}
                className="rounded-xl bg-[#102544] px-4 py-2 text-sm font-bold text-white disabled:opacity-60 dark:bg-[#facc15] dark:text-[#102544]"
              >
                {savingBusy ? 'Saving…' : t.common.save}
              </button>
            </div>
          </form>
        </ModalShell>
      )}
    </div>
  );
};

const SearchBar: React.FC<{ value: string; onChange: (val: string) => void }> = ({
  value,
  onChange,
}) => {
  const { t } = useApp();
  return (
    <div className="relative w-full sm:w-80">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t.common.search}
        className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm dark:border-[#24385c] dark:bg-[#122443] dark:text-white"
      />
    </div>
  );
};

const ActionButtons: React.FC<{ onEdit: () => void; onDelete: () => void }> = ({
  onEdit,
  onDelete,
}) => {
  const { t } = useApp();
  return (
    <div className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={onEdit}
        className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#16294b]"
        aria-label={t.common.edit}
      >
        <Edit3 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
        aria-label={t.common.delete}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
};

const PaginationBar: React.FC<{
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (next: number) => void;
}> = ({ page, totalPages, totalCount, onPageChange }) => {
  const { t } = useApp();
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-[#9fb0c8]">
      <span>{t.common.entriesCount.replace('{count}', String(totalCount))}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold disabled:opacity-40 dark:border-[#24385c] dark:bg-[#122443]"
        >
          {t.common.previous}
        </button>
        <span className="font-mono-num">
          {t.common.pageOf
            .replace('{page}', String(page))
            .replace('{total}', String(totalPages))}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold disabled:opacity-40 dark:border-[#24385c] dark:bg-[#122443]"
        >
          {t.common.next}
        </button>
      </div>
    </div>
  );
};

const ModalShell: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="fixed inset-0 bg-slate-950/60" onClick={onClose} aria-hidden="true" />
    <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-[#24385c] dark:bg-[#122443]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#16294b]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      {children}
    </div>
  </div>
);
