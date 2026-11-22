export interface ParsedMcqItem {
  tempId: string;
  question: string;
  options: string[];
  correctIndex: number;
  hasExplicitCorrect: boolean;
  explanation: string;
}

export interface ParsedMcqWarning {
  index: number;
  message: string;
  rawPreview: string;
}

export interface BulkMcqParseResult {
  items: ParsedMcqItem[];
  warnings: ParsedMcqWarning[];
}

export const SAMPLE_BULK_MCQ_TEXT = `1. Battle of Khanwa was fought between?
A) Babur and Rana Sanga [Correct]
B) Humayun and Sher Khan
C) Akbar and Rana Pratap
D) Lodi and Rana Sanga
Explanation: This landmark battle was fought in 1527 near Khanwa.

2. Which fundamental right is protected under Article 21 of the Indian Constitution?
A) Right to Equality
B) Right to Life and Personal Liberty [Correct]
C) Right to Freedom of Religion
D) Right against Exploitation
Explanation: Article 21 guarantees protection of life and personal liberty.

3. What does RAM stand for in computing?
A) Read Access Memory
B) Random Access Memory *
C) Rapid Allocation Module
D) Runtime Array Memory
Explanation: RAM stands for Random Access Memory and stores active working data.`;

const QUESTION_START_RE = /^(?:(?:Q|Question)\.?\s*)?(?:\d+|[০-৯]+)[.):\-\]]\s+(.+)$/i;
const OPTION_LINE_RE = /^\s*(\*)?\s*\(?([A-Fa-f]|[ক-ঘ]|[1-6])\s*(?:\)|\.|:|-)\s*(\*)?\s*(.+)$/;
const EXPLANATION_RE = /^(?:Explanation|Exp|Note|Solution|ব্যাখ্যা)\s*[:：\-]\s*(.*)$/i;
const ANSWER_LINE_RE = /^(?:Answer|Ans|Correct(?:\s+Answer)?|উত্তর)\s*[:：\-]\s*(.+)$/i;

const LETTER_TO_INDEX: Record<string, number> = {
  a: 0,
  b: 1,
  c: 2,
  d: 3,
  e: 4,
  f: 5,
  '1': 0,
  '2': 1,
  '3': 2,
  '4': 3,
  '5': 4,
  '6': 5,
  ক: 0,
  খ: 1,
  গ: 2,
  ঘ: 3,
};

function stripCorrectMarker(raw: string): { text: string; isCorrect: boolean } {
  let text = raw.trim();
  let isCorrect = false;

  const markerPatterns = [
    /\[(?:correct|ans|right|true)\]/gi,
    /\((?:correct|ans|right|true)\)/gi,
    /[✓✔✅]/g,
  ];

  for (const pat of markerPatterns) {
    if (pat.test(text)) {
      isCorrect = true;
      text = text.replace(pat, '').trim();
    }
  }

  // Trailing or leading * marker (e.g. "* Babur" or "Babur *")
  if (/^\*\s*/.test(text)) {
    isCorrect = true;
    text = text.replace(/^\*\s*/, '').trim();
  }
  if (/\s*\*+$/.test(text)) {
    isCorrect = true;
    text = text.replace(/\s*\*+$/, '').trim();
  }

  return { text, isCorrect };
}

function splitIntoQuestionBlocks(rawInput: string): string[][] {
  const normalized = rawInput.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');

  // Detect if input uses explicit numbered questions (e.g. "1. ...", "2) ...", "Q1. ...")
  const hasNumberedMarkers = lines.some((line) => QUESTION_START_RE.test(line.trim()));

  if (hasNumberedMarkers) {
    const blocks: string[][] = [];
    let current: string[] = [];

    for (const rawLine of lines) {
      const trimmed = rawLine.trim();
      // Ignore decorative header lines before first question like "Format Model:"
      if (blocks.length === 0 && current.length === 0 && /^format\s*model\s*:?$/i.test(trimmed)) {
        continue;
      }

      if (QUESTION_START_RE.test(trimmed)) {
        if (current.some((l) => l.trim().length > 0)) {
          blocks.push(current);
        }
        current = [trimmed];
      } else {
        if (current.length > 0 || trimmed.length > 0) {
          current.push(rawLine);
        }
      }
    }
    if (current.some((l) => l.trim().length > 0)) {
      blocks.push(current);
    }
    return blocks;
  }

  // Fallback: split by one or more blank lines
  const blocks: string[][] = [];
  let current: string[] = [];
  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (/^format\s*model\s*:?$/i.test(trimmed) && blocks.length === 0 && current.length === 0) {
      continue;
    }
    if (!trimmed) {
      if (current.length > 0) {
        blocks.push(current);
        current = [];
      }
    } else {
      current.push(rawLine);
    }
  }
  if (current.length > 0) {
    blocks.push(current);
  }
  return blocks;
}

export function parseBulkMcqs(rawInput: string): BulkMcqParseResult {
  const blocks = splitIntoQuestionBlocks(rawInput);
  const items: ParsedMcqItem[] = [];
  const warnings: ParsedMcqWarning[] = [];

  blocks.forEach((blockLines, blockIdx) => {
    const cleanLines = blockLines.map((l) => l.trim()).filter(Boolean);
    if (!cleanLines.length) return;

    const questionLines: string[] = [];
    const options: string[] = [];
    const explanationLines: string[] = [];
    let correctIndex = -1;
    let inExplanation = false;
    let seenAnyOption = false;

    for (let i = 0; i < cleanLines.length; i += 1) {
      const line = cleanLines[i];

      const expMatch = line.match(EXPLANATION_RE);
      if (expMatch) {
        inExplanation = true;
        if (expMatch[1]?.trim()) {
          explanationLines.push(expMatch[1].trim());
        }
        continue;
      }

      const ansMatch = line.match(ANSWER_LINE_RE);
      if (ansMatch && seenAnyOption) {
        inExplanation = false;
        const ansVal = ansMatch[1].trim().toLowerCase();
        const firstChar = ansVal.charAt(0);
        if (firstChar in LETTER_TO_INDEX) {
          correctIndex = LETTER_TO_INDEX[firstChar];
        } else {
          // Try matching by option text
          const byText = options.findIndex((o) => o.toLowerCase() === ansVal);
          if (byText >= 0) correctIndex = byText;
        }
        continue;
      }

      if (inExplanation) {
        explanationLines.push(line);
        continue;
      }

      const optMatch = line.match(OPTION_LINE_RE);
      if (optMatch && (i > 0 || questionLines.length > 0)) {
        seenAnyOption = true;
        const hasStarPrefix = Boolean(optMatch[1] || optMatch[3]);
        const rawOptBody = optMatch[4] || '';
        const cleaned = stripCorrectMarker(rawOptBody);

        if (cleaned.text) {
          const nextIdx = options.length;
          if (nextIdx < 6) {
            options.push(cleaned.text.slice(0, 300));
            if (hasStarPrefix || cleaned.isCorrect) {
              correctIndex = nextIdx;
            }
          }
        }
        continue;
      }

      if (!seenAnyOption) {
        const qMatch = line.match(QUESTION_START_RE);
        if (questionLines.length === 0 && qMatch) {
          questionLines.push(qMatch[1].trim());
        } else {
          questionLines.push(line);
        }
      } else {
        // Extra line after options without "Explanation:" prefix
        explanationLines.push(line);
      }
    }

    const questionText = questionLines.join(' ').trim().slice(0, 1000);
    const explanationText = explanationLines.join(' ').trim().slice(0, 1200);

    if (questionText.length < 3 || options.length < 2) {
      warnings.push({
        index: blockIdx + 1,
        message:
          questionText.length < 3
            ? 'Question text is too short (minimum 3 characters).'
            : `Found only ${options.length} option(s). Need at least 2 options (A, B, ...).`,
        rawPreview: cleanLines.slice(0, 2).join(' '),
      });
      return;
    }

    const hasExplicitCorrect = correctIndex >= 0 && correctIndex < options.length;
    const safeCorrectIndex = hasExplicitCorrect ? correctIndex : 0;

    if (!hasExplicitCorrect) {
      warnings.push({
        index: blockIdx + 1,
        message: 'No [Correct] or * mark found — defaulted to Option A (click any option in preview to set).',
        rawPreview: questionText,
      });
    }

    items.push({
      tempId: `bulk_${blockIdx}_${questionText.slice(0, 16)}`,
      question: questionText,
      options,
      correctIndex: safeCorrectIndex,
      hasExplicitCorrect,
      explanation: explanationText,
    });
  });

  return { items, warnings };
}
