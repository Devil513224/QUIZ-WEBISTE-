import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, ChevronRight, Lock, PlayCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EXAM_CATEGORIES, type TestDefinition } from '../data/demoData';

export function getScheduledTargetMs(scheduledAt?: string): number | null {
  if (!scheduledAt || !scheduledAt.trim()) return null;
  const parsed = Date.parse(scheduledAt);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isTestLockedBySchedule(test: TestDefinition, nowMs: number): boolean {
  const targetMs = getScheduledTargetMs(test.scheduledAt);
  if (targetMs === null) return false;
  return nowMs < targetMs;
}

export function formatCountdownParts(targetMs: number, nowMs: number) {
  const diffSec = Math.max(0, Math.floor((targetMs - nowMs) / 1000));
  const days = Math.floor(diffSec / 86400);
  const hours = Math.floor((diffSec % 86400) / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  const seconds = diffSec % 60;
  return {
    diffSec,
    days,
    hours,
    minutes,
    seconds,
  };
}

export function formatScheduledDateLabel(scheduledAt?: string): string {
  const ms = getScheduledTargetMs(scheduledAt);
  if (ms === null) return '';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(ms));
  } catch {
    return scheduledAt || '';
  }
}

export const MegaMockBanner: React.FC = () => {
  const { state } = useApp();
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const megaTest = useMemo(() => {
    const publishedTests = state.tests.filter((tst) => tst.published !== false);
    const flagged = publishedTests.filter((tst) => tst.isMegaMock || getScheduledTargetMs(tst.scheduledAt) !== null);

    if (flagged.length === 0) return null;

    // Prefer upcoming scheduled mega mock sorted soonest first, else latest live mega mock
    const upcoming = flagged
      .filter((tst) => {
        const ms = getScheduledTargetMs(tst.scheduledAt);
        return ms !== null && ms > nowMs;
      })
      .sort((a, b) => (getScheduledTargetMs(a.scheduledAt) || 0) - (getScheduledTargetMs(b.scheduledAt) || 0));
    if (upcoming.length > 0) return upcoming[0];
    return flagged[0];
  }, [state.tests, nowMs]);

  const targetMs = megaTest ? getScheduledTargetMs(megaTest.scheduledAt) : null;
  const isLocked = targetMs !== null && nowMs < targetMs;
  const isFromStore = megaTest ? state.tests.some((tst) => tst.id === megaTest.id && tst.published !== false) : false;

  useEffect(() => {
    if (!megaTest || targetMs === null || !isLocked) return;
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [megaTest, targetMs, isLocked]);

  if (!megaTest) return null;

  const parts = targetMs !== null ? formatCountdownParts(targetMs, nowMs) : null;
  const qCount =
    megaTest.questionCount ??
    megaTest.questionLimit ??
    (megaTest.questionIds?.length || 50);
  const examNames = (megaTest.examIds || [])
    .map((id) => EXAM_CATEGORIES.find((e) => e.id === id)?.name)
    .filter(Boolean)
    .slice(0, 4) as string[];

  const scheduleLabel = formatScheduledDateLabel(megaTest.scheduledAt);

  return (
    <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
      <div className="overflow-hidden rounded-2xl border border-[#24385c] bg-[#102544] p-5 text-white shadow-lg sm:p-6">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold uppercase tracking-wide">
              {isLocked ? (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[#1b3a6b] px-2.5 py-1 text-[#facc15]">
                  <CalendarClock className="h-3.5 w-3.5" />
                  <span>Scheduled Mega Mock</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600/20 px-2.5 py-1 text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live Now · Open for All</span>
                </span>
              )}
              {scheduleLabel && (
                <span className="font-mono-num text-slate-300">
                  {isLocked ? `Unlocks: ${scheduleLabel}` : `Started: ${scheduleLabel}`}
                </span>
              )}
            </div>

            <h2 className="mt-2.5 font-display text-xl font-extrabold text-white sm:text-2xl">
              {megaTest.name}
            </h2>
            <p className="mt-1 text-sm text-[#c7d3e6]">
              {megaTest.note ||
                'Compete with aspirants across India & West Bengal under real exam timing and negative marking.'}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono-num text-xs text-slate-300">
              <span>
                <strong className="text-white">{qCount}</strong> Questions
              </span>
              <span>·</span>
              <span>
                <strong className="text-white">{megaTest.minutes}</strong> Minutes
              </span>
              <span>·</span>
              <span>
                {megaTest.negativeMarking > 0
                  ? `-${megaTest.negativeMarking} Neg. Mark`
                  : 'No Negative Marking'}
              </span>
              {examNames.length > 0 && (
                <>
                  <span>·</span>
                  <span className="text-[#facc15]">{examNames.join(', ')}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-3 sm:items-end">
            {isLocked && parts ? (
              <div
                aria-live="polite"
                className="grid grid-cols-4 gap-2 text-center"
              >
                {[
                  { label: 'Days', val: parts.days },
                  { label: 'Hrs', val: parts.hours },
                  { label: 'Min', val: parts.minutes },
                  { label: 'Sec', val: parts.seconds },
                ].map((unit) => (
                  <div
                    key={unit.label}
                    className="min-w-[58px] rounded-xl border border-[#24385c] bg-[#0b1730] px-2.5 py-2"
                  >
                    <div className="font-mono-num text-xl font-extrabold text-[#facc15] sm:text-2xl">
                      {String(unit.val).padStart(2, '0')}
                    </div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {unit.label}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2.5">
              {isLocked ? (
                <Link
                  to={isFromStore ? `/tests?start=${megaTest.id}` : '/tests?type=Mock+Test'}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#24385c] bg-[#16294b] px-4 text-xs font-bold text-[#facc15] transition-colors hover:bg-[#1b3a6b] sm:text-sm"
                >
                  <Lock className="h-4 w-4" />
                  <span>View Syllabus &amp; Countdown</span>
                </Link>
              ) : (
                <Link
                  to={isFromStore ? `/tests?start=${megaTest.id}` : '/tests?type=Mock+Test'}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#facc15] px-5 text-xs font-bold text-[#102544] transition-transform hover:brightness-95 sm:text-sm"
                >
                  <PlayCircle className="h-4 w-4" />
                  <span>Start Mega Mock Now</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
