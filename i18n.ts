import { getRequestConfig } from 'next-intl/server';
import { routing } from './i18n.config';
import enMessages from './messages/en.json';
import zhMessages from './messages/zh.json';
import frMessages from './messages/fr.json';
import esMessages from './messages/es.json';

// 优化: 使用静态导入代替动态导入，避免每次都计算
const messagesByLocale = {
  en: enMessages,
  zh: zhMessages,
  fr: frMessages,
  es: esMessages,
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  const locale = await requestLocale;
  type SupportedLocale = (typeof routing.locales)[number];

  // Ensure that the incoming locale is valid
  const normalizedLocale = locale && routing.locales.includes(locale as SupportedLocale)
    ? (locale as SupportedLocale)
    : routing.defaultLocale;

  return {
    locale: normalizedLocale,
    messages: messagesByLocale[normalizedLocale]
  };
});
