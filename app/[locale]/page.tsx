import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Calculator } from '@/components/Calculator';
import { FAQ } from '@/components/FAQ';
import { LanguageSelector } from '@/components/LanguageSelector';

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
        <HomeFooter locale={locale} />
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

function HomeFooter({ locale }: { locale: string }) {
  const legalT = useTranslations('legal');

  return (
    <footer className="mt-16 text-center text-sm text-gray-500 dark:text-gray-400">
      <p className="mb-3">Marathon Pace Calculator - Built with Next.js & Framer Motion</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/user-service"
          locale={locale}
          className="font-medium text-lime-700 underline underline-offset-4 transition hover:text-lime-600 dark:text-lime-300 dark:hover:text-lime-200"
        >
          {legalT('userServiceAgreement')}
        </Link>
        <span aria-hidden className="text-gray-400">•</span>
        <Link
          href="/privacy-policy"
          locale={locale}
          className="font-medium text-lime-700 underline underline-offset-4 transition hover:text-lime-600 dark:text-lime-300 dark:hover:text-lime-200"
        >
          {legalT('privacyPolicy')}
        </Link>
        <span aria-hidden className="text-gray-400">•</span>
        <Link
          href="/support"
          locale={locale}
          className="font-medium text-lime-700 underline underline-offset-4 transition hover:text-lime-600 dark:text-lime-300 dark:hover:text-lime-200"
        >
          {legalT('supportFeedback')}
        </Link>
      </div>
    </footer>
  );
}
