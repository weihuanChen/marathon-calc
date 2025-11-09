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
