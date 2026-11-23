import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  type User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile as updateFirebaseAuthProfile,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { TRANSLATIONS, type LanguageCode, type TranslationSchema } from '../i18n';
import {
  DEFAULT_PDF_BRANDING,
  DEFAULT_SITE_COMMUNITY,
  INITIAL_AFFAIRS,
  INITIAL_BANNERS,
  INITIAL_COURSES,
  INITIAL_HOMEPAGE_SECTIONS,
  INITIAL_JOBS,
  INITIAL_MATERIALS,
  INITIAL_NOTIFICATIONS,
  INITIAL_QUESTIONS,
  INITIAL_TESTS,
  INITIAL_TYPING_PASSAGES,
  type BannerItem,
  type CourseItem,
  type CurrentAffairItem,
  type HomepageSectionItem,
  type JobUpdateItem,
  type NotificationItem,
  type PdfBrandingConfig,
  type QuestionItem,
  type QuestionLanguage,
  type SiteCommunityConfig,
  type StudyMaterialItem,
  type TestDefinition,
  type TypingPassageItem,
} from '../data/demoData';
import {
  OperationType,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  isFirebaseConfigured,
} from '../firebase';

export type UserRole = 'student' | 'admin' | 'super_admin';

export interface TypingAttempt {
  id: string;
  language: string;
  wpm: number;
  cpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  date: string;
}

export interface TestAttempt {
  id: string;
  testId: string;
  testName: string;
  score: number;
  total: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  accuracy: number;
  timeUsedSec: number;
  date: string;
}

export interface PlannerTask {
  id: string;
  text: string;
  done: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  exam: string;
  language: string;
}

export interface GenericRow {
  id: string;
  pub: boolean;
  updatedAt?: string;
  updatedAtMs?: number;
  [key: string]: string | number | boolean | undefined;
}

export type AdminActionHint = 'create' | 'update' | 'publish' | 'unpublish';

export interface DashboardCollectionStat {
  key: string;
  label: string;
  total: number;
  published: number;
  draft: number;
}

export interface DashboardCountsData {
  studentsTotal: number;
  studentsActive: number;
  studentsSuspended: number;
  testsTotal: number;
  testsPublished: number;
  questionsTotal: number;
  questionsPublished: number;
  materialsTotal: number;
  materialsPublished: number;
  bannersTotal: number;
  bannersPublished: number;
  coursesTotal: number;
  coursesPublished: number;
  affairsTotal: number;
  affairsPublished: number;
  jobsTotal: number;
  jobsPublished: number;
  typingTotal: number;
  typingPublished: number;
  notificationsTotal: number;
  notificationsPublished: number;
  logsTotal?: number;
  chartData: DashboardCollectionStat[];
}

export interface PersistedState {
  theme: 'light' | 'dark';
  language: LanguageCode;
  savedMaterials: string[];
  completedLessons: string[];
  syllabusChecked: string[];
  typingHistory: TypingAttempt[];
  testHistory: TestAttempt[];
  planner: {
    exam: string;
    date: string;
    tasks: PlannerTask[];
    subjectProgress: Record<string, number>;
  };
  notifications: {
    readIds: number[];
    clearedIds: number[];
  };
  profile: UserProfile;
  questions: QuestionItem[];
  tests: TestDefinition[];
  banners: BannerItem[];
  homepageSections: HomepageSectionItem[];
  materials: StudyMaterialItem[];
  courses: CourseItem[];
  affairs: CurrentAffairItem[];
  jobs: JobUpdateItem[];
  notificationsList: NotificationItem[];
  typingPassages: TypingPassageItem[];
  pdfBranding: PdfBrandingConfig;
  communityConfig: SiteCommunityConfig;
  adminTables: Record<string, GenericRow[]>;
}

const DEFAULT_ADMIN_TABLES: Record<string, GenericRow[]> = {
  students: [],
  exams: [
    { id: 'ex1', name: 'SSC CGL', cat: 'All India', pub: true },
    { id: 'ex2', name: 'RRB NTPC', cat: 'All India', pub: true },
    { id: 'ex3', name: 'WBCS', cat: 'State & WB', pub: true },
    { id: 'ex4', name: 'WBP Constable', cat: 'State & WB', pub: true },
    { id: 'ex5', name: 'IBPS Clerk', cat: 'All India', pub: true },
  ],
  subjects: [
    { id: 'sb1', name: 'General Knowledge', desc: 'Static and current GK', pub: true },
    { id: 'sb2', name: 'Computer Knowledge', desc: 'Computer basics and MS Office', pub: true },
    { id: 'sb3', name: 'Reasoning', desc: 'Logical and analytical reasoning', pub: true },
    { id: 'sb4', name: 'Mathematics', desc: 'Arithmetic and quantitative aptitude', pub: true },
    { id: 'sb5', name: 'English', desc: 'Grammar and vocabulary', pub: true },
  ],
  categories: [
    { id: 'ct1', name: 'SSC', desc: 'Staff Selection Commission exams', pub: true },
    { id: 'ct2', name: 'Railway', desc: 'Railway recruitment exams', pub: true },
    { id: 'ct3', name: 'Banking', desc: 'Bank recruitment exams', pub: true },
    { id: 'ct4', name: 'Police', desc: 'Police recruitment exams', pub: true },
    { id: 'ct5', name: 'West Bengal Govt Exams', desc: 'State government exams', pub: true },
  ],
  reports: [
    { id: 'rp1', name: 'Weekly activity', period: 'Nov 2026', status: 'Ready', pub: true },
    { id: 'rp2', name: 'Quiz performance', period: 'Oct 2026', status: 'Ready', pub: true },
  ],
  sitesettings: [
    { id: 'ss1', key: 'Site name', val: 'LEARN WITH TG', pub: true },
    { id: 'ss2', key: 'Tagline', val: 'Learn Smart, Grow Every Day.', pub: true },
    { id: 'ss3', key: 'Contact email', val: 'contact@learnwithtg.example', pub: true },
    { id: 'ss4', key: 'Access policy', val: '100% Free — No paid tiers', pub: true },
  ],
  logs: [],
};

const STORAGE_KEY = 'learn_with_tg_v2';

const getInitialState = (): PersistedState => {
  const prefersDark =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;

  const base: PersistedState = {
    theme: prefersDark ? 'dark' : 'light',
    language: 'en',
    savedMaterials: [],
    completedLessons: [],
    syllabusChecked: [],
    typingHistory: [],
    testHistory: [],
    planner: {
      exam: 'SSC',
      date: '',
      tasks: [
        { id: 't1', text: 'Revise Indian Polity Fundamental Rights notes', done: false },
        { id: 't2', text: 'Solve 20 reasoning & GK practice questions', done: false },
      ],
      subjectProgress: {
        'General Knowledge': 40,
        Mathematics: 25,
        Reasoning: 30,
        English: 50,
      },
    },
    notifications: {
      readIds: [],
      clearedIds: [],
    },
    profile: {
      name: 'Learner_4821',
      email: '',
      exam: 'SSC',
      language: 'English',
    },
    questions: INITIAL_QUESTIONS,
    tests: INITIAL_TESTS,
    banners: INITIAL_BANNERS,
    homepageSections: INITIAL_HOMEPAGE_SECTIONS.map((s, idx) => ({ ...s, order: idx })),
    materials: INITIAL_MATERIALS,
    courses: INITIAL_COURSES,
    affairs: INITIAL_AFFAIRS,
    jobs: INITIAL_JOBS,
    notificationsList: INITIAL_NOTIFICATIONS.map((n) => ({
      ...n,
      docId: `nt_${n.id}`,
      published: true,
    })),
    typingPassages: INITIAL_TYPING_PASSAGES,
    pdfBranding: DEFAULT_PDF_BRANDING,
    communityConfig: DEFAULT_SITE_COMMUNITY,
    adminTables: DEFAULT_ADMIN_TABLES,
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...base,
        ...parsed,
        planner: { ...base.planner, ...(parsed.planner || {}) },
        notifications: { ...base.notifications, ...(parsed.notifications || {}) },
        profile: { ...base.profile, ...(parsed.profile || {}) },
        pdfBranding: { ...base.pdfBranding, ...(parsed.pdfBranding || {}) },
        communityConfig: { ...base.communityConfig, ...(parsed.communityConfig || {}) },
        adminTables: { ...base.adminTables, ...(parsed.adminTables || {}) },
      };
    }
  } catch {
    // Ignore storage read errors
  }
  return base;
};

interface AppContextValue {
  state: PersistedState;
  t: TranslationSchema;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  authReady: boolean;
  firebaseUser: User | null;
  userRole: UserRole;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  registerWithEmail: (name: string, email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  toggleTheme: () => void;
  setLanguage: (lang: LanguageCode) => void;
  toggleSaveMaterial: (id: string) => void;
  toggleLesson: (lessonKey: string) => void;
  toggleSyllabusKey: (key: string) => void;
  addTypingAttempt: (attempt: TypingAttempt) => void;
  addTestAttempt: (attempt: TestAttempt) => void;
  updatePlanner: (updater: (prev: PersistedState['planner']) => PersistedState['planner']) => void;
  toggleNotifRead: (id: number) => void;
  markAllNotifsRead: () => void;
  clearAllNotifs: () => void;
  restoreNotifs: () => void;
  unreadNotificationsCount: number;
  updateProfile: (profile: UserProfile) => Promise<void>;
  // Firestore Admin CRUD actions
  saveQuestionDoc: (item: QuestionItem, actionHint?: AdminActionHint) => Promise<void>;
  saveQuestionsBatchDoc: (items: QuestionItem[]) => Promise<string[]>;
  deleteQuestionDoc: (id: string, displayLabel?: string) => Promise<void>;
  saveTestDoc: (item: TestDefinition, actionHint?: AdminActionHint) => Promise<void>;
  deleteTestDoc: (id: string, displayLabel?: string) => Promise<void>;
  saveMaterialDoc: (item: StudyMaterialItem, actionHint?: AdminActionHint) => Promise<void>;
  deleteMaterialDoc: (id: string, displayLabel?: string) => Promise<void>;
  saveCourseDoc: (item: CourseItem, actionHint?: AdminActionHint) => Promise<void>;
  deleteCourseDoc: (id: string, displayLabel?: string) => Promise<void>;
  saveAffairDoc: (item: CurrentAffairItem, actionHint?: AdminActionHint) => Promise<void>;
  deleteAffairDoc: (id: string, displayLabel?: string) => Promise<void>;
  saveJobDoc: (item: JobUpdateItem, actionHint?: AdminActionHint) => Promise<void>;
  deleteJobDoc: (id: string, displayLabel?: string) => Promise<void>;
  saveBannerDoc: (item: BannerItem, actionHint?: AdminActionHint) => Promise<void>;
  deleteBannerDoc: (id: string, displayLabel?: string) => Promise<void>;
  saveHomepageSectionDoc: (
    item: HomepageSectionItem,
    order: number,
    actionHint?: AdminActionHint
  ) => Promise<void>;
  saveHomepageSectionsOrder: (items: HomepageSectionItem[], customLog?: string) => Promise<void>;
  saveNotificationDoc: (item: NotificationItem, actionHint?: AdminActionHint) => Promise<void>;
  deleteNotificationDoc: (docId: string, displayLabel?: string) => Promise<void>;
  saveTypingPassageDoc: (item: TypingPassageItem, actionHint?: AdminActionHint) => Promise<void>;
  deleteTypingPassageDoc: (id: string, displayLabel?: string) => Promise<void>;
  saveCatalogRowDoc: (
    kind: 'exams' | 'subjects' | 'categories' | 'sitesettings',
    row: GenericRow,
    actionHint?: AdminActionHint
  ) => Promise<void>;
  deleteCatalogRowDoc: (id: string, displayLabel?: string, kindLabel?: string) => Promise<void>;
  saveReportDoc: (row: GenericRow, actionHint?: AdminActionHint) => Promise<void>;
  deleteReportDoc: (id: string, displayLabel?: string) => Promise<void>;
  savePdfBrandingDoc: (config: PdfBrandingConfig) => Promise<void>;
  saveCommunityConfigDoc: (config: SiteCommunityConfig) => Promise<void>;
  toggleStudentStatusDoc: (
    uid: string,
    nextStatus: 'Active' | 'Suspended',
    displayLabel?: string
  ) => Promise<void>;
  updateUserRoleDoc: (
    uid: string,
    nextRole: UserRole,
    displayLabel?: string
  ) => Promise<void>;
  fetchDashboardCounts: () => Promise<DashboardCountsData>;
  seedFirestoreCatalog: (silent?: boolean) => Promise<void>;
  resetDemoState: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const cleanId = (raw: string, fallbackPrefix: string) => {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
  return cleaned || `${fallbackPrefix}_${Date.now()}`;
};

const extractTimestampInfo = (val: unknown): { formatted: string; ms: number } => {
  if (!val) return { formatted: '—', ms: 0 };
  let date: Date | null = null;
  if (typeof val === 'string') {
    const parsed = new Date(val);
    if (!Number.isNaN(parsed.getTime())) date = parsed;
    else return { formatted: val, ms: 0 };
  } else if (typeof val === 'number') {
    date = new Date(val);
  } else {
    const ts = val as { toDate?: () => Date; seconds?: number };
    if (typeof ts.toDate === 'function') {
      date = ts.toDate();
    } else if (typeof ts.seconds === 'number') {
      date = new Date(ts.seconds * 1000);
    }
  }
  if (!date || Number.isNaN(date.getTime())) return { formatted: '—', ms: 0 };
  const pad = (n: number) => String(n).padStart(2, '0');
  const formatted = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return { formatted, ms: date.getTime() };
};

const describeAdminAction = (
  hint: AdminActionHint | undefined,
  existsInList: boolean,
  entityLabel: string,
  title: string
) => {
  const verb =
    hint === 'publish'
      ? 'Published'
      : hint === 'unpublish'
        ? 'Unpublished'
        : hint === 'create' || (!hint && !existsInList)
          ? 'Created'
          : 'Updated';
  const cleanTitle = title.trim() || 'Untitled';
  return `${verb} ${entityLabel}: ${cleanTitle}`;
};

const getLogTimestampMs = (row: GenericRow): number => {
  if (typeof row.updatedAtMs === 'number' && row.updatedAtMs > 0) return row.updatedAtMs;
  const rawTime = String(row.time || '').trim();
  if (!rawTime) return 0;
  const parsed = new Date(rawTime.replace(' ', 'T')).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

export interface GroupedActivityLog {
  id: string;
  time: string;
  who: string;
  act: string;
  count: number;
}

export const groupActivityLogs = (logs: GenericRow[]): GroupedActivityLog[] => {
  const groups: Array<{
    id: string;
    time: string;
    who: string;
    act: string;
    count: number;
    anchorMs: number;
  }> = [];

  for (const row of logs) {
    const who = String(row.who || '');
    const act = String(row.act || '');
    const time = String(row.time || '');
    const ms = getLogTimestampMs(row);
    const existing = groups.find(
      (g) =>
        g.who === who &&
        g.act === act &&
        ms > 0 &&
        g.anchorMs > 0 &&
        Math.abs(g.anchorMs - ms) <= 60_000
    );
    if (existing) {
      existing.count += 1;
    } else {
      groups.push({
        id: row.id,
        time,
        who,
        act,
        count: 1,
        anchorMs: ms,
      });
    }
  }

  return groups.map(({ id, time, who, act, count }) => ({
    id,
    time,
    who,
    act,
    count,
  }));
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PersistedState>(getInitialState);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(!isFirebaseConfigured);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('student');
  const isSuperAdmin = userRole === 'super_admin';
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';

  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.lang = state.language;
  }, [state.theme, state.language]);

  useEffect(() => {
    try {
      // Do not bloat localStorage with giant base64 PDF blobs
      const slimMaterials = state.materials.map((m) =>
        m.pdfDataUrl ? { ...m, pdfDataUrl: undefined } : m
      );
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...state, materials: slimMaterials })
      );
    } catch {
      // Ignore quota errors
    }
  }, [state]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const logAdminActivity = useCallback(async (actionText: string) => {
    if (!isFirebaseConfigured || !db || !auth?.currentUser) return;
    const logId = `lg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date();
    const timeStr = `${now.toISOString().slice(0, 10)} ${now.toISOString().slice(11, 16)}`;
    try {
      await setDoc(doc(db, 'activityLogs', logId), {
        id: logId,
        time: timeStr,
        who: auth.currentUser.email || auth.currentUser.uid,
        act: actionText.slice(0, 290),
        published: true,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `activityLogs/${logId}`);
    }
  }, []);

  const seedFirestoreCatalog = useCallback(
    async (silent = false) => {
      if (!isFirebaseConfigured || !db || !auth?.currentUser) return;
      const batch = writeBatch(db);

      INITIAL_QUESTIONS.forEach((q) => {
        batch.set(doc(db, 'questions', q.id), {
          id: q.id,
          subjectKey: q.subjectKey,
          subjectName: q.subjectName,
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          language: q.language || 'English',
          published: q.published,
          updatedAt: serverTimestamp(),
        });
      });

      INITIAL_TESTS.forEach((tst) => {
        const defaultCount =
          tst.type === 'Daily Quiz' ? 10 : tst.type === 'Mock Test' ? 50 : 20;
        batch.set(doc(db, 'tests', tst.id), {
          id: tst.id,
          type: tst.type,
          name: tst.name,
          subjectKeys: tst.subjectKeys,
          examIds: tst.examIds || [],
          questionIds: tst.questionIds || [],
          questionCount: tst.questionCount ?? tst.questionLimit ?? defaultCount,
          minutes: tst.minutes,
          negativeMarking: tst.negativeMarking,
          shuffle: Boolean(tst.shuffle ?? tst.type === 'Daily Quiz'),
          note: tst.note || '',
          published: tst.published ?? true,
          updatedAt: serverTimestamp(),
        });
      });

      batch.set(doc(db, 'siteBranding', 'pdf'), {
        id: 'pdf',
        brandName: DEFAULT_PDF_BRANDING.brandName,
        tagline: DEFAULT_PDF_BRANDING.tagline,
        footerNote: DEFAULT_PDF_BRANDING.footerNote,
        logoUrl: DEFAULT_PDF_BRANDING.logoUrl || '',
        accentColor: DEFAULT_PDF_BRANDING.accentColor,
        watermarkMode: DEFAULT_PDF_BRANDING.watermarkMode || 'both',
        watermarkText: DEFAULT_PDF_BRANDING.watermarkText || DEFAULT_PDF_BRANDING.brandName,
        watermarkColor: DEFAULT_PDF_BRANDING.watermarkColor || DEFAULT_PDF_BRANDING.accentColor,
        watermarkOpacity: DEFAULT_PDF_BRANDING.watermarkOpacity ?? 0.08,
        published: true,
        updatedAt: serverTimestamp(),
      });

      INITIAL_MATERIALS.forEach((mat) => {
        batch.set(doc(db, 'materials', mat.id), {
          id: mat.id,
          title: mat.title,
          subject: mat.subject,
          pages: mat.pages,
          summary: mat.summary,
          published: mat.published,
          updatedAt: serverTimestamp(),
        });
      });

      INITIAL_COURSES.forEach((c) => {
        batch.set(doc(db, 'courses', c.id), {
          id: c.id,
          title: c.title,
          description: c.description,
          lessons: c.lessons,
          published: c.published,
          updatedAt: serverTimestamp(),
        });
      });

      INITIAL_AFFAIRS.forEach((a) => {
        batch.set(doc(db, 'affairs', a.id), {
          id: a.id,
          title: a.title,
          category: a.category,
          period: a.period,
          date: a.date,
          summary: a.summary,
          published: a.published,
          updatedAt: serverTimestamp(),
        });
      });

      INITIAL_JOBS.forEach((j) => {
        batch.set(doc(db, 'jobs', j.id), {
          id: j.id,
          tab: j.tab,
          title: j.title,
          organization: j.organization,
          publishedDate: j.publishedDate,
          startDate: j.startDate,
          deadline: j.deadline,
          eligibility: j.eligibility,
          officialLink: j.officialLink || '',
          published: j.published,
          updatedAt: serverTimestamp(),
        });
      });

      INITIAL_BANNERS.forEach((b) => {
        batch.set(doc(db, 'banners', b.id), {
          id: b.id,
          title: b.title,
          subtitle: b.subtitle,
          buttonText: b.buttonText,
          bgColor: b.bgColor,
          align: b.align,
          visible: b.visible,
          updatedAt: serverTimestamp(),
        });
      });

      INITIAL_HOMEPAGE_SECTIONS.forEach((s, idx) => {
        batch.set(doc(db, 'homepageSections', s.id), {
          id: s.id,
          key: s.key,
          name: s.name,
          heading: s.heading,
          order: idx,
          visible: s.visible,
          updatedAt: serverTimestamp(),
        });
      });

      INITIAL_NOTIFICATIONS.forEach((n) => {
        const docId = `nt_${n.id}`;
        batch.set(doc(db, 'notifications', docId), {
          id: docId,
          numericId: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          audience: n.audience,
          date: n.date,
          published: true,
          updatedAt: serverTimestamp(),
        });
      });

      INITIAL_TYPING_PASSAGES.forEach((tp) => {
        batch.set(doc(db, 'typingPassages', tp.id), {
          id: tp.id,
          title: tp.title,
          lang: tp.lang,
          langLabel: tp.langLabel,
          text: tp.text,
          published: tp.published,
          updatedAt: serverTimestamp(),
        });
      });

      (['exams', 'subjects', 'categories', 'sitesettings'] as const).forEach((kind) => {
        (DEFAULT_ADMIN_TABLES[kind] || []).forEach((row) => {
          const col1 =
            kind === 'sitesettings' ? String(row.key || '') : String(row.name || '');
          const col2 =
            kind === 'exams'
              ? String(row.cat || '')
              : kind === 'sitesettings'
                ? String(row.val || '')
                : String(row.desc || '');
          batch.set(doc(db, 'catalogRows', row.id), {
            id: row.id,
            kind,
            col1,
            col2,
            col3: '',
            published: row.pub,
            updatedAt: serverTimestamp(),
          });
        });
      });

      (DEFAULT_ADMIN_TABLES.reports || []).forEach((rp) => {
        batch.set(doc(db, 'reports', rp.id), {
          id: rp.id,
          name: String(rp.name || ''),
          period: String(rp.period || ''),
          status: String(rp.status || ''),
          published: rp.pub,
          updatedAt: serverTimestamp(),
        });
      });

      batch.set(doc(db, 'siteCommunity', 'main'), {
        id: 'main',
        youtubeUrl: DEFAULT_SITE_COMMUNITY.youtubeUrl,
        telegramUrl: DEFAULT_SITE_COMMUNITY.telegramUrl,
        instagramUrl: DEFAULT_SITE_COMMUNITY.instagramUrl,
        whatsappUrl: DEFAULT_SITE_COMMUNITY.whatsappUrl,
        facebookUrl: DEFAULT_SITE_COMMUNITY.facebookUrl,
        twitterUrl: DEFAULT_SITE_COMMUNITY.twitterUrl,
        popupEnabled: DEFAULT_SITE_COMMUNITY.popupEnabled,
        popupTitle: DEFAULT_SITE_COMMUNITY.popupTitle,
        popupSubtitle: DEFAULT_SITE_COMMUNITY.popupSubtitle,
        popupHighlight: DEFAULT_SITE_COMMUNITY.popupHighlight,
        published: true,
        updatedAt: serverTimestamp(),
      });

      try {
        await batch.commit();
        await logAdminActivity('Seeded initial platform data to Firestore');
        if (!silent) showToast('Starter catalog synced to Firebase Firestore!');
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'batchSeed');
      }
    },
    [logAdminActivity, showToast]
  );

  // Firebase Auth listener + Firestore users/{uid} role & profile bootstrap
  useEffect(() => {
    if (!isFirebaseConfigured || !auth || !db) {
      setFirebaseUser(null);
      setUserRole('student');
      setAuthReady(true);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setUserRole('student');
        setAuthReady(true);
        return;
      }

      const rawName = (user.displayName || '').trim();
      const safeDisplayName =
        rawName.length >= 2 && !rawName.includes('@')
          ? rawName.slice(0, 80)
          : `Learner_${user.uid.slice(0, 5)}`;

      let resolvedRole: UserRole = 'student';
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            email: (user.email || '').slice(0, 200),
            displayName: safeDisplayName,
            targetExam: 'SSC',
            preferredLang: 'English',
            role: 'student',
            status: 'Active',
            points: 100,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          setState((prev) => ({
            ...prev,
            profile: {
              ...prev.profile,
              name: safeDisplayName,
              email: user.email || '',
            },
          }));
        } else {
          const data = userSnap.data();
          const rawRole = String(data.role || 'student');
          resolvedRole =
            rawRole === 'super_admin' || rawRole === 'admin' ? rawRole : 'student';
          setState((prev) => ({
            ...prev,
            profile: {
              name: String(data.displayName || safeDisplayName),
              email: user.email || String(data.email || ''),
              exam: String(data.targetExam || 'SSC'),
              language: String(data.preferredLang || 'English'),
            },
          }));
        }
      } catch {
        resolvedRole = 'student';
      }

      setUserRole(resolvedRole);
      setAuthReady(true);

      // Sync signed-in user progress
      try {
        const progSnap = await getDoc(doc(db, 'userProgress', user.uid));
        if (progSnap.exists()) {
          const p = progSnap.data();
          setState((prev) => ({
            ...prev,
            savedMaterials: Array.isArray(p.savedMaterials) ? p.savedMaterials : prev.savedMaterials,
            completedLessons: Array.isArray(p.completedLessons)
              ? p.completedLessons
              : prev.completedLessons,
            syllabusChecked: Array.isArray(p.syllabusChecked)
              ? p.syllabusChecked
              : prev.syllabusChecked,
            typingHistory: Array.isArray(p.typingHistory) ? p.typingHistory : prev.typingHistory,
            testHistory: Array.isArray(p.testHistory) ? p.testHistory : prev.testHistory,
            planner: p.planner ? { ...prev.planner, ...p.planner } : prev.planner,
            notifications: {
              readIds: Array.isArray(p.readNotifIds)
                ? p.readNotifIds
                : prev.notifications.readIds,
              clearedIds: Array.isArray(p.clearedNotifIds)
                ? p.clearedNotifIds
                : prev.notifications.clearedIds,
            },
          }));
        }
      } catch {
        // Non-fatal if userProgress doesn't exist yet
      }
    });
    return () => unsub();
  }, []);

  // Keep user role synced live if updated in Firestore
  useEffect(() => {
    if (!isFirebaseConfigured || !db || !firebaseUser) return;
    const unsub = onSnapshot(
      doc(db, 'users', firebaseUser.uid),
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        const rawRole = String(data.role || 'student');
        const nextRole: UserRole =
          rawRole === 'super_admin' || rawRole === 'admin' ? rawRole : 'student';
        setUserRole(nextRole);
      },
      () => {
        // Ignore transient permission errors on sign-out
      }
    );
    return () => unsub();
  }, [firebaseUser]);

  // Firestore Real-time Subscriptions
  useEffect(() => {
    if (!authReady || !isFirebaseConfigured || !db) return;
    const unsubs: Array<() => void> = [];

    const makePublicOrAdminQuery = (colName: string, visibilityField = 'published') =>
      isAdmin
        ? collection(db, colName)
        : query(collection(db, colName), where(visibilityField, '==', true));

    // Questions
    unsubs.push(
      onSnapshot(
        makePublicOrAdminQuery('questions'),
        (snap) => {
          if (snap.empty) return;
          const list = snap.docs.map((d) => {
            const data = d.data() as QuestionItem & { updatedAt?: unknown };
            const rawLang = data.language;
            const language: QuestionLanguage =
              rawLang === 'Bengali' || rawLang === 'Hindi' ? rawLang : 'English';
            return {
              ...data,
              language,
              updatedAt: extractTimestampInfo(data.updatedAt).formatted,
            };
          });
          setState((prev) => ({ ...prev, questions: list }));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'questions')
      )
    );

    // Tests (Quizzes & Mock Tests)
    unsubs.push(
      onSnapshot(
        makePublicOrAdminQuery('tests'),
        (snap) => {
          if (snap.empty) return;
          const list = snap.docs.map((d) => {
            const data = d.data() as TestDefinition & { updatedAt?: unknown };
            return {
              ...data,
              examIds: Array.isArray(data.examIds) ? data.examIds : [],
              questionIds: Array.isArray(data.questionIds) ? data.questionIds : [],
              questionCount:
                typeof data.questionCount === 'number'
                  ? data.questionCount
                  : typeof data.questionLimit === 'number'
                    ? data.questionLimit
                    : undefined,
              shuffle: Boolean(data.shuffle ?? data.type === 'Daily Quiz'),
              updatedAt: extractTimestampInfo(data.updatedAt).formatted,
            };
          });
          setState((prev) => ({ ...prev, tests: list }));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'tests')
      )
    );

    // Site Branding (PDF Name & Logo)
    unsubs.push(
      onSnapshot(
        makePublicOrAdminQuery('siteBranding'),
        (snap) => {
          if (snap.empty) return;
          const pdfDoc = snap.docs.find((d) => d.id === 'pdf') || snap.docs[0];
          if (!pdfDoc) return;
          const data = pdfDoc.data();
          const rawMode = String(data.watermarkMode || DEFAULT_PDF_BRANDING.watermarkMode || 'both');
          const watermarkMode: PdfBrandingConfig['watermarkMode'] =
            rawMode === 'logo' || rawMode === 'text' || rawMode === 'none' ? rawMode : 'both';
          const rawOpacity = Number(data.watermarkOpacity);
          setState((prev) => ({
            ...prev,
            pdfBranding: {
              id: pdfDoc.id,
              brandName: String(data.brandName || DEFAULT_PDF_BRANDING.brandName),
              tagline: String(data.tagline ?? DEFAULT_PDF_BRANDING.tagline),
              footerNote: String(data.footerNote ?? DEFAULT_PDF_BRANDING.footerNote),
              logoUrl: data.logoUrl ? String(data.logoUrl) : undefined,
              logoDataUrl: data.logoDataUrl ? String(data.logoDataUrl) : undefined,
              accentColor: String(data.accentColor || DEFAULT_PDF_BRANDING.accentColor),
              watermarkMode,
              watermarkText: String(
                data.watermarkText ?? data.brandName ?? DEFAULT_PDF_BRANDING.watermarkText ?? ''
              ),
              watermarkColor: String(
                data.watermarkColor || data.accentColor || DEFAULT_PDF_BRANDING.watermarkColor
              ),
              watermarkOpacity: Number.isFinite(rawOpacity)
                ? Math.max(0, Math.min(0.4, rawOpacity))
                : (DEFAULT_PDF_BRANDING.watermarkOpacity ?? 0.08),
              watermarkLogoUrl: data.watermarkLogoUrl ? String(data.watermarkLogoUrl) : '',
              watermarkLogoDataUrl: data.watermarkLogoDataUrl
                ? String(data.watermarkLogoDataUrl)
                : '',
            },
          }));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'siteBranding')
      )
    );

    // Site Community (Social Media Channel Links & Visit Welcome Popup)
    unsubs.push(
      onSnapshot(
        makePublicOrAdminQuery('siteCommunity'),
        (snap) => {
          if (snap.empty) return;
          const commDoc = snap.docs.find((d) => d.id === 'main') || snap.docs[0];
          if (!commDoc) return;
          const data = commDoc.data();
          setState((prev) => ({
            ...prev,
            communityConfig: {
              id: commDoc.id,
              youtubeUrl: String(data.youtubeUrl ?? ''),
              telegramUrl: String(data.telegramUrl ?? ''),
              instagramUrl: String(data.instagramUrl ?? ''),
              whatsappUrl: String(data.whatsappUrl ?? ''),
              facebookUrl: String(data.facebookUrl ?? ''),
              twitterUrl: String(data.twitterUrl ?? ''),
              popupEnabled: data.popupEnabled !== false,
              popupTitle: String(data.popupTitle || DEFAULT_SITE_COMMUNITY.popupTitle),
              popupSubtitle: String(data.popupSubtitle ?? DEFAULT_SITE_COMMUNITY.popupSubtitle),
              popupHighlight: String(data.popupHighlight ?? DEFAULT_SITE_COMMUNITY.popupHighlight),
            },
          }));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'siteCommunity')
      )
    );

    // Materials (including PDF uploads)
    unsubs.push(
      onSnapshot(
        makePublicOrAdminQuery('materials'),
        (snap) => {
          if (snap.empty) return;
          const list = snap.docs.map((d) => {
            const data = d.data() as StudyMaterialItem & { updatedAt?: unknown };
            return {
              ...data,
              updatedAt: extractTimestampInfo(data.updatedAt).formatted,
            };
          });
          setState((prev) => ({ ...prev, materials: list }));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'materials')
      )
    );

    // Courses
    unsubs.push(
      onSnapshot(
        makePublicOrAdminQuery('courses'),
        (snap) => {
          if (snap.empty) return;
          const list = snap.docs.map((d) => {
            const data = d.data() as CourseItem & { updatedAt?: unknown };
            return {
              ...data,
              updatedAt: extractTimestampInfo(data.updatedAt).formatted,
            };
          });
          setState((prev) => ({ ...prev, courses: list }));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'courses')
      )
    );

    // Affairs
    unsubs.push(
      onSnapshot(
        makePublicOrAdminQuery('affairs'),
        (snap) => {
          if (snap.empty) return;
          const list = snap.docs.map((d) => {
            const data = d.data() as CurrentAffairItem & { updatedAt?: unknown };
            return {
              ...data,
              updatedAt: extractTimestampInfo(data.updatedAt).formatted,
            };
          });
          setState((prev) => ({ ...prev, affairs: list }));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'affairs')
      )
    );

    // Jobs
    unsubs.push(
      onSnapshot(
        makePublicOrAdminQuery('jobs'),
        (snap) => {
          if (snap.empty) return;
          const list = snap.docs.map((d) => {
            const data = d.data() as JobUpdateItem & { updatedAt?: unknown };
            return {
              ...data,
              updatedAt: extractTimestampInfo(data.updatedAt).formatted,
            };
          });
          setState((prev) => ({ ...prev, jobs: list }));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'jobs')
      )
    );

    // Banners
    unsubs.push(
      onSnapshot(
        makePublicOrAdminQuery('banners', 'visible'),
        (snap) => {
          if (snap.empty) return;
          const list = snap.docs.map((d) => {
            const data = d.data() as BannerItem & { updatedAt?: unknown };
            return {
              ...data,
              updatedAt: extractTimestampInfo(data.updatedAt).formatted,
            };
          });
          setState((prev) => ({ ...prev, banners: list }));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'banners')
      )
    );

    // Homepage Sections
    unsubs.push(
      onSnapshot(
        makePublicOrAdminQuery('homepageSections', 'visible'),
        (snap) => {
          if (snap.empty) return;
          const list = snap.docs
            .map((d) => {
              const data = d.data() as HomepageSectionItem & { updatedAt?: unknown };
              return {
                ...data,
                updatedAt: extractTimestampInfo(data.updatedAt).formatted,
              };
            })
            .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
          setState((prev) => ({ ...prev, homepageSections: list }));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'homepageSections')
      )
    );

    // Notifications
    unsubs.push(
      onSnapshot(
        makePublicOrAdminQuery('notifications'),
        (snap) => {
          if (snap.empty) return;
          const list = snap.docs
            .map((d) => {
              const data = d.data();
              return {
                id: Number(data.numericId || 1),
                docId: d.id,
                type: String(data.type || 'Announcement'),
                title: String(data.title || ''),
                message: String(data.message || ''),
                audience: String(data.audience || 'All students'),
                date: String(data.date || ''),
                published: Boolean(data.published),
                updatedAt: extractTimestampInfo(data.updatedAt).formatted,
              } as NotificationItem;
            })
            .sort((a, b) => b.id - a.id);
          setState((prev) => ({ ...prev, notificationsList: list }));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'notifications')
      )
    );

    // Typing Passages
    unsubs.push(
      onSnapshot(
        makePublicOrAdminQuery('typingPassages'),
        (snap) => {
          if (snap.empty) return;
          const list = snap.docs.map((d) => {
            const data = d.data() as TypingPassageItem & { updatedAt?: unknown };
            return {
              ...data,
              updatedAt: extractTimestampInfo(data.updatedAt).formatted,
            };
          });
          setState((prev) => ({ ...prev, typingPassages: list }));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'typingPassages')
      )
    );

    // Catalog Rows (Exams, Subjects, Categories, Site Settings)
    unsubs.push(
      onSnapshot(
        makePublicOrAdminQuery('catalogRows'),
        (snap) => {
          if (snap.empty) return;
          const exams: GenericRow[] = [];
          const subjects: GenericRow[] = [];
          const categories: GenericRow[] = [];
          const sitesettings: GenericRow[] = [];

          snap.docs.forEach((d) => {
            const data = d.data();
            const kind = String(data.kind);
            const updatedAt = extractTimestampInfo(data.updatedAt).formatted;
            if (kind === 'exams') {
              exams.push({
                id: d.id,
                name: String(data.col1 || ''),
                cat: String(data.col2 || ''),
                pub: Boolean(data.published),
                updatedAt,
              });
            } else if (kind === 'subjects') {
              subjects.push({
                id: d.id,
                name: String(data.col1 || ''),
                desc: String(data.col2 || ''),
                pub: Boolean(data.published),
                updatedAt,
              });
            } else if (kind === 'categories') {
              categories.push({
                id: d.id,
                name: String(data.col1 || ''),
                desc: String(data.col2 || ''),
                pub: Boolean(data.published),
                updatedAt,
              });
            } else if (kind === 'sitesettings') {
              sitesettings.push({
                id: d.id,
                key: String(data.col1 || ''),
                val: String(data.col2 || ''),
                pub: Boolean(data.published),
                updatedAt,
              });
            }
          });

          setState((prev) => ({
            ...prev,
            adminTables: {
              ...prev.adminTables,
              exams: exams.length ? exams : prev.adminTables.exams,
              subjects: subjects.length ? subjects : prev.adminTables.subjects,
              categories: categories.length ? categories : prev.adminTables.categories,
              sitesettings: sitesettings.length ? sitesettings : prev.adminTables.sitesettings,
            },
          }));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'catalogRows')
      )
    );

    // Admin-only collections
    if (isAdmin) {
      unsubs.push(
        onSnapshot(
          collection(db, 'users'),
          (snap) => {
            const rows: GenericRow[] = snap.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                name: String(data.displayName || d.id),
                email: String(data.email || ''),
                role: String(data.role || 'student'),
                exam: String(data.targetExam || 'SSC'),
                status: String(data.status || 'Active'),
                points: String(data.points ?? 0),
                pub: data.status === 'Active',
                updatedAt: extractTimestampInfo(data.updatedAt).formatted,
              };
            });
            setState((prev) => ({
              ...prev,
              adminTables: { ...prev.adminTables, students: rows },
            }));
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'users')
        )
      );

      unsubs.push(
        onSnapshot(
          collection(db, 'reports'),
          (snap) => {
            if (snap.empty) return;
            const rows: GenericRow[] = snap.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                name: String(data.name || ''),
                period: String(data.period || ''),
                status: String(data.status || ''),
                pub: Boolean(data.published),
                updatedAt: extractTimestampInfo(data.updatedAt).formatted,
              };
            });
            setState((prev) => ({
              ...prev,
              adminTables: { ...prev.adminTables, reports: rows },
            }));
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'reports')
        )
      );
    }

    // Super Admin-only Activity Logs
    if (isSuperAdmin) {
      unsubs.push(
        onSnapshot(
          collection(db, 'activityLogs'),
          (snap) => {
            const rows: GenericRow[] = snap.docs
              .map((d) => {
                const data = d.data();
                const ts = extractTimestampInfo(data.updatedAt);
                return {
                  id: d.id,
                  time: ts.ms > 0 ? ts.formatted : String(data.time || 'Pending…'),
                  who: String(data.who || ''),
                  act: String(data.act || ''),
                  pub: Boolean(data.published),
                  updatedAt: ts.formatted,
                  updatedAtMs: ts.ms,
                };
              })
              .sort((a, b) => {
                const diff = (b.updatedAtMs || 0) - (a.updatedAtMs || 0);
                if (diff !== 0) return diff;
                return String(b.time).localeCompare(String(a.time));
              });
            setState((prev) => ({
              ...prev,
              adminTables: { ...prev.adminTables, logs: rows },
            }));
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'activityLogs')
        )
      );
    } else {
      setState((prev) =>
        prev.adminTables.logs?.length
          ? { ...prev, adminTables: { ...prev.adminTables, logs: [] } }
          : prev
      );
    }

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [authReady, isAdmin, isSuperAdmin]);

  // Persist user progress to Firestore when signed in
  const persistProgressToFirestore = useCallback(async (nextState: PersistedState) => {
    if (!isFirebaseConfigured || !db || !auth) return;
    const user = auth.currentUser;
    if (!user) return;
    try {
      await setDoc(doc(db, 'userProgress', user.uid), {
        uid: user.uid,
        savedMaterials: nextState.savedMaterials.slice(0, 200),
        completedLessons: nextState.completedLessons.slice(0, 300),
        syllabusChecked: nextState.syllabusChecked.slice(0, 500),
        typingHistory: nextState.typingHistory.slice(-100),
        testHistory: nextState.testHistory.slice(0, 100),
        planner: nextState.planner,
        readNotifIds: nextState.notifications.readIds.slice(0, 200),
        clearedNotifIds: nextState.notifications.clearedIds.slice(0, 200),
        updatedAt: serverTimestamp(),
      });
    } catch {
      // Non-blocking sync
    }
  }, []);

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase is not configured yet.');
    }
    await signInWithPopup(auth, googleProvider);
  };

  const registerWithEmail = async (name: string, email: string, password: string) => {
    if (!isFirebaseConfigured || !auth || !db) {
      throw new Error('Firebase is not configured yet.');
    }
    const cleanEmail = email.trim();
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const safeName = name.trim().slice(0, 80) || `Learner_${cred.user.uid.slice(0, 5)}`;
    await updateFirebaseAuthProfile(cred.user, { displayName: safeName });
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      email: (cred.user.email || cleanEmail).slice(0, 200),
      displayName: safeName,
      targetExam: 'SSC',
      preferredLang: 'English',
      role: 'student',
      status: 'Active',
      points: 100,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase is not configured yet.');
    }
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const resetPassword = async (email: string) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase is not configured yet.');
    }
    await sendPasswordResetEmail(auth, email.trim());
  };

  const signOutUser = async () => {
    if (!isFirebaseConfigured || !auth) return;
    await signOut(auth);
    showToast('Signed out.');
  };

  const toggleTheme = () => {
    setState((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  };

  const setLanguage = (language: LanguageCode) => {
    setState((prev) => ({ ...prev, language }));
  };

  const toggleSaveMaterial = (id: string) => {
    setState((prev) => {
      const exists = prev.savedMaterials.includes(id);
      const next: PersistedState = {
        ...prev,
        savedMaterials: exists
          ? prev.savedMaterials.filter((item) => item !== id)
          : [...prev.savedMaterials, id],
      };
      void persistProgressToFirestore(next);
      return next;
    });
  };

  const toggleLesson = (lessonKey: string) => {
    setState((prev) => {
      const exists = prev.completedLessons.includes(lessonKey);
      const next: PersistedState = {
        ...prev,
        completedLessons: exists
          ? prev.completedLessons.filter((item) => item !== lessonKey)
          : [...prev.completedLessons, lessonKey],
      };
      void persistProgressToFirestore(next);
      return next;
    });
  };

  const toggleSyllabusKey = (key: string) => {
    setState((prev) => {
      const exists = prev.syllabusChecked.includes(key);
      const next: PersistedState = {
        ...prev,
        syllabusChecked: exists
          ? prev.syllabusChecked.filter((item) => item !== key)
          : [...prev.syllabusChecked, key],
      };
      void persistProgressToFirestore(next);
      return next;
    });
  };

  const addTypingAttempt = (attempt: TypingAttempt) => {
    setState((prev) => {
      const next: PersistedState = {
        ...prev,
        typingHistory: [...prev.typingHistory, attempt],
      };
      void persistProgressToFirestore(next);
      return next;
    });
  };

  const addTestAttempt = (attempt: TestAttempt) => {
    setState((prev) => {
      const next: PersistedState = {
        ...prev,
        testHistory: [attempt, ...prev.testHistory],
      };
      void persistProgressToFirestore(next);
      return next;
    });
  };

  const updatePlanner = (
    updater: (prev: PersistedState['planner']) => PersistedState['planner']
  ) => {
    setState((prev) => {
      const next: PersistedState = {
        ...prev,
        planner: updater(prev.planner),
      };
      void persistProgressToFirestore(next);
      return next;
    });
  };

  const toggleNotifRead = (id: number) => {
    setState((prev) => {
      const exists = prev.notifications.readIds.includes(id);
      const next: PersistedState = {
        ...prev,
        notifications: {
          ...prev.notifications,
          readIds: exists
            ? prev.notifications.readIds.filter((item) => item !== id)
            : [...prev.notifications.readIds, id],
        },
      };
      void persistProgressToFirestore(next);
      return next;
    });
  };

  const markAllNotifsRead = () => {
    setState((prev) => {
      const next: PersistedState = {
        ...prev,
        notifications: {
          ...prev.notifications,
          readIds: prev.notificationsList.map((n) => n.id),
        },
      };
      void persistProgressToFirestore(next);
      return next;
    });
  };

  const clearAllNotifs = () => {
    setState((prev) => {
      const next: PersistedState = {
        ...prev,
        notifications: {
          ...prev.notifications,
          clearedIds: prev.notificationsList.map((n) => n.id),
        },
      };
      void persistProgressToFirestore(next);
      return next;
    });
  };

  const restoreNotifs = () => {
    setState((prev) => {
      const next: PersistedState = {
        ...prev,
        notifications: {
          ...prev.notifications,
          clearedIds: [],
        },
      };
      void persistProgressToFirestore(next);
      return next;
    });
  };

  const unreadNotificationsCount = state.notificationsList.filter(
    (n) =>
      n.published !== false &&
      !state.notifications.clearedIds.includes(n.id) &&
      !state.notifications.readIds.includes(n.id)
  ).length;

  const updateProfile = async (profile: UserProfile) => {
    setState((prev) => ({ ...prev, profile }));
    const user = auth?.currentUser;
    if (user && isFirebaseConfigured && db) {
      const path = `users/${user.uid}`;
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          displayName: profile.name.slice(0, 80),
          targetExam: profile.exam.slice(0, 80),
          preferredLang: profile.language.slice(0, 40),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    }
  };

  /* -------------------- Admin Firestore CRUD Helpers -------------------- */
  const saveQuestionDoc = async (item: QuestionItem, actionHint?: AdminActionHint) => {
    const id = cleanId(item.id, 'q');
    const path = `questions/${id}`;
    const lang: QuestionLanguage =
      item.language === 'Bengali' || item.language === 'Hindi' ? item.language : 'English';
    const exists = state.questions.some((q) => q.id === id);
    try {
      await setDoc(doc(db, 'questions', id), {
        id,
        subjectKey: item.subjectKey.slice(0, 32),
        subjectName: item.subjectName.slice(0, 80),
        question: item.question.slice(0, 1000),
        options: item.options.slice(0, 6),
        correctIndex: item.correctIndex,
        explanation: item.explanation.slice(0, 1200),
        language: lang,
        published: Boolean(item.published),
        updatedAt: serverTimestamp(),
      });
      await logAdminActivity(
        describeAdminAction(actionHint, exists, 'question', item.question.slice(0, 60))
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const saveQuestionsBatchDoc = async (items: QuestionItem[]): Promise<string[]> => {
    if (!items.length) return [];
    const savedIds: string[] = [];
    const CHUNK = 400;
    try {
      for (let i = 0; i < items.length; i += CHUNK) {
        const chunk = items.slice(i, i + CHUNK);
        const batch = writeBatch(db);
        chunk.forEach((item, idx) => {
          const id = cleanId(item.id || `q_${Date.now()}_${i + idx}`, 'q');
          const lang: QuestionLanguage =
            item.language === 'Bengali' || item.language === 'Hindi' ? item.language : 'English';
          savedIds.push(id);
          batch.set(doc(db, 'questions', id), {
            id,
            subjectKey: item.subjectKey.slice(0, 32),
            subjectName: item.subjectName.slice(0, 80),
            question: item.question.slice(0, 1000),
            options: item.options.slice(0, 6),
            correctIndex: Math.max(0, Math.min(item.options.length - 1, item.correctIndex)),
            explanation: item.explanation.slice(0, 1200),
            language: lang,
            published: Boolean(item.published),
            updatedAt: serverTimestamp(),
          });
        });
        await batch.commit();
      }
      await logAdminActivity(`Created ${savedIds.length} bulk MCQ question(s)`);
      return savedIds;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'questions');
    }
  };

  const deleteQuestionDoc = async (id: string, displayLabel?: string) => {
    const path = `questions/${id}`;
    const docRef = doc(db, 'questions', id);
    try {
      const snap = await getDoc(docRef);
      if (!snap.exists()) return;
      const data = snap.data();
      const readable = (
        displayLabel ||
        String(data.question || 'Question')
      ).slice(0, 60);
      await deleteDoc(docRef);
      setState((prev) => ({
        ...prev,
        questions: prev.questions.filter((q) => q.id !== id),
      }));
      await logAdminActivity(`Deleted question: ${readable}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const saveTestDoc = async (item: TestDefinition, actionHint?: AdminActionHint) => {
    const id = cleanId(item.id, 'tst');
    const path = `tests/${id}`;
    const defaultCount =
      item.type === 'Daily Quiz' ? 10 : item.type === 'Mock Test' ? 50 : 20;
    const resolvedCount = Math.max(
      1,
      Math.min(500, Number(item.questionCount ?? item.questionLimit) || defaultCount)
    );
    const exists = state.tests.some((tItem) => tItem.id === id);
    try {
      const payload: Record<string, unknown> = {
        id,
        type: item.type,
        name: item.name.slice(0, 160),
        subjectKeys: item.subjectKeys.length ? item.subjectKeys.slice(0, 10) : ['gk'],
        examIds: (item.examIds || []).slice(0, 20),
        questionIds: (item.questionIds || []).slice(0, 200),
        questionCount: resolvedCount,
        minutes: Math.max(1, Math.min(360, Number(item.minutes) || 5)),
        negativeMarking: Math.max(0, Math.min(5, Number(item.negativeMarking) || 0)),
        shuffle: Boolean(item.shuffle ?? item.type === 'Daily Quiz'),
        published: Boolean(item.published),
        updatedAt: serverTimestamp(),
      };
      if (item.note) payload.note = item.note.slice(0, 400);
      await setDoc(doc(db, 'tests', id), payload);
      await logAdminActivity(describeAdminAction(actionHint, exists, item.type, item.name));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const savePdfBrandingDoc = async (config: PdfBrandingConfig) => {
    const path = 'siteBranding/pdf';
    try {
      const wmMode =
        config.watermarkMode === 'logo' ||
        config.watermarkMode === 'text' ||
        config.watermarkMode === 'none'
          ? config.watermarkMode
          : 'both';
      const wmOpacity =
        typeof config.watermarkOpacity === 'number' && Number.isFinite(config.watermarkOpacity)
          ? Math.max(0, Math.min(0.4, Number(config.watermarkOpacity.toFixed(2))))
          : 0.08;

      const payload: Record<string, unknown> = {
        id: 'pdf',
        brandName: (config.brandName || 'LEARN WITH TG').trim().slice(0, 120),
        tagline: (config.tagline || '').trim().slice(0, 200),
        footerNote: (config.footerNote || '').trim().slice(0, 240),
        accentColor: (config.accentColor || '#102544').slice(0, 32),
        watermarkMode: wmMode,
        watermarkOpacity: wmOpacity,
        published: true,
        updatedAt: serverTimestamp(),
      };
      if (config.logoUrl?.trim()) payload.logoUrl = config.logoUrl.trim().slice(0, 2048);
      if (config.logoDataUrl?.trim()) payload.logoDataUrl = config.logoDataUrl.trim().slice(0, 350000);
      if (config.watermarkText?.trim()) {
        payload.watermarkText = config.watermarkText.trim().slice(0, 120);
      }
      if (config.watermarkColor?.trim()) {
        payload.watermarkColor = config.watermarkColor.trim().slice(0, 32);
      }
      if (config.watermarkLogoUrl?.trim()) {
        payload.watermarkLogoUrl = config.watermarkLogoUrl.trim().slice(0, 2048);
      }
      if (config.watermarkLogoDataUrl?.trim()) {
        payload.watermarkLogoDataUrl = config.watermarkLogoDataUrl.trim().slice(0, 350000);
      }
      await setDoc(doc(db, 'siteBranding', 'pdf'), payload);
      await logAdminActivity(`Updated PDF branding: ${String(payload.brandName)}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const saveCommunityConfigDoc = async (config: SiteCommunityConfig) => {
    const path = 'siteCommunity/main';
    try {
      await setDoc(doc(db, 'siteCommunity', 'main'), {
        id: 'main',
        youtubeUrl: (config.youtubeUrl || '').trim().slice(0, 512),
        telegramUrl: (config.telegramUrl || '').trim().slice(0, 512),
        instagramUrl: (config.instagramUrl || '').trim().slice(0, 512),
        whatsappUrl: (config.whatsappUrl || '').trim().slice(0, 512),
        facebookUrl: (config.facebookUrl || '').trim().slice(0, 512),
        twitterUrl: (config.twitterUrl || '').trim().slice(0, 512),
        popupEnabled: Boolean(config.popupEnabled),
        popupTitle: (config.popupTitle || DEFAULT_SITE_COMMUNITY.popupTitle).trim().slice(0, 160),
        popupSubtitle: (config.popupSubtitle || '').trim().slice(0, 300),
        popupHighlight: (config.popupHighlight || '').trim().slice(0, 600),
        published: true,
        updatedAt: serverTimestamp(),
      });
      await logAdminActivity('Updated Social Media links & Welcome Notification popup');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const deleteTestDoc = async (id: string, displayLabel?: string) => {
    const path = `tests/${id}`;
    const docRef = doc(db, 'tests', id);
    try {
      const snap = await getDoc(docRef);
      if (!snap.exists()) return;
      const data = snap.data();
      const readable = (displayLabel || String(data.name || 'Test')).slice(0, 80);
      await deleteDoc(docRef);
      setState((prev) => ({
        ...prev,
        tests: prev.tests.filter((tst) => tst.id !== id),
      }));
      await logAdminActivity(`Deleted ${String(data.type || 'test')}: ${readable}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const saveMaterialDoc = async (item: StudyMaterialItem, actionHint?: AdminActionHint) => {
    const id = cleanId(item.id, 'mat');
    const path = `materials/${id}`;
    const exists = state.materials.some((m) => m.id === id);
    try {
      const payload: Record<string, unknown> = {
        id,
        title: item.title.slice(0, 180),
        subject: item.subject.slice(0, 80),
        pages: Math.max(1, Math.min(5000, Number(item.pages) || 1)),
        summary: item.summary.slice(0, 1200),
        published: Boolean(item.published),
        updatedAt: serverTimestamp(),
      };
      if (item.fileName) payload.fileName = item.fileName.slice(0, 200);
      if (typeof item.fileSizeBytes === 'number') payload.fileSizeBytes = item.fileSizeBytes;
      if (item.pdfUrl) payload.pdfUrl = item.pdfUrl.slice(0, 2048);
      if (item.pdfDataUrl) payload.pdfDataUrl = item.pdfDataUrl.slice(0, 920000);
      await setDoc(doc(db, 'materials', id), payload);
      await logAdminActivity(describeAdminAction(actionHint, exists, 'study material', item.title));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const deleteMaterialDoc = async (id: string, displayLabel?: string) => {
    const path = `materials/${id}`;
    const docRef = doc(db, 'materials', id);
    try {
      const snap = await getDoc(docRef);
      if (!snap.exists()) return;
      const readable = (displayLabel || String(snap.data().title || 'Study Material')).slice(0, 80);
      await deleteDoc(docRef);
      setState((prev) => ({
        ...prev,
        materials: prev.materials.filter((m) => m.id !== id),
      }));
      await logAdminActivity(`Deleted study material: ${readable}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const saveCourseDoc = async (item: CourseItem, actionHint?: AdminActionHint) => {
    const id = cleanId(item.id, 'crs');
    const path = `courses/${id}`;
    const exists = state.courses.some((c) => c.id === id);
    try {
      await setDoc(doc(db, 'courses', id), {
        id,
        title: item.title.slice(0, 180),
        description: item.description.slice(0, 1000),
        lessons: item.lessons.slice(0, 100),
        published: Boolean(item.published),
        updatedAt: serverTimestamp(),
      });
      await logAdminActivity(describeAdminAction(actionHint, exists, 'course', item.title));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const deleteCourseDoc = async (id: string, displayLabel?: string) => {
    const path = `courses/${id}`;
    const docRef = doc(db, 'courses', id);
    try {
      const snap = await getDoc(docRef);
      if (!snap.exists()) return;
      const readable = (displayLabel || String(snap.data().title || 'Course')).slice(0, 80);
      await deleteDoc(docRef);
      setState((prev) => ({
        ...prev,
        courses: prev.courses.filter((c) => c.id !== id),
      }));
      await logAdminActivity(`Deleted course: ${readable}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const saveAffairDoc = async (item: CurrentAffairItem, actionHint?: AdminActionHint) => {
    const id = cleanId(item.id, 'ca');
    const path = `affairs/${id}`;
    const exists = state.affairs.some((a) => a.id === id);
    try {
      await setDoc(doc(db, 'affairs', id), {
        id,
        title: item.title.slice(0, 220),
        category: item.category.slice(0, 60),
        period: item.period,
        date: item.date.slice(0, 32),
        summary: item.summary.slice(0, 1200),
        published: Boolean(item.published),
        updatedAt: serverTimestamp(),
      });
      await logAdminActivity(
        describeAdminAction(actionHint, exists, 'current affair', item.title.slice(0, 60))
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const deleteAffairDoc = async (id: string, displayLabel?: string) => {
    const path = `affairs/${id}`;
    const docRef = doc(db, 'affairs', id);
    try {
      const snap = await getDoc(docRef);
      if (!snap.exists()) return;
      const readable = (displayLabel || String(snap.data().title || 'Current Affair')).slice(0, 80);
      await deleteDoc(docRef);
      setState((prev) => ({
        ...prev,
        affairs: prev.affairs.filter((a) => a.id !== id),
      }));
      await logAdminActivity(`Deleted current affair: ${readable}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const saveJobDoc = async (item: JobUpdateItem, actionHint?: AdminActionHint) => {
    const id = cleanId(item.id, 'job');
    const path = `jobs/${id}`;
    const exists = state.jobs.some((j) => j.id === id);
    try {
      const payload: Record<string, unknown> = {
        id,
        tab: item.tab,
        title: item.title.slice(0, 200),
        organization: item.organization.slice(0, 140),
        publishedDate: item.publishedDate.slice(0, 32),
        startDate: item.startDate.slice(0, 32),
        deadline: item.deadline.slice(0, 32),
        eligibility: item.eligibility.slice(0, 500),
        published: Boolean(item.published),
        updatedAt: serverTimestamp(),
      };
      if (item.officialLink) payload.officialLink = item.officialLink.slice(0, 1024);
      await setDoc(doc(db, 'jobs', id), payload);
      await logAdminActivity(
        describeAdminAction(actionHint, exists, 'job update', item.title.slice(0, 60))
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const deleteJobDoc = async (id: string, displayLabel?: string) => {
    const path = `jobs/${id}`;
    const docRef = doc(db, 'jobs', id);
    try {
      const snap = await getDoc(docRef);
      if (!snap.exists()) return;
      const readable = (displayLabel || String(snap.data().title || 'Job Update')).slice(0, 80);
      await deleteDoc(docRef);
      setState((prev) => ({
        ...prev,
        jobs: prev.jobs.filter((j) => j.id !== id),
      }));
      await logAdminActivity(`Deleted job update: ${readable}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const saveBannerDoc = async (item: BannerItem, actionHint?: AdminActionHint) => {
    const id = cleanId(item.id, 'ban');
    const path = `banners/${id}`;
    const exists = state.banners.some((b) => b.id === id);
    try {
      await setDoc(doc(db, 'banners', id), {
        id,
        title: item.title.slice(0, 200),
        subtitle: item.subtitle.slice(0, 400),
        buttonText: item.buttonText.slice(0, 60),
        bgColor: item.bgColor.slice(0, 32),
        align: item.align,
        visible: Boolean(item.visible),
        updatedAt: serverTimestamp(),
      });
      await logAdminActivity(
        describeAdminAction(actionHint, exists, 'banner', item.title.slice(0, 60))
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const deleteBannerDoc = async (id: string, displayLabel?: string) => {
    const path = `banners/${id}`;
    const docRef = doc(db, 'banners', id);
    try {
      const snap = await getDoc(docRef);
      if (!snap.exists()) return;
      const readable = (displayLabel || String(snap.data().title || 'Banner')).slice(0, 80);
      await deleteDoc(docRef);
      setState((prev) => ({
        ...prev,
        banners: prev.banners.filter((b) => b.id !== id),
      }));
      await logAdminActivity(`Deleted banner: ${readable}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const saveHomepageSectionDoc = async (
    item: HomepageSectionItem,
    order: number,
    actionHint?: AdminActionHint
  ) => {
    const id = cleanId(item.id, 'hb');
    const path = `homepageSections/${id}`;
    const exists = state.homepageSections.some((s) => s.id === id);
    try {
      await setDoc(doc(db, 'homepageSections', id), {
        id,
        key: item.key.slice(0, 64),
        name: item.name.slice(0, 100),
        heading: item.heading.slice(0, 200),
        order,
        visible: Boolean(item.visible),
        updatedAt: serverTimestamp(),
      });
      await logAdminActivity(
        describeAdminAction(actionHint, exists, 'homepage section', item.name)
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const saveHomepageSectionsOrder = async (
    items: HomepageSectionItem[],
    customLog?: string
  ) => {
    const batch = writeBatch(db);
    items.forEach((sec, idx) => {
      const id = cleanId(sec.id, 'hb');
      batch.set(doc(db, 'homepageSections', id), {
        id,
        key: sec.key.slice(0, 64),
        name: sec.name.slice(0, 100),
        heading: sec.heading.slice(0, 200),
        order: idx,
        visible: Boolean(sec.visible),
        updatedAt: serverTimestamp(),
      });
    });
    try {
      await batch.commit();
      await logAdminActivity(customLog || 'Updated homepage section order & visibility');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'homepageSections');
    }
  };

  const saveNotificationDoc = async (
    item: NotificationItem,
    actionHint?: AdminActionHint
  ) => {
    const docId = cleanId(item.docId || `nt_${item.id}`, 'nt');
    const path = `notifications/${docId}`;
    const exists = state.notificationsList.some(
      (n) => (n.docId || `nt_${n.id}`) === docId
    );
    try {
      await setDoc(doc(db, 'notifications', docId), {
        id: docId,
        numericId: Number(item.id) || Date.now(),
        type: item.type.slice(0, 60),
        title: item.title.slice(0, 200),
        message: item.message.slice(0, 800),
        audience: item.audience.slice(0, 80),
        date: item.date.slice(0, 32),
        published: Boolean(item.published),
        updatedAt: serverTimestamp(),
      });
      await logAdminActivity(
        describeAdminAction(actionHint, exists, 'notification', item.title.slice(0, 60))
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const deleteNotificationDoc = async (docId: string, displayLabel?: string) => {
    const path = `notifications/${docId}`;
    const docRef = doc(db, 'notifications', docId);
    try {
      const snap = await getDoc(docRef);
      if (!snap.exists()) return;
      const readable = (displayLabel || String(snap.data().title || 'Notification')).slice(0, 80);
      await deleteDoc(docRef);
      setState((prev) => ({
        ...prev,
        notificationsList: prev.notificationsList.filter(
          (n) => (n.docId || `nt_${n.id}`) !== docId
        ),
      }));
      await logAdminActivity(`Deleted notification: ${readable}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const saveTypingPassageDoc = async (
    item: TypingPassageItem,
    actionHint?: AdminActionHint
  ) => {
    const id = cleanId(item.id, 'tp');
    const path = `typingPassages/${id}`;
    const exists = state.typingPassages.some((tp) => tp.id === id);
    try {
      await setDoc(doc(db, 'typingPassages', id), {
        id,
        title: item.title.slice(0, 120),
        lang: item.lang,
        langLabel: item.langLabel.slice(0, 40),
        text: item.text.slice(0, 4000),
        published: Boolean(item.published),
        updatedAt: serverTimestamp(),
      });
      await logAdminActivity(
        describeAdminAction(actionHint, exists, 'typing passage', item.title)
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const deleteTypingPassageDoc = async (id: string, displayLabel?: string) => {
    const path = `typingPassages/${id}`;
    const docRef = doc(db, 'typingPassages', id);
    try {
      const snap = await getDoc(docRef);
      if (!snap.exists()) return;
      const readable = (displayLabel || String(snap.data().title || 'Typing Passage')).slice(0, 80);
      await deleteDoc(docRef);
      setState((prev) => ({
        ...prev,
        typingPassages: prev.typingPassages.filter((tp) => tp.id !== id),
      }));
      await logAdminActivity(`Deleted typing passage: ${readable}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const saveCatalogRowDoc = async (
    kind: 'exams' | 'subjects' | 'categories' | 'sitesettings',
    row: GenericRow,
    actionHint?: AdminActionHint
  ) => {
    const id = cleanId(row.id, kind);
    const path = `catalogRows/${id}`;
    const col1 =
      kind === 'sitesettings' ? String(row.key || '') : String(row.name || '');
    const col2 =
      kind === 'exams'
        ? String(row.cat || '')
        : kind === 'sitesettings'
          ? String(row.val || '')
          : String(row.desc || '');
    const exists = (state.adminTables[kind] || []).some((r) => r.id === id);
    const kindLabel =
      kind === 'exams'
        ? 'exam'
        : kind === 'subjects'
          ? 'subject'
          : kind === 'categories'
            ? 'category'
            : 'site setting';
    try {
      await setDoc(doc(db, 'catalogRows', id), {
        id,
        kind,
        col1: col1.slice(0, 160),
        col2: col2.slice(0, 300),
        col3: '',
        published: Boolean(row.pub),
        updatedAt: serverTimestamp(),
      });
      await logAdminActivity(describeAdminAction(actionHint, exists, kindLabel, col1));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const deleteCatalogRowDoc = async (
    id: string,
    displayLabel?: string,
    kindLabel?: string
  ) => {
    const path = `catalogRows/${id}`;
    const docRef = doc(db, 'catalogRows', id);
    try {
      const snap = await getDoc(docRef);
      if (!snap.exists()) return;
      const data = snap.data();
      const kind = String(data.kind || '');
      const resolvedKindLabel =
        kindLabel ||
        (kind === 'exams'
          ? 'exam'
          : kind === 'subjects'
            ? 'subject'
            : kind === 'categories'
              ? 'category'
              : kind === 'sitesettings'
                ? 'site setting'
                : 'catalog item');
      const readable = (displayLabel || String(data.col1 || 'Item')).slice(0, 80);
      await deleteDoc(docRef);
      setState((prev) => ({
        ...prev,
        adminTables: {
          ...prev.adminTables,
          exams: (prev.adminTables.exams || []).filter((r) => r.id !== id),
          subjects: (prev.adminTables.subjects || []).filter((r) => r.id !== id),
          categories: (prev.adminTables.categories || []).filter((r) => r.id !== id),
          sitesettings: (prev.adminTables.sitesettings || []).filter((r) => r.id !== id),
        },
      }));
      await logAdminActivity(`Deleted ${resolvedKindLabel}: ${readable}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const saveReportDoc = async (row: GenericRow, actionHint?: AdminActionHint) => {
    const id = cleanId(row.id, 'rp');
    const path = `reports/${id}`;
    const exists = (state.adminTables.reports || []).some((r) => r.id === id);
    try {
      await setDoc(doc(db, 'reports', id), {
        id,
        name: String(row.name || '').slice(0, 160),
        period: String(row.period || '').slice(0, 60),
        status: String(row.status || 'Ready').slice(0, 40),
        published: Boolean(row.pub),
        updatedAt: serverTimestamp(),
      });
      await logAdminActivity(
        describeAdminAction(actionHint, exists, 'report', String(row.name || id))
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const deleteReportDoc = async (id: string, displayLabel?: string) => {
    const path = `reports/${id}`;
    const docRef = doc(db, 'reports', id);
    try {
      const snap = await getDoc(docRef);
      if (!snap.exists()) return;
      const readable = (displayLabel || String(snap.data().name || 'Report')).slice(0, 80);
      await deleteDoc(docRef);
      setState((prev) => ({
        ...prev,
        adminTables: {
          ...prev.adminTables,
          reports: (prev.adminTables.reports || []).filter((r) => r.id !== id),
        },
      }));
      await logAdminActivity(`Deleted report: ${readable}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const resolveUserReadableName = (uid: string, displayLabel?: string) => {
    if (displayLabel?.trim()) return displayLabel.trim().slice(0, 100);
    const match = (state.adminTables.students || []).find((s) => s.id === uid);
    if (!match) return 'User';
    const name = String(match.name || '').trim();
    const email = String(match.email || '').trim();
    if (name && email) return `${name} (${email})`;
    return name || email || 'User';
  };

  const toggleStudentStatusDoc = async (
    uid: string,
    nextStatus: 'Active' | 'Suspended',
    displayLabel?: string
  ) => {
    const path = `users/${uid}`;
    const readable = resolveUserReadableName(uid, displayLabel);
    try {
      await updateDoc(doc(db, 'users', uid), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
      await logAdminActivity(`Updated student ${readable} status to ${nextStatus}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const updateUserRoleDoc = async (
    uid: string,
    nextRole: UserRole,
    displayLabel?: string
  ) => {
    if (!isSuperAdmin) {
      throw new Error('Only Super Admin can change user roles.');
    }
    if (auth?.currentUser?.uid === uid) {
      throw new Error('You cannot change your own role.');
    }
    const path = `users/${uid}`;
    const readable = resolveUserReadableName(uid, displayLabel);
    try {
      await updateDoc(doc(db, 'users', uid), {
        role: nextRole,
        updatedAt: serverTimestamp(),
      });
      await logAdminActivity(`Changed role for ${readable} to ${nextRole}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const fetchDashboardCounts = useCallback(async (): Promise<DashboardCountsData> => {
    const buildLocalFallback = (): DashboardCountsData => {
      const students = state.adminTables.students || [];
      const studentsActive = students.filter((s) => s.status === 'Active').length;
      const testsPublished = state.tests.filter((x) => x.published !== false).length;
      const questionsPublished = state.questions.filter((x) => x.published).length;
      const materialsPublished = state.materials.filter((x) => x.published).length;
      const coursesPublished = state.courses.filter((x) => x.published).length;
      const affairsPublished = state.affairs.filter((x) => x.published).length;
      const jobsPublished = state.jobs.filter((x) => x.published).length;
      const typingPublished = state.typingPassages.filter((x) => x.published).length;
      const notificationsPublished = state.notificationsList.filter((x) => x.published !== false).length;
      const bannersPublished = state.banners.filter((x) => x.visible).length;

      const makeStat = (key: string, label: string, total: number, published: number): DashboardCollectionStat => ({
        key,
        label,
        total,
        published,
        draft: Math.max(0, total - published),
      });

      return {
        studentsTotal: students.length,
        studentsActive,
        studentsSuspended: Math.max(0, students.length - studentsActive),
        testsTotal: state.tests.length,
        testsPublished,
        questionsTotal: state.questions.length,
        questionsPublished,
        materialsTotal: state.materials.length,
        materialsPublished,
        bannersTotal: state.banners.length,
        bannersPublished,
        coursesTotal: state.courses.length,
        coursesPublished,
        affairsTotal: state.affairs.length,
        affairsPublished,
        jobsTotal: state.jobs.length,
        jobsPublished,
        typingTotal: state.typingPassages.length,
        typingPublished,
        notificationsTotal: state.notificationsList.length,
        notificationsPublished,
        logsTotal: isSuperAdmin ? (state.adminTables.logs || []).length : undefined,
        chartData: [
          makeStat('questions', 'Questions', state.questions.length, questionsPublished),
          makeStat('tests', 'Tests', state.tests.length, testsPublished),
          makeStat('materials', 'PDFs', state.materials.length, materialsPublished),
          makeStat('courses', 'Courses', state.courses.length, coursesPublished),
          makeStat('affairs', 'Affairs', state.affairs.length, affairsPublished),
          makeStat('jobs', 'Jobs', state.jobs.length, jobsPublished),
          makeStat('typingPassages', 'Typing', state.typingPassages.length, typingPublished),
          makeStat('notifications', 'Notices', state.notificationsList.length, notificationsPublished),
          makeStat('banners', 'Banners', state.banners.length, bannersPublished),
        ],
      };
    };

    if (!isFirebaseConfigured || !db || !auth?.currentUser) {
      return buildLocalFallback();
    }

    const countPair = async (colName: string, field = 'published', value: unknown = true) => {
      const colRef = collection(db, colName);
      const [totalSnap, pubSnap] = await Promise.all([
        getCountFromServer(colRef),
        getCountFromServer(query(colRef, where(field, '==', value))),
      ]);
      return {
        total: totalSnap.data().count,
        published: pubSnap.data().count,
      };
    };

    try {
      const [
        usersRes,
        questionsRes,
        testsRes,
        materialsRes,
        coursesRes,
        affairsRes,
        jobsRes,
        typingRes,
        notificationsRes,
        bannersRes,
        logsSnap,
      ] = await Promise.all([
        countPair('users', 'status', 'Active'),
        countPair('questions'),
        countPair('tests'),
        countPair('materials'),
        countPair('courses'),
        countPair('affairs'),
        countPair('jobs'),
        countPair('typingPassages'),
        countPair('notifications'),
        countPair('banners', 'visible', true),
        isSuperAdmin ? getCountFromServer(collection(db, 'activityLogs')) : Promise.resolve(null),
      ]);

      const makeStat = (
        key: string,
        label: string,
        res: { total: number; published: number }
      ): DashboardCollectionStat => ({
        key,
        label,
        total: res.total,
        published: res.published,
        draft: Math.max(0, res.total - res.published),
      });

      return {
        studentsTotal: usersRes.total,
        studentsActive: usersRes.published,
        studentsSuspended: Math.max(0, usersRes.total - usersRes.published),
        testsTotal: testsRes.total,
        testsPublished: testsRes.published,
        questionsTotal: questionsRes.total,
        questionsPublished: questionsRes.published,
        materialsTotal: materialsRes.total,
        materialsPublished: materialsRes.published,
        bannersTotal: bannersRes.total,
        bannersPublished: bannersRes.published,
        coursesTotal: coursesRes.total,
        coursesPublished: coursesRes.published,
        affairsTotal: affairsRes.total,
        affairsPublished: affairsRes.published,
        jobsTotal: jobsRes.total,
        jobsPublished: jobsRes.published,
        typingTotal: typingRes.total,
        typingPublished: typingRes.published,
        notificationsTotal: notificationsRes.total,
        notificationsPublished: notificationsRes.published,
        logsTotal: logsSnap ? logsSnap.data().count : undefined,
        chartData: [
          makeStat('questions', 'Questions', questionsRes),
          makeStat('tests', 'Tests', testsRes),
          makeStat('materials', 'PDFs', materialsRes),
          makeStat('courses', 'Courses', coursesRes),
          makeStat('affairs', 'Affairs', affairsRes),
          makeStat('jobs', 'Jobs', jobsRes),
          makeStat('typingPassages', 'Typing', typingRes),
          makeStat('notifications', 'Notices', notificationsRes),
          makeStat('banners', 'Banners', bannersRes),
        ],
      };
    } catch {
      return buildLocalFallback();
    }
  }, [isSuperAdmin, state]);

  const resetDemoState = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState(getInitialState());
    showToast('Local preferences reset.');
  };

  const t = TRANSLATIONS[state.language] || TRANSLATIONS.en;

  return (
    <AppContext.Provider
      value={{
        state,
        t,
        toastMessage,
        showToast,
        authReady,
        firebaseUser,
        userRole,
        isAdmin,
        isSuperAdmin,
        signInWithGoogle,
        registerWithEmail,
        signInWithEmail,
        resetPassword,
        signOutUser,
        toggleTheme,
        setLanguage,
        toggleSaveMaterial,
        toggleLesson,
        toggleSyllabusKey,
        addTypingAttempt,
        addTestAttempt,
        updatePlanner,
        toggleNotifRead,
        markAllNotifsRead,
        clearAllNotifs,
        restoreNotifs,
        unreadNotificationsCount,
        updateProfile,
        saveQuestionDoc,
        saveQuestionsBatchDoc,
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
        saveHomepageSectionDoc,
        saveHomepageSectionsOrder,
        saveNotificationDoc,
        deleteNotificationDoc,
        saveTypingPassageDoc,
        deleteTypingPassageDoc,
        saveCatalogRowDoc,
        deleteCatalogRowDoc,
        saveReportDoc,
        deleteReportDoc,
        savePdfBrandingDoc,
        saveCommunityConfigDoc,
        toggleStudentStatusDoc,
        updateUserRoleDoc,
        fetchDashboardCounts,
        seedFirestoreCatalog,
        resetDemoState,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
