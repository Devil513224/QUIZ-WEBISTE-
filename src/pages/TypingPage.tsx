import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TYPING_PASSAGES } from '../data/demoData';

type TypingLang = 'en' | 'bn' | 'hi';

export const TypingPage: React.FC = () => {
  const { state, t, addTypingAttempt } = useApp();
  const [lang, setLang] = useState<TypingLang>('en');
  const [typed, setTyped] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [result, setResult] = useState<{
    wpm: number;
    cpm: number;
    accuracy: number;
    correct: number;
    incorrect: number;
    secondsUsed: number;
  } | null>(null);

  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const handleWindowKey = (e: KeyboardEvent) => {
      if (typeof e.getModifierState === 'function') {
        setCapsLockOn(Boolean(e.getModifierState('CapsLock')));
      }
    };
    window.addEventListener('keydown', handleWindowKey);
    window.addEventListener('keyup', handleWindowKey);
    return () => {
      window.removeEventListener('keydown', handleWindowKey);
      window.removeEventListener('keyup', handleWindowKey);
    };
  }, []);

  const updateCapsLockState = (
    e: React.KeyboardEvent<HTMLTextAreaElement> | React.MouseEvent<HTMLTextAreaElement>
  ) => {
    setCapsLockOn(e.getModifierState('CapsLock'));
  };

  const passage =
    state.typingPassages.find((p) => p.published && p.lang === lang)?.text ||
    TYPING_PASSAGES[lang];
  const passageChars = Array.from(passage);
  const typedChars = Array.from(typed);

  const finishTest = (currentTyped: string) => {
    if (finished) return;
    setRunning(false);
    setFinished(true);

    const elapsedSec = startTimeRef.current
      ? Math.max((Date.now() - startTimeRef.current) / 1000, 1)
      : 1;
    const tChars = Array.from(currentTyped);
    let ok = 0;
    tChars.forEach((c, idx) => {
      if (c === passageChars[idx]) ok += 1;
    });
    const bad = tChars.length - ok;
    const cpm = Math.round((ok / elapsedSec) * 60);
    const wpm = Math.round(cpm / 5);
    const accuracy = tChars.length > 0 ? Math.round((ok / tChars.length) * 100) : 0;
    const secondsUsed = Math.min(60, Math.round(elapsedSec));

    setResult({ wpm, cpm, accuracy, correct: ok, incorrect: bad, secondsUsed });

    addTypingAttempt({
      id: `typ-${Date.now()}`,
      language: lang === 'en' ? 'English' : lang === 'bn' ? 'বাংলা' : 'हिन्दी',
      wpm,
      cpm,
      accuracy,
      correctChars: ok,
      incorrectChars: bad,
      date: new Date().toISOString(),
    });
  };

  useEffect(() => {
    if (!running || finished) return;
    const interval = window.setInterval(() => {
      if (!startTimeRef.current) return;
      const left = 60 - Math.floor((Date.now() - startTimeRef.current) / 1000);
      if (left <= 0) {
        setTimeLeft(0);
        finishTest(typed);
      } else {
        setTimeLeft(left);
      }
    }, 250);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, finished, typed]);

  const handleReset = (newLang?: TypingLang) => {
    if (newLang) setLang(newLang);
    setTyped('');
    setTimeLeft(60);
    setRunning(false);
    setFinished(false);
    setResult(null);
    startTimeRef.current = null;
  };

  const handleInput = (val: string) => {
    if (finished) return;
    if (!running && val.length > 0) {
      startTimeRef.current = Date.now();
      setRunning(true);
    }
    setTyped(val);
    if (Array.from(val).length >= passageChars.length) {
      finishTest(val);
    }
  };

  const langTabs: Array<{ code: TypingLang; label: string }> = [
    { code: 'en', label: 'English' },
    { code: 'bn', label: 'বাংলা' },
    { code: 'hi', label: 'हिन्दी' },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">
        {t.hub.typingTitle}
      </h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-[#9fb0c8]">{t.hub.typingSub}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {langTabs.map((item) => (
          <button
            key={item.code}
            type="button"
            onClick={() => handleReset(item.code)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              lang === item.code
                ? 'bg-[#102544] text-white dark:bg-[#facc15] dark:text-[#102544]'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-[#24385c] dark:bg-[#122443] dark:text-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-6 dark:border-[#24385c] dark:bg-[#122443]">
        <div
          aria-live="off"
          className="rounded-xl bg-[#eef2f8] p-5 text-lg leading-loose tracking-wide break-words sm:text-xl dark:bg-[#16294b]"
        >
          {passageChars.map((ch, idx) => {
            let cls = 'text-slate-700 dark:text-slate-300';
            if (idx < typedChars.length) {
              cls =
                typedChars[idx] === ch
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-500/20 text-red-600 dark:text-red-400';
            } else if (idx === typedChars.length) {
              cls = 'rounded bg-[#facc15] px-0.5 text-[#102544] font-semibold';
            }
            return (
              <span key={idx} className={cls}>
                {ch}
              </span>
            );
          })}
        </div>

        <textarea
          value={typed}
          disabled={finished}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={updateCapsLockState}
          onKeyUp={updateCapsLockState}
          onClick={updateCapsLockState}
          placeholder={t.hub.typingPlaceholder}
          spellCheck={false}
          rows={3}
          aria-label={t.hub.typingPlaceholder}
          className="mt-4 w-full rounded-xl border-2 border-slate-200 bg-white p-4 text-base text-slate-900 focus:border-[#102544] focus:outline-none disabled:opacity-60 sm:text-lg dark:border-[#24385c] dark:bg-[#0b1730] dark:text-white dark:focus:border-[#facc15]"
        />

        {capsLockOn && (
          <div
            role="status"
            aria-live="polite"
            className="mt-3 flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs font-semibold text-amber-900 sm:text-sm dark:border-amber-700/60 dark:bg-amber-950/50 dark:text-amber-200"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>Caps Lock is ON — check letter casing while typing.</span>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono-num text-sm font-semibold text-slate-700 dark:text-slate-200">
            {t.home.timeLeft}: <strong className="text-[#102544] dark:text-[#facc15]">{timeLeft}s</strong>
          </span>
          <button
            type="button"
            onClick={() => handleReset()}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#24385c] dark:text-slate-200 dark:hover:bg-[#16294b]"
          >
            <RotateCcw className="h-4 w-4" />
            <span>{t.hub.restart}</span>
          </button>
        </div>

        {result && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: t.hub.wpm, value: String(result.wpm) },
              { label: t.hub.cpm, value: String(result.cpm) },
              { label: t.tests.accuracy, value: `${result.accuracy}%` },
              { label: t.hub.correctChars, value: String(result.correct) },
              { label: t.hub.incorrectChars, value: String(result.incorrect) },
              { label: t.tests.timeTaken, value: `${result.secondsUsed}s` },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-[#eef2f8] p-3.5 dark:bg-[#16294b]">
                <div className="font-mono-num text-2xl font-bold text-slate-900 dark:text-white">
                  {s.value}
                </div>
                <div className="text-xs text-slate-500 dark:text-[#9fb0c8]">{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attempt History */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 dark:border-[#24385c] dark:bg-[#122443]">
        <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
          {t.hub.attemptHistory}
        </h2>
        {state.typingHistory.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600 dark:text-[#9fb0c8]">{t.hub.noAttempts}</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500 dark:border-[#24385c] dark:text-[#9fb0c8]">
                  <th className="py-2 pr-4">{t.hub.language}</th>
                  <th className="py-2 pr-4">{t.hub.wpm}</th>
                  <th className="py-2 pr-4">{t.hub.cpm}</th>
                  <th className="py-2">{t.tests.accuracy}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#24385c]">
                {state.typingHistory
                  .slice(-8)
                  .reverse()
                  .map((h) => (
                    <tr key={h.id}>
                      <td className="py-2.5 pr-4 font-medium">{h.language}</td>
                      <td className="py-2.5 pr-4 font-mono-num font-bold">{h.wpm}</td>
                      <td className="py-2.5 pr-4 font-mono-num">{h.cpm}</td>
                      <td className="py-2.5 font-mono-num">{h.accuracy}%</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
