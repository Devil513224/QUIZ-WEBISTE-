import React, { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DemoLabel, EmptyState } from '../components/CommonUI';
import { EXAM_CATEGORIES, EXAM_ROADMAP, SUBJECT_SYLLABI } from '../data/demoData';

export const ExamsPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const { state, t, toggleSyllabusKey } = useApp();

  const getExamKeys = (examId: string) => {
    const exam = EXAM_CATEGORIES.find((e) => e.id === examId);
    if (!exam) return [];
    const topicKeys = exam.subjectKeys.flatMap((sk) =>
      (SUBJECT_SYLLABI[sk]?.topics || []).map((topic) => `${examId}|${sk}|${topic}`)
    );
    const roadKeys = EXAM_ROADMAP.map((step) => `${examId}|road|${step}`);
    return [...topicKeys, ...roadKeys];
  };

  const getProgressPct = (examId: string) => {
    const keys = getExamKeys(examId);
    if (!keys.length) return 0;
    const done = keys.filter((k) => state.syllabusChecked.includes(k)).length;
    return Math.round((done / keys.length) * 100);
  };

  const selectedExam = id ? EXAM_CATEGORIES.find((e) => e.id === id) : null;

  if (selectedExam) {
    const pct = getProgressPct(selectedExam.id);
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link
          to="/exams"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-[#24385c] dark:bg-[#122443] dark:text-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t.exams.allExams}</span>
        </Link>

        <div className="mt-4 rounded-2xl bg-[#102544] p-6 text-white sm:p-8">
          <span className="text-xs font-semibold text-[#facc15]">{t.exams.sampleOutline}</span>
          <h1 className="mt-1 font-display text-3xl font-extrabold">{selectedExam.name}</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#c7d3e6]">{selectedExam.description}</p>
          <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-[#24385c]">
            <div
              className="h-full bg-emerald-500 transition-[width] duration-200"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 font-mono-num text-xs text-slate-200">
            {t.exams.prepProgress}: {pct}%
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7 dark:border-[#24385c] dark:bg-[#122443]">
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              {t.exams.syllabusChecklist}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-[#9fb0c8]">{t.exams.syllabusNote}</p>

            <div className="mt-5 space-y-5">
              {selectedExam.subjectKeys.map((sk) => {
                const sub = SUBJECT_SYLLABI[sk];
                if (!sub) return null;
                return (
                  <div key={sk}>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{sub.name}</h3>
                    <div className="mt-2 space-y-2">
                      {sub.topics.map((topic) => {
                        const key = `${selectedExam.id}|${sk}|${topic}`;
                        const checked = state.syllabusChecked.includes(key);
                        return (
                          <label key={key} className="flex cursor-pointer items-center gap-3 text-sm">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSyllabusKey(key)}
                              className="h-4 w-4 rounded accent-emerald-600"
                            />
                            <span
                              className={
                                checked
                                  ? 'text-slate-400 line-through dark:text-slate-500'
                                  : 'text-slate-700 dark:text-slate-200'
                              }
                            >
                              {topic}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-6 lg:col-span-5">
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-[#24385c] dark:bg-[#122443]">
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                {t.exams.roadmapTitle}
              </h2>
              <div className="mt-3 space-y-2.5">
                {EXAM_ROADMAP.map((step) => {
                  const key = `${selectedExam.id}|road|${step}`;
                  const checked = state.syllabusChecked.includes(key);
                  return (
                    <label key={key} className="flex cursor-pointer items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSyllabusKey(key)}
                        className="h-4 w-4 rounded accent-emerald-600"
                      />
                      <span
                        className={
                          checked
                            ? 'text-slate-400 line-through dark:text-slate-500'
                            : 'text-slate-700 dark:text-slate-200'
                        }
                      >
                        {step}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-[#24385c] dark:bg-[#122443]">
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                {t.exams.stagesTitle}
              </h2>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-700 dark:text-slate-300">
                {selectedExam.stages.map((stage) => (
                  <li key={stage}>{stage}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-[#24385c] dark:bg-[#122443]">
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                {t.exams.freeResourcesTitle}
              </h2>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <Link
                  to="/tests"
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-[#facc15] px-4 text-sm font-bold text-[#102544]"
                >
                  {t.exams.quizzesAndMocks}
                </Link>
                <Link
                  to="/materials"
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-800 dark:border-[#24385c] dark:text-slate-200"
                >
                  {t.exams.studyMaterials}
                </Link>
                <Link
                  to="/courses"
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-800 dark:border-[#24385c] dark:text-slate-200"
                >
                  {t.exams.courses}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filtered = EXAM_CATEGORIES.filter(
    (e) =>
      !query.trim() ||
      e.name.toLowerCase().includes(query.toLowerCase()) ||
      e.description.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">
            {t.exams.title}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-[#9fb0c8]">{t.exams.subtitle}</p>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.home.searchExamPlaceholder}
          aria-label={t.home.searchExamPlaceholder}
          className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm sm:w-72 dark:border-[#24385c] dark:bg-[#122443] dark:text-white"
        />
      </div>

      <div className="mt-6">
        {filtered.length === 0 ? (
          <EmptyState onReset={() => setQuery('')} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((exam) => {
              const pct = getProgressPct(exam.id);
              return (
                <div
                  key={exam.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 dark:border-[#24385c] dark:bg-[#122443]"
                >
                  <div>
                    <DemoLabel text={`${exam.group} · ${t.common.demo}`} />
                    <h2 className="mt-1 font-display text-xl font-bold text-slate-900 dark:text-white">
                      {exam.name}
                    </h2>
                    <p className="mt-1.5 text-sm text-slate-600 dark:text-[#9fb0c8]">{exam.description}</p>
                    <div className="mt-3 flex gap-3 font-mono-num text-xs text-slate-500 dark:text-[#9fb0c8]">
                      <span><strong className="text-slate-900 dark:text-white">{exam.quizzesCount}</strong> {t.common.questionsCount}</span>
                      <span>·</span>
                      <span><strong className="text-slate-900 dark:text-white">{exam.mocksCount}</strong> {t.nav.mockTests}</span>
                      <span>·</span>
                      <span><strong className="text-slate-900 dark:text-white">{exam.pdfsCount}</strong> PDFs</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#eef2f8] dark:bg-[#16294b]">
                      <div className="h-full bg-emerald-600" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1.5 font-mono-num text-xs text-slate-500 dark:text-[#9fb0c8]">
                      {t.exams.yourProgress}: {pct}%
                    </p>
                    <Link
                      to={`/exams/${exam.id}`}
                      className="mt-3 inline-flex h-9 items-center justify-center rounded-lg bg-[#102544] px-4 text-xs font-semibold text-white hover:bg-[#1b3a6b] dark:bg-[#facc15] dark:text-[#102544]"
                    >
                      {t.exams.openExam}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
