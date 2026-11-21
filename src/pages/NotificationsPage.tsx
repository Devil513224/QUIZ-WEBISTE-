import React, { useMemo, useState } from 'react';
import { Bell, CheckCheck, RotateCcw, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DemoLabel, EmptyState } from '../components/CommonUI';

export const NotificationsPage: React.FC = () => {
  const {
    state,
    t,
    toggleNotifRead,
    markAllNotifsRead,
    clearAllNotifs,
    restoreNotifs,
    unreadNotificationsCount,
  } = useApp();

  const [viewMode, setViewMode] = useState<'all' | 'unread'>('all');
  const [audience, setAudience] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');

  const activeNotifs = useMemo(
    () => state.notificationsList.filter((n) => n.published !== false),
    [state.notificationsList]
  );

  const audiences = useMemo(
    () => ['All', ...Array.from(new Set(activeNotifs.map((n) => n.audience)))],
    [activeNotifs]
  );
  const types = useMemo(
    () => ['All', ...Array.from(new Set(activeNotifs.map((n) => n.type)))],
    [activeNotifs]
  );

  const visibleList = activeNotifs.filter((item) => {
    if (state.notifications.clearedIds.includes(item.id)) return false;
    const isRead = state.notifications.readIds.includes(item.id);
    if (viewMode === 'unread' && isRead) return false;
    if (audience !== 'All' && item.audience !== audience) return false;
    if (typeFilter !== 'All' && item.type !== typeFilter) return false;
    return true;
  });

  const allCleared =
    activeNotifs.length > 0 &&
    activeNotifs.every((n) => state.notifications.clearedIds.includes(n.id));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#102544] dark:text-[#facc15]" />
            <DemoLabel text={t.common.sample} />
          </div>
          <h1 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">
            {t.notifications.title}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-[#9fb0c8]">
            {t.notifications.unreadCount.replace('{count}', String(unreadNotificationsCount))}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={markAllNotifsRead}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-[#24385c] dark:bg-[#122443] dark:text-slate-100 dark:hover:bg-[#16294b]"
          >
            <CheckCheck className="h-4 w-4" />
            <span>{t.notifications.markAllRead}</span>
          </button>

          {allCleared ? (
            <button
              type="button"
              onClick={restoreNotifs}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#102544] px-3.5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[#1b3a6b] dark:bg-[#facc15] dark:text-[#102544]"
            >
              <RotateCcw className="h-4 w-4" />
              <span>{t.notifications.restoreCleared}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={clearAllNotifs}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-900/40 dark:bg-[#122443] dark:text-red-400 dark:hover:bg-red-950/30"
            >
              <Trash2 className="h-4 w-4" />
              <span>{t.notifications.clearAll}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#24385c] dark:bg-[#122443]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl border border-slate-200 p-1 dark:border-[#24385c]">
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`rounded-lg px-3.5 py-1 text-xs sm:text-sm font-semibold ${
                viewMode === 'all'
                  ? 'bg-[#102544] text-white dark:bg-[#facc15] dark:text-[#102544]'
                  : 'text-slate-600 dark:text-[#9fb0c8]'
              }`}
            >
              {t.notifications.all}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('unread')}
              className={`rounded-lg px-3.5 py-1 text-xs sm:text-sm font-semibold ${
                viewMode === 'unread'
                  ? 'bg-[#102544] text-white dark:bg-[#facc15] dark:text-[#102544]'
                  : 'text-slate-600 dark:text-[#9fb0c8]'
              }`}
            >
              {t.notifications.unread}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-[#9fb0c8]">
              {t.notifications.forAudience}:
            </span>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs sm:text-sm text-slate-800 dark:border-[#24385c] dark:bg-[#16294b] dark:text-slate-100"
            >
              {audiences.map((aud) => (
                <option key={aud} value={aud}>
                  {aud === 'All' ? t.common.all : aud}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {types.map((tp) => (
            <button
              key={tp}
              type="button"
              onClick={() => setTypeFilter(tp)}
              className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
                typeFilter === tp
                  ? 'border-[#102544] bg-[#102544] text-white dark:border-[#facc15] dark:bg-[#facc15] dark:text-[#102544]'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-[#24385c] dark:bg-[#16294b] dark:text-[#9fb0c8]'
              }`}
            >
              {tp === 'All' ? t.common.all : tp}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {allCleared ? (
        <EmptyState
          title={t.notifications.emptyCleared}
          onReset={restoreNotifs}
          resetLabel={t.notifications.restoreCleared}
        />
      ) : visibleList.length === 0 ? (
        <EmptyState
          title={t.notifications.emptyFiltered}
          onReset={() => {
            setViewMode('all');
            setAudience('All');
            setTypeFilter('All');
          }}
        />
      ) : (
        <div className="space-y-3">
          {visibleList.map((item) => {
            const isRead = state.notifications.readIds.includes(item.id);
            return (
              <div
                key={item.id}
                className={`flex flex-col justify-between gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center ${
                  isRead
                    ? 'border-slate-200 bg-white/70 dark:border-[#24385c] dark:bg-[#122443]/70'
                    : 'border-[#102544]/30 bg-white shadow-sm dark:border-[#facc15]/40 dark:bg-[#122443]'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {!isRead && (
                      <span className="h-2 w-2 rounded-full bg-[#facc15]" aria-hidden="true" />
                    )}
                    <span className="font-semibold text-[#102544] dark:text-[#facc15]">
                      {item.type}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500 dark:text-[#9fb0c8]">{item.audience}</span>
                    <span className="text-slate-400">·</span>
                    <span className="font-mono-num text-slate-500 dark:text-[#9fb0c8]">
                      {item.date}
                    </span>
                  </div>
                  <h2 className="mt-1 font-display text-base font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-600 dark:text-[#9fb0c8]">{item.message}</p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleNotifRead(item.id)}
                  className="shrink-0 rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#24385c] dark:text-slate-200 dark:hover:bg-[#16294b]"
                >
                  {isRead ? t.notifications.unread : t.common.saved.replace('d', '') === 'Save' ? 'Mark read' : '✓'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
