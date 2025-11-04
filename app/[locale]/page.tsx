import { useTranslations } from 'next-intl';
import { Calculator } from '@/components/Calculator';
import { FAQ } from '@/components/FAQ';
import { Languages } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { locales } from '@/i18n.config';

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <main className="min-h-screen bg-gradient-to-br from-lime-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12">
      <div className="container mx-auto px-4">
        {/* Header with Language Selector */}
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-lime-400 to-blue-500 bg-clip-text text-transparent">
              <HomeTitle />
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              <HomeDescription />
            </p>
          </div>

          <LanguageSelector currentLocale={locale} />
        </header>

        {/* Calculator Component */}
        <Calculator />

        {/* FAQ and How-to-Use Component */}
        <FAQ />

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>Marathon Pace Calculator - Built with Next.js & Framer Motion</p>
        </footer>
      </div>
    </main>
  );
}

function HomeTitle() {
  const t = useTranslations();
  return <>{t('title')}</>;
}

function HomeDescription() {
  const t = useTranslations();
  return <>{t('description')}</>;
}

function LanguageSelector({ currentLocale }: { currentLocale: string }) {
  const locale = currentLocale;

  const languageNames: Record<string, string> = {
    en: 'English',
    zh: '中文',
    fr: 'Français',
    es: 'Español',
  };

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition border border-gray-200 dark:border-gray-700">
        <Languages size={20} />
        <span>{languageNames[locale]}</span>
      </button>

      {/* Dropdown */}
      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        {locales.map((loc) => (
          <Link
            key={loc}
            href="/"
            locale={loc}
            className={`block px-4 py-2 hover:bg-lime-100 dark:hover:bg-lime-900/30 transition ${
              loc === locale ? 'bg-lime-50 dark:bg-lime-900/20 font-semibold' : ''
            } first:rounded-t-lg last:rounded-b-lg`}
          >
            {languageNames[loc]}
          </Link>
        ))}
      </div>
    </div>
  );
}
