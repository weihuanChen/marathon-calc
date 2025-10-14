import { defineRouting } from 'next-intl/routing';

// 支持的语言列表
export const locales = ['en', 'zh', 'fr', 'es'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'as-needed'
});
