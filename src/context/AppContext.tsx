import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  type User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
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
  type SiteCommunityConfig,
  type StudyMaterialItem,
  type TestDefinition,
  type TypingPassageItem,
} from '../data/demoData';
import {
  ADMIN_EMAIL,
  OperationType,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
} from '../firebase';

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
  [key: string]: string | boolean;
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
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
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
  saveQuestionDoc: (item: QuestionItem) => Promise<void>;
  saveQuestionsBatchDoc: (items: QuestionItem[]) => Promise<string[]>;
  deleteQuestionDoc: (id: string) => Promise<void>;
  saveTestDoc: (item: TestDefinition) => Promise<void>;
  deleteTestDoc: (id: string) => Promise<void>;
  saveMaterialDoc: (item: StudyMaterialItem) => Promise<void>;
  deleteMaterialDoc: (id: string) => Promise<void>;
  saveCourseDoc: (item: CourseItem) => Promise<void>;
  deleteCourseDoc: (id: string) => Promise<void>;
  saveAffairDoc: (item: CurrentAffairItem) => Promise<void>;
  deleteAffairDoc: (id: string) => Promise<void>;
  saveJobDoc: (item: JobUpdateItem) => Promise<void>;
  deleteJobDoc: (id: string) => Promise<void>;
  saveBannerDoc: (item: BannerItem) => Promise<void>;
  deleteBannerDoc: (id: string) => Promise<void>;
  saveHomepageSectionDoc: (item: HomepageSectionItem, order: number) => Promise<void>;
  saveHomepageSectionsOrder: (items: HomepageSectionItem[]) => Promise<void>;
  saveNotificationDoc: (item: NotificationItem) => Promise<void>;
  deleteNotificationDoc: (docId: string) => Promise<void>;
  saveTypingPassageDoc: (item: TypingPassageItem) => Promise<void>;
  deleteTypingPassageDoc: (id: string) => Promise<void>;
  saveCatalogRowDoc: (
    kind: 'exams' | 'subjects' | 'categories' | 'sitesettings',
    row: GenericRow
  ) => Promise<void>;
  deleteCatalogRowDoc: (id: string) => Promise<void>;
  saveReportDoc: (row: GenericRow) => Promise<void>;
  deleteReportDoc: (id: string) => Promise<void>;
  savePdfBrandingDoc: (config: PdfBrandingConfig) => Promise<void>;
  saveCommunityConfigDoc: (config: SiteCommunityConfig) => Promise<void>;
  toggleStudentStatusDoc: (uid: string, nextStatus: 'Active' | 'Suspended') => Promise<void>;
  seedFirestoreCatalog: (silent?: boolean) => Promise<void>;
  resetDemoState: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const cleanId = (raw: string, fallbackPrefix: string) => {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
  return cleaned || `${fallbackPrefix}_${Date.now()}`;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PersistedState>(getInitialState);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const didAutoSeedRef = useRef(false);

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
    if (!auth.currentUser) return;
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
      if (!auth.currentUser) return;
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
          published: q.published,
          updatedAt: serverTimestamp(),
        });
      });

      INITIAL_TESTS.forEach((tst) => {
        batch.set(doc(db, 'tests', tst.id), {
          id: tst.id,
          type: tst.type,
          name: tst.name,
          subjectKeys: tst.subjectKeys,
          examIds: tst.examIds || [],
          questionIds: tst.questionIds || [],
          minutes: tst.minutes,
          negativeMarking: tst.negativeMarking,
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

  // Firebase Auth listener + User profile bootstrap
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setIsAdmin(false);
        setAuthReady(true);
        return;
      }

      let adminFlag = Boolean(user.emailVerified && user.email === ADMIN_EMAIL);
      if (!adminFlag && user.emailVerified) {
        try {
          const adminSnap = await getDoc(doc(db, 'admins', user.uid));
          adminFlag = adminSnap.exists();
        } catch {
          adminFlag = false;
        }
      }
      setIsAdmin(adminFlag);
      setAuthReady(true);

      // Sync signed-in user documents & progress if verified
      if (user.emailVerified) {
        try {
          const pubRef = doc(db, 'usersPublic', user.uid);
          const pubSnap = await getDoc(pubRef);
          const rawName = (user.displayName || '').trim();
          const safeDisplayName =
            rawName.length >= 3 && !rawName.includes('@')
              ? rawName.slice(0, 80)
              : `Learner_${user.uid.slice(0, 5)}`;

          if (!pubSnap.exists()) {
            await setDoc(pubRef, {
              uid: user.uid,
              displayName: safeDisplayName,
              targetExam: 'SSC',
              preferredLang: 'English',
              status: 'Active',
              points: 100,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } else {
            const data = pubSnap.data();
            setState((prev) => ({
              ...prev,
              profile: {
                name: String(data.displayName || safeDisplayName),
                email: user.email || '',
                exam: String(data.targetExam || 'SSC'),
                language: String(data.preferredLang || 'English'),
              },
            }));
          }

          await setDoc(
            doc(db, 'usersPrivate', user.uid),
            {
              uid: user.uid,
              email: (user.email || '').slice(0, 200),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );

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
          // Graceful non-fatal sync if user profile doc creation is restricted
        }
      }
    });
    return () => unsub();
  }, []);

  // Firestore Real-time Subscriptions
  useEffect(() => {
    if (!authReady) return;
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
          if (snap.empty) {
            if (isAdmin && !didAutoSeedRef.current) {
              didAutoSeedRef.current = true;
              void seedFirestoreCatalog(true);
            }
            return;
          }
          const list = snap.docs.map((d) => d.data() as QuestionItem);
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
            const data = d.data() as TestDefinition;
            return {
              ...data,
              examIds: Array.isArray(data.examIds) ? data.examIds : [],
              questionIds: Array.isArray(data.questionIds) ? data.questionIds : [],
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
          const list = snap.docs.map((d) => d.data() as StudyMaterialItem);
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
          const list = snap.docs.map((d) => d.data() as CourseItem);
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
          const list = snap.docs.map((d) => d.data() as CurrentAffairItem);
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
          const list = snap.docs.map((d) => d.data() as JobUpdateItem);
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
          const list = snap.docs.map((d) => d.data() as BannerItem);
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
            .map((d) => d.data() as HomepageSectionItem)
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
          const list = snap.docs.map((d) => d.data() as TypingPassageItem);
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
            if (kind === 'exams') {
              exams.push({
                id: d.id,
                name: String(data.col1 || ''),
                cat: String(data.col2 || ''),
                pub: Boolean(data.published),
              });
            } else if (kind === 'subjects') {
              subjects.push({
                id: d.id,
                name: String(data.col1 || ''),
                desc: String(data.col2 || ''),
                pub: Boolean(data.published),
              });
            } else if (kind === 'categories') {
              categories.push({
                id: d.id,
                name: String(data.col1 || ''),
                desc: String(data.col2 || ''),
                pub: Boolean(data.published),
              });
            } else if (kind === 'sitesettings') {
              sitesettings.push({
                id: d.id,
                key: String(data.col1 || ''),
                val: String(data.col2 || ''),
                pub: Boolean(data.published),
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
          collection(db, 'usersPublic'),
          (snap) => {
            const rows: GenericRow[] = snap.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                name: String(data.displayName || d.id),
                exam: String(data.targetExam || 'SSC'),
                status: String(data.status || 'Active'),
                points: String(data.points ?? 0),
                pub: data.status === 'Active',
              };
            });
            setState((prev) => ({
              ...prev,
              adminTables: { ...prev.adminTables, students: rows },
            }));
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'usersPublic')
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

      unsubs.push(
        onSnapshot(
          collection(db, 'activityLogs'),
          (snap) => {
            const rows: GenericRow[] = snap.docs
              .map((d) => {
                const data = d.data();
                return {
                  id: d.id,
                  time: String(data.time || ''),
                  who: String(data.who || ''),
                  act: String(data.act || ''),
                  pub: Boolean(data.published),
                };
              })
              .sort((a, b) => String(b.time).localeCompare(String(a.time)));
            setState((prev) => ({
              ...prev,
              adminTables: { ...prev.adminTables, logs: rows },
            }));
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'activityLogs')
        )
      );
    }

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [authReady, isAdmin, seedFirestoreCatalog]);

  // Persist user progress to Firestore when signed in
  const persistProgressToFirestore = useCallback(async (nextState: PersistedState) => {
    const user = auth.currentUser;
    if (!user || !user.emailVerified) return;
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
    await signInWithPopup(auth, googleProvider);
  };

  const signOutUser = async () => {
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
    const user = auth.currentUser;
    if (user && user.emailVerified) {
      const path = `usersPublic/${user.uid}`;
      try {
        await updateDoc(doc(db, 'usersPublic', user.uid), {
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
  const saveQuestionDoc = async (item: QuestionItem) => {
    const id = cleanId(item.id, 'q');
    const path = `questions/${id}`;
    try {
      await setDoc(doc(db, 'questions', id), {
        id,
        subjectKey: item.subjectKey.slice(0, 32),
        subjectName: item.subjectName.slice(0, 80),
        question: item.question.slice(0, 1000),
        options: item.options.slice(0, 6),
        correctIndex: item.correctIndex,
        explanation: item.explanation.slice(0, 1200),
        published: Boolean(item.published),
        updatedAt: serverTimestamp(),
      });
      await logAdminActivity(`Saved question: ${item.question.slice(0, 60)}`);
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
          savedIds.push(id);
          batch.set(doc(db, 'questions', id), {
            id,
            subjectKey: item.subjectKey.slice(0, 32),
            subjectName: item.subjectName.slice(0, 80),
            question: item.question.slice(0, 1000),
            options: item.options.slice(0, 6),
            correctIndex: Math.max(0, Math.min(item.options.length - 1, item.correctIndex)),
            explanation: item.explanation.slice(0, 1200),
            published: Boolean(item.published),
            updatedAt: serverTimestamp(),
          });
        });
        await batch.commit();
      }
      await logAdminActivity(`Bulk imported ${savedIds.length} MCQ question(s)`);
      return savedIds;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'questions');
    }
  };

  const deleteQuestionDoc = async (id: string) => {
    const path = `questions/${id}`;
    try {
      await deleteDoc(doc(db, 'questions', id));
      await logAdminActivity(`Deleted question: ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const saveTestDoc = async (item: TestDefinition) => {
    const id = cleanId(item.id, 'tst');
    const path = `tests/${id}`;
    try {
      const payload: Record<string, unknown> = {
        id,
        type: item.type,
        name: item.name.slice(0, 160),
        subjectKeys: item.subjectKeys.length ? item.subjectKeys.slice(0, 10) : ['gk'],
        examIds: (item.examIds || []).slice(0, 20),
        questionIds: (item.questionIds || []).slice(0, 200),
        minutes: Math.max(1, Math.min(360, Number(item.minutes) || 5)),
        negativeMarking: Math.max(0, Math.min(5, Number(item.negativeMarking) || 0)),
        published: item.published ?? true,
        updatedAt: serverTimestamp(),
      };
      if (item.note) payload.note = item.note.slice(0, 400);
      await setDoc(doc(db, 'tests', id), payload);
      await logAdminActivity(`Saved ${item.type}: ${item.name}`);
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

  const deleteTestDoc = async (id: string) => {
    const path = `tests/${id}`;
    try {
      await deleteDoc(doc(db, 'tests', id));
      await logAdminActivity(`Deleted test: ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const saveMaterialDoc = async (item: StudyMaterialItem) => {
    const id = cleanId(item.id, 'mat');
    const path = `materials/${id}`;
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
      await logAdminActivity(`Saved study material: ${item.title}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const deleteMaterialDoc = async (id: string) => {
    const path = `materials/${id}`;
    try {
      await deleteDoc(doc(db, 'materials', id));
      await logAdminActivity(`Deleted study material: ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const saveCourseDoc = async (item: CourseItem) => {
    const id = cleanId(item.id, 'crs');
    const path = `courses/${id}`;
    try {
      await setDoc(doc(db, 'courses', id), {
        id,
        title: item.title.slice(0, 180),
        description: item.description.slice(0, 1000),
        lessons: item.lessons.slice(0, 100),
        published: Boolean(item.published),
        updatedAt: serverTimestamp(),
      });
      await logAdminActivity(`Saved course: ${item.title}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const deleteCourseDoc = async (id: string) => {
    const path = `courses/${id}`;
    try {
      await deleteDoc(doc(db, 'courses', id));
      await logAdminActivity(`Deleted course: ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const saveAffairDoc = async (item: CurrentAffairItem) => {
    const id = cleanId(item.id, 'ca');
    const path = `affairs/${id}`;
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
      await logAdminActivity(`Saved current affair: ${item.title.slice(0, 50)}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const deleteAffairDoc = async (id: string) => {
    const path = `affairs/${id}`;
    try {
      await deleteDoc(doc(db, 'affairs', id));
      await logAdminActivity(`Deleted current affair: ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const saveJobDoc = async (item: JobUpdateItem) => {
    const id = cleanId(item.id, 'job');
    const path = `jobs/${id}`;
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
      await logAdminActivity(`Saved job update: ${item.title.slice(0, 50)}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const deleteJobDoc = async (id: string) => {
    const path = `jobs/${id}`;
    try {
      await deleteDoc(doc(db, 'jobs', id));
      await logAdminActivity(`Deleted job update: ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const saveBannerDoc = async (item: BannerItem) => {
    const id = cleanId(item.id, 'ban');
    const path = `banners/${id}`;
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
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const deleteBannerDoc = async (id: string) => {
    const path = `banners/${id}`;
    try {
      await deleteDoc(doc(db, 'banners', id));
      await logAdminActivity(`Deleted banner: ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const saveHomepageSectionDoc = async (item: HomepageSectionItem, order: number) => {
    const id = cleanId(item.id, 'hb');
    const path = `homepageSections/${id}`;
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
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const saveHomepageSectionsOrder = async (items: HomepageSectionItem[]) => {
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
      await logAdminActivity('Updated homepage section order & visibility');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'homepageSections');
    }
  };

  const saveNotificationDoc = async (item: NotificationItem) => {
    const docId = cleanId(item.docId || `nt_${item.id}`, 'nt');
    const path = `notifications/${docId}`;
    try {
      await setDoc(doc(db, 'notifications', docId), {
        id: docId,
        numericId: Number(item.id) || Date.now(),
        type: item.type.slice(0, 60),
        title: item.title.slice(0, 200),
        message: item.message.slice(0, 800),
        audience: item.audience.slice(0, 80),
        date: item.date.slice(0, 32),
        published: item.published ?? true,
        updatedAt: serverTimestamp(),
      });
      await logAdminActivity(`Saved notification: ${item.title.slice(0, 50)}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const deleteNotificationDoc = async (docId: string) => {
    const path = `notifications/${docId}`;
    try {
      await deleteDoc(doc(db, 'notifications', docId));
      await logAdminActivity(`Deleted notification: ${docId}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const saveTypingPassageDoc = async (item: TypingPassageItem) => {
    const id = cleanId(item.id, 'tp');
    const path = `typingPassages/${id}`;
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
      await logAdminActivity(`Saved typing passage: ${item.title}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const deleteTypingPassageDoc = async (id: string) => {
    const path = `typingPassages/${id}`;
    try {
      await deleteDoc(doc(db, 'typingPassages', id));
      await logAdminActivity(`Deleted typing passage: ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const saveCatalogRowDoc = async (
    kind: 'exams' | 'subjects' | 'categories' | 'sitesettings',
    row: GenericRow
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
      await logAdminActivity(`Saved ${kind} row: ${col1}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const deleteCatalogRowDoc = async (id: string) => {
    const path = `catalogRows/${id}`;
    try {
      await deleteDoc(doc(db, 'catalogRows', id));
      await logAdminActivity(`Deleted catalog item: ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const saveReportDoc = async (row: GenericRow) => {
    const id = cleanId(row.id, 'rp');
    const path = `reports/${id}`;
    try {
      await setDoc(doc(db, 'reports', id), {
        id,
        name: String(row.name || '').slice(0, 160),
        period: String(row.period || '').slice(0, 60),
        status: String(row.status || 'Ready').slice(0, 40),
        published: Boolean(row.pub),
        updatedAt: serverTimestamp(),
      });
      await logAdminActivity(`Saved report: ${String(row.name || '')}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const deleteReportDoc = async (id: string) => {
    const path = `reports/${id}`;
    try {
      await deleteDoc(doc(db, 'reports', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const toggleStudentStatusDoc = async (uid: string, nextStatus: 'Active' | 'Suspended') => {
    const path = `usersPublic/${uid}`;
    try {
      await updateDoc(doc(db, 'usersPublic', uid), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
      await logAdminActivity(`Changed student ${uid} status to ${nextStatus}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

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
        isAdmin,
        signInWithGoogle,
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
