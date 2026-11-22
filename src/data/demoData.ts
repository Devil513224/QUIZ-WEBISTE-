export interface ExamCategory {
  id: string;
  name: string;
  group: 'All India' | 'State & WB' | 'Computer';
  description: string;
  quizzesCount: number;
  mocksCount: number;
  pdfsCount: number;
  stages: string[];
  subjectKeys: string[];
}

export interface SubjectSyllabus {
  key: string;
  name: string;
  topics: string[];
}

export type QuestionLanguage = 'English' | 'Bengali' | 'Hindi';

export interface QuestionItem {
  id: string;
  subjectKey: 'gk' | 'cs';
  subjectName: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  language?: QuestionLanguage;
  published: boolean;
}

export interface TestDefinition {
  id: string;
  type: 'Daily Quiz' | 'Mock Test' | 'Sectional Test' | 'Previous-Year Paper' | 'Custom Practice';
  name: string;
  subjectKeys: Array<'gk' | 'cs'>;
  examIds?: string[];
  questionIds?: string[];
  questionCount?: number;
  minutes: number;
  negativeMarking: number;
  note?: string;
  questionLimit?: number;
  shuffle?: boolean;
  published?: boolean;
}

export interface PdfBrandingConfig {
  id: string;
  brandName: string;
  tagline: string;
  footerNote: string;
  logoUrl?: string;
  logoDataUrl?: string;
  accentColor: string;
  watermarkMode?: 'both' | 'logo' | 'text' | 'none';
  watermarkText?: string;
  watermarkColor?: string;
  watermarkOpacity?: number;
  watermarkLogoUrl?: string;
  watermarkLogoDataUrl?: string;
}

export interface SiteCommunityConfig {
  id: string;
  youtubeUrl: string;
  telegramUrl: string;
  instagramUrl: string;
  whatsappUrl: string;
  facebookUrl: string;
  twitterUrl: string;
  popupEnabled: boolean;
  popupTitle: string;
  popupSubtitle: string;
  popupHighlight: string;
}

export interface StudyMaterialItem {
  id: string;
  title: string;
  subject: string;
  pages: number;
  summary: string;
  fileName?: string;
  fileSizeBytes?: number;
  pdfUrl?: string;
  pdfDataUrl?: string;
  published: boolean;
}

export interface CourseItem {
  id: string;
  title: string;
  description: string;
  lessons: string[];
  published: boolean;
}

export interface CurrentAffairItem {
  id: string;
  title: string;
  category: string;
  period: 'Daily' | 'Weekly' | 'Monthly';
  date: string;
  summary: string;
  published: boolean;
}

export interface JobUpdateItem {
  id: string;
  tab: 'Vacancies' | 'Admit Cards' | 'Results' | 'Answer Keys' | 'Exam Dates';
  title: string;
  organization: string;
  publishedDate: string;
  startDate: string;
  deadline: string;
  eligibility: string;
  officialLink?: string;
  published: boolean;
}

export interface NotificationItem {
  id: number;
  docId?: string;
  type: string;
  title: string;
  message: string;
  audience: string;
  date: string;
  published?: boolean;
}

export interface BannerItem {
  id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  bgColor: string;
  align: 'left' | 'center' | 'right';
  visible: boolean;
}

export interface HomepageSectionItem {
  id: string;
  key: string;
  name: string;
  heading: string;
  order?: number;
  visible: boolean;
}

export interface TypingPassageItem {
  id: string;
  title: string;
  lang: 'en' | 'bn' | 'hi';
  langLabel: string;
  text: string;
  published: boolean;
}

export const LOGO_URL = '/assets/aistudio/Learn_With_TG__Smart_Growth_Badge__1__04e13a98.png';

export const DEFAULT_PDF_BRANDING: PdfBrandingConfig = {
  id: 'pdf',
  brandName: 'LEARN WITH TG',
  tagline: 'Learn Smart, Grow Every Day.',
  footerNote: '100% Free Exam Preparation · Learn With TG',
  logoUrl: LOGO_URL,
  accentColor: '#102544',
  watermarkMode: 'both',
  watermarkText: 'LEARN WITH TG',
  watermarkColor: '#102544',
  watermarkOpacity: 0.08,
  watermarkLogoUrl: '',
  watermarkLogoDataUrl: '',
};

export const DEFAULT_SITE_COMMUNITY: SiteCommunityConfig = {
  id: 'main',
  youtubeUrl: 'https://www.youtube.com/@learnwithtg',
  telegramUrl: 'https://t.me/learnwithtg',
  instagramUrl: 'https://www.instagram.com/learnwithtg',
  whatsappUrl: 'https://whatsapp.com/channel/learnwithtg',
  facebookUrl: 'https://www.facebook.com/learnwithtg',
  twitterUrl: '',
  popupEnabled: true,
  popupTitle: 'Welcome to LEARN WITH TG!',
  popupSubtitle: 'Join our official channels for daily PDFs, free classes, quiz alerts & job updates.',
  popupHighlight:
    'New quizzes, mock tests & free study material PDFs are added daily. Join Telegram & WhatsApp so you never miss an update!',
};

export const SUBJECT_SYLLABI: Record<string, SubjectSyllabus> = {
  gk: {
    key: 'gk',
    name: 'General Awareness',
    topics: ['History', 'Indian Polity', 'Geography', 'Economy', 'Static GK'],
  },
  qa: {
    key: 'qa',
    name: 'Quantitative Aptitude',
    topics: ['Percentages', 'Ratio and proportion', 'Time and work', 'Geometry'],
  },
  rs: {
    key: 'rs',
    name: 'Reasoning',
    topics: ['Number series', 'Coding-decoding', 'Syllogism', 'Puzzles'],
  },
  en: {
    key: 'en',
    name: 'English',
    topics: ['Grammar', 'Vocabulary', 'Reading comprehension'],
  },
  cs: {
    key: 'cs',
    name: 'Computer Knowledge',
    topics: ['Hardware', 'Software', 'MS Office', 'Internet & Networking'],
  },
  wb: {
    key: 'wb',
    name: 'West Bengal GK',
    topics: ['WB History', 'WB Geography', 'Culture & Heritage', 'State Schemes'],
  },
  ed: {
    key: 'ed',
    name: 'Teaching Aptitude',
    topics: ['Child development', 'Pedagogy', 'Learning theories'],
  },
};

export const EXAM_ROADMAP = [
  'Read the official syllabus',
  'Finish core study materials',
  'Take topic-wise quizzes',
  'Attempt full-length mock tests',
  'Revise weak topics',
];

export const EXAM_CATEGORIES: ExamCategory[] = [
  {
    id: 'ssc',
    name: 'SSC',
    group: 'All India',
    description: 'CGL, CHSL, MTS and GD Constable central recruitment preparation.',
    quizzesCount: 24,
    mocksCount: 18,
    pdfsCount: 60,
    stages: ['Tier 1 (Computer-based objective)', 'Tier 2 (Objective)', 'Skill or document verification'],
    subjectKeys: ['gk', 'qa', 'rs', 'en'],
  },
  {
    id: 'railway',
    name: 'Railway',
    group: 'All India',
    description: 'RRB NTPC, Group D, ALP and Technician exam preparation.',
    quizzesCount: 18,
    mocksCount: 14,
    pdfsCount: 45,
    stages: ['CBT Stage 1', 'CBT Stage 2 / Skill test', 'Document & medical verification'],
    subjectKeys: ['gk', 'qa', 'rs'],
  },
  {
    id: 'banking',
    name: 'Banking',
    group: 'All India',
    description: 'IBPS PO/Clerk, SBI and RBI assistant preparation.',
    quizzesCount: 20,
    mocksCount: 16,
    pdfsCount: 52,
    stages: ['Preliminary exam', 'Mains exam', 'Interview / Language proficiency'],
    subjectKeys: ['qa', 'rs', 'en', 'gk'],
  },
  {
    id: 'upsc',
    name: 'UPSC',
    group: 'All India',
    description: 'Civil Services Prelims, Mains and NDA/CDS foundation.',
    quizzesCount: 15,
    mocksCount: 10,
    pdfsCount: 70,
    stages: ['Preliminary exam', 'Mains written exam', 'Personality test / Interview'],
    subjectKeys: ['gk', 'en'],
  },
  {
    id: 'state-psc',
    name: 'State PSC',
    group: 'State & WB',
    description: 'State Public Service Commission combined and miscellaneous services.',
    quizzesCount: 16,
    mocksCount: 12,
    pdfsCount: 40,
    stages: ['Preliminary objective', 'Mains descriptive/objective', 'Interview'],
    subjectKeys: ['gk', 'qa', 'rs', 'en'],
  },
  {
    id: 'police',
    name: 'Police',
    group: 'All India',
    description: 'State Police Constable, SI and Sub-Inspector recruitment.',
    quizzesCount: 12,
    mocksCount: 9,
    pdfsCount: 30,
    stages: ['Preliminary written test', 'PMT / PET physical test', 'Final written & interview'],
    subjectKeys: ['gk', 'qa', 'rs', 'wb'],
  },
  {
    id: 'defence',
    name: 'Defence',
    group: 'All India',
    description: 'Agniveer, CAPF, CDS and AFCAT competitive exam practice.',
    quizzesCount: 14,
    mocksCount: 11,
    pdfsCount: 32,
    stages: ['Written examination', 'SSB / Physical standard test', 'Medical fitness'],
    subjectKeys: ['gk', 'qa', 'rs', 'en'],
  },
  {
    id: 'teaching',
    name: 'Teaching',
    group: 'All India',
    description: 'CTET, WB TET, SSC SLST and school service preparation.',
    quizzesCount: 10,
    mocksCount: 8,
    pdfsCount: 26,
    stages: ['Eligibility test (TET)', 'Subject recruitment exam', 'Document verification'],
    subjectKeys: ['ed', 'en', 'gk'],
  },
  {
    id: 'wb',
    name: 'West Bengal Govt Exams',
    group: 'State & WB',
    description: 'WBCS, WBP Constable/SI, WBSSC Clerkship and Food SI.',
    quizzesCount: 22,
    mocksCount: 15,
    pdfsCount: 48,
    stages: ['Preliminary exam', 'Mains exam', 'Personality test / Interview'],
    subjectKeys: ['gk', 'wb', 'qa', 'rs', 'en'],
  },
  {
    id: 'computer',
    name: 'Computer Knowledge',
    group: 'Computer',
    description: 'Fundamentals, MS Office, shortcuts and cyber awareness.',
    quizzesCount: 14,
    mocksCount: 6,
    pdfsCount: 34,
    stages: ['Topic-wise practice', 'Speed & shortcut drills'],
    subjectKeys: ['cs'],
  },
];

export const INITIAL_QUESTIONS: QuestionItem[] = [
  {
    id: 'q1',
    subjectKey: 'gk',
    subjectName: 'General Knowledge',
    question: 'What is the capital of West Bengal?',
    options: ['Howrah', 'Kolkata', 'Siliguri', 'Durgapur'],
    correctIndex: 1,
    explanation: 'Kolkata has been the capital of West Bengal since 1947.',
    language: 'English',
    published: true,
  },
  {
    id: 'q2',
    subjectKey: 'gk',
    subjectName: 'General Knowledge',
    question: 'Who wrote the poetry collection Gitanjali?',
    options: [
      'Rabindranath Tagore',
      'Kazi Nazrul Islam',
      'Jibanananda Das',
      'Bankim Chandra Chatterjee',
    ],
    correctIndex: 0,
    explanation: 'Rabindranath Tagore received the 1913 Nobel Prize in Literature for Gitanjali.',
    language: 'English',
    published: true,
  },
  {
    id: 'q3',
    subjectKey: 'gk',
    subjectName: 'General Knowledge',
    question: 'Which river is the longest flowing mainly within India?',
    options: ['Yamuna', 'Godavari', 'Ganga', 'Brahmaputra'],
    correctIndex: 2,
    explanation: 'The Ganga is the longest river flowing primarily within India.',
    language: 'English',
    published: true,
  },
  {
    id: 'q4',
    subjectKey: 'gk',
    subjectName: 'General Knowledge',
    question: 'Article 21 of the Indian Constitution protects which fundamental right?',
    options: [
      'Freedom of speech',
      'Protection of life and personal liberty',
      'Right to property',
      'Right against exploitation',
    ],
    correctIndex: 1,
    explanation: 'Article 21 guarantees the protection of life and personal liberty.',
    language: 'English',
    published: true,
  },
  {
    id: 'q5',
    subjectKey: 'gk',
    subjectName: 'General Knowledge',
    question: 'Who was the first Prime Minister of independent India?',
    options: ['Sardar Patel', 'Rajendra Prasad', 'Jawaharlal Nehru', 'Lal Bahadur Shastri'],
    correctIndex: 2,
    explanation: 'Jawaharlal Nehru took office on 15 August 1947.',
    language: 'English',
    published: true,
  },
  {
    id: 'q6',
    subjectKey: 'cs',
    subjectName: 'Computer Knowledge',
    question: 'What does CPU stand for?',
    options: [
      'Central Processing Unit',
      'Computer Personal Unit',
      'Central Program Utility',
      'Control Processing Unit',
    ],
    correctIndex: 0,
    explanation: 'The CPU (Central Processing Unit) executes program instructions.',
    language: 'English',
    published: true,
  },
  {
    id: 'q7',
    subjectKey: 'cs',
    subjectName: 'Computer Knowledge',
    question: 'Which of these is primarily an output device?',
    options: ['Keyboard', 'Scanner', 'Mouse', 'Monitor'],
    correctIndex: 3,
    explanation: 'A monitor displays visual output; keyboard, scanner and mouse are input devices.',
    language: 'English',
    published: true,
  },
  {
    id: 'q8',
    subjectKey: 'cs',
    subjectName: 'Computer Knowledge',
    question: 'How many bits make one byte?',
    options: ['4', '8', '16', '32'],
    correctIndex: 1,
    explanation: 'One byte equals 8 bits.',
    language: 'English',
    published: true,
  },
  {
    id: 'q9',
    subjectKey: 'cs',
    subjectName: 'Computer Knowledge',
    question: 'Which keyboard shortcut copies selected text in Windows?',
    options: ['Ctrl + V', 'Ctrl + X', 'Ctrl + C', 'Ctrl + Z'],
    correctIndex: 2,
    explanation: 'Ctrl + C copies, Ctrl + V pastes, Ctrl + X cuts, and Ctrl + Z undoes.',
    language: 'English',
    published: true,
  },
  {
    id: 'q10',
    subjectKey: 'cs',
    subjectName: 'Computer Knowledge',
    question: 'RAM is classified as which type of memory?',
    options: ['Volatile', 'Permanent', 'Read-only', 'Optical'],
    correctIndex: 0,
    explanation: 'RAM is volatile memory because it loses its contents when power turns off.',
    language: 'English',
    published: true,
  },
];

export const INITIAL_TESTS: TestDefinition[] = [
  {
    id: 'dq',
    type: 'Daily Quiz',
    name: 'Daily GK Quiz',
    subjectKeys: ['gk', 'cs'],
    examIds: ['ssc', 'wb', 'railway'],
    questionCount: 10,
    minutes: 5,
    negativeMarking: 0,
    shuffle: true,
    published: true,
  },
  {
    id: 'mt',
    type: 'Mock Test',
    name: 'Free Mock Test 1: GK & Computer',
    subjectKeys: ['gk', 'cs'],
    examIds: ['ssc', 'railway', 'wb', 'computer'],
    questionCount: 50,
    minutes: 40,
    negativeMarking: 0.25,
    shuffle: false,
    published: true,
  },
  {
    id: 'sg',
    type: 'Sectional Test',
    name: 'General Knowledge Sectional',
    subjectKeys: ['gk'],
    examIds: ['upsc', 'state-psc', 'wb'],
    questionCount: 20,
    minutes: 15,
    negativeMarking: 0.25,
    published: true,
  },
  {
    id: 'st',
    type: 'Sectional Test',
    name: 'Computer Knowledge Sectional',
    subjectKeys: ['cs'],
    examIds: ['computer', 'banking', 'ssc'],
    questionCount: 20,
    minutes: 15,
    negativeMarking: 0.25,
    published: true,
  },
  {
    id: 'py',
    type: 'Previous-Year Paper',
    name: 'Sample Paper in Previous-Year Format',
    subjectKeys: ['gk', 'cs'],
    examIds: ['ssc', 'wb', 'police'],
    questionCount: 50,
    minutes: 40,
    negativeMarking: 0.25,
    note: 'Sample paper in previous-year format (Demo only).',
    published: true,
  },
];

export const INITIAL_MATERIALS: StudyMaterialItem[] = [
  {
    id: 'm1',
    title: 'Computer Basics Notes',
    subject: 'Computer Knowledge',
    pages: 32,
    summary: 'Hardware, memory hierarchy, OS basics and shortcut keys.',
    published: true,
  },
  {
    id: 'm2',
    title: 'Indian Polity: Fundamental Rights',
    subject: 'Indian Polity',
    pages: 24,
    summary: 'Articles 12 to 35 explained with landmark amendments.',
    published: true,
  },
  {
    id: 'm3',
    title: 'Reasoning: Series and Coding',
    subject: 'Reasoning',
    pages: 40,
    summary: 'Number patterns, letter shifts and solved practice sets.',
    published: true,
  },
  {
    id: 'm4',
    title: 'West Bengal GK Capsule',
    subject: 'West Bengal GK',
    pages: 28,
    summary: 'Districts, rivers, national parks and cultural milestones of WB.',
    published: true,
  },
  {
    id: 'm5',
    title: 'Quantitative Aptitude Formulas',
    subject: 'Mathematics',
    pages: 18,
    summary: 'Quick revision sheet for percentages, profit-loss and geometry.',
    published: true,
  },
  {
    id: 'm6',
    title: 'General Science Quick Revision',
    subject: 'General Science',
    pages: 36,
    summary: 'Physics units, chemical formulas and human biology highlights.',
    published: true,
  },
  {
    id: 'm7',
    title: 'Indian History Timeline',
    subject: 'Indian History',
    pages: 30,
    summary: 'Ancient, medieval and modern freedom struggle chronology.',
    published: true,
  },
  {
    id: 'm8',
    title: 'English Grammar Essentials',
    subject: 'English',
    pages: 22,
    summary: 'Tenses, prepositions, voice change and common error spotting.',
    published: true,
  },
];

export const INITIAL_COURSES: CourseItem[] = [
  {
    id: 'c1',
    title: 'Computer Fundamentals',
    description: 'Hardware, software, MS Office and internet basics for SSC & Banking.',
    lessons: [
      '01. What is a computer?',
      '02. Input and output devices',
      '03. Memory and storage',
      '04. Operating systems & shortcuts',
    ],
    published: true,
  },
  {
    id: 'c2',
    title: 'Indian Polity Basics',
    description: 'Constitution, Fundamental Rights, Directive Principles and Parliament.',
    lessons: [
      '01. Making of the Constitution',
      '02. Fundamental Rights (Articles 12–35)',
      '03. Structure of Parliament',
    ],
    published: true,
  },
  {
    id: 'c3',
    title: 'West Bengal GK Foundation',
    description: 'History, geography, rivers and administrative structure of West Bengal.',
    lessons: [
      '01. Districts and major rivers',
      '02. Literary figures and reformers',
      '03. Cultural heritage and festivals',
    ],
    published: true,
  },
];

export const TYPING_PASSAGES: Record<'en' | 'bn' | 'hi', string> = {
  en: 'Practice every day and your speed will improve steadily. Accuracy matters more than raw speed in the beginning, so focus on pressing the right keys smoothly.',
  bn: 'প্রতিদিন অনুশীলন করলে আপনার গতি ধীরে ধীরে বাড়বে। শুরুতে গতির চেয়ে নির্ভুলতা বেশি গুরুত্বপূর্ণ, তাই মন দিয়ে সঠিক অক্ষরে চাপ দিন।',
  hi: 'रोज़ अभ्यास करने से आपकी टाइपिंग गति लगातार बढ़ेगी। शुरुआत में गति से ज्यादा शुद्धता महत्वपूर्ण होती है, इसलिए सही कुंजी दबाने पर ध्यान दें।',
};

export const INITIAL_TYPING_PASSAGES: TypingPassageItem[] = [
  {
    id: 'tp1',
    title: 'Daily English Practice',
    lang: 'en',
    langLabel: 'English',
    text: TYPING_PASSAGES.en,
    published: true,
  },
  {
    id: 'tp2',
    title: 'Bengali Practice Passage',
    lang: 'bn',
    langLabel: 'Bengali',
    text: TYPING_PASSAGES.bn,
    published: true,
  },
  {
    id: 'tp3',
    title: 'Hindi Practice Passage',
    lang: 'hi',
    langLabel: 'Hindi',
    text: TYPING_PASSAGES.hi,
    published: true,
  },
];

export const INITIAL_AFFAIRS: CurrentAffairItem[] = [
  {
    id: 'ca1',
    title: 'Sample headline: Quarterly economic growth outlook released',
    category: 'Economy',
    period: 'Daily',
    date: '2026-11-19',
    summary: 'Sample summary highlighting key fiscal indicators for exam notes.',
    published: true,
  },
  {
    id: 'ca2',
    title: 'Sample headline: New space observation satellite mission announced',
    category: 'Science',
    period: 'Daily',
    date: '2026-11-18',
    summary: 'Sample science briefing covering launch vehicle and orbital objective.',
    published: true,
  },
  {
    id: 'ca3',
    title: 'Sample headline: West Bengal student scholarship portal update',
    category: 'West Bengal',
    period: 'Weekly',
    date: '2026-11-15',
    summary: 'Sample state governance update for WBCS and WBP aspirants.',
    published: true,
  },
  {
    id: 'ca4',
    title: 'Sample headline: International clean energy summit concludes',
    category: 'International',
    period: 'Weekly',
    date: '2026-11-14',
    summary: 'Sample summary of multilateral climate commitments.',
    published: true,
  },
  {
    id: 'ca5',
    title: 'Sample headline: Annual national sports awards list published',
    category: 'Sports',
    period: 'Monthly',
    date: '2026-10-30',
    summary: 'Sample compilation of awardees across athletics and chess.',
    published: true,
  },
  {
    id: 'ca6',
    title: 'Sample headline: Parliamentary committee review on digital education',
    category: 'Polity',
    period: 'Monthly',
    date: '2026-10-22',
    summary: 'Sample policy brief relevant to General Studies Paper II.',
    published: true,
  },
];

export const INITIAL_JOBS: JobUpdateItem[] = [
  {
    id: 'j1',
    tab: 'Vacancies',
    title: 'Sample: Constable Recruitment 2026',
    organization: 'Sample Police Recruitment Board',
    publishedDate: '2026-11-10',
    startDate: '2026-11-15',
    deadline: '2026-12-30',
    eligibility: 'Graduate or equivalent, age 18 to 27 years',
    published: true,
  },
  {
    id: 'j2',
    tab: 'Vacancies',
    title: 'Sample: Junior Clerk Vacancy',
    organization: 'Sample State Commission',
    publishedDate: '2026-11-05',
    startDate: '2026-11-08',
    deadline: '2027-01-15',
    eligibility: '12th pass with basic computer knowledge',
    published: true,
  },
  {
    id: 'j3',
    tab: 'Admit Cards',
    title: 'Sample: Clerk Prelims Admit Card',
    organization: 'Sample Banking Board',
    publishedDate: '2026-11-18',
    startDate: '-',
    deadline: '-',
    eligibility: 'Download using registration number and date of birth',
    published: true,
  },
  {
    id: 'j4',
    tab: 'Results',
    title: 'Sample: Combined Prelims Result List',
    organization: 'Sample Service Commission',
    publishedDate: '2026-11-12',
    startDate: '-',
    deadline: '-',
    eligibility: 'Check roll number in provisional merit PDF',
    published: true,
  },
  {
    id: 'j5',
    tab: 'Answer Keys',
    title: 'Sample: Provisional Answer Key & Objections',
    organization: 'Sample Railway Board',
    publishedDate: '2026-11-16',
    startDate: '-',
    deadline: '2026-11-25',
    eligibility: 'Objections accepted online until deadline shown',
    published: true,
  },
  {
    id: 'j6',
    tab: 'Exam Dates',
    title: 'Sample: Typing & Skill Test Schedule',
    organization: 'Sample Recruitment Board',
    publishedDate: '2026-11-17',
    startDate: '-',
    deadline: '-',
    eligibility: 'Shift-wise reporting schedule published in sample notice',
    published: true,
  },
];

export const LEADERBOARD_DATA: Record<'Daily' | 'Weekly' | 'Monthly', Array<{ name: string; points: number }>> = {
  Daily: [
    { name: 'Learner_4821', points: 310 },
    { name: 'Aspirant_0937', points: 295 },
    { name: 'Topper_5560', points: 270 },
    { name: 'Student_2214', points: 240 },
    { name: 'Reader_7783', points: 215 },
  ],
  Weekly: [
    { name: 'Aspirant_0937', points: 1240 },
    { name: 'Learner_4821', points: 1175 },
    { name: 'Topper_5560', points: 1102 },
    { name: 'Scholar_3391', points: 980 },
    { name: 'Student_2214', points: 940 },
  ],
  Monthly: [
    { name: 'Topper_5560', points: 4820 },
    { name: 'Learner_4821', points: 4610 },
    { name: 'Aspirant_0937', points: 4450 },
    { name: 'Scholar_3391', points: 3900 },
    { name: 'Reader_7783', points: 3720 },
  ],
};

export const ACHIEVEMENT_BADGES = ['Quick starter', '7-day streak', '100 questions', 'Top 10'];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1,
    type: 'Quiz',
    title: 'New daily GK quiz is ready',
    message: "Sample: Take today's quiz to keep your streak going.",
    audience: 'All students',
    date: '2026-11-20',
  },
  {
    id: 2,
    type: 'Mock test',
    title: 'New free mock test added',
    message: 'Sample: GK and Computer mock test with 10 questions.',
    audience: 'All students',
    date: '2026-11-19',
  },
  {
    id: 3,
    type: 'PDF',
    title: 'New study material uploaded',
    message: 'Sample: West Bengal GK Capsule is now available.',
    audience: 'West Bengal aspirants',
    date: '2026-11-18',
  },
  {
    id: 4,
    type: 'Current affairs',
    title: 'Weekly current affairs updated',
    message: "Sample: This week's summary is available.",
    audience: 'All students',
    date: '2026-11-17',
  },
  {
    id: 5,
    type: 'Job update',
    title: 'Sample vacancy notice',
    message: 'Sample, not a real vacancy. Always verify on the official notification.',
    audience: 'SSC aspirants',
    date: '2026-11-16',
  },
  {
    id: 6,
    type: 'Announcement',
    title: 'Typing practice now in 3 languages',
    message: 'Sample: English, Bengali and Hindi passages are available.',
    audience: 'All students',
    date: '2026-11-15',
  },
  {
    id: 7,
    type: 'Exam notice',
    title: 'Sample exam date announcement',
    message: 'Sample, not a real exam date. Confirm on the official website.',
    audience: 'West Bengal aspirants',
    date: '2026-11-12',
  },
];

export const INITIAL_BANNERS: BannerItem[] = [
  {
    id: 'b1',
    title: 'Your Complete Destination for Exam Preparation',
    subtitle: 'Free mock tests and quizzes for SSC, Railway & WB exams',
    buttonText: 'Start Learning',
    bgColor: '#102544',
    align: 'left',
    visible: true,
  },
  {
    id: 'b2',
    title: 'Daily GK Quiz Challenge',
    subtitle: 'Keep your study streak alive with quick daily revision',
    buttonText: 'Take the quiz',
    bgColor: '#1B3A6B',
    align: 'center',
    visible: true,
  },
];

export const INITIAL_HOMEPAGE_SECTIONS: HomepageSectionItem[] = [
  { id: 'hb1', key: 'hero', name: 'Hero banner', heading: 'Your Complete Destination for Exam Preparation', visible: true },
  { id: 'hb2', key: 'exams', name: 'Exam categories', heading: 'Explore exam categories', visible: true },
  { id: 'hb3', key: 'mocks', name: 'Popular mock tests', heading: 'Popular mock tests', visible: true },
  { id: 'hb4', key: 'quiz', name: 'Daily GK question', heading: 'Daily GK question', visible: true },
  { id: 'hb5', key: 'jobs', name: 'Government job updates', heading: 'Government job updates', visible: true },
  { id: 'hb6', key: 'why', name: 'Why Learn With TG', heading: 'Why Learn With TG', visible: true },
  { id: 'hb7', key: 'faq', name: 'FAQ', heading: 'Frequently asked questions', visible: true },
];
