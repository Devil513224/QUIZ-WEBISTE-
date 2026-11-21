import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Bookmark,
  CheckCircle2,
  ClipboardCheck,
  Flame,
  Gauge,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { DemoLabel } from '../components/CommonUI';
import { ACHIEVEMENT_BADGES } from '../data/demoData';

export const DashboardPage: React.FC = () => {
  const { state, t } = useApp();

  const bestWpm = useMemo(() => {
    if (state.typingHistory.length === 0) return 0;
    return Math.max(...state.typingHistory.map((item) => item.wpm));
  }, [state.typingHistory]);

  const studyStreak = useMemo(() => {
    return 3 + (state.testHistory.length > 0 ? 1 : 0) + (state.typingHistory.length > 0 ? 1 : 0);
  }, [state.testHistory.length, state.typingHistory.length]);

  const savedMaterialObjects = state.materials.filter((m) => state.savedMaterials.includes(m.id));

  const performanceData = useMemo(() => {
    const baseline = [
      { label: 'Mon (Demo)', scorePct: 62 },
      { label: 'Tue (Demo)', scorePct: 70 },
      { label: 'Wed (Demo)', scorePct: 68 },
      { label: 'Thu (Demo)', scorePct: 78 },
    ];
    const localPoints = state.testHistory
      .slice(0, 4)
      .reverse()
      .map((item, idx) => ({
        label: item.testName.length > 12 ? `Test ${idx + 1}` : item.testName,
        scorePct: item.total > 0 ? Math.max(0, Math.round((item.score / item.total) * 100)) : 0,
      }));
    return [...baseline, ...localPoints];
  }, [state.testHistory]);

  const subjectChartData = useMemo(
    () =>
      Object.entries(state.planner.subjectProgress).map(([subject, pct]) => ({
        subject: subject.length > 14 ? `${subject.slice(0, 12)}…` : subject,
        progress: pct,
      })),
    [state.planner.subjectProgress]
  );

  const isDark = state.theme === 'dark';
  const gridColor = isDark ? '#24385c' : '#e2e8f0';
  const tickColor = isDark ? '#9fb0c8' : '#64748b';

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <DemoLabel text={t.common.demoOnly} />
          <h1 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">
            {t.dashboard.title}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-[#9fb0c8]">{t.dashboard.subtitle}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/tests"
            className="rounded-xl bg-[#102544] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1b3a6b] dark:bg-[#facc15] dark:text-[#102544]"
          >
            {t.home.startTest}
          </Link>
          <Link
            to="/account"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-[#24385c] dark:bg-[#122443] dark:text-slate-100"
          >
            {state.profile.name}
          </Link>
        </div>
      </div>

      {/* KPI Row */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#24385c] dark:bg-[#122443]">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#9fb0c8]">
            <span>{t.dashboard.savedMaterials}</span>
            <Bookmark className="h-4 w-4 text-[#102544] dark:text-[#facc15]" />
          </div>
          <div className="mt-2 font-mono-num text-2xl font-extrabold text-slate-900 dark:text-white">
            {state.savedMaterials.length}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#24385c] dark:bg-[#122443]">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#9fb0c8]">
            <span>{t.dashboard.lessonsCompleted}</span>
            <CheckCircle2 className="h-4 w-4 text-[#102544] dark:text-[#facc15]" />
          </div>
          <div className="mt-2 font-mono-num text-2xl font-extrabold text-slate-900 dark:text-white">
            {state.completedLessons.length}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#24385c] dark:bg-[#122443]">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#9fb0c8]">
            <span>{t.dashboard.testsTaken}</span>
            <ClipboardCheck className="h-4 w-4 text-[#102544] dark:text-[#facc15]" />
          </div>
          <div className="mt-2 font-mono-num text-2xl font-extrabold text-slate-900 dark:text-white">
            {state.testHistory.length}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#24385c] dark:bg-[#122443]">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#9fb0c8]">
            <span>{t.dashboard.bestWpm}</span>
            <Gauge className="h-4 w-4 text-[#102544] dark:text-[#facc15]" />
          </div>
          <div className="mt-2 font-mono-num text-2xl font-extrabold text-slate-900 dark:text-white">
            {bestWpm}
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#24385c] dark:bg-[#122443]">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#9fb0c8]">
            <span>{t.dashboard.studyStreak}</span>
            <Flame className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 font-mono-num text-2xl font-extrabold text-slate-900 dark:text-white">
            {t.dashboard.streakDays.replace('{days}', String(studyStreak))}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-[#24385c] dark:bg-[#122443]">
          <h2 className="mb-4 font-display text-base font-bold text-slate-900 dark:text-white">
            {t.dashboard.perfChartTitle}
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isDark ? '#facc15' : '#102544'} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={isDark ? '#facc15' : '#102544'} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="label" tick={{ fill: tickColor, fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: tickColor, fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#122443' : '#ffffff',
                    borderColor: gridColor,
                    color: isDark ? '#f1f5f9' : '#0f172a',
                    borderRadius: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="scorePct"
                  stroke={isDark ? '#facc15' : '#102544'}
                  strokeWidth={2.5}
                  fill="url(#scoreFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-[#24385c] dark:bg-[#122443]">
          <h2 className="mb-4 font-display text-base font-bold text-slate-900 dark:text-white">
            {t.dashboard.subjectChartTitle}
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="subject" tick={{ fill: tickColor, fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: tickColor, fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#122443' : '#ffffff',
                    borderColor: gridColor,
                    color: isDark ? '#f1f5f9' : '#0f172a',
                    borderRadius: 12,
                  }}
                />
                <Bar
                  dataKey="progress"
                  fill={isDark ? '#facc15' : '#102544'}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Course Progress & Saved Materials */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-[#24385c] dark:bg-[#122443]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              {t.dashboard.courseProgress}
            </h2>
            <Link to="/courses" className="text-xs font-semibold text-[#102544] hover:underline dark:text-[#facc15]">
              {t.common.viewAll}
            </Link>
          </div>
          <div className="space-y-4">
            {state.courses
              .filter((c) => c.published)
              .map((course) => {
                const done = course.lessons.filter((_, idx) =>
                  state.completedLessons.includes(`${course.id}-${idx}`)
                ).length;
                const pct = course.lessons.length
                  ? Math.round((done / course.lessons.length) * 100)
                  : 0;
              return (
                <div key={course.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <Link
                      to={`/courses/${course.id}`}
                      className="font-semibold text-slate-800 hover:underline dark:text-slate-100"
                    >
                      {course.title}
                    </Link>
                    <span className="font-mono-num text-xs font-bold text-slate-600 dark:text-[#9fb0c8]">
                      {done}/{course.lessons.length} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-[#16294b]">
                    <div
                      className="h-full bg-[#102544] transition-all dark:bg-[#facc15]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-[#24385c] dark:bg-[#122443]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              {t.dashboard.savedMaterials}
            </h2>
            <Link to="/materials" className="text-xs font-semibold text-[#102544] hover:underline dark:text-[#facc15]">
              {t.common.viewAll}
            </Link>
          </div>
          {savedMaterialObjects.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-[#9fb0c8]">{t.dashboard.noSaved}</p>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-[#24385c]">
              {savedMaterialObjects.map((mat) => (
                <li key={mat.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="font-medium text-slate-800 dark:text-slate-100">{mat.title}</span>
                  <span className="font-mono-num text-xs text-slate-500 dark:text-[#9fb0c8]">
                    {mat.pages} {t.common.pages}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent Test Attempts & Typing History */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-[#24385c] dark:bg-[#122443]">
          <h2 className="mb-4 font-display text-lg font-bold text-slate-900 dark:text-white">
            {t.dashboard.recentTests}
          </h2>
          {state.testHistory.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-[#9fb0c8]">{t.dashboard.noTestsYet}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs text-slate-500 dark:border-[#24385c] dark:text-[#9fb0c8]">
                  <tr>
                    <th className="py-2 pr-3">{t.nav.quizzes}</th>
                    <th className="py-2 pr-3 text-right">{t.tests.score}</th>
                    <th className="py-2 text-right">{t.tests.accuracy}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#24385c]">
                  {state.testHistory.slice(0, 5).map((attempt) => (
                    <tr key={attempt.id}>
                      <td className="py-2.5 pr-3 font-medium text-slate-800 dark:text-slate-100">
                        {attempt.testName}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-mono-num font-bold text-[#102544] dark:text-[#facc15]">
                        {attempt.score}/{attempt.total}
                      </td>
                      <td className="py-2.5 text-right font-mono-num text-slate-600 dark:text-[#9fb0c8]">
                        {attempt.accuracy}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-[#24385c] dark:bg-[#122443]">
          <h2 className="mb-4 font-display text-lg font-bold text-slate-900 dark:text-white">
            {t.dashboard.recentTyping}
          </h2>
          {state.typingHistory.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-[#9fb0c8]">{t.hub.noAttempts}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs text-slate-500 dark:border-[#24385c] dark:text-[#9fb0c8]">
                  <tr>
                    <th className="py-2 pr-3">{t.hub.language}</th>
                    <th className="py-2 pr-3 text-right">{t.hub.wpm}</th>
                    <th className="py-2 text-right">{t.tests.accuracy}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#24385c]">
                  {state.typingHistory.slice(-5).reverse().map((attempt) => (
                    <tr key={attempt.id}>
                      <td className="py-2.5 pr-3 font-medium text-slate-800 dark:text-slate-100">
                        {attempt.language}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-mono-num font-bold text-[#102544] dark:text-[#facc15]">
                        {attempt.wpm}
                      </td>
                      <td className="py-2.5 text-right font-mono-num text-slate-600 dark:text-[#9fb0c8]">
                        {attempt.accuracy}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Achievements */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-[#24385c] dark:bg-[#122443]">
        <div className="mb-3 flex items-center gap-2">
          <Award className="h-5 w-5 text-[#102544] dark:text-[#facc15]" />
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            {t.dashboard.achievementsTitle}
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ACHIEVEMENT_BADGES.map((badge) => (
            <div
              key={badge}
              className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-800 dark:border-[#24385c] dark:bg-[#16294b] dark:text-slate-100"
            >
              {badge}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
