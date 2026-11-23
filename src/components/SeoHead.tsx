import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface RouteSeoMeta {
  title: string;
  description: string;
}

const DEFAULT_META: RouteSeoMeta = {
  title: 'Learn With TG – Learn Smart, Grow Every Day.',
  description:
    'Free mock tests, daily GK quizzes, study materials, and typing practice for SSC, Railway, Banking, UPSC, and WBPSC exam students.',
};

const ROUTE_SEO_MAP: Array<{ match: (path: string) => boolean; meta: RouteSeoMeta }> = [
  {
    match: (p) => p === '/',
    meta: DEFAULT_META,
  },
  {
    match: (p) => p.startsWith('/exams'),
    meta: {
      title: 'Exam Categories & Syllabus – Learn With TG',
      description:
        'Explore SSC, Railway, Banking, UPSC, WBPSC, Police, Defence, Teaching, and Computer exam syllabus & preparation plans.',
    },
  },
  {
    match: (p) => p.startsWith('/tests') || p.startsWith('/mock-tests') || p.startsWith('/quizzes'),
    meta: {
      title: 'Free Mock Tests & Daily GK Quizzes – Learn With TG',
      description:
        'Attempt timed competitive exam mock tests, daily GK quizzes, and sectional practice sets with instant explanations.',
    },
  },
  {
    match: (p) => p.startsWith('/materials'),
    meta: {
      title: 'Free PDF Study Materials & Notes – Learn With TG',
      description:
        'Download and bookmark curated study notes, GK capsules, and PDF study materials for competitive exams.',
    },
  },
  {
    match: (p) => p.startsWith('/courses'),
    meta: {
      title: 'Free Structured Courses – Learn With TG',
      description:
        'Follow topic-wise free video and structured exam courses designed for SSC, Railway, Banking, and State exams.',
    },
  },
  {
    match: (p) => p.startsWith('/typing'),
    meta: {
      title: 'Typing Speed & Accuracy Practice – Learn With TG',
      description:
        'Practice SSC CGL, CHSL, and clerk typing tests online with live WPM, CPM, and accuracy tracking.',
    },
  },
  {
    match: (p) => p.startsWith('/affairs'),
    meta: {
      title: 'Daily Current Affairs & GK Updates – Learn With TG',
      description:
        'Read daily current affairs digests, national/international highlights, and exam-focused GK notes.',
    },
  },
  {
    match: (p) => p.startsWith('/jobs'),
    meta: {
      title: 'Latest Govt Job Alerts & Exam Dates – Learn With TG',
      description:
        'Stay updated with latest government job notifications, vacancy details, eligibility, and application deadlines.',
    },
  },
  {
    match: (p) => p.startsWith('/leaderboard'),
    meta: {
      title: 'Student Leaderboard & Top Scorers – Learn With TG',
      description:
        'Check top scorers across daily quizzes and mock tests on Learn With TG.',
    },
  },
  {
    match: (p) => p.startsWith('/planner'),
    meta: {
      title: 'Daily Study Planner & Tracker – Learn With TG',
      description:
        'Plan daily study goals, manage exam preparation tasks, and stay consistent with Learn With TG.',
    },
  },
  {
    match: (p) => p.startsWith('/dashboard'),
    meta: {
      title: 'Student Dashboard & Progress – Learn With TG',
      description:
        'Track mock test scores, accuracy trends, bookmarked PDFs, and daily learning streaks.',
    },
  },
  {
    match: (p) => p.startsWith('/about'),
    meta: {
      title: 'About Learn With TG – Free Exam Preparation Platform',
      description:
        'Learn about the mission of Learn With TG to provide free, high-quality exam preparation tools for every student.',
    },
  },
  {
    match: (p) => p.startsWith('/admin'),
    meta: {
      title: 'Admin Console – Learn With TG',
      description: 'Manage questions, mock tests, study materials, and platform settings on Learn With TG.',
    },
  },
];

function upsertMetaTag(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

export const SeoHead: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const matched = ROUTE_SEO_MAP.find((entry) => entry.match(location.pathname));
    const meta = matched?.meta ?? DEFAULT_META;
    const origin = window.location.origin;
    const canonicalUrl = `${origin}${location.pathname}`;
    const ogImageUrl = `${origin}/og-image.png`;

    document.title = meta.title;
    upsertCanonical(canonicalUrl);
    upsertMetaTag('name', 'description', meta.description);
    upsertMetaTag('property', 'og:title', meta.title);
    upsertMetaTag('property', 'og:description', meta.description);
    upsertMetaTag('property', 'og:url', canonicalUrl);
    upsertMetaTag('property', 'og:image', ogImageUrl);
    upsertMetaTag('name', 'twitter:title', meta.title);
    upsertMetaTag('name', 'twitter:description', meta.description);
    upsertMetaTag('name', 'twitter:image', ogImageUrl);
  }, [location.pathname]);

  return null;
};
