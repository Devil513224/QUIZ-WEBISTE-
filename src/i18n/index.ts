import { en, type TranslationSchema } from './en';
import { bn } from './bn';
import { hi } from './hi';

export type { TranslationSchema };
export type LanguageCode = 'en' | 'bn' | 'hi';

export const TRANSLATIONS: Record<LanguageCode, TranslationSchema> = {
  en,
  bn,
  hi,
};

export const LANGUAGE_OPTIONS: Array<{ code: LanguageCode; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'hi', label: 'हिन्दी' },
];
