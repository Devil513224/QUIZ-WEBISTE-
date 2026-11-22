import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bell, ExternalLink, Megaphone, Sparkles, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LOGO_URL, type SiteCommunityConfig } from '../data/demoData';

export const SESSION_POPUP_KEY = 'ltg_visit_popup_seen_v1';

export function sanitizeExternalUrl(raw: string | undefined): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) return '';
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return '';
}

export interface SocialChannelItem {
  key: 'youtube' | 'telegram' | 'instagram' | 'whatsapp' | 'facebook' | 'twitter';
  label: string;
  cta: string;
  href: string;
  pillBg: string;
  cardBorder: string;
  iconBg: string;
  icon: React.ReactNode;
}

const YouTubeSvg = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
    <path d="M23.5 6.2a3.01 3.01 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.51A3.01 3.01 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3.01 3.01 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.01 3.01 0 0 0 2.12-2.14A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
  </svg>
);

const TelegramSvg = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0Zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635Z" />
  </svg>
);

const InstagramSvg = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
    <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.8A3.95 3.95 0 0 0 3.8 7.75v8.5a3.95 3.95 0 0 0 3.95 3.95h8.5a3.95 3.95 0 0 0 3.95-3.95v-8.5a3.95 3.95 0 0 0-3.95-3.95h-8.5Zm9.65 1.4a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Z" />
  </svg>
);

const WhatsAppSvg = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
    <path d="M12.04 2a9.93 9.93 0 0 0-8.46 15.13L2 22l5.02-1.52A9.93 9.93 0 1 0 12.04 2Zm5.8 14.07c-.24.68-1.4 1.3-1.94 1.38-.52.08-1.18.11-1.91-.12-.44-.14-1-.33-1.72-.64-3.03-1.31-5-4.38-5.15-4.58-.15-.2-1.23-1.64-1.23-3.12 0-1.48.77-2.21 1.05-2.51.28-.3.6-.38.8-.38h.58c.19 0 .44-.07.68.52.25.6.85 2.08.92 2.23.08.15.13.33.03.53-.1.2-.15.33-.3.51-.15.18-.32.4-.45.54-.15.15-.3.32-.13.62.17.3.78 1.28 1.67 2.08 1.15 1.02 2.12 1.34 2.42 1.49.3.15.47.12.65-.08.17-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.28.1 1.75.83 2.05.98.3.15.5.22.58.35.07.12.07.72-.17 1.4Z" />
  </svg>
);

const FacebookSvg = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
    <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.87.24-1.46 1.5-1.46h1.6V4.95c-.28-.04-1.23-.12-2.34-.12-2.32 0-3.91 1.42-3.91 4.02V11H7.7v3h2.65v8h3.15Z" />
  </svg>
);

const TwitterSvg = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
  </svg>
);

export function buildSocialChannels(cfg: SiteCommunityConfig): SocialChannelItem[] {
  const candidates: Array<SocialChannelItem | null> = [
    sanitizeExternalUrl(cfg.youtubeUrl)
      ? {
          key: 'youtube',
          label: 'YouTube',
          cta: 'Subscribe for Free Classes',
          href: sanitizeExternalUrl(cfg.youtubeUrl),
          pillBg: 'bg-[#dc2626] text-white hover:bg-[#b91c1c]',
          cardBorder: 'border-red-200 hover:border-red-400 dark:border-red-900/50',
          iconBg: 'bg-[#dc2626] text-white',
          icon: <YouTubeSvg />,
        }
      : null,
    sanitizeExternalUrl(cfg.telegramUrl)
      ? {
          key: 'telegram',
          label: 'Telegram',
          cta: 'Join for Daily PDFs & Quiz',
          href: sanitizeExternalUrl(cfg.telegramUrl),
          pillBg: 'bg-[#0284c7] text-white hover:bg-[#0369a1]',
          cardBorder: 'border-sky-200 hover:border-sky-400 dark:border-sky-900/50',
          iconBg: 'bg-[#0284c7] text-white',
          icon: <TelegramSvg />,
        }
      : null,
    sanitizeExternalUrl(cfg.instagramUrl)
      ? {
          key: 'instagram',
          label: 'Instagram',
          cta: 'Follow for GK Reels & Tips',
          href: sanitizeExternalUrl(cfg.instagramUrl),
          pillBg: 'bg-gradient-to-r from-[#d946ef] to-[#f97316] text-white hover:brightness-95',
          cardBorder: 'border-pink-200 hover:border-pink-400 dark:border-pink-900/50',
          iconBg: 'bg-gradient-to-br from-[#d946ef] to-[#f97316] text-white',
          icon: <InstagramSvg />,
        }
      : null,
    sanitizeExternalUrl(cfg.whatsappUrl)
      ? {
          key: 'whatsapp',
          label: 'WhatsApp',
          cta: 'Join WhatsApp Channel',
          href: sanitizeExternalUrl(cfg.whatsappUrl),
          pillBg: 'bg-[#16a34a] text-white hover:bg-[#15803d]',
          cardBorder: 'border-emerald-200 hover:border-emerald-400 dark:border-emerald-900/50',
          iconBg: 'bg-[#16a34a] text-white',
          icon: <WhatsAppSvg />,
        }
      : null,
    sanitizeExternalUrl(cfg.facebookUrl)
      ? {
          key: 'facebook',
          label: 'Facebook',
          cta: 'Follow Community Page',
          href: sanitizeExternalUrl(cfg.facebookUrl),
          pillBg: 'bg-[#1d4ed8] text-white hover:bg-[#1e40af]',
          cardBorder: 'border-blue-200 hover:border-blue-400 dark:border-blue-900/50',
          iconBg: 'bg-[#1d4ed8] text-white',
          icon: <FacebookSvg />,
        }
      : null,
    sanitizeExternalUrl(cfg.twitterUrl)
      ? {
          key: 'twitter',
          label: 'X / Twitter',
          cta: 'Follow Exam Updates',
          href: sanitizeExternalUrl(cfg.twitterUrl),
          pillBg: 'bg-slate-800 text-white hover:bg-slate-900',
          cardBorder: 'border-slate-200 hover:border-slate-400 dark:border-slate-700',
          iconBg: 'bg-slate-900 text-white',
          icon: <TwitterSvg />,
        }
      : null,
  ];
  return candidates.filter((item): item is SocialChannelItem => item !== null);
}

export const FooterSocialLinks: React.FC<{ onOpenPopup: () => void }> = ({ onOpenPopup }) => {
  const { state } = useApp();
  const channels = useMemo(() => buildSocialChannels(state.communityConfig), [state.communityConfig]);

  return (
    <div className="mt-5">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#facc15]">
          Join Official Channels
        </span>
        <button
          type="button"
          onClick={onOpenPopup}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 underline-offset-2 hover:text-[#facc15] hover:underline"
        >
          <Bell className="h-3 w-3" />
          <span>Alerts & Links</span>
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {channels.map((ch) => (
          <a
            key={ch.key}
            href={ch.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={ch.label}
            title={`${ch.label} — ${ch.cta}`}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold shadow-sm transition-transform hover:-translate-y-0.5 ${ch.pillBg}`}
          >
            {ch.icon}
            <span>{ch.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
};

export const WelcomeNotificationPopup: React.FC<{
  open: boolean;
  onClose: () => void;
  configOverride?: SiteCommunityConfig;
}> = ({ open, onClose, configOverride }) => {
  const { state, unreadNotificationsCount } = useApp();
  const cfg = configOverride || state.communityConfig;

  const channels = useMemo(() => buildSocialChannels(cfg), [cfg]);
  const latestNotices = useMemo(
    () => state.notificationsList.filter((n) => n.published !== false).slice(0, 3),
    [state.notificationsList]
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-popup-title"
    >
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#24385c] dark:bg-[#122443]">
        {/* Header Banner */}
        <div className="relative bg-gradient-to-r from-[#102544] via-[#173664] to-[#102544] px-5 py-4 text-white border-b-4 border-[#facc15]">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close popup"
            className="absolute right-3.5 top-3.5 rounded-lg bg-white/10 p-1.5 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3 pr-8">
            <img
              src={state.pdfBranding.logoDataUrl || state.pdfBranding.logoUrl || LOGO_URL}
              alt="LEARN WITH TG"
              className="h-12 w-12 shrink-0 rounded-full border-2 border-[#facc15] bg-white object-cover"
            />
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#facc15] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#102544]">
                <Sparkles className="h-3 w-3" />
                <span>Updates & Community</span>
              </div>
              <h2
                id="welcome-popup-title"
                className="mt-1 font-display text-lg font-extrabold leading-tight sm:text-xl"
              >
                {cfg.popupTitle || 'Welcome to LEARN WITH TG!'}
              </h2>
            </div>
          </div>
          {cfg.popupSubtitle && (
            <p className="mt-2 text-xs leading-relaxed text-slate-200 sm:text-sm">
              {cfg.popupSubtitle}
            </p>
          )}
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          {/* Highlight Announcement */}
          {cfg.popupHighlight && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-950 dark:border-amber-700/40 dark:bg-amber-950/30 dark:text-amber-100">
              <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-[#facc15]" />
              <p className="leading-relaxed font-medium">{cfg.popupHighlight}</p>
            </div>
          )}

          {/* Latest Notifications */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#102544] dark:text-[#facc15]">
                <Bell className="h-3.5 w-3.5" />
                <span>
                  Latest Notifications
                  {unreadNotificationsCount > 0 ? ` (${unreadNotificationsCount} new)` : ''}
                </span>
              </div>
              <Link
                to="/notifications"
                onClick={onClose}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#102544] hover:underline dark:text-[#facc15]"
              >
                <span>View all</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {latestNotices.length > 0 ? (
              <div className="space-y-2">
                {latestNotices.map((n) => (
                  <Link
                    key={n.id}
                    to="/notifications"
                    onClick={onClose}
                    className="block rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition-colors hover:border-[#102544]/40 hover:bg-[#eef2f8] dark:border-[#24385c] dark:bg-[#16294b] dark:hover:border-[#facc15]/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded bg-[#102544] px-1.5 py-0.5 text-[10px] font-bold text-[#facc15]">
                        {n.type}
                      </span>
                      <span className="font-mono-num text-[11px] text-slate-500 dark:text-[#9fb0c8]">
                        {n.date}
                      </span>
                    </div>
                    <div className="mt-1 text-xs font-bold text-slate-900 sm:text-sm dark:text-white">
                      {n.title}
                    </div>
                    <p className="line-clamp-1 text-[11px] text-slate-600 dark:text-[#9fb0c8]">
                      {n.message}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-500 dark:border-[#24385c] dark:bg-[#16294b] dark:text-[#9fb0c8]">
                Stay tuned for daily quiz alerts, PDFs, and exam updates!
              </div>
            )}
          </div>

          {/* Official Social Media Channels */}
          {channels.length > 0 && (
            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Join Official Channels (Free Notes, Videos & Daily Alerts)
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {channels.map((ch) => (
                  <a
                    key={ch.key}
                    href={ch.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-between gap-2.5 rounded-xl border bg-white p-2.5 transition-all hover:shadow-md dark:bg-[#16294b] ${ch.cardBorder}`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${ch.iconBg}`}
                      >
                        {ch.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-extrabold text-slate-900 sm:text-sm dark:text-white">
                          {ch.label}
                        </div>
                        <div className="truncate text-[11px] text-slate-500 dark:text-[#9fb0c8]">
                          {ch.cta}
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Footer CTA */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 dark:border-[#24385c]">
            <span className="text-[11px] text-slate-500 dark:text-[#9fb0c8]">
              100% Free preparation platform
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[#102544] px-5 py-2 text-xs font-bold text-white hover:bg-[#1b3a6b] sm:text-sm dark:bg-[#facc15] dark:text-[#102544]"
            >
              Continue to Website
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
