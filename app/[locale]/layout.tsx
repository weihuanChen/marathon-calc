import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from '@vercel/analytics/react';
import "../globals.css";
import { locales } from '@/i18n.config';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const titles: Record<string, string> = {
    en: 'Marathon Pace Calculator',
    zh: '马拉松配速计算器',
    fr: 'Calculateur d\'Allure Marathon',
    es: 'Calculadora de Ritmo de Maratón'
  };

  const descriptions: Record<string, string> = {
    en: 'Calculate your running pace, time, or distance with an interactive dashboard',
    zh: '使用交互式仪表板计算您的跑步配速、时间或距离',
    fr: 'Calculez votre allure, temps ou distance de course avec un tableau de bord interactif',
    es: 'Calcula tu ritmo, tiempo o distancia de carrera con un panel interactivo'
  };

  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
