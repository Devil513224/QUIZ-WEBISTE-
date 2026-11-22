import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DemoLabel, EmptyState } from '../components/CommonUI';
import { EXAM_CATEGORIES, LEADERBOARD_DATA } from '../data/demoData';

export const HomePage: React.FC = () => {
  const { state, t } = useApp();
  const [heroSelected, setHeroSelected] = useState<number | null>(null);
  const [heroSeconds, setHeroSeconds] = useState(3599);
  const [examSearch, setExamSearch] = useState('');
  const [examFilter, setExamFilter] = useState<'All' | 'All India' | 'State & WB' | 'Computer'>('All');
  const [gkSelected, setGkSelected] = useState<number | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      setHeroSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const formatTimer = (secs: number) =>
    `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;

  const filteredExams = EXAM_CATEGORIES.filter((item) => {
    const matchesGroup = examFilter === 'All' || item.group === examFilter;
    const matchesSearch =
      !examSearch.trim() ||
      item.name.toLowerCase().includes(examSearch.trim().toLowerCase()) ||
      item.description.toLowerCase().includes(examSearch.trim().toLowerCase());
    return matchesGroup && matchesSearch;
  });

  const filterChips: Array<{ id: 'All' | 'All India' | 'State & WB' | 'Computer'; label: string }> = [
    { id: 'All', label: t.home.catAll },
    { id: 'All India', label: t.home.catAllIndia },
    { id: 'State & WB', label: t.home.catState },
    { id: 'Computer', label: t.home.catComputer },
  ];

  const isSectionVisible = (key: string) => {
    const found = state.homepageSections.find((s) => s.key === key);
    return found ? found.visible : true;
  };

  const getSectionHeading = (key: string, fallback: string) => {
    const found = state.homepageSections.find((s) => s.key === key);
    if (!found) return fallback;
    return state.language === 'en' ? found.heading : fallback;
  };

  const isLightHexColor = (hex: string) => {
    const clean = (hex || '').replace('#', '').trim();
    if (!/^[0-9a-fA-F]{6}$/.test(clean) && !/^[0-9a-fA-F]{3}$/.test(clean)) return false;
    const full =
      clean.length === 3
        ? clean
            .split('')
            .map((c) => c + c)
            .join('')
        : clean;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.62;
  };

  const heroBanner = state.banners.find((b) => b.id === 'b1') || state.banners[0];
  const heroBg =
    heroBanner?.bgColor && /^#[0-9a-fA-F]{3,8}$/.test(heroBanner.bgColor)
      ? heroBanner.bgColor
      : '#102544';
  const heroIsLight = isLightHexColor(heroBg);
  const heroTitleText =
    heroBanner &&
    (state.language === 'en' ||
      heroBanner.title !== 'Your Complete Destination for Exam Preparation')
      ? heroBanner.title
      : t.home.heroTitle;
  const heroSubtitleText =
    heroBanner &&
    (state.language === 'en' ||
      heroBanner.subtitle !== 'Free mock tests and quizzes for SSC, Railway & WB exams')
      ? heroBanner.subtitle
      : t.home.heroSubtitle;
  const heroButtonText =
    heroBanner && (state.language === 'en' || heroBanner.buttonText !== 'Start Learning')
      ? heroBanner.buttonText
      : t.home.startLearning;
  const heroAlignClass =
    heroBanner?.align === 'center'
      ? 'text-center'
      : heroBanner?.align === 'right'
        ? 'text-right'
        : 'text-left';
  const extraVisibleBanners = state.banners.filter(
    (b) => b.visible && b.id !== heroBanner?.id
  );

  return (
    <div>
      {/* Hero Section */}
      {isSectionVisible('hero') && (!heroBanner || heroBanner.visible !== false) && (
        <section
          className={`py-14 transition-colors sm:py-16 ${
            heroIsLight ? 'text-[#0f172a]' : 'text-white'
          }`}
          style={{ backgroundColor: heroBg }}
        >
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 sm:px-6 lg:grid-cols-12">
            <div className={`lg:col-span-7 ${heroAlignClass}`}>
              <h1
                className={`font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl ${
                  heroIsLight ? 'text-[#0f172a]' : 'text-white'
                }`}
                style={{ textWrap: 'balance' }}
              >
                {heroTitleText}
              </h1>
              <p
                className={`mt-4 max-w-xl text-base leading-relaxed sm:text-lg ${
                  heroBanner?.align === 'center'
                    ? 'mx-auto'
                    : heroBanner?.align === 'right'
                      ? 'ml-auto'
                      : ''
                } ${heroIsLight ? 'text-slate-800' : 'text-[#c7d3e6]'}`}
              >
                {heroSubtitleText}
              </p>

              <div
                className={`mt-7 flex flex-wrap gap-3 ${
                  heroBanner?.align === 'center'
                    ? 'justify-center'
                    : heroBanner?.align === 'right'
                      ? 'justify-end'
                      : 'justify-start'
                }`}
              >
                <Link
                  to="/tests"
                  className={`inline-flex h-11 items-center justify-center whitespace-nowrap rounded-xl px-6 text-sm font-bold transition-transform hover:brightness-95 active:scale-[0.99] ${
                    heroIsLight
                      ? 'bg-[#102544] text-white'
                      : 'bg-[#facc15] text-[#102544]'
                  }`}
                >
                  {heroButtonText}
                </Link>
                <Link
                  to="/tests?type=Mock+Test"
                  className={`inline-flex h-11 items-center justify-center whitespace-nowrap rounded-xl border-2 px-6 text-sm font-semibold transition-colors ${
                    heroIsLight
                      ? 'border-[#102544] text-[#102544] hover:bg-[#102544]/10'
                      : 'border-white/80 text-white hover:bg-white/10'
                  }`}
                >
                  {t.home.exploreMocks}
                </Link>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setExamFilter('All');
                  document.getElementById('exam-categories')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`mt-7 flex max-w-md overflow-hidden rounded-xl bg-white shadow-sm ${
                  heroBanner?.align === 'center'
                    ? 'mx-auto'
                    : heroBanner?.align === 'right'
                      ? 'ml-auto'
                      : ''
                }`}
                role="search"
              >
                <input
                  type="search"
                  value={examSearch}
                  onChange={(e) => setExamSearch(e.target.value)}
                  placeholder={t.home.searchExamPlaceholder}
                  aria-label={t.home.searchExamPlaceholder}
                  className="h-11 min-w-0 flex-1 border-0 bg-transparent px-4 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className={`inline-flex shrink-0 items-center gap-1.5 px-5 text-sm font-bold hover:brightness-95 ${
                    heroIsLight
                      ? 'bg-[#102544] text-white'
                      : 'bg-[#facc15] text-[#102544]'
                  }`}
                >
                  <Search className="h-4 w-4" />
                  <span>{t.home.searchExamBtn}</span>
                </button>
              </form>
            </div>

            {/* Sample Exam Preview Card */}
            <div className="lg:col-span-5">
              <div className="overflow-hidden rounded-2xl bg-white text-slate-900 shadow-2xl dark:bg-[#122443] dark:text-slate-100">
                <div className="flex items-center justify-between bg-[#1b3a6b] px-4 py-3 text-xs sm:text-sm text-white">
                  <span className="font-medium">{t.home.samplePaperLabel}</span>
                  <span>
                    {t.home.timeLeft}{' '}
                    <strong className="font-mono-num text-[#facc15]">{formatTimer(heroSeconds)}</strong>
                  </span>
                </div>

                <div className="p-5">
                  <DemoLabel text={t.home.demoQuestionTag} />
                  <h2 className="mt-1.5 font-display text-lg font-bold text-slate-900 dark:text-white">
                    {t.home.heroQuestion}
                  </h2>

                  <div className="mt-4 space-y-2">
                    {t.home.heroOptions.map((opt, idx) => {
                      const isSel = heroSelected === idx;
                      const isCorrect = idx === 0;
                      let style =
                        'border-slate-200 bg-white text-slate-800 hover:border-[#102544] dark:border-[#24385c] dark:bg-[#122443] dark:text-slate-100 dark:hover:border-[#facc15]';
                      if (heroSelected !== null) {
                        if (isCorrect) {
                          style =
                            'border-emerald-600 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200';
                        } else if (isSel) {
                          style =
                            'border-red-600 bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-200';
                        }
                      }

                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setHeroSelected(idx)}
                          className={`flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium transition-colors ${style}`}
                        >
                          <span className="font-mono-num font-bold text-slate-500 dark:text-[#9fb0c8]">
                            {'ABCD'[idx]}.
                          </span>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {heroSelected !== null && (
                    <p className="mt-3 text-xs font-medium text-slate-700 dark:text-slate-300">
                      {heroSelected === 0 ? t.home.heroCorrectNote : t.home.heroWrongNote}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-1.5" aria-hidden="true">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <span
                        key={n}
                        className={`grid h-7 w-7 place-items-center rounded-md font-mono-num text-xs font-bold ${
                          n === 1
                            ? heroSelected !== null
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[#facc15] text-[#102544]'
                            : 'bg-[#eef2f8] text-slate-500 dark:bg-[#16294b] dark:text-[#9fb0c8]'
                        }`}
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2.5 text-xs text-slate-500 dark:text-[#9fb0c8]">{t.home.heroPaletteNote}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Additional Admin Promotional Banners */}
      {extraVisibleBanners.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
          <div className="grid grid-cols-1 gap-4">
            {extraVisibleBanners.map((b) => {
              const bg = /^#[0-9a-fA-F]{3,8}$/.test(b.bgColor || '') ? b.bgColor : '#1b3a6b';
              const light = isLightHexColor(bg);
              const alignCls =
                b.align === 'center'
                  ? 'text-center items-center'
                  : b.align === 'right'
                    ? 'text-right items-end'
                    : 'text-left items-start';
              return (
                <div
                  key={b.id}
                  className={`flex flex-col justify-between gap-4 rounded-2xl p-6 shadow-sm sm:flex-row sm:items-center ${
                    light ? 'text-[#0f172a]' : 'text-white'
                  }`}
                  style={{ backgroundColor: bg }}
                >
                  <div className={`flex flex-1 flex-col ${alignCls}`}>
                    <h2 className="font-display text-lg font-extrabold sm:text-xl">{b.title}</h2>
                    {b.subtitle && (
                      <p
                        className={`mt-1 text-xs sm:text-sm ${
                          light ? 'text-slate-800' : 'text-slate-200'
                        }`}
                      >
                        {b.subtitle}
                      </p>
                    )}
                  </div>
                  {b.buttonText && (
                    <Link
                      to="/tests?type=Daily+Quiz"
                      className={`inline-flex shrink-0 items-center justify-center rounded-xl px-5 py-2.5 text-xs font-bold transition-transform hover:brightness-95 sm:text-sm ${
                        light
                          ? 'bg-[#102544] text-white'
                          : 'bg-[#facc15] text-[#102544]'
                      }`}
                    >
                      {b.buttonText}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Exam Categories */}
      {isSectionVisible('exams') && (
        <section id="exam-categories" className="py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white">
                  {getSectionHeading('exams', t.home.exploreExamsTitle)}
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-[#9fb0c8]">{t.home.exploreExamsSub}</p>
              </div>
              <Link
                to="/exams"
                className="border-b-2 border-[#facc15] pb-0.5 text-sm font-bold text-[#102544] dark:text-[#facc15]"
              >
                {t.common.viewAll}
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {filterChips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setExamFilter(chip.id)}
                  className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    examFilter === chip.id
                      ? 'bg-[#102544] text-white dark:bg-[#facc15] dark:text-[#102544]'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-[#24385c] dark:bg-[#122443] dark:text-slate-200 dark:hover:bg-[#16294b]'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <div className="mt-6">
              {filteredExams.length === 0 ? (
                <EmptyState onReset={() => { setExamFilter('All'); setExamSearch(''); }} />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredExams.map((exam) => (
                    <div
                      key={exam.id}
                      className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 dark:border-[#24385c] dark:bg-[#122443]"
                    >
                      <div>
                        <div className="text-xs font-medium text-slate-500 dark:text-[#9fb0c8]">
                          {exam.group} · {t.common.demo}
                        </div>
                        <h3 className="mt-1 font-display text-lg font-bold text-slate-900 dark:text-white">
                          {exam.name}
                        </h3>
                        <p className="mt-1.5 text-sm text-slate-600 dark:text-[#9fb0c8]">{exam.description}</p>
                      </div>

                      <div className="mt-4">
                        <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 font-mono-num text-xs text-slate-500 dark:text-[#9fb0c8]">
                          <span><strong className="text-slate-900 dark:text-white">{exam.quizzesCount}</strong> {t.common.questionsCount}</span>
                          <span>·</span>
                          <span><strong className="text-slate-900 dark:text-white">{exam.mocksCount}</strong> {t.nav.mockTests}</span>
                          <span>·</span>
                          <span><strong className="text-slate-900 dark:text-white">{exam.pdfsCount}</strong> PDFs</span>
                        </div>
                        <Link
                          to={`/exams/${exam.id}`}
                          className="inline-flex h-9 items-center justify-center rounded-lg bg-[#102544] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#1b3a6b] dark:bg-[#facc15] dark:text-[#102544]"
                        >
                          {t.common.explore}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-[#9fb0c8]">{t.home.demoCountsNote}</p>
          </div>
        </section>
      )}

      {/* Popular Mock Tests */}
      {isSectionVisible('mocks') && (
        <section className="bg-[#eef2f8] py-14 dark:bg-[#16294b]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white">
                  {getSectionHeading('mocks', t.home.popularMocksTitle)}
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-[#9fb0c8]">{t.home.popularMocksSub}</p>
              </div>
              <Link
                to="/tests"
                className="border-b-2 border-[#facc15] pb-0.5 text-sm font-bold text-[#102544] dark:text-[#facc15]"
              >
                {t.common.viewAll}
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              {state.tests
                .filter((x) => x.published !== false)
                .slice(0, 3)
                .map((test) => {
                  const count =
                    test.questionCount ??
                    test.questionLimit ??
                    (test.questionIds && test.questionIds.length > 0
                      ? state.questions.filter(
                          (q) => q.published && test.questionIds?.includes(q.id)
                        ).length
                      : test.type === 'Daily Quiz'
                      ? 10
                      : test.type === 'Mock Test'
                      ? 50
                      : state.questions.filter(
                          (q) => q.published && test.subjectKeys.includes(q.subjectKey)
                        ).length);
                return (
                  <div
                    key={test.id}
                    className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 dark:border-[#24385c] dark:bg-[#122443]"
                  >
                    <div>
                      <div className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                        {test.type} · {t.common.demo}
                      </div>
                      <h3 className="mt-1.5 font-display text-lg font-bold text-slate-900 dark:text-white">
                        {test.name}
                      </h3>
                      <div className="mt-2 flex items-center gap-3 font-mono-num text-xs text-slate-500 dark:text-[#9fb0c8]">
                        <span><strong className="text-slate-900 dark:text-white">{count}</strong> {t.common.questionsCount}</span>
                        <span>·</span>
                        <span><strong className="text-slate-900 dark:text-white">{test.minutes}</strong> {t.common.minutes}</span>
                      </div>
                    </div>

                    <div className="mt-5">
                      <Link
                        to={`/tests?start=${test.id}`}
                        className="inline-flex h-9 items-center justify-center rounded-lg bg-[#102544] px-4 text-xs font-semibold text-white hover:bg-[#1b3a6b] dark:bg-[#facc15] dark:text-[#102544]"
                      >
                        {t.home.startTest}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Daily GK & Leaderboard Preview */}
      {isSectionVisible('quiz') && (
        <section className="py-14">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
                {getSectionHeading('quiz', t.home.dailyGkTitle)}
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-[#9fb0c8]">{t.home.dailyGkSub}</p>

              <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5 dark:border-[#24385c] dark:bg-[#122443]">
                <DemoLabel />
                <h3 className="mt-1.5 font-display text-lg font-bold text-slate-900 dark:text-white">
                  {t.home.dailyGkQuestion}
                </h3>
                <div className="mt-4 space-y-2">
                  {t.home.dailyGkOptions.map((opt, idx) => {
                    const isCorrect = idx === 1;
                    const isSel = gkSelected === idx;
                    let cls =
                      'border-slate-200 bg-white text-slate-800 hover:border-[#102544] dark:border-[#24385c] dark:bg-[#122443] dark:text-slate-100';
                    if (gkSelected !== null) {
                      if (isCorrect) cls = 'border-emerald-600 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200';
                      else if (isSel) cls = 'border-red-600 bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-200';
                    }
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          if (gkSelected === null) setGkSelected(idx);
                        }}
                        className={`block w-full rounded-xl border px-4 py-2.5 text-left text-sm font-medium transition-colors ${cls}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {gkSelected !== null && (
                  <p className="mt-3 text-xs font-medium text-slate-600 dark:text-[#9fb0c8]">
                    {gkSelected === 1 ? t.home.dailyGkCorrect : t.home.dailyGkWrong}
                  </p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
                    {t.home.leaderboardTitle}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-[#9fb0c8]">{t.home.leaderboardSub}</p>
                </div>
                <Link
                  to="/leaderboard"
                  className="border-b-2 border-[#facc15] pb-0.5 text-sm font-bold text-[#102544] dark:text-[#facc15]"
                >
                  {t.common.viewAll}
                </Link>
              </div>

              <div className="mt-5 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white px-5 dark:divide-[#24385c] dark:border-[#24385c] dark:bg-[#122443]">
                {LEADERBOARD_DATA.Weekly.slice(0, 4).map((entry, idx) => (
                  <div key={entry.name} className="flex items-center justify-between py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-[#facc15] font-mono-num text-sm font-bold text-[#102544]">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{entry.name}</div>
                        <div className="text-xs text-slate-500 dark:text-[#9fb0c8]">{t.home.weeklyPoints}</div>
                      </div>
                    </div>
                    <span className="font-mono-num text-sm font-bold text-slate-900 dark:text-white">
                      {entry.points.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-[#9fb0c8]">{t.home.sampleDataOnly}</p>
            </div>
          </div>
        </section>
      )}

      {/* Government Job Updates (Sample) */}
      {isSectionVisible('jobs') && (
        <section className="bg-[#eef2f8] py-14 dark:bg-[#16294b]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white">
                  {getSectionHeading('jobs', t.home.jobsTitle)}
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-[#9fb0c8]">{t.home.jobsSub}</p>
              </div>
              <Link
                to="/jobs"
                className="border-b-2 border-[#facc15] pb-0.5 text-sm font-bold text-[#102544] dark:text-[#facc15]"
              >
                {t.common.viewAll}
              </Link>
            </div>

            <div className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white px-5 dark:divide-[#24385c] dark:border-[#24385c] dark:bg-[#122443]">
              {state.jobs.slice(0, 3).map((job) => (
                <div
                  key={job.id}
                  className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{job.title}</div>
                    <div className="mt-0.5 text-xs text-slate-600 dark:text-[#9fb0c8]">
                      {job.organization} · {t.updates.deadline}: {job.deadline} ·{' '}
                      <span className="font-semibold text-amber-700 dark:text-amber-300">
                        {t.common.sampleNotReal}
                      </span>
                    </div>
                  </div>
                  <Link
                    to="/jobs"
                    className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-[#102544] px-4 text-xs font-semibold text-white hover:bg-[#1b3a6b] dark:bg-[#facc15] dark:text-[#102544]"
                  >
                    {t.common.details}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Learn With TG */}
      {isSectionVisible('why') && (
        <section className="py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="font-display text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white">
              {getSectionHeading('why', t.home.whyTitle)}
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {t.home.whyItems.map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-slate-200 bg-white p-5 dark:border-[#24385c] dark:bg-[#122443]"
                >
                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-[#9fb0c8]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {isSectionVisible('faq') && (
        <section className="bg-[#eef2f8] py-14 dark:bg-[#16294b]">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="font-display text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white">
              {getSectionHeading('faq', t.home.faqTitle)}
            </h2>
            <div className="mt-6 space-y-3">
              {t.home.faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-xl border border-slate-200 bg-white p-4 dark:border-[#24385c] dark:bg-[#122443]"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 font-semibold text-slate-900 dark:text-white">
                    <span>{faq.q}</span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-600 dark:text-[#9fb0c8]">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
