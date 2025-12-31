import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Analytics } from '@vercel/analytics/react';
import { IBM_Plex_Sans, Sora } from 'next/font/google';
import "../globals.css";
import { locales } from '@/i18n.config';
import { LOCALE_TITLES, LOCALE_DESCRIPTIONS } from '@/lib/metadata';

const display = Sora({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-display' });
const body = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-body' });

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  // 英语是主要语言,所有其他语言版本的 canonical URL 指向英语版本
  const canonicalLocale = locale === 'en' ? '' : '/en';
  const canonicalUrl = `https://marathonpacecalc.com${canonicalLocale}`;

  // 当前语言页面的 URL
  const currentLocaleUrl = locale === 'en' ? 'https://marathonpacecalc.com' : `https://marathonpacecalc.com/${locale}`;

  const title = LOCALE_TITLES[locale] || LOCALE_TITLES.en;
  const description = LOCALE_DESCRIPTIONS[locale] || LOCALE_DESCRIPTIONS.en;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': 'https://marathonpacecalc.com/en',
        'zh': 'https://marathonpacecalc.com/zh',
        'fr': 'https://marathonpacecalc.com/fr',
        'es': 'https://marathonpacecalc.com/es',
        'x-default': 'https://marathonpacecalc.com/en'
      }
    },
    openGraph: {
      title,
      description,
      url: currentLocaleUrl,
      siteName: 'Marathon Pace Calculator',
      locale: locale,
      type: 'website',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
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
    <html lang={locale} className={`${display.variable} ${body.variable}`}>
      <body className="antialiased font-body bg-surface text-ink">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
