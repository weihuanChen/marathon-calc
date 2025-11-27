import { AgreementDisclaimer } from '@/components/AgreementDisclaimer';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { ArrowLeft, MessageCircleHeart } from 'lucide-react';

const DOMAIN = 'marathoncalc.com';
const CONTACT_EMAIL = 'shendongloving123@gmail.com';

type SectionItem = {
  title: string;
  description?: string;
  bullets?: string[];
};

type Section = {
  title: string;
  items: SectionItem[];
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'support' });

  return {
    title: t('meta.title'),
    description: t('meta.description')
  };
}

export default async function SupportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'support' });
  const disclaimerT = await getTranslations({ locale, namespace: 'disclaimer' });

  const sections: Section[] = [
    {
      title: t('sections.contact.title'),
      items: [
        {
          title: t('sections.contact.items.email.title'),
          description: t('sections.contact.items.email.description', { email: CONTACT_EMAIL })
        },
        {
          title: t('sections.contact.items.responseTime.title'),
          description: t('sections.contact.items.responseTime.description')
        },
        {
          title: t('sections.contact.items.languages.title'),
          description: t('sections.contact.items.languages.description')
        }
      ]
    },
    {
      title: t('sections.bugReports.title'),
      items: [
        {
          title: t('sections.bugReports.items.details.title'),
          bullets: t.raw('sections.bugReports.items.details.bullets') as string[]
        },
        {
          title: t('sections.bugReports.items.expectation.title'),
          description: t('sections.bugReports.items.expectation.description')
        }
      ]
    },
    {
      title: t('sections.featureRequests.title'),
      items: [
        {
          title: t('sections.featureRequests.items.context.title'),
          description: t('sections.featureRequests.items.context.description')
        },
        {
          title: t('sections.featureRequests.items.examples.title'),
          bullets: t.raw('sections.featureRequests.items.examples.bullets') as string[]
        }
      ]
    },
    {
      title: t('sections.triage.title'),
      items: [
        {
          title: t('sections.triage.items.process.title'),
          description: t('sections.triage.items.process.description')
        },
        {
          title: t('sections.triage.items.updates.title'),
          description: t('sections.triage.items.updates.description')
        }
      ]
    }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-lime-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-950 py-12">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="mb-10 flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-lime-600 dark:text-lime-300">
              {t('meta.kicker')}
            </p>
            <h1 className="flex items-center gap-2 text-4xl font-bold leading-tight text-gray-900 dark:text-white">
              <MessageCircleHeart className="h-8 w-8 text-lime-500" aria-hidden />
              {t('pageTitle')}
            </h1>
            <p className="max-w-3xl text-base text-gray-700 dark:text-gray-300">{t('subtitle', { domain: DOMAIN })}</p>
          </div>
          <Link
            href="/"
            locale={locale}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:border-lime-200 hover:text-lime-700 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-lime-700"
          >
            <ArrowLeft size={16} />
            {t('backToHome')}
          </Link>
        </div>

        <div className="space-y-6">
          <AgreementDisclaimer
            title={disclaimerT('title')}
            description={disclaimerT('description')}
            note={disclaimerT('note')}
          />

          <div className="rounded-2xl border border-gray-100 bg-white/80 p-8 shadow-xl shadow-lime-100/40 backdrop-blur dark:border-gray-800 dark:bg-gray-900/70 dark:shadow-none">
            <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300">
              {t('intro', { domain: DOMAIN })}
            </p>

            <div className="mt-8 space-y-8">
              {sections.map((section) => (
                <section key={section.title} className="space-y-4">
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{section.title}</h2>
                  <div className="space-y-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
                    {section.items.map((item) => (
                      <div key={item.title} className="space-y-2">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{item.title}</p>
                        {item.description ? (
                          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{item.description}</p>
                        ) : null}
                        {item.bullets?.length ? (
                          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-300">
                            {item.bullets.map((bullet) => (
                              <li key={bullet}>{bullet}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-blue-900 shadow-sm dark:border-blue-500/40 dark:bg-blue-900/40 dark:text-blue-50">
          <p className="text-sm font-semibold">{t('contactCallout.title')}</p>
          <p className="text-sm leading-relaxed">{t('contactCallout.description', { email: CONTACT_EMAIL })}</p>
          <a
            className="mt-2 inline-block text-sm font-medium text-blue-800 underline underline-offset-4 transition hover:text-blue-600 dark:text-blue-200 dark:hover:text-blue-50"
            href={`mailto:${CONTACT_EMAIL}`}
          >
            {CONTACT_EMAIL}
          </a>
        </div>
      </div>
    </main>
  );
}
