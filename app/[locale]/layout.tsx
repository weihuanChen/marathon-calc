import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Analytics } from '@vercel/analytics/react';
import "../globals.css";
import { locales } from '@/i18n.config';
import { LOCALE_TITLES, LOCALE_DESCRIPTIONS } from '@/lib/metadata';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return {
    title: LOCALE_TITLES[locale] || LOCALE_TITLES.en,
    description: LOCALE_DESCRIPTIONS[locale] || LOCALE_DESCRIPTIONS.en,
    icons: {
      icon: [
        { url: '/favicon.ico', type: 'image/x-icon' }
      ],
      shortcut: ['/favicon.ico']
    }
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // 确保语言是支持的
  if (!locales.includes(locale as (typeof locales)[number])) {
    notFound();
  }

  // 获取翻译消息
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
