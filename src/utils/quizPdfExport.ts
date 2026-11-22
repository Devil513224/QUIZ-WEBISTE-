import { jsPDF } from 'jspdf';
import {
  DEFAULT_PDF_BRANDING,
  LOGO_URL,
  type PdfBrandingConfig,
  type QuestionItem,
} from '../data/demoData';

const PAGE_W = 1240; // ~150 DPI A4 width
const PAGE_H = 1754; // ~150 DPI A4 height
const MARGIN_X = 68;
const CONTENT_W = PAGE_W - MARGIN_X * 2; // 1104
const COL_GAP = 32;
const TWO_COL_W = Math.floor((CONTENT_W - COL_GAP) / 2); // 536
const HEADER_H = 148;
const FOOTER_H = 68;
const BODY_TOP = HEADER_H + 30;
const BODY_BOTTOM = PAGE_H - FOOTER_H - 22;

const FONT_STACK = "'Hind Siliguri', 'Noto Sans Bengali', system-ui, -apple-system, sans-serif";
const HEX_COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    if (!src.startsWith('data:') && !src.startsWith('/')) {
      img.crossOrigin = 'anonymous';
    }
    const timer = window.setTimeout(() => resolve(null), 5000);
    img.onload = () => {
      window.clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      resolve(null);
    };
    img.src = src;
  });
}

export async function resizeImageFileToDataUrl(file: File, maxDim = 220): Promise<string> {
  const rawUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read image file.'));
    reader.readAsDataURL(file);
  });

  const img = await loadImage(rawUrl);
  if (!img) {
    throw new Error('Selected file is not a valid image.');
  }

  const ratio = Math.min(maxDim / img.width, maxDim / img.height, 1);
  const w = Math.max(32, Math.round(img.width * ratio));
  const h = Math.max(32, Math.round(img.height * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return rawUrl;
  ctx.drawImage(img, 0, 0, w, h);

  const pngUrl = canvas.toDataURL('image/png');
  if (pngUrl.length <= 280_000) return pngUrl;
  return canvas.toDataURL('image/jpeg', 0.86);
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];
  const words = cleaned.split(' ');
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      if (ctx.measureText(word).width > maxWidth) {
        let part = '';
        for (const ch of word) {
          if (ctx.measureText(part + ch).width > maxWidth && part) {
            lines.push(part);
            part = ch;
          } else {
            part += ch;
          }
        }
        line = part;
      } else {
        line = word;
      }
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

interface MeasuredOption {
  label: string;
  isCorrect: boolean;
  lines: string[];
}

interface MeasuredQuestion {
  qLines: string[];
  options: MeasuredOption[];
  optionsGridTwoUp: boolean;
  expLines: string[];
  blockH: number;
}

interface ColumnLayoutMetrics {
  qFontSize: number;
  qLineH: number;
  optFontSize: number;
  optLineH: number;
  expFontSize: number;
  expLineH: number;
  padX: number;
  padTop: number;
  cardGap: number;
}

function getMetricsForMode(twoCol: boolean): ColumnLayoutMetrics {
  if (twoCol) {
    return {
      qFontSize: 18,
      qLineH: 25,
      optFontSize: 16,
      optLineH: 22,
      expFontSize: 14.5,
      expLineH: 20,
      padX: 16,
      padTop: 28,
      cardGap: 14,
    };
  }
  return {
    qFontSize: 21,
    qLineH: 29,
    optFontSize: 18.5,
    optLineH: 25,
    expFontSize: 16.5,
    expLineH: 23,
    padX: 22,
    padTop: 32,
    cardGap: 16,
  };
}

function measureQuestions(
  ctx: CanvasRenderingContext2D,
  questions: QuestionItem[],
  colW: number,
  metrics: ColumnLayoutMetrics,
  includeAnswers: boolean
): MeasuredQuestion[] {
  const innerW = colW - metrics.padX * 2;
  const twoUpCellW = Math.floor((innerW - 14) / 2);

  return questions.map((q, idx) => {
    const numPrefix = `${idx + 1}. `;
    ctx.font = `700 ${metrics.qFontSize}px ${FONT_STACK}`;
    const qLines = wrapLines(ctx, `${numPrefix}${q.question}`, innerW);

    ctx.font = `500 ${metrics.optFontSize}px ${FONT_STACK}`;
    const optionStrings = q.options.map((opt, oIdx) => {
      const prefix = `${'ABCDEF'[oIdx]}) `;
      const suffix = includeAnswers && oIdx === q.correctIndex ? ' ✓' : '';
      return {
        label: `${prefix}${opt}${suffix}`,
        isCorrect: includeAnswers && oIdx === q.correctIndex,
      };
    });

    // Place options in a clean 2x2 grid when all 4 options fit on single lines inside half-column width
    const canTwoUp =
      optionStrings.length === 4 &&
      optionStrings.every((o) => {
        ctx.font = `${o.isCorrect ? 700 : 500} ${metrics.optFontSize}px ${FONT_STACK}`;
        return ctx.measureText(o.label).width <= twoUpCellW - 16;
      });

    const options: MeasuredOption[] = optionStrings.map((o) => {
      ctx.font = `${o.isCorrect ? 700 : 500} ${metrics.optFontSize}px ${FONT_STACK}`;
      return {
        label: o.label,
        isCorrect: o.isCorrect,
        lines: canTwoUp ? [o.label] : wrapLines(ctx, o.label, innerW - 20),
      };
    });

    ctx.font = `500 ${metrics.expFontSize}px ${FONT_STACK}`;
    const expLines =
      includeAnswers && q.explanation.trim()
        ? wrapLines(ctx, `Explanation: ${q.explanation.trim()}`, innerW - 20)
        : [];

    let optionsH = 0;
    if (canTwoUp) {
      const rowH = metrics.optLineH + 10;
      optionsH = rowH * 2 + 8;
    } else {
      optionsH = options.reduce(
        (sum, o) => sum + o.lines.length * metrics.optLineH + (includeAnswers ? 8 : 5),
        0
      );
    }

    const expH = expLines.length > 0 ? 10 + expLines.length * metrics.expLineH + 16 : 0;
    const cardInnerH =
      14 + qLines.length * metrics.qLineH + 10 + optionsH + expH + 10;

    return {
      qLines,
      options,
      optionsGridTwoUp: canTwoUp,
      expLines,
      blockH: cardInnerH + metrics.cardGap,
    };
  });
}

export interface ExportQuizPdfParams {
  testName: string;
  testType?: string;
  minutes?: number;
  questions: QuestionItem[];
  branding?: PdfBrandingConfig;
  includeAnswers?: boolean;
}

export async function exportQuizToPdf({
  testName,
  testType = 'Quiz / Practice Set',
  minutes,
  questions,
  branding = DEFAULT_PDF_BRANDING,
  includeAnswers = true,
}: ExportQuizPdfParams): Promise<void> {
  if (!questions.length) {
    throw new Error('No questions available in this quiz to export as PDF.');
  }

  const brandName = (branding.brandName || 'LEARN WITH TG').trim();
  const tagline = (branding.tagline || '').trim();
  const footerNote = (branding.footerNote || brandName).trim();
  const accentColor = HEX_COLOR_RE.test(branding.accentColor || '')
    ? branding.accentColor
    : '#102544';

  const wmMode =
    branding.watermarkMode === 'logo' ||
    branding.watermarkMode === 'text' ||
    branding.watermarkMode === 'none'
      ? branding.watermarkMode
      : 'both';
  const wmText = (branding.watermarkText ?? brandName).trim() || brandName;
  const wmColor = HEX_COLOR_RE.test(branding.watermarkColor || '')
    ? branding.watermarkColor!
    : accentColor;
  const wmOpacity =
    typeof branding.watermarkOpacity === 'number' && Number.isFinite(branding.watermarkOpacity)
      ? Math.max(0, Math.min(0.4, branding.watermarkOpacity))
      : 0.08;

  const logoSrc = branding.logoDataUrl || branding.logoUrl || LOGO_URL;
  const customWmLogoSrc = branding.watermarkLogoDataUrl || branding.watermarkLogoUrl || '';

  const [logoImg, customWmImg] = await Promise.all([
    loadImage(logoSrc),
    customWmLogoSrc ? loadImage(customWmLogoSrc) : Promise.resolve(null),
  ]);
  const wmLogoImg = customWmImg || logoImg;

  // Measure at 2-column width first to determine whether 2-column or 1-column layout is cleanest
  const measureCanvas = document.createElement('canvas');
  const measureCtx = measureCanvas.getContext('2d')!;
  const halfMetrics = getMetricsForMode(true);
  const halfMeasured = measureQuestions(
    measureCtx,
    questions,
    TWO_COL_W,
    halfMetrics,
    includeAnswers
  );

  const maxQLines = Math.max(...halfMeasured.map((m) => m.qLines.length));
  const maxBlockH = Math.max(...halfMeasured.map((m) => m.blockH));
  const avgBlockH =
    halfMeasured.reduce((sum, m) => sum + m.blockH, 0) / Math.max(1, halfMeasured.length);

  // Adaptive 2-column rule:
  // - Questions-Only: use 2 columns whenever questions/options are compact to medium
  // - With-Answers: use 2 columns when answers/explanations stay compact; switch to 1 column when long
  const useTwoCols = includeAnswers
    ? maxQLines <= 6 && maxBlockH <= 460 && avgBlockH <= 320
    : maxQLines <= 7 && maxBlockH <= 420 && avgBlockH <= 280;

  const colW = useTwoCols ? TWO_COL_W : CONTENT_W;
  const metrics = useTwoCols ? halfMetrics : getMetricsForMode(false);
  const measured = useTwoCols
    ? halfMeasured
    : measureQuestions(measureCtx, questions, CONTENT_W, metrics, includeAnswers);

  const pages: HTMLCanvasElement[] = [];

  const drawWatermark = (ctx: CanvasRenderingContext2D) => {
    if (wmMode === 'none' || wmOpacity <= 0) return;

    const cx = PAGE_W / 2;
    const cy = PAGE_H / 2 + 24;
    const showLogo = (wmMode === 'logo' || wmMode === 'both') && Boolean(wmLogoImg);
    const showText = (wmMode === 'text' || wmMode === 'both') && Boolean(wmText);

    ctx.save();
    ctx.globalAlpha = wmOpacity;

    if (showLogo && wmLogoImg) {
      const logoCy = showText ? cy - 48 : cy;
      const wmRadius = 152;

      // Colored outer emblem halo & ring in chosen watermark color
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, logoCy, wmRadius + 14, 0, Math.PI * 2);
      ctx.fillStyle = wmColor;
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, logoCy, wmRadius, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(wmLogoImg, cx - wmRadius, logoCy - wmRadius, wmRadius * 2, wmRadius * 2);
      // Soft tint wash so watermark color visibly harmonizes with uploaded logo
      ctx.fillStyle = wmColor;
      ctx.globalAlpha = wmOpacity * 0.35;
      ctx.fillRect(cx - wmRadius, logoCy - wmRadius, wmRadius * 2, wmRadius * 2);
      ctx.restore();

      ctx.beginPath();
      ctx.arc(cx, logoCy, wmRadius + 14, 0, Math.PI * 2);
      ctx.strokeStyle = wmColor;
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    if (showText) {
      ctx.fillStyle = wmColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (showLogo) {
        // Bold centered text seal directly beneath the logo watermark + subtle diagonal seal
        ctx.font = `800 54px ${FONT_STACK}`;
        ctx.fillText(wmText.toUpperCase(), cx, cy + 168, CONTENT_W - 120);
      } else {
        ctx.translate(cx, cy);
        ctx.rotate(-Math.PI / 6);
        ctx.font = `800 76px ${FONT_STACK}`;
        ctx.fillText(wmText.toUpperCase(), 0, 0, CONTENT_W);
      }
    }

    ctx.restore();
  };

  const drawColumnDivider = (ctx: CanvasRenderingContext2D, topY: number) => {
    if (!useTwoCols) return;
    const dividerX = MARGIN_X + TWO_COL_W + COL_GAP / 2;
    ctx.save();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(dividerX, topY);
    ctx.lineTo(dividerX, BODY_BOTTOM);
    ctx.stroke();
    ctx.restore();
  };

  const createPage = (colStartY: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } => {
    const canvas = document.createElement('canvas');
    canvas.width = PAGE_W;
    canvas.height = PAGE_H;
    const ctx = canvas.getContext('2d')!;

    // White sheet
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);

    // Header banner
    ctx.fillStyle = accentColor;
    ctx.fillRect(0, 0, PAGE_W, HEADER_H);

    // Gold bottom accent strip on header
    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, HEADER_H - 6, PAGE_W, 6);

    // Logo badge on left
    const logoCx = MARGIN_X + 44;
    const logoCy = HEADER_H / 2 - 2;
    const logoR = 40;
    ctx.save();
    ctx.beginPath();
    ctx.arc(logoCx, logoCy, logoR + 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.clip();
    if (logoImg) {
      ctx.drawImage(logoImg, logoCx - logoR, logoCy - logoR, logoR * 2, logoR * 2);
    } else {
      ctx.fillStyle = '#facc15';
      ctx.fillRect(logoCx - logoR, logoCy - logoR, logoR * 2, logoR * 2);
      ctx.fillStyle = accentColor;
      ctx.font = `800 28px ${FONT_STACK}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(brandName.slice(0, 2).toUpperCase(), logoCx, logoCy);
    }
    ctx.restore();

    // Brand Name & Tagline
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#ffffff';
    ctx.font = `800 32px ${FONT_STACK}`;
    ctx.fillText(brandName, MARGIN_X + 102, 66, 650);

    if (tagline) {
      ctx.fillStyle = '#facc15';
      ctx.font = `600 18px ${FONT_STACK}`;
      ctx.fillText(tagline, MARGIN_X + 102, 100, 650);
    }

    // Right side Test Badge
    ctx.textAlign = 'right';
    ctx.fillStyle = '#e2e8f0';
    ctx.font = `600 17px ${FONT_STACK}`;
    ctx.fillText(testType.toUpperCase(), PAGE_W - MARGIN_X, 58, 360);
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 19px ${FONT_STACK}`;
    const metaRight = `${questions.length} Qs${minutes ? ` · ${minutes} Min` : ''}`;
    ctx.fillText(metaRight, PAGE_W - MARGIN_X, 94, 360);

    // Center Page Watermark (Logo + Colored Text)
    drawWatermark(ctx);

    // Optional column divider (for Page 2+; Page 1 draws after title card)
    if (colStartY === BODY_TOP) {
      drawColumnDivider(ctx, BODY_TOP);
    }

    ctx.textAlign = 'left';
    pages.push(canvas);
    return { canvas, ctx };
  };

  const titleCardH = 78;
  const page1BodyStart = BODY_TOP + titleCardH + 22;
  let current = createPage(page1BodyStart);

  // Title Card on Page 1
  current.ctx.fillStyle = 'rgba(241, 245, 249, 0.9)';
  drawRoundedRect(current.ctx, MARGIN_X, BODY_TOP, CONTENT_W, titleCardH, 12);
  current.ctx.fill();
  current.ctx.fillStyle = '#0f172a';
  current.ctx.font = `800 26px ${FONT_STACK}`;
  current.ctx.fillText(testName, MARGIN_X + 22, BODY_TOP + 36, CONTENT_W - 44);
  current.ctx.fillStyle = '#475569';
  current.ctx.font = `600 16.5px ${FONT_STACK}`;
  const subtitleLabel = includeAnswers
    ? `Answer Key & Explanations (${useTwoCols ? '2-Column Compact' : 'Detailed 1-Column'})`
    : `Practice Question Paper (${useTwoCols ? '2-Column Paper' : 'Full-Width Paper'})`;
  current.ctx.fillText(subtitleLabel, MARGIN_X + 22, BODY_TOP + 63, CONTENT_W - 44);

  drawColumnDivider(current.ctx, page1BodyStart);

  let colIndex: 0 | 1 = 0;
  let colTopY = page1BodyStart;
  let cursorY = page1BodyStart;

  measured.forEach((m) => {
    const cardH = m.blockH - metrics.cardGap;

    if (cursorY + cardH > BODY_BOTTOM && cursorY > colTopY + 8) {
      if (useTwoCols && colIndex === 0) {
        colIndex = 1;
        cursorY = colTopY;
      } else {
        current = createPage(BODY_TOP);
        colIndex = 0;
        colTopY = BODY_TOP;
        cursorY = BODY_TOP;
      }
    }

    const colX =
      colIndex === 0 ? MARGIN_X : MARGIN_X + TWO_COL_W + COL_GAP;
    const drawCtx = current.ctx;

    // Semi-transparent card fill so center watermark stays visible underneath
    drawCtx.fillStyle = 'rgba(255, 255, 255, 0.62)';
    drawCtx.strokeStyle = includeAnswers ? '#cbd5e1' : '#dbe3ee';
    drawCtx.lineWidth = 1.25;
    drawRoundedRect(drawCtx, colX, cursorY, colW, cardH, 10);
    drawCtx.fill();
    drawCtx.stroke();

    let y = cursorY + metrics.padTop;

    // Question text (e.g. "1. Question...")
    drawCtx.fillStyle = '#0f172a';
    drawCtx.font = `700 ${metrics.qFontSize}px ${FONT_STACK}`;
    drawCtx.textAlign = 'left';
    for (const ql of m.qLines) {
      drawCtx.fillText(ql, colX + metrics.padX, y);
      y += metrics.qLineH;
    }
    y += 6;

    // Options (either compact 2x2 grid or stacked list)
    const innerW = colW - metrics.padX * 2;
    if (m.optionsGridTwoUp) {
      const cellW = Math.floor((innerW - 14) / 2);
      const rowH = metrics.optLineH + 10;
      for (let i = 0; i < m.options.length; i += 2) {
        const pair = [m.options[i], m.options[i + 1]];
        pair.forEach((opt, pIdx) => {
          if (!opt) return;
          const cellX = colX + metrics.padX + pIdx * (cellW + 14);
          if (opt.isCorrect) {
            drawCtx.fillStyle = 'rgba(236, 253, 245, 0.88)';
            drawCtx.strokeStyle = '#10b981';
            drawCtx.lineWidth = 1.25;
            drawRoundedRect(drawCtx, cellX, y - metrics.optLineH + 3, cellW, rowH - 2, 6);
            drawCtx.fill();
            drawCtx.stroke();
            drawCtx.fillStyle = '#065f46';
            drawCtx.font = `700 ${metrics.optFontSize}px ${FONT_STACK}`;
          } else {
            drawCtx.fillStyle = '#334155';
            drawCtx.font = `500 ${metrics.optFontSize}px ${FONT_STACK}`;
          }
          drawCtx.fillText(opt.label, cellX + 8, y);
        });
        y += rowH + 4;
      }
    } else {
      for (const opt of m.options) {
        const rowH = opt.lines.length * metrics.optLineH + 6;
        if (opt.isCorrect) {
          drawCtx.fillStyle = 'rgba(236, 253, 245, 0.88)';
          drawCtx.strokeStyle = '#10b981';
          drawCtx.lineWidth = 1.25;
          drawRoundedRect(
            drawCtx,
            colX + metrics.padX,
            y - metrics.optLineH + 4,
            innerW,
            rowH,
            7
          );
          drawCtx.fill();
          drawCtx.stroke();
          drawCtx.fillStyle = '#065f46';
          drawCtx.font = `700 ${metrics.optFontSize}px ${FONT_STACK}`;
        } else {
          drawCtx.fillStyle = '#334155';
          drawCtx.font = `500 ${metrics.optFontSize}px ${FONT_STACK}`;
        }

        for (const ol of opt.lines) {
          drawCtx.fillText(ol, colX + metrics.padX + 10, y);
          y += metrics.optLineH;
        }
        y += includeAnswers ? 8 : 5;
      }
    }

    // Explanation box (only when includeAnswers === true)
    if (m.expLines.length > 0) {
      const expBoxH = m.expLines.length * metrics.expLineH + 14;
      drawCtx.fillStyle = 'rgba(238, 242, 248, 0.88)';
      drawRoundedRect(drawCtx, colX + metrics.padX, y - 8, innerW, expBoxH, 7);
      drawCtx.fill();
      drawCtx.fillStyle = '#1e293b';
      drawCtx.font = `500 ${metrics.expFontSize}px ${FONT_STACK}`;
      let ey = y + metrics.expLineH - 8;
      for (const el of m.expLines) {
        drawCtx.fillText(el, colX + metrics.padX + 10, ey);
        ey += metrics.expLineH;
      }
    }

    cursorY += m.blockH;
  });

  // Draw Footers on all pages
  const totalPages = pages.length;
  pages.forEach((canvas, idx) => {
    const ctx = canvas.getContext('2d')!;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(MARGIN_X, PAGE_H - FOOTER_H);
    ctx.lineTo(PAGE_W - MARGIN_X, PAGE_H - FOOTER_H);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = `600 15.5px ${FONT_STACK}`;
    ctx.textAlign = 'left';
    ctx.fillText(footerNote, MARGIN_X, PAGE_H - 28, CONTENT_W - 180);

    ctx.textAlign = 'right';
    ctx.fillText(`Page ${idx + 1} of ${totalPages}`, PAGE_W - MARGIN_X, PAGE_H - 28);
  });

  // Pack pages into a single A4 PDF
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  pages.forEach((canvas, idx) => {
    if (idx > 0) pdf.addPage();
    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
  });

  const safeFile =
    testName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'quiz-qa';
  const fileSuffix = includeAnswers ? '-answers' : '-questions-only';
  pdf.save(`${safeFile}${fileSuffix}.pdf`);
}
