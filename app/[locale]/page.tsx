import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Calculator } from '@/components/Calculator';
import { FAQ } from '@/components/FAQ';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ThemeToggle } from '@/components/ThemeToggle';
import { RunningIcon } from '@/components/RunningIcon';

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <main className="min-h-screen overflow-hidden relative bg-surface text-ink mesh-bg">
      <div className="absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-white/70 via-white/30 to-transparent dark:from-black/30 dark:via-black/10 dark:to-transparent pointer-events-none" />

      <div className="relative w-full max-w-[1600px] mx-auto px-3 md:px-5 lg:px-8 pb-16">
        <header className="flex flex-col gap-10 pt-12">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 lg:gap-10">
            <div className="space-y-4 max-w-3xl">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 dark:bg-black/40 ring-1 ring-gray-200 dark:ring-gray-800 text-xs uppercase tracking-[0.2em] font-semibold">
                <RunningIcon className="text-amber-500" />
                Pace Studio
              </span>
              <div className="space-y-3">
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl leading-tight text-ink dark:text-white drop-shadow-sm">
                  <HomeTitle />
                </h1>
                <p className="text-base md:text-lg text-muted max-w-2xl">
                  <HomeDescription />
                </p>
              </div>
              <div className="inline-flex flex-wrap gap-2 text-sm text-muted">
                <Badge>Live pace rig</Badge>
                <Badge>Split strategies</Badge>
                <Badge>Drag rings</Badge>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start">
              <LanguageSelector currentLocale={locale} />
              <ThemeToggle />
            </div>
          </div>

          <div className="grid gap-6 xl:gap-8 2xl:gap-12 items-start lg:grid-cols-1 xl:grid-cols-1 2xl:grid-cols-[minmax(0,1.7fr)_minmax(360px,0.85fr)]">
            <div className="min-w-0 rounded-3xl bg-white/80 dark:bg-black/50 with-grain backdrop-blur-xl ring-1 ring-gray-200/70 dark:ring-gray-800/80 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.35)] p-4 md:p-6 lg:p-8">
              <Calculator />
            </div>
            <div className="min-w-[320px] rounded-3xl border border-gray-200/70 dark:border-gray-800/80 bg-gradient-to-b from-white/80 via-white/60 to-white/30 dark:from-slate-900/80 dark:via-slate-900/50 dark:to-slate-900/30 backdrop-blur-xl p-6 flex flex-col gap-4 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.55)]">
              <h2 className="font-display text-xl text-ink dark:text-white">Race day notes</h2>
              <ul className="space-y-3 text-sm text-muted">
                <li className="flex gap-3"><Dot /> Lock pacing mode first, then adjust rings.</li>
                <li className="flex gap-3"><Dot /> Use split strategies to model fatigue or negative splits.</li>
                <li className="flex gap-3"><Dot /> Toggle km / mi and watch the plan adapt instantly.</li>
              </ul>
              <div className="mt-auto grid grid-cols-2 gap-3 text-xs text-muted">
                <div className="rounded-2xl p-3 ring-1 ring-gray-200 dark:ring-gray-800 bg-white/80 dark:bg-black/30">
                  <p className="font-semibold text-ink dark:text-white">Dragable rings</p>
                  <p>Distance + time respond in real time.</p>
                </div>
                <div className="rounded-2xl p-3 ring-1 ring-gray-200 dark:ring-gray-800 bg-white/80 dark:bg-black/30">
                  <p className="font-semibold text-ink dark:text-white">Split table</p>
                  <p>Exportable pacing checkpoints.</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-16">
          <FAQ />
        </section>

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
    <footer className="mt-14 border-t border-gray-200/70 dark:border-gray-800/80 pt-6 text-sm text-muted">
      <p className="mb-3 font-medium text-ink dark:text-white">Marathon Pace Studio — Built with Next.js & Framer Motion</p>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/user-service"
          locale={locale}
          className="font-semibold text-ink dark:text-white underline underline-offset-4 transition"
          style={{ textDecorationColor: 'var(--accent)' }}
        >
          {legalT('userServiceAgreement')}
        </Link>
        <span aria-hidden className="text-gray-400">•</span>
        <Link
          href="/privacy-policy"
          locale={locale}
          className="font-semibold text-ink dark:text-white underline underline-offset-4 transition"
          style={{ textDecorationColor: 'var(--accent)' }}
        >
          {legalT('privacyPolicy')}
        </Link>
        <span aria-hidden className="text-gray-400">•</span>
        <Link
          href="/support"
          locale={locale}
          className="font-semibold text-ink dark:text-white underline underline-offset-4 transition"
          style={{ textDecorationColor: 'var(--accent)' }}
        >
          {legalT('supportFeedback')}
        </Link>
      </div>
    </footer>
  );
}

function Dot() {
  return <span className="mt-1 h-2 w-2 rounded-full bg-accent inline-block flex-shrink-0" />;
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-ink/5 dark:bg-white/10 text-ink/80 dark:text-white/80 ring-1 ring-ink/10 dark:ring-white/10">
      {children}
    </span>
  );
}
