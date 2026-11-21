import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Briefcase,
  Calendar,
  Check,
  ChevronDown,
  ExternalLink,
  Newspaper,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Trophy,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DemoLabel, EmptyState } from '../components/CommonUI';
import { ACHIEVEMENT_BADGES, EXAM_CATEGORIES, LEADERBOARD_DATA, LOGO_URL } from '../data/demoData';

/* -------------------------------------------------------------------------- */
/* 1. CURRENT AFFAIRS PAGE                                                    */
/* -------------------------------------------------------------------------- */
export const CurrentAffairsPage: React.FC = () => {
  const { state, t } = useApp();
  const [period, setPeriod] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [category, setCategory] = useState<string>('All');
  const [query, setQuery] = useState('');

  const categories = useMemo(() => {
    const unique = Array.from(new Set(state.affairs.map((a) => a.category)));
    return ['All', ...unique];
  }, [state.affairs]);

  const filtered = state.affairs.filter((item) => {
    if (!item.published) return false;
    const matchPeriod = item.period === period;
    const matchCat = category === 'All' || item.category === category;
    const matchQ =
      !query.trim() ||
      item.title.toLowerCase().includes(query.trim().toLowerCase()) ||
      item.summary.toLowerCase().includes(query.trim().toLowerCase()) ||
      item.category.toLowerCase().includes(query.trim().toLowerCase());
    return matchPeriod && matchCat && matchQ;
  });

  const periodLabels: Array<{ key: 'Daily' | 'Weekly' | 'Monthly'; label: string }> = [
    { key: 'Daily', label: t.updates.tabsPeriod[0] || 'Daily' },
    { key: 'Weekly', label: t.updates.tabsPeriod[1] || 'Weekly' },
    { key: 'Monthly', label: t.updates.tabsPeriod[2] || 'Monthly' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-[#102544] dark:text-[#facc15]" />
            <DemoLabel text={t.common.sample} />
          </div>
          <h1 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">
            {t.updates.affairsTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-[#9fb0c8]">{t.updates.affairsSub}</p>
        </div>

        {/* Period Tabs */}
        <div
          role="tablist"
          aria-label={t.updates.affairsTitle}
          className="inline-flex rounded-xl border border-slate-200 bg-white p-1 dark:border-[#24385c] dark:bg-[#122443]"
        >
          {periodLabels.map((p) => (
            <button
              key={p.key}
              type="button"
              role="tab"
              aria-selected={period === p.key}
              onClick={() => setPeriod(p.key)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
                period === p.key
                  ? 'bg-[#102544] text-white dark:bg-[#facc15] dark:text-[#102544]'
                  : 'text-slate-600 hover:text-slate-900 dark:text-[#9fb0c8] dark:hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-lg border px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                category === cat
                  ? 'border-[#102544] bg-[#102544] text-white dark:border-[#facc15] dark:bg-[#facc15] dark:text-[#102544]'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-[#24385c] dark:bg-[#122443] dark:text-[#9fb0c8] dark:hover:bg-[#16294b]'
              }`}
            >
              {cat === 'All' ? t.common.all : cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.updates.searchAffairs}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#102544] focus:outline-none dark:border-[#24385c] dark:bg-[#122443] dark:text-white"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          onReset={() => {
            setCategory('All');
            setQuery('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-[#24385c] dark:bg-[#122443]"
            >
              <div>
                <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-[#102544] dark:text-[#facc15]">
                    {item.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <DemoLabel text={t.common.sample} />
                    <span className="font-mono-num text-slate-500 dark:text-[#9fb0c8]">
                      {item.date}
                    </span>
                  </div>
                </div>
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-[#9fb0c8]">
                  {item.summary}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 2. GOVERNMENT JOB UPDATES PAGE                                             */
/* -------------------------------------------------------------------------- */
export const JobsPage: React.FC = () => {
  const { state, t, showToast } = useApp();
  const jobTabs: Array<'Vacancies' | 'Admit Cards' | 'Results' | 'Answer Keys' | 'Exam Dates'> = [
    'Vacancies',
    'Admit Cards',
    'Results',
    'Answer Keys',
    'Exam Dates',
  ];
  const [activeTab, setActiveTab] = useState<(typeof jobTabs)[number]>('Vacancies');
  const [expandedId, setExpandedId] = useState<string | null>('j1');

  const items = state.jobs.filter((j) => j.published && j.tab === activeTab);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <div className="mb-1 flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-[#102544] dark:text-[#facc15]" />
          <DemoLabel text={t.common.sampleNotReal} />
        </div>
        <h1 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">
          {t.updates.jobsTitle}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-[#9fb0c8]">{t.updates.jobsSub}</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3 dark:border-[#24385c]">
        {jobTabs.map((tab, idx) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setActiveTab(tab);
              setExpandedId(null);
            }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === tab
                ? 'bg-[#102544] text-white dark:bg-[#facc15] dark:text-[#102544]'
                : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-[#122443] dark:text-[#9fb0c8] dark:hover:bg-[#16294b]'
            }`}
          >
            {t.updates.jobTabs[idx] || tab}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState onReset={() => setActiveTab('Vacancies')} resetLabel={t.updates.jobTabs[0]} />
      ) : (
        <div className="space-y-4">
          {items.map((job) => {
            const isOpen = expandedId === job.id;
            return (
              <div
                key={job.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-[#24385c] dark:bg-[#122443]"
              >
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <DemoLabel text={t.common.sampleNotReal} />
                      <span className="text-slate-400">·</span>
                      <span className="font-medium text-slate-600 dark:text-[#9fb0c8]">
                        {job.organization}
                      </span>
                    </div>
                    <h2 className="mt-1 font-display text-lg font-bold text-slate-900 dark:text-white">
                      {job.title}
                    </h2>
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600 dark:text-[#9fb0c8]">
                      <span>
                        {t.updates.publishedOn}:{' '}
                        <strong className="font-mono-num text-slate-900 dark:text-slate-100">
                          {job.publishedDate}
                        </strong>
                      </span>
                      <span>
                        {t.updates.deadline}:{' '}
                        <strong className="font-mono-num text-slate-900 dark:text-slate-100">
                          {job.deadline}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedId(isOpen ? null : job.id)}
                    aria-expanded={isOpen}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 dark:border-[#24385c] dark:bg-[#16294b] dark:text-slate-100 dark:hover:bg-[#1b3a6b]"
                  >
                    <span>{isOpen ? t.common.hide : t.common.details}</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>

                {isOpen && (
                  <div className="border-t border-slate-200 bg-slate-50/70 px-5 py-4 text-sm dark:border-[#24385c] dark:bg-[#0b1730]/50">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <div className="text-xs text-slate-500 dark:text-[#9fb0c8]">
                          {t.updates.appStart}
                        </div>
                        <div className="mt-0.5 font-mono-num font-semibold text-slate-900 dark:text-white">
                          {job.startDate}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 dark:text-[#9fb0c8]">
                          {t.updates.deadline}
                        </div>
                        <div className="mt-0.5 font-mono-num font-semibold text-slate-900 dark:text-white">
                          {job.deadline}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 dark:text-[#9fb0c8]">
                          {t.updates.eligibility}
                        </div>
                        <div className="mt-0.5 font-medium text-slate-800 dark:text-slate-200">
                          {job.eligibility}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => showToast(t.updates.officialNoticeToast)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#102544] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1b3a6b] dark:bg-[#facc15] dark:text-[#102544]"
                      >
                        <span>{t.updates.officialNotice}</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 3. LEADERBOARD PAGE                                                        */
/* -------------------------------------------------------------------------- */
export const LeaderboardPage: React.FC = () => {
  const { state, t } = useApp();
  const [period, setPeriod] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');

  const rows = LEADERBOARD_DATA[period];
  const localBonusPoints = state.testHistory.reduce((acc, a) => acc + Math.max(0, Math.round(a.score * 20)), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[#102544] dark:text-[#facc15]" />
            <DemoLabel text={t.common.sample} />
          </div>
          <h1 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">
            {t.updates.leaderboardTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-[#9fb0c8]">{t.updates.leaderboardSub}</p>
        </div>

        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 dark:border-[#24385c] dark:bg-[#122443]">
          {(['Daily', 'Weekly', 'Monthly'] as const).map((key, idx) => (
            <button
              key={key}
              type="button"
              onClick={() => setPeriod(key)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
                period === key
                  ? 'bg-[#102544] text-white dark:bg-[#facc15] dark:text-[#102544]'
                  : 'text-slate-600 hover:text-slate-900 dark:text-[#9fb0c8] dark:hover:text-white'
              }`}
            >
              {t.updates.tabsPeriod[idx] || key}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-[#24385c] dark:bg-[#122443]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-[#24385c] dark:bg-[#16294b] dark:text-[#9fb0c8]">
                <tr>
                  <th className="px-5 py-3">#</th>
                  <th className="px-5 py-3">{t.account.displayName}</th>
                  <th className="px-5 py-3 text-right">{t.common.pts}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#24385c]">
                {rows.map((entry, idx) => (
                  <tr
                    key={entry.name}
                    className={
                      entry.name === state.profile.name
                        ? 'bg-[#eef2f8]/70 dark:bg-[#16294b]'
                        : ''
                    }
                  >
                    <td className="px-5 py-3.5 font-mono-num font-bold text-[#102544] dark:text-[#facc15]">
                      #{idx + 1}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                      {entry.name}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono-num font-bold text-slate-800 dark:text-slate-100">
                      {entry.points} {t.common.pts}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-[#24385c] dark:bg-[#122443]">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              {t.updates.yourRankTitle}
            </h2>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {state.profile.name}
              </span>
              <span className="font-mono-num text-xl font-extrabold text-[#102544] dark:text-[#facc15]">
                {1175 + localBonusPoints} {t.common.pts}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-[#9fb0c8]">
              {t.updates.yourRankNote}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-[#24385c] dark:bg-[#122443]">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-[#102544] dark:text-[#facc15]" />
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                {t.updates.badgesTitle}
              </h2>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {ACHIEVEMENT_BADGES.map((badge) => (
                <div
                  key={badge}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 dark:border-[#24385c] dark:bg-[#16294b] dark:text-slate-100"
                >
                  {badge}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 4. STUDY PLANNER PAGE                                                      */
/* -------------------------------------------------------------------------- */
export const PlannerPage: React.FC = () => {
  const { state, t, updatePlanner, showToast } = useApp();
  const [newTask, setNewTask] = useState('');

  const daysLeftInfo = useMemo(() => {
    if (!state.planner.date) return { status: 'empty' as const, days: 0 };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(`${state.planner.date}T00:00:00`);
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { status: 'past' as const, days: 0 };
    return { status: 'ok' as const, days: diff };
  }, [state.planner.date]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTask.trim();
    if (!trimmed) {
      showToast(t.updates.typeTargetFirst);
      return;
    }
    updatePlanner((prev) => ({
      ...prev,
      tasks: [...prev.tasks, { id: `task_${Date.now()}`, text: trimmed, done: false }],
    }));
    setNewTask('');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <div className="mb-1 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-[#102544] dark:text-[#facc15]" />
          <DemoLabel text={t.common.demo} />
        </div>
        <h1 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">
          {t.updates.plannerTitle}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-[#9fb0c8]">{t.updates.plannerSub}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Countdown + Subject Sliders */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-[#24385c] dark:bg-[#122443]">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              {t.updates.examCountdown}
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-[#9fb0c8]">
                  {t.account.targetExam}
                </label>
                <select
                  value={state.planner.exam}
                  onChange={(e) =>
                    updatePlanner((prev) => ({ ...prev, exam: e.target.value }))
                  }
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
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-[#9fb0c8]">
                  {t.updates.examCountdown}
                </label>
                <input
                  type="date"
                  value={state.planner.date}
                  onChange={(e) =>
                    updatePlanner((prev) => ({ ...prev, date: e.target.value }))
                  }
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
                />
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-[#eef2f8] p-4 dark:bg-[#16294b]">
              {daysLeftInfo.status === 'empty' && (
                <p className="text-sm text-slate-600 dark:text-[#9fb0c8]">
                  {t.updates.pickExamDate}
                </p>
              )}
              {daysLeftInfo.status === 'past' && (
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                  {t.updates.datePassed}
                </p>
              )}
              {daysLeftInfo.status === 'ok' && (
                <div className="flex items-baseline gap-2">
                  <span className="font-mono-num text-3xl font-extrabold text-[#102544] dark:text-[#facc15]">
                    {daysLeftInfo.days}
                  </span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t.updates.daysLeftFor.replace('{exam}', state.planner.exam)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-[#24385c] dark:bg-[#122443]">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              {t.updates.prepProgressTitle}
            </h2>
            <div className="mt-4 space-y-4">
              {Object.entries(state.planner.subjectProgress).map(([subj, pct]) => (
                <div key={subj}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-800 dark:text-slate-100">{subj}</span>
                    <span className="font-mono-num font-bold text-[#102544] dark:text-[#facc15]">
                      {pct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={pct}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      updatePlanner((prev) => ({
                        ...prev,
                        subjectProgress: { ...prev.subjectProgress, [subj]: val },
                      }));
                    }}
                    className="h-2 w-full cursor-pointer accent-[#102544] dark:accent-[#facc15]"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Today's Targets */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-[#24385c] dark:bg-[#122443]">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              {t.updates.todaysTargets}
            </h2>

            <form onSubmit={handleAddTask} className="mt-4 flex gap-2">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder={t.updates.newTargetPlaceholder}
                className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#102544] focus:outline-none dark:border-[#24385c] dark:bg-[#16294b] dark:text-white"
              />
              <button
                type="submit"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#102544] px-4 text-sm font-semibold text-white hover:bg-[#1b3a6b] dark:bg-[#facc15] dark:text-[#102544]"
              >
                <Plus className="h-4 w-4" />
                <span>{t.updates.addTarget}</span>
              </button>
            </form>

            {state.planner.tasks.length === 0 ? (
              <p className="mt-6 text-sm text-slate-500 dark:text-[#9fb0c8]">
                {t.updates.noTargets}
              </p>
            ) : (
              <ul className="mt-5 divide-y divide-slate-200 dark:divide-[#24385c]">
                {state.planner.tasks.map((task) => (
                  <li key={task.id} className="flex items-center justify-between gap-3 py-3">
                    <button
                      type="button"
                      onClick={() =>
                        updatePlanner((prev) => ({
                          ...prev,
                          tasks: prev.tasks.map((item) =>
                            item.id === task.id ? { ...item, done: !item.done } : item
                          ),
                        }))
                      }
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                          task.done
                            ? 'border-[#102544] bg-[#102544] text-white dark:border-[#facc15] dark:bg-[#facc15] dark:text-[#102544]'
                            : 'border-slate-300 dark:border-[#24385c]'
                        }`}
                      >
                        {task.done && <Check className="h-3.5 w-3.5" />}
                      </span>
                      <span
                        className={`text-sm ${
                          task.done
                            ? 'text-slate-400 line-through dark:text-slate-500'
                            : 'font-medium text-slate-800 dark:text-slate-100'
                        }`}
                      >
                        {task.text}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updatePlanner((prev) => ({
                          ...prev,
                          tasks: prev.tasks.filter((item) => item.id !== task.id),
                        }))
                      }
                      aria-label={t.updates.remove}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 5. ABOUT PAGE                                                              */
/* -------------------------------------------------------------------------- */
export const AboutPage: React.FC = () => {
  const { t } = useApp();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 dark:border-[#24385c] dark:bg-[#122443]">
        <div className="flex items-center gap-4">
          <img
            src={LOGO_URL}
            alt={t.brand.logoAlt}
            className="h-16 w-16 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div>
            <h1 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">
              {t.updates.aboutTitle}
            </h1>
            <p className="text-sm font-semibold text-[#102544] dark:text-[#facc15]">
              {t.brand.tagline}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-700 dark:text-slate-200">
          <p>{t.updates.aboutMission}</p>
          <p>{t.updates.aboutPromise}</p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {t.home.whyItems.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-[#24385c] dark:bg-[#16294b]"
            >
              <div className="flex items-center gap-2 font-display text-base font-bold text-slate-900 dark:text-white">
                <ShieldCheck className="h-4 w-4 text-[#102544] dark:text-[#facc15]" />
                <span>{item.title}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-[#9fb0c8]">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/exams"
            className="rounded-xl bg-[#102544] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1b3a6b] dark:bg-[#facc15] dark:text-[#102544]"
          >
            {t.nav.exams}
          </Link>
          <Link
            to="/tests"
            className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-[#24385c] dark:text-slate-100 dark:hover:bg-[#16294b]"
          >
            {t.nav.mockTests}
          </Link>
        </div>
      </div>
    </div>
  );
};
