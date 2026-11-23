import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Layers,
  RotateCcw,
  Search,
  Shuffle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EmptyState } from '../components/CommonUI';
import type { FlashcardItem } from '../data/demoData';

export const FlashcardsPage: React.FC = () => {
  const { state, toggleMasteredFlashcard, resetMasteredFlashcards, showToast } = useApp();

  const publishedCards = useMemo(
    () => state.flashcards.filter((fc) => fc.published !== false),
    [state.flashcards]
  );

  const categories = useMemo(() => {
    const set = new Set<string>();
    publishedCards.forEach((c) => {
      if (c.category.trim()) set.add(c.category.trim());
    });
    return ['All', ...Array.from(set)];
  }, [publishedCards]);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyNeedReview, setOnlyNeedReview] = useState(false);
  const [shuffledIds, setShuffledIds] = useState<string[] | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [viewMode, setViewMode] = useState<'deck' | 'list'>('deck');

  const filteredCards = useMemo(() => {
    const list = publishedCards.filter((card) => {
      const matchCat = selectedCategory === 'All' || card.category === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        card.front.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        card.back.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        card.category.toLowerCase().includes(searchQuery.trim().toLowerCase());
      const matchReview = !onlyNeedReview || !state.masteredFlashcards.includes(card.id);
      return matchCat && matchSearch && matchReview;
    });

    if (!shuffledIds) return list;
    const byId = new Map<string, FlashcardItem>();
    list.forEach((c) => byId.set(c.id, c));
    const ordered: FlashcardItem[] = [];
    shuffledIds.forEach((id) => {
      const found = byId.get(id);
      if (found) {
        ordered.push(found);
        byId.delete(id);
      }
    });
    byId.forEach((remaining) => ordered.push(remaining));
    return ordered;
  }, [publishedCards, selectedCategory, searchQuery, onlyNeedReview, state.masteredFlashcards, shuffledIds]);

  const safeIdx = filteredCards.length > 0 ? Math.min(currentIdx, filteredCards.length - 1) : 0;
  const currentCard = filteredCards[safeIdx] || null;
  const isMastered = currentCard ? state.masteredFlashcards.includes(currentCard.id) : false;

  const masteredInAll = useMemo(
    () => publishedCards.filter((c) => state.masteredFlashcards.includes(c.id)).length,
    [publishedCards, state.masteredFlashcards]
  );

  const progressPct =
    publishedCards.length > 0 ? Math.round((masteredInAll / publishedCards.length) * 100) : 0;

  const goToIndex = useCallback(
    (next: number) => {
      if (filteredCards.length === 0) return;
      const clamped = (next + filteredCards.length) % filteredCards.length;
      setCurrentIdx(clamped);
      setIsFlipped(false);
      setShowHint(false);
    },
    [filteredCards.length]
  );

  useEffect(() => {
    setCurrentIdx(0);
    setIsFlipped(false);
    setShowHint(false);
  }, [selectedCategory, onlyNeedReview]);

  useEffect(() => {
    if (viewMode !== 'deck' || !currentCard) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === 'ArrowRight') {
        goToIndex(safeIdx + 1);
      } else if (e.key === 'ArrowLeft') {
        goToIndex(safeIdx - 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [viewMode, currentCard, safeIdx, goToIndex]);

  const handleShuffle = () => {
    const ids = filteredCards.map((c) => c.id);
    for (let i = ids.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    setShuffledIds(ids);
    setCurrentIdx(0);
    setIsFlipped(false);
    setShowHint(false);
    showToast('Flashcard deck shuffled!');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-[#eef2f8] px-2.5 py-1 text-xs font-bold text-[#102544] dark:bg-[#16294b] dark:text-[#facc15]">
            <Layers className="h-3.5 w-3.5" />
            <span>Quick Revision Mode</span>
          </span>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-slate-900 dark:text-white">
            Quick Revision Flashcards
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-[#9fb0c8]">
            Tap any card to flip between the question and its crisp exam answer. Ideal for 5-minute daily GK, Polity, WB GK &amp; Computer revision.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'deck' ? 'list' : 'deck')}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#24385c] dark:bg-[#122443] dark:text-slate-100"
          >
            <BookOpen className="h-4 w-4" />
            <span>{viewMode === 'deck' ? 'View All as Cheat Sheet' : 'Switch to Flip Deck'}</span>
          </button>
          <Link
            to="/tests"
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#102544] px-4 text-xs font-bold text-white hover:bg-[#1b3a6b] dark:bg-[#facc15] dark:text-[#102544]"
          >
            <span>Practice Mock Tests</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Mastery Progress Bar */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-[#24385c] dark:bg-[#122443]">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            Deck Mastery:{' '}
            <strong className="font-mono-num text-[#102544] dark:text-[#facc15]">
              {masteredInAll} / {publishedCards.length}
            </strong>{' '}
            cards mastered ({progressPct}%)
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-1.5 font-medium text-slate-600 dark:text-[#9fb0c8]">
              <input
                type="checkbox"
                checked={onlyNeedReview}
                onChange={(e) => setOnlyNeedReview(e.target.checked)}
                className="h-3.5 w-3.5 accent-[#102544]"
              />
              <span>Only unmastered cards</span>
            </label>
            {masteredInAll > 0 && (
              <button
                type="button"
                onClick={() => {
                  resetMasteredFlashcards();
                  showToast('Mastered progress cleared.');
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-[#9fb0c8] dark:hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
        <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-[#0b1730]">
          <div
            className="h-full rounded-full bg-emerald-600 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Filters & Search */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#102544] text-white dark:bg-[#facc15] dark:text-[#102544]'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-[#24385c] dark:bg-[#122443] dark:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topic or keyword…"
              aria-label="Search flashcards"
              className="h-9 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 dark:border-[#24385c] dark:bg-[#122443] dark:text-white"
            />
          </div>
          <button
            type="button"
            onClick={handleShuffle}
            disabled={filteredCards.length < 2}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-[#24385c] dark:bg-[#122443] dark:text-slate-200"
          >
            <Shuffle className="h-3.5 w-3.5" />
            <span>Shuffle</span>
          </button>
        </div>
      </div>

      {/* Main Stage */}
      {filteredCards.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            onReset={() => {
              setSelectedCategory('All');
              setSearchQuery('');
              setOnlyNeedReview(false);
            }}
          />
        </div>
      ) : viewMode === 'deck' && currentCard ? (
        <div className="mx-auto mt-8 max-w-2xl">
          {/* Card Counter */}
          <div className="mb-3 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-[#9fb0c8]">
            <span>
              Card <strong className="font-mono-num text-slate-900 dark:text-white">{safeIdx + 1}</strong> of{' '}
              <strong className="font-mono-num text-slate-900 dark:text-white">{filteredCards.length}</strong> ·{' '}
              <span className="font-semibold text-[#102544] dark:text-[#facc15]">{currentCard.category}</span>
            </span>
            <span>{isFlipped ? 'Answer Side' : 'Question Side · Tap card to flip'}</span>
          </div>

          {/* Interactive Flip Card */}
          <button
            type="button"
            onClick={() => setIsFlipped((prev) => !prev)}
            aria-label={isFlipped ? 'Showing answer, click to show question' : 'Showing question, click to reveal answer'}
            className={`group relative flex min-h-[270px] w-full cursor-pointer flex-col justify-between rounded-2xl border-2 p-6 text-left shadow-sm transition-all sm:p-8 ${
              isFlipped
                ? 'border-emerald-600 bg-emerald-50/60 dark:border-emerald-500/70 dark:bg-[#0f2933]'
                : 'border-slate-200 bg-white hover:border-[#102544] dark:border-[#24385c] dark:bg-[#122443] dark:hover:border-[#facc15]'
            }`}
          >
            <div className="flex w-full items-center justify-between gap-2">
              <span
                className={`rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                  isFlipped
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#eef2f8] text-[#102544] dark:bg-[#16294b] dark:text-[#facc15]'
                }`}
              >
                {isFlipped ? 'Answer' : currentCard.category}
              </span>

              {isMastered && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Mastered</span>
                </span>
              )}
            </div>

            <div className="my-6">
              {isFlipped ? (
                <>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {currentCard.front}
                  </div>
                  <div className="mt-2 font-display text-xl font-extrabold leading-snug text-slate-900 sm:text-2xl dark:text-white">
                    {currentCard.back}
                  </div>
                  {currentCard.hint && (
                    <div className="mt-3 rounded-lg border border-emerald-600/20 bg-white/80 px-3 py-2 text-xs text-slate-700 dark:border-emerald-500/20 dark:bg-[#122443] dark:text-slate-300">
                      <strong>Exam Tip:</strong> {currentCard.hint}
                    </div>
                  )}
                </>
              ) : (
                <h2 className="font-display text-xl font-extrabold leading-snug text-slate-900 sm:text-2xl dark:text-white">
                  {currentCard.front}
                </h2>
              )}
            </div>

            <div className="flex w-full items-center justify-between text-xs text-slate-500 dark:text-[#9fb0c8]">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#102544] dark:text-[#facc15]">
                <Eye className="h-3.5 w-3.5" />
                <span>{isFlipped ? 'Click to see question again' : 'Tap card or press Space to reveal answer'}</span>
              </span>
              <span className="hidden font-mono-num sm:inline">← Prev · Next →</span>
            </div>
          </button>

          {/* Optional Hint Toggle on Question Side */}
          {!isFlipped && currentCard.hint && (
            <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs dark:border-[#24385c] dark:bg-[#122443]">
              {showHint ? (
                <span className="text-slate-700 dark:text-slate-200">
                  <strong>Hint:</strong> {currentCard.hint}
                </span>
              ) : (
                <span className="text-slate-500 dark:text-[#9fb0c8]">Need a small clue first?</span>
              )}
              <button
                type="button"
                onClick={() => setShowHint((v) => !v)}
                className="font-bold text-[#102544] hover:underline dark:text-[#facc15]"
              >
                {showHint ? 'Hide Hint' : 'Show Hint'}
              </button>
            </div>
          )}

          {/* Deck Navigation & Mastery Controls */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => goToIndex(safeIdx - 1)}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#24385c] dark:bg-[#122443] dark:text-slate-100"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!isMastered) {
                    toggleMasteredFlashcard(currentCard.id);
                    showToast('Marked as mastered!');
                  } else {
                    toggleMasteredFlashcard(currentCard.id);
                  }
                  goToIndex(safeIdx + 1);
                }}
                className={`inline-flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm font-bold transition-colors ${
                  isMastered
                    ? 'border border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{isMastered ? 'Mastered (Undo & Next)' : 'Got It! Next'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => goToIndex(safeIdx + 1)}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#102544] px-4 text-sm font-bold text-white hover:bg-[#1b3a6b] dark:bg-[#facc15] dark:text-[#102544]"
            >
              <span>Next Card</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Cheat Sheet List View */
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredCards.map((card, idx) => {
            const done = state.masteredFlashcards.includes(card.id);
            return (
              <div
                key={card.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 dark:border-[#24385c] dark:bg-[#122443]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-[#102544] dark:text-[#facc15]">
                      #{idx + 1} · {card.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleMasteredFlashcard(card.id)}
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-semibold ${
                        done
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-[#16294b] dark:text-[#9fb0c8]'
                      }`}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{done ? 'Mastered' : 'Mark Done'}</span>
                    </button>
                  </div>
                  <h3 className="mt-2 font-display text-base font-bold text-slate-900 dark:text-white">
                    {card.front}
                  </h3>
                  <p className="mt-2 rounded-lg bg-[#eef2f8] px-3 py-2 text-sm font-semibold text-[#102544] dark:bg-[#16294b] dark:text-emerald-300">
                    {card.back}
                  </p>
                  {card.hint && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-[#9fb0c8]">
                      <strong>Tip:</strong> {card.hint}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
