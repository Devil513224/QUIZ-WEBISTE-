import React, { useMemo, useState } from 'react';
import { Bookmark, Download, Eye, FileText, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DemoLabel, EmptyState } from '../components/CommonUI';
import { type StudyMaterialItem } from '../data/demoData';

export const MaterialsPage: React.FC = () => {
  const { state, t, toggleSaveMaterial, showToast } = useApp();
  const [query, setQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [previewPdf, setPreviewPdf] = useState<{ title: string; src: string } | null>(null);

  const publishedMaterials = useMemo(
    () => state.materials.filter((m) => m.published),
    [state.materials]
  );

  const subjects = useMemo(
    () => ['All', ...Array.from(new Set(publishedMaterials.map((m) => m.subject)))],
    [publishedMaterials]
  );

  const filtered = publishedMaterials.filter((m) => {
    const matchSub = subjectFilter === 'All' || m.subject === subjectFilter;
    const matchQ =
      !query.trim() ||
      m.title.toLowerCase().includes(query.toLowerCase()) ||
      m.subject.toLowerCase().includes(query.toLowerCase());
    return matchSub && matchQ;
  });

  const handleDownload = (mat: StudyMaterialItem) => {
    const pdfSrc = mat.pdfUrl || mat.pdfDataUrl;
    if (pdfSrc) {
      const a = document.createElement('a');
      a.href = pdfSrc;
      a.download = mat.fileName || `${mat.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast(`Downloading ${mat.fileName || mat.title}…`);
      return;
    }

    const content = `LEARN WITH TG - Study Material Summary\nTitle: ${mat.title}\nSubject: ${mat.subject}\n\nSummary:\n${mat.summary}\n\nNote: Sample summary. Admin can upload the full PDF file from Admin Panel.`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mat.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-summary.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(t.hub.downloadToast.replace('{title}', mat.title));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">
            {t.hub.materialsTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-[#9fb0c8]">{t.hub.materialsSub}</p>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.hub.searchMaterials}
          aria-label={t.hub.searchMaterials}
          className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm sm:w-72 dark:border-[#24385c] dark:bg-[#122443] dark:text-white"
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {subjects.map((sub) => (
          <button
            key={sub}
            type="button"
            onClick={() => setSubjectFilter(sub)}
            className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
              subjectFilter === sub
                ? 'bg-[#102544] text-white dark:bg-[#facc15] dark:text-[#102544]'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-[#24385c] dark:bg-[#122443] dark:text-slate-200'
            }`}
          >
            {sub === 'All' ? t.common.all : sub}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {filtered.length === 0 ? (
          <EmptyState onReset={() => { setQuery(''); setSubjectFilter('All'); }} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((mat) => {
              const isSaved = state.savedMaterials.includes(mat.id);
              const pdfSrc = mat.pdfUrl || mat.pdfDataUrl;
              return (
                <div
                  key={mat.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 dark:border-[#24385c] dark:bg-[#122443]"
                >
                  <div>
                    {pdfSrc ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        <FileText className="h-3.5 w-3.5" />
                        <span>{mat.fileName ? `PDF · ${mat.fileName}` : 'PDF Attached'}</span>
                      </span>
                    ) : (
                      <DemoLabel text={`${t.common.demo} PDF`} />
                    )}
                    <h2 className="mt-1.5 font-display text-lg font-bold text-slate-900 dark:text-white">
                      {mat.title}
                    </h2>
                    <p className="mt-1 text-xs font-medium text-slate-500 dark:text-[#9fb0c8]">
                      {mat.subject} · <span className="font-mono-num">{mat.pages}</span> {t.common.pages}
                    </p>
                    <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-300">{mat.summary}</p>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownload(mat)}
                      className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#102544] px-3 text-xs font-semibold text-white hover:bg-[#1b3a6b] dark:bg-[#facc15] dark:text-[#102544]"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>{t.hub.download}</span>
                    </button>
                    {pdfSrc && (
                      <button
                        type="button"
                        onClick={() => setPreviewPdf({ title: mat.title, src: pdfSrc })}
                        aria-label={`Preview ${mat.title}`}
                        className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#24385c] dark:bg-[#122443] dark:text-slate-200"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleSaveMaterial(mat.id)}
                      aria-pressed={isSaved}
                      className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors ${
                        isSaved
                          ? 'border-[#102544] bg-[#eef2f8] text-[#102544] dark:border-[#facc15] dark:bg-[#16294b] dark:text-[#facc15]'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-[#24385c] dark:bg-[#122443] dark:text-slate-200'
                      }`}
                    >
                      <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-current' : ''}`} />
                      <span>{isSaved ? t.hub.savedBtn : t.hub.saveBtn}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Embedded PDF Reader Modal */}
      {previewPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/70"
            onClick={() => setPreviewPdf(null)}
            aria-hidden="true"
          />
          <div className="relative z-10 flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#24385c] dark:bg-[#122443]">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 dark:border-[#24385c]">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                {previewPdf.title}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewPdf(null)}
                aria-label={t.nav.close}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#16294b]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <iframe
              title={previewPdf.title}
              src={previewPdf.src}
              className="w-full flex-1 bg-slate-100 dark:bg-[#0b1730]"
            />
          </div>
        </div>
      )}
    </div>
  );
};
