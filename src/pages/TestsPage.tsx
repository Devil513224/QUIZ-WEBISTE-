import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock, Download, FileText, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DemoLabel, EmptyState } from '../components/CommonUI';
import { EXAM_CATEGORIES, LOGO_URL, type QuestionItem, type TestDefinition } from '../data/demoData';
import { exportQuizToPdf } from '../utils/quizPdfExport';

type ViewMode = 'list' | 'instructions' | 'exam' | 'result' | 'review';

const SUBJECT_NAMES: Record<'gk' | 'cs', string> = {
  gk: 'General Knowledge',
  cs: 'Computer Knowledge',
};

export const TestsPage: React.FC = () => {
  const { state, t, showToast, addTestAttempt } = useApp();
  const [searchParams] = useSearchParams();

  const typeParam = searchParams.get('type') || 'All';
  const examParam = searchParams.get('exam') || 'All';
  const startParam = searchParams.get('start');

  const [typeFilter, setTypeFilter] = useState<string>(typeParam);
  const [examFilter, setExamFilter] = useState<string>(examParam);
  const [pdfBusyId, setPdfBusyId] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('list');
  const [activeTest, setActiveTest] = useState<TestDefinition | null>(null);
  const [examQuestions, setExamQuestions] = useState<QuestionItem[]>([]);

  // Custom Practice Test state
  const [customGk, setCustomGk] = useState(true);
  const [customCs, setCustomCs] = useState(true);
  const [customCount, setCustomCount] = useState(5);
  const [customMins, setCustomMins] = useState(5);
  const [customErr, setCustomErr] = useState('');

  // Active Exam state
  const [curIdx, setCurIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [marked, setMarked] = useState<Record<number, boolean>>({});
  const [visited, setVisited] = useState<Record<number, boolean>>({ 0: true });
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [timeUsed, setTimeUsed] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showPostSubmitModal, setShowPostSubmitModal] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'All' | 'Correct' | 'Incorrect' | 'Unanswered'>('All');

  useEffect(() => {
    setTypeFilter(typeParam);
  }, [typeParam]);

  useEffect(() => {
    setExamFilter(examParam);
  }, [examParam]);

  const availableTests = useMemo(
    () => state.tests.filter((x) => x.published !== false),
    [state.tests]
  );

  useEffect(() => {
    if (startParam) {
      const found = availableTests.find((x) => x.id === startParam);
      if (found) {
        setActiveTest(found);
        setView('instructions');
      }
    }
  }, [startParam, availableTests]);

  const publishedQuestions = useMemo(
    () => state.questions.filter((q) => q.published),
    [state.questions]
  );

  const getQuestionsForTest = (test: TestDefinition) => {
    let list =
      test.questionIds && test.questionIds.length > 0
        ? publishedQuestions.filter((q) => test.questionIds?.includes(q.id))
        : publishedQuestions.filter((q) => test.subjectKeys.includes(q.subjectKey));
    if (test.shuffle) {
      list = [...list].sort(() => Math.random() - 0.5);
    }
    if (test.questionLimit) {
      list = list.slice(0, test.questionLimit);
    }
    return list;
  };

  const formatTime = (sec: number) =>
    `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

  const handleDownloadTestPdf = async (
    test: TestDefinition,
    qsOverride?: QuestionItem[],
    includeAnswers = true
  ) => {
    const qs = qsOverride && qsOverride.length > 0 ? qsOverride : getQuestionsForTest(test);
    if (!qs.length) {
      showToast('No published questions found for this test.');
      return;
    }
    setPdfBusyId(test.id);
    try {
      await exportQuizToPdf({
        testName: test.name,
        testType: test.type,
        minutes: test.minutes,
        questions: qs,
        branding: state.pdfBranding,
        includeAnswers,
      });
      showToast(
        includeAnswers
          ? 'Quiz Q&A PDF downloaded!'
          : 'Practice Question Paper PDF downloaded!'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'PDF download failed.');
    } finally {
      setPdfBusyId(null);
    }
  };

  const beginExam = (test: TestDefinition) => {
    const qs = getQuestionsForTest(test);
    if (!qs.length) return;
    setActiveTest(test);
    setExamQuestions(qs);
    setCurIdx(0);
    setAnswers({});
    setMarked({});
    setVisited({ 0: true });
    setSecondsLeft(test.minutes * 60);
    setTimeUsed(0);
    setShowSubmitModal(false);
    setShowPostSubmitModal(false);
    setView('exam');
  };

  const finalizeSubmit = () => {
    if (!activeTest) return;
    setShowSubmitModal(false);
    const used = Math.max(activeTest.minutes * 60 - Math.max(secondsLeft, 0), 1);
    setTimeUsed(used);

    let correct = 0;
    let incorrect = 0;
    examQuestions.forEach((q, idx) => {
      const chosen = answers[idx];
      if (chosen === undefined) return;
      if (chosen === q.correctIndex) correct += 1;
      else incorrect += 1;
    });

    const unanswered = examQuestions.length - correct - incorrect;
    const score = Number((correct - incorrect * activeTest.negativeMarking).toFixed(2));
    const accuracy = correct + incorrect > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 0;

    addTestAttempt({
      id: `${activeTest.id}-${Date.now()}`,
      testId: activeTest.id,
      testName: activeTest.name,
      score,
      total: examQuestions.length,
      correct,
      incorrect,
      unanswered,
      accuracy,
      timeUsedSec: used,
      date: new Date().toISOString(),
    });

    setShowPostSubmitModal(true);
    setView('result');
  };

  useEffect(() => {
    if (view !== 'exam') return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [view]);

  useEffect(() => {
    if (view === 'exam' && secondsLeft === 0) {
      finalizeSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, view]);

  const filterTypes: Array<{ key: string; label: string }> = [
    { key: 'All', label: t.tests.filters[0] },
    { key: 'Daily Quiz', label: t.tests.filters[1] },
    { key: 'Mock Test', label: t.tests.filters[2] },
    { key: 'Sectional Test', label: t.tests.filters[3] },
    { key: 'Previous-Year Paper', label: t.tests.filters[4] },
  ];

  if (view === 'instructions' && activeTest) {
    const qCount = getQuestionsForTest(activeTest).length;
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-[#24385c] dark:bg-[#122443]">
          <DemoLabel text={`${activeTest.type} · ${t.common.demo}`} />
          <h1 className="mt-2 font-display text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white">
            {activeTest.name}
          </h1>
          {activeTest.note && (
            <p className="mt-2 text-sm text-slate-600 dark:text-[#9fb0c8]">{activeTest.note}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-4 font-mono-num text-sm text-slate-600 dark:text-[#9fb0c8]">
            <span><strong className="text-slate-900 dark:text-white">{qCount}</strong> {t.common.questionsCount}</span>
            <span>·</span>
            <span><strong className="text-slate-900 dark:text-white">{activeTest.minutes}</strong> {t.common.minutes}</span>
            <span>·</span>
            <span>{t.tests.markEach}</span>
          </div>

          <h2 className="mt-6 font-display text-lg font-bold text-slate-900 dark:text-white">
            {t.tests.instructionsTitle}
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-300">
            {t.tests.rules.map((r) => (
              <li key={r}>{r}</li>
            ))}
            <li>
              {activeTest.negativeMarking > 0
                ? t.tests.ruleNeg.replace('{neg}', String(activeTest.negativeMarking))
                : t.tests.ruleNoNeg}
            </li>
          </ul>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setView('list')}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#24385c] dark:text-slate-200 dark:hover:bg-[#16294b]"
            >
              {t.common.back}
            </button>
            <button
              type="button"
              disabled={pdfBusyId === activeTest.id || qCount === 0}
              onClick={() => void handleDownloadTestPdf(activeTest)}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-[#24385c] dark:bg-[#16294b] dark:text-slate-200"
            >
              <Download className="h-4 w-4" />
              <span>{pdfBusyId === activeTest.id ? 'Generating PDF…' : 'Download Q&A PDF'}</span>
            </button>
            <button
              type="button"
              onClick={() => beginExam(activeTest)}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[#facc15] px-6 text-sm font-bold text-[#102544] hover:brightness-95"
            >
              {t.home.startTest}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'exam' && activeTest && examQuestions[curIdx]) {
    const q = examQuestions[curIdx];
    const answeredCount = Object.keys(answers).length;
    const markedCount = Object.values(marked).filter(Boolean).length;
    const unansweredCount = examQuestions.length - answeredCount;

    const goToQuestion = (idx: number) => {
      setCurIdx(idx);
      setVisited((prev) => ({ ...prev, [idx]: true }));
    };

    const paletteStyle = (idx: number) => {
      const isAns = answers[idx] !== undefined;
      const isMk = Boolean(marked[idx]);
      const isVis = Boolean(visited[idx]);
      if (isMk && isAns) return 'bg-purple-600 text-white ring-2 ring-emerald-500';
      if (isMk) return 'rounded-full bg-purple-600 text-white';
      if (isAns) return 'bg-emerald-600 text-white';
      if (isVis) return 'bg-red-600 text-white';
      return 'bg-[#eef2f8] text-slate-600 dark:bg-[#16294b] dark:text-[#9fb0c8]';
    };

    return (
      <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-6">
        {/* Top Exam Header Bar */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#102544] px-4 py-3 text-white sm:px-5 sm:py-3.5">
          <div className="min-w-0">
            <div className="text-xs text-[#c7d3e6]">{activeTest.type} · {t.common.demo}</div>
            <div className="font-display text-base font-bold break-words">{activeTest.name}</div>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-lg bg-[#1b3a6b] px-3 py-1.5 font-mono-num text-xs sm:px-3.5 sm:text-sm">
            <Clock className="h-4 w-4 text-[#facc15]" />
            <span>{t.home.timeLeft}:</span>
            <strong className="text-[#facc15]">{formatTime(secondsLeft)}</strong>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="mb-5 flex flex-wrap gap-2">
          {activeTest.subjectKeys.map((sk) => (
            <button
              key={sk}
              type="button"
              onClick={() => {
                const idx = examQuestions.findIndex((item) => item.subjectKey === sk);
                if (idx >= 0) goToQuestion(idx);
              }}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${
                q.subjectKey === sk
                  ? 'bg-[#102544] text-white dark:bg-[#facc15] dark:text-[#102544]'
                  : 'border border-slate-200 bg-white text-slate-700 dark:border-[#24385c] dark:bg-[#122443] dark:text-slate-200'
              }`}
            >
              {SUBJECT_NAMES[sk]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Question Stage */}
          <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-6 lg:col-span-8 dark:border-[#24385c] dark:bg-[#122443]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 text-xs font-medium text-slate-500 dark:border-[#24385c] dark:text-[#9fb0c8]">
              <span>
                {t.tests.questionOf
                  .replace('{cur}', String(curIdx + 1))
                  .replace('{total}', String(examQuestions.length))}{' '}
                · {q.subjectName}
              </span>
              <span className="font-mono-num">
                +1 / {activeTest.negativeMarking > 0 ? `−${activeTest.negativeMarking}` : '0'}
              </span>
            </div>

            <h2 className="mt-4 text-lg font-semibold text-slate-900 sm:text-xl dark:text-white">
              {q.question}
            </h2>

            <div className="mt-5 space-y-2.5">
              {q.options.map((opt, oIdx) => {
                const selected = answers[curIdx] === oIdx;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAnswers((prev) => ({ ...prev, [curIdx]: oIdx }))}
                    className={`flex w-full items-start gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm sm:text-base transition-colors ${
                      selected
                        ? 'border-[#102544] bg-[#eef2f8] font-medium dark:border-[#facc15] dark:bg-[#16294b]'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-[#24385c] dark:bg-[#122443] dark:hover:border-slate-500'
                    }`}
                  >
                    <span className="font-mono-num font-bold text-slate-500 dark:text-[#9fb0c8]">
                      {'ABCD'[oIdx]}.
                    </span>
                    <span className="text-slate-900 dark:text-slate-100">{opt}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <button
                type="button"
                disabled={curIdx === 0}
                onClick={() => goToQuestion(curIdx - 1)}
                className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 disabled:opacity-40 dark:border-[#24385c] dark:text-slate-200"
              >
                {t.common.previous}
              </button>
              <button
                type="button"
                onClick={() => setMarked((prev) => ({ ...prev, [curIdx]: !prev[curIdx] }))}
                className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 dark:border-[#24385c] dark:text-slate-200"
              >
                {marked[curIdx] ? t.tests.unmarkReview : t.tests.markReview}
              </button>
              <button
                type="button"
                onClick={() =>
                  setAnswers((prev) => {
                    const copy = { ...prev };
                    delete copy[curIdx];
                    return copy;
                  })
                }
                className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 dark:border-[#24385c] dark:text-slate-200"
              >
                {t.tests.clearResponse}
              </button>
              <button
                type="button"
                disabled={curIdx >= examQuestions.length - 1}
                onClick={() => goToQuestion(curIdx + 1)}
                className="h-10 rounded-lg bg-[#102544] px-5 text-sm font-semibold text-white disabled:opacity-40 dark:bg-[#facc15] dark:text-[#102544]"
              >
                {t.tests.saveAndNext}
              </button>
            </div>
          </div>

          {/* Question Palette */}
          <aside className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 lg:col-span-4 dark:border-[#24385c] dark:bg-[#122443]">
            <div>
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                {t.tests.questionPalette}
              </h3>

              <div className="mt-3 flex flex-wrap gap-2">
                {examQuestions.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => goToQuestion(idx)}
                    aria-label={`Question ${idx + 1}`}
                    className={`grid h-9 w-9 place-items-center rounded-lg font-mono-num text-xs font-bold ${paletteStyle(
                      idx
                    )} ${idx === curIdx ? 'ring-2 ring-[#facc15] ring-offset-2 dark:ring-offset-[#122443]' : ''}`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-[#9fb0c8]">
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded bg-emerald-600" />
                  <span>{t.tests.answered}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded bg-red-600" />
                  <span>{t.tests.notAnswered}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full bg-purple-600" />
                  <span>{t.tests.marked}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded bg-[#eef2f8] dark:bg-[#16294b]" />
                  <span>{t.tests.notVisited}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-2.5">
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="h-11 w-full rounded-xl bg-[#facc15] text-sm font-bold text-[#102544] hover:brightness-95"
              >
                {t.tests.submitTest}
              </button>
              <button
                type="button"
                disabled={pdfBusyId === activeTest.id}
                onClick={() => void handleDownloadTestPdf(activeTest, examQuestions, false)}
                className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-[#24385c] dark:bg-[#16294b] dark:text-slate-200"
              >
                <Download className="h-3.5 w-3.5" />
                <span>
                  {pdfBusyId === activeTest.id
                    ? 'Generating PDF…'
                    : 'Download Question Paper PDF'}
                </span>
              </button>
            </div>
          </aside>
        </div>

        {/* Submit Confirmation Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
            <div
              role="dialog"
              aria-modal="true"
              className="w-full max-w-[calc(100vw-2rem)] rounded-2xl bg-white p-5 shadow-2xl sm:max-w-md sm:p-6 dark:bg-[#122443]"
            >
              <h2 className="font-display text-lg font-bold text-slate-900 sm:text-xl dark:text-white">
                {t.tests.submitConfirmTitle}
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-[#9fb0c8]">
                {t.tests.answered}: <strong className="font-mono-num text-slate-900 dark:text-white">{answeredCount}</strong> ·{' '}
                {t.tests.unanswered}: <strong className="font-mono-num text-slate-900 dark:text-white">{unansweredCount}</strong> ·{' '}
                {t.tests.marked}: <strong className="font-mono-num text-slate-900 dark:text-white">{markedCount}</strong>
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-[#9fb0c8]">{t.tests.submitConfirmNote}</p>
              <div className="mt-5 flex flex-wrap justify-end gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 dark:border-[#24385c] dark:text-slate-200"
                >
                  {t.tests.keepWorking}
                </button>
                <button
                  type="button"
                  onClick={finalizeSubmit}
                  className="h-10 rounded-lg bg-[#facc15] px-5 text-sm font-bold text-[#102544]"
                >
                  {t.tests.submitNow}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'result' && activeTest) {
    let correct = 0;
    let incorrect = 0;
    const bySection: Record<string, { total: number; correct: number; incorrect: number }> = {};

    examQuestions.forEach((q, idx) => {
      bySection[q.subjectKey] = bySection[q.subjectKey] || { total: 0, correct: 0, incorrect: 0 };
      bySection[q.subjectKey].total += 1;
      const ans = answers[idx];
      if (ans === undefined) return;
      if (ans === q.correctIndex) {
        correct += 1;
        bySection[q.subjectKey].correct += 1;
      } else {
        incorrect += 1;
        bySection[q.subjectKey].incorrect += 1;
      }
    });

    const unanswered = examQuestions.length - correct - incorrect;
    const score = Number((correct - incorrect * activeTest.negativeMarking).toFixed(2));
    const accuracy = correct + incorrect > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 0;

    return (
      <div className="mx-auto max-w-5xl px-3 py-6 sm:px-6 sm:py-10">
        <h1 className="font-display text-2xl font-extrabold break-words text-slate-900 sm:text-3xl dark:text-white">
          {t.tests.resultTitle}: {activeTest.name}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-[#9fb0c8]">{t.tests.resultDemoNote}</p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: t.tests.score, value: `${score} / ${examQuestions.length}` },
            { label: t.tests.correct, value: String(correct) },
            { label: t.tests.incorrect, value: String(incorrect) },
            { label: t.tests.unanswered, value: String(unanswered) },
            { label: t.tests.accuracy, value: `${accuracy}%` },
            { label: t.tests.timeTaken, value: formatTime(timeUsed) },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 dark:border-[#24385c] dark:bg-[#122443]"
            >
              <div className="font-mono-num text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">
                {stat.value}
              </div>
              <div className="mt-0.5 text-xs text-slate-500 dark:text-[#9fb0c8]">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-[#24385c] dark:bg-[#122443]">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            {t.tests.sectionAnalysis}
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500 dark:border-[#24385c] dark:text-[#9fb0c8]">
                  <th className="py-2 pr-2 sm:pr-4">{t.tests.section}</th>
                  <th className="py-2 pr-2 sm:pr-4">{t.tests.correct}</th>
                  <th className="py-2 pr-2 sm:pr-4">{t.tests.incorrect}</th>
                  <th className="py-2">{t.tests.progress}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#24385c]">
                {Object.entries(bySection).map(([key, val]) => (
                  <tr key={key}>
                    <td className="py-3 pr-2 font-medium text-slate-900 sm:pr-4 dark:text-white">
                      {SUBJECT_NAMES[key as 'gk' | 'cs']}
                    </td>
                    <td className="py-3 pr-2 whitespace-nowrap font-mono-num sm:pr-4">
                      {val.correct} / {val.total}
                    </td>
                    <td className="py-3 pr-2 font-mono-num sm:pr-4">{val.incorrect}</td>
                    <td className="py-3">
                      <div className="h-2 w-14 overflow-hidden rounded-full bg-[#eef2f8] sm:w-28 dark:bg-[#16294b]">
                        <div
                          className="h-full bg-emerald-600"
                          style={{ width: `${Math.round((val.correct / val.total) * 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setReviewFilter('All');
              setView('review');
            }}
            className="h-10 rounded-xl bg-[#102544] px-5 text-sm font-semibold text-white dark:bg-[#facc15] dark:text-[#102544]"
          >
            {t.tests.reviewAnswers}
          </button>
          <button
            type="button"
            onClick={() => setView('list')}
            className="h-10 rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 dark:border-[#24385c] dark:text-slate-200"
          >
            {t.tests.allTests}
          </button>
          <button
            type="button"
            onClick={() => beginExam(activeTest)}
            className="h-10 rounded-xl bg-[#facc15] px-5 text-sm font-bold text-[#102544]"
          >
            {t.tests.retakeTest}
          </button>
        </div>

        {/* Dedicated Bottom Download PDF Card */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-[#24385c] dark:bg-[#122443]">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-start gap-3">
              <img
                src={state.pdfBranding.logoDataUrl || state.pdfBranding.logoUrl || LOGO_URL}
                alt={state.pdfBranding.brandName}
                className="h-11 w-11 shrink-0 rounded-full border border-slate-200 bg-white object-cover"
              />
              <div>
                <h2 className="font-display text-base font-extrabold text-slate-900 sm:text-lg dark:text-white">
                  Download This Quiz as PDF ({state.pdfBranding.brandName})
                </h2>
                <p className="mt-0.5 text-xs text-slate-600 sm:text-sm dark:text-[#9fb0c8]">
                  Save all {examQuestions.length} questions with answers &amp; explanations or download a clean practice paper for offline revision.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                disabled={pdfBusyId === activeTest.id}
                onClick={() => void handleDownloadTestPdf(activeTest, examQuestions, true)}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#102544] px-4 text-xs font-bold text-white hover:bg-[#1b3a6b] disabled:opacity-50 sm:text-sm dark:bg-[#facc15] dark:text-[#102544]"
              >
                <Download className="h-4 w-4" />
                <span>
                  {pdfBusyId === activeTest.id ? 'Generating PDF…' : 'Download Q&A PDF (With Answers)'}
                </span>
              </button>
              <button
                type="button"
                disabled={pdfBusyId === activeTest.id}
                onClick={() => void handleDownloadTestPdf(activeTest, examQuestions, false)}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-slate-200"
              >
                <FileText className="h-4 w-4" />
                <span>Questions Only PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Post-Submit Automatic PDF Download Popup */}
        {showPostSubmitModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="post-submit-pdf-title"
          >
            <div
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
              onClick={() => setShowPostSubmitModal(false)}
              aria-hidden="true"
            />
            <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#24385c] dark:bg-[#122443]">
              <div className="relative bg-[#102544] px-5 py-4 text-white border-b-4 border-[#facc15]">
                <button
                  type="button"
                  onClick={() => setShowPostSubmitModal(false)}
                  aria-label="Close"
                  className="absolute right-3.5 top-3.5 rounded-lg bg-white/10 p-1.5 text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2.5 pr-8">
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-[#facc15]" />
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#facc15]">
                      Test Submitted Successfully
                    </div>
                    <h2 id="post-submit-pdf-title" className="font-display text-lg font-extrabold">
                      {activeTest.name}
                    </h2>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-[#24385c] dark:bg-[#16294b]">
                  <div>
                    <div className="font-mono-num text-base font-extrabold text-slate-900 dark:text-white">
                      {score}/{examQuestions.length}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-[#9fb0c8]">{t.tests.score}</div>
                  </div>
                  <div>
                    <div className="font-mono-num text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                      {correct}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-[#9fb0c8]">{t.tests.correct}</div>
                  </div>
                  <div>
                    <div className="font-mono-num text-base font-extrabold text-[#102544] dark:text-[#facc15]">
                      {accuracy}%
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-[#9fb0c8]">{t.tests.accuracy}</div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-[#eef2f8]/60 p-3.5 dark:border-[#24385c] dark:bg-[#0b1730]">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={state.pdfBranding.logoDataUrl || state.pdfBranding.logoUrl || LOGO_URL}
                      alt={state.pdfBranding.brandName}
                      className="h-9 w-9 shrink-0 rounded-full border border-slate-200 bg-white object-cover"
                    />
                    <div className="min-w-0">
                      <div className="truncate text-xs font-extrabold text-slate-900 dark:text-white">
                        Download Q&amp;A PDF ({state.pdfBranding.brandName})
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-[#9fb0c8]">
                        Get all questions, answers &amp; explanations in one PDF for revision.
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    <button
                      type="button"
                      disabled={pdfBusyId === activeTest.id}
                      onClick={() => void handleDownloadTestPdf(activeTest, examQuestions, true)}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#facc15] px-4 text-sm font-bold text-[#102544] hover:brightness-95 disabled:opacity-50"
                    >
                      <Download className="h-4 w-4" />
                      <span>
                        {pdfBusyId === activeTest.id
                          ? 'Generating PDF…'
                          : 'Download Q&A PDF (With Answers)'}
                      </span>
                    </button>
                    <button
                      type="button"
                      disabled={pdfBusyId === activeTest.id}
                      onClick={() => void handleDownloadTestPdf(activeTest, examQuestions, false)}
                      className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-[#24385c] dark:bg-[#16294b] dark:text-slate-200"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Download Questions Only PDF</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPostSubmitModal(false);
                      setReviewFilter('All');
                      setView('review');
                    }}
                    className="h-9 rounded-xl border border-slate-300 px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#24385c] dark:text-slate-200"
                  >
                    {t.tests.reviewAnswers}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPostSubmitModal(false)}
                    className="h-9 rounded-xl bg-[#102544] px-4 text-xs font-bold text-white hover:bg-[#1b3a6b] dark:bg-[#facc15] dark:text-[#102544]"
                  >
                    View Score Card
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'review' && activeTest) {
    const revButtons: Array<{ key: 'All' | 'Correct' | 'Incorrect' | 'Unanswered'; label: string }> = [
      { key: 'All', label: t.tests.reviewFilters[0] },
      { key: 'Correct', label: t.tests.reviewFilters[1] },
      { key: 'Incorrect', label: t.tests.reviewFilters[2] },
      { key: 'Unanswered', label: t.tests.reviewFilters[3] },
    ];

    const items = examQuestions
      .map((q, idx) => ({ q, idx, userAns: answers[idx] }))
      .filter((item) => {
        if (reviewFilter === 'All') return true;
        if (reviewFilter === 'Correct') return item.userAns === item.q.correctIndex;
        if (reviewFilter === 'Incorrect')
          return item.userAns !== undefined && item.userAns !== item.q.correctIndex;
        return item.userAns === undefined;
      });

    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">
          {t.tests.answerReview}
        </h1>
        <div className="mt-4 flex flex-wrap gap-2">
          {revButtons.map((b) => (
            <button
              key={b.key}
              type="button"
              onClick={() => setReviewFilter(b.key)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium ${
                reviewFilter === b.key
                  ? 'bg-[#102544] text-white dark:bg-[#facc15] dark:text-[#102544]'
                  : 'border border-slate-200 bg-white text-slate-700 dark:border-[#24385c] dark:bg-[#122443] dark:text-slate-200'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          {items.length === 0 ? (
            <EmptyState onReset={() => setReviewFilter('All')} />
          ) : (
            items.map(({ q, idx, userAns }) => (
              <div
                key={q.id}
                className="rounded-xl border border-slate-200 bg-white p-5 dark:border-[#24385c] dark:bg-[#122443]"
              >
                <div className="text-xs font-medium text-slate-500 dark:text-[#9fb0c8]">
                  {t.tests.questionOf
                    .replace('{cur}', String(idx + 1))
                    .replace('{total}', String(examQuestions.length))}{' '}
                  · {q.subjectName}
                </div>
                <h3 className="mt-1.5 text-base font-bold text-slate-900 dark:text-white">
                  {q.question}
                </h3>
                <div className="mt-3 space-y-2">
                  {q.options.map((opt, oIdx) => {
                    const isCorrect = oIdx === q.correctIndex;
                    const isUser = oIdx === userAns;
                    let cls =
                      'border-slate-200 bg-white text-slate-800 dark:border-[#24385c] dark:bg-[#122443] dark:text-slate-200';
                    if (isCorrect) {
                      cls = 'border-emerald-600 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200';
                    } else if (isUser) {
                      cls = 'border-red-600 bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-200';
                    }
                    return (
                      <div key={opt} className={`rounded-lg border px-3.5 py-2 text-sm ${cls}`}>
                        <span className="font-mono-num font-bold">{'ABCD'[oIdx]}.</span> {opt}{' '}
                        {isCorrect && <strong className="ml-1">{t.tests.correctLabel}</strong>}
                        {!isCorrect && isUser && <strong className="ml-1">{t.tests.yourAnswerLabel}</strong>}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 rounded-lg bg-[#eef2f8] p-3 text-sm text-slate-700 dark:bg-[#16294b] dark:text-slate-200">
                  <strong>{t.tests.explanation}:</strong> {q.explanation}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setView('result')}
            className="h-10 rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 dark:border-[#24385c] dark:text-slate-200"
          >
            {t.tests.backToResult}
          </button>
          <button
            type="button"
            onClick={() => setView('list')}
            className="h-10 rounded-xl bg-[#102544] px-5 text-sm font-semibold text-white dark:bg-[#facc15] dark:text-[#102544]"
          >
            {t.tests.allTests}
          </button>
        </div>

        {/* Dedicated Bottom Download PDF Card on Answer Review */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-[#24385c] dark:bg-[#122443]">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-start gap-3">
              <img
                src={state.pdfBranding.logoDataUrl || state.pdfBranding.logoUrl || LOGO_URL}
                alt={state.pdfBranding.brandName}
                className="h-11 w-11 shrink-0 rounded-full border border-slate-200 bg-white object-cover"
              />
              <div>
                <h2 className="font-display text-base font-extrabold text-slate-900 sm:text-lg dark:text-white">
                  Save Answers &amp; Explanations as PDF ({state.pdfBranding.brandName})
                </h2>
                <p className="mt-0.5 text-xs text-slate-600 sm:text-sm dark:text-[#9fb0c8]">
                  Download this complete quiz with correct answers &amp; explanations or questions-only format.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                disabled={pdfBusyId === activeTest.id}
                onClick={() => void handleDownloadTestPdf(activeTest, examQuestions, true)}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#102544] px-4 text-xs font-bold text-white hover:bg-[#1b3a6b] disabled:opacity-50 sm:text-sm dark:bg-[#facc15] dark:text-[#102544]"
              >
                <Download className="h-4 w-4" />
                <span>
                  {pdfBusyId === activeTest.id ? 'Generating PDF…' : 'Download Q&A PDF (With Answers)'}
                </span>
              </button>
              <button
                type="button"
                disabled={pdfBusyId === activeTest.id}
                onClick={() => void handleDownloadTestPdf(activeTest, examQuestions, false)}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:text-sm dark:border-[#24385c] dark:bg-[#16294b] dark:text-slate-200"
              >
                <FileText className="h-4 w-4" />
                <span>Questions Only PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default List View + Custom Practice Builder
  const visibleTests = availableTests.filter((test) => {
    const matchesType = typeFilter === 'All' || test.type === typeFilter;
    const matchesExam =
      examFilter === 'All' || (test.examIds || []).includes(examFilter);
    return matchesType && matchesExam;
  });

  const handleCreateCustom = () => {
    const secs: Array<'gk' | 'cs'> = [];
    if (customGk) secs.push('gk');
    if (customCs) secs.push('cs');
    if (!secs.length) {
      setCustomErr(t.tests.chooseOneSubject);
      return;
    }
    setCustomErr('');
    const avail = publishedQuestions.filter((q) => secs.includes(q.subjectKey)).length;
    const customTest: TestDefinition = {
      id: 'custom',
      type: 'Custom Practice',
      name: t.tests.customTitle,
      subjectKeys: secs,
      minutes: customMins,
      negativeMarking: 0,
      questionLimit: Math.min(customCount, avail),
      shuffle: true,
    };
    setActiveTest(customTest);
    setView('instructions');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">
        {t.tests.title}
      </h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-[#9fb0c8]">{t.tests.subtitle}</p>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {filterTypes.map((ft) => (
            <button
              key={ft.key}
              type="button"
              onClick={() => setTypeFilter(ft.key)}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                typeFilter === ft.key
                  ? 'bg-[#102544] text-white dark:bg-[#facc15] dark:text-[#102544]'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-[#24385c] dark:bg-[#122443] dark:text-slate-200'
              }`}
            >
              {ft.label}
            </button>
          ))}
        </div>

        <select
          aria-label="Filter by exam"
          value={examFilter}
          onChange={(e) => setExamFilter(e.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 dark:border-[#24385c] dark:bg-[#122443] dark:text-slate-100"
        >
          <option value="All">All Exam Categories</option>
          {EXAM_CATEGORIES.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </select>
      </div>

      {visibleTests.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            onReset={() => {
              setTypeFilter('All');
              setExamFilter('All');
            }}
          />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visibleTests.map((test) => {
            const count = getQuestionsForTest(test).length;
            const examNames = (test.examIds || [])
              .map((eid) => EXAM_CATEGORIES.find((e) => e.id === eid)?.name)
              .filter(Boolean) as string[];
            return (
              <div
                key={test.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 dark:border-[#24385c] dark:bg-[#122443]"
              >
                <div>
                  <DemoLabel text={`${test.type}`} />
                  <h2 className="mt-1.5 font-display text-xl font-bold text-slate-900 dark:text-white">
                    {test.name}
                  </h2>
                  {examNames.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {examNames.map((ename) => (
                        <span
                          key={ename}
                          className="rounded-md bg-[#eef2f8] px-2 py-0.5 text-[11px] font-semibold text-[#102544] dark:bg-[#16294b] dark:text-[#facc15]"
                        >
                          {ename}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-mono-num text-xs text-slate-500 dark:text-[#9fb0c8]">
                    <span><strong className="text-slate-900 dark:text-white">{count}</strong> {t.common.questionsCount}</span>
                    <span>·</span>
                    <span><strong className="text-slate-900 dark:text-white">{test.minutes}</strong> {t.common.minutes}</span>
                    <span>·</span>
                    <span>
                      {test.negativeMarking > 0
                        ? t.tests.negativeMark.replace('{neg}', String(test.negativeMarking))
                        : t.tests.noNegative}
                    </span>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTest(test);
                      setView('instructions');
                    }}
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-[#102544] px-4 text-sm font-semibold text-white hover:bg-[#1b3a6b] dark:bg-[#facc15] dark:text-[#102544]"
                  >
                    {t.tests.viewInstructions}
                  </button>
                  <button
                    type="button"
                    disabled={pdfBusyId === test.id || count === 0}
                    onClick={() => void handleDownloadTestPdf(test)}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-[#24385c] dark:bg-[#16294b] dark:text-slate-200"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>{pdfBusyId === test.id ? 'PDF…' : 'Q&A PDF'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Custom Practice Test Builder */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 dark:border-[#24385c] dark:bg-[#122443]">
        <DemoLabel />
        <h2 className="mt-1 font-display text-2xl font-extrabold text-slate-900 dark:text-white">
          {t.tests.customTitle}
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-[#9fb0c8]">{t.tests.customSub}</p>

        <div className="mt-5 flex flex-wrap items-center gap-5">
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={customGk}
                onChange={(e) => setCustomGk(e.target.checked)}
                className="h-4 w-4 accent-[#102544]"
              />
              <span>General Knowledge</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={customCs}
                onChange={(e) => setCustomCs(e.target.checked)}
                className="h-4 w-4 accent-[#102544]"
              />
              <span>Computer Knowledge</span>
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium">
            <span>{t.tests.questionsLabel}</span>
            <select
              value={customCount}
              onChange={(e) => setCustomCount(Number(e.target.value))}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-[#24385c] dark:bg-[#16294b]"
            >
              {[3, 5, 10].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm font-medium">
            <span>{t.tests.minutesLabel}</span>
            <select
              value={customMins}
              onChange={(e) => setCustomMins(Number(e.target.value))}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-[#24385c] dark:bg-[#16294b]"
            >
              {[3, 5, 10].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={handleCreateCustom}
            className="h-10 rounded-xl bg-[#facc15] px-5 text-sm font-bold text-[#102544] hover:brightness-95"
          >
            {t.tests.createCustom}
          </button>
        </div>

        {customErr && <p className="mt-2 text-sm font-medium text-red-600">{customErr}</p>}
      </div>
    </div>
  );
};
