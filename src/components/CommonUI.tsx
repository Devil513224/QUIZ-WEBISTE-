import React from 'react';
import { AlertCircle, Inbox, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const DemoLabel: React.FC<{ text?: string; className?: string }> = ({ text, className = '' }) => {
  const { t } = useApp();
  return (
    <span
      className={`inline-block text-xs font-semibold tracking-wide text-amber-700 dark:text-amber-300 ${className}`}
    >
      {text || t.common.demo}
    </span>
  );
};

export const EmptyState: React.FC<{
  title?: string;
  subtitle?: string;
  onReset?: () => void;
  resetLabel?: string;
}> = ({ title, subtitle, onReset, resetLabel }) => {
  const { t } = useApp();
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-12 text-center dark:border-[#24385c] dark:bg-[#122443]">
      <Inbox className="mb-3 h-9 w-9 text-slate-400 dark:text-[#9fb0c8]" />
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        {title || t.common.emptyTitle}
      </h3>
      <p className="mt-1 max-w-md text-sm text-slate-600 dark:text-[#9fb0c8]">
        {subtitle || t.common.emptySubtitle}
      </p>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="mt-4 inline-flex items-center justify-center rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100 dark:border-[#24385c] dark:bg-[#16294b] dark:text-slate-100 dark:hover:bg-[#1b3a6b]"
        >
          {resetLabel || t.common.resetFilters}
        </button>
      )}
    </div>
  );
};

export const LoadingState: React.FC<{ message?: string }> = ({ message }) => {
  const { t } = useApp();
  return (
    <div className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-12 text-slate-600 dark:border-[#24385c] dark:bg-[#122443] dark:text-[#9fb0c8]">
      <Loader2 className="h-5 w-5 animate-spin text-[#102544] dark:text-[#facc15]" />
      <span className="text-sm font-medium">{message || t.common.loading}</span>
    </div>
  );
};

export const ErrorState: React.FC<{ message?: string; onRetry?: () => void }> = ({
  message,
  onRetry,
}) => {
  const { t } = useApp();
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-white px-6 py-12 text-center dark:border-red-900/50 dark:bg-[#122443]">
      <AlertCircle className="mb-3 h-9 w-9 text-red-600 dark:text-red-400" />
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        {t.common.errorTitle}
      </h3>
      <p className="mt-1 text-sm text-slate-600 dark:text-[#9fb0c8]">
        {message || t.common.errorSubtitle}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg bg-[#102544] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1b3a6b]"
        >
          {t.common.retry}
        </button>
      )}
    </div>
  );
};
