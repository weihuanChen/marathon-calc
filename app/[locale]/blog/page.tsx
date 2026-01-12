import { type Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { type Locale } from '@/i18n.config';
import { getAllPostsFromCMS, getLocalesWithBlogContent } from '@/lib/cms-blog';
import { SITE_URL } from '@/lib/site';

export const revalidate = 43200;

type Params = Promise<{ locale: Locale }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const [t, listResult, localesWithContent] = await Promise.all([
    getTranslations({ locale, namespace: 'blog' }),
    getAllPostsFromCMS(locale, { page: 1, perPage: 9 }),
    getLocalesWithBlogContent(),
  ]);

  const hasContent = listResult.total > 0;
  const canonicalPath = `${SITE_URL}${locale === 'en' ? '' : `/${locale}`}/blog`;
  const isIndexable = hasContent && listResult.total > 3;

  const languages = localesWithContent.reduce<Record<string, string>>((acc, loc) => {
    const href = `${SITE_URL}${loc === 'en' ? '' : `/${loc}`}/blog`;
    acc[loc] = href;
    if (loc === 'en') {
      acc['x-default'] = href;
    }
    return acc;
  }, {});

  return {
    title: t('meta.title'),
    description: t('meta.description'),
    alternates: {
      canonical: canonicalPath,
      ...(Object.keys(languages).length > 0 ? { languages } : {}),
    },
    robots: {
      index: isIndexable,
      follow: true,
    },
  };
}

export default async function BlogPage({ params }: { params: Params }) {
  const { locale } = await params;
  return renderBlogList(locale, 1);
}

function formatDate(date: string, locale: Locale): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  } catch (error) {
    console.error('Error formatting date:', error);
    return date;
  }
}

export async function renderBlogList(locale: Locale, page: number) {
  const [t, listResult] = await Promise.all([
    getTranslations({ locale, namespace: 'blog' }),
    getAllPostsFromCMS(locale, { page, perPage: 9 }),
  ]);

  const hasContent = listResult.posts.length > 0;

  return (
    <main className="min-h-screen bg-surface text-ink mesh-bg">
      <div className="relative w-full max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-14">
        <header className="mb-10">
          <div className="mb-4">
            <Link
              href="/"
              locale={locale}
              className="inline-flex items-center gap-2 rounded-full bg-white/80 dark:bg-black/50 with-grain px-4 py-2 text-sm font-semibold text-ink/80 dark:text-white/80 ring-1 ring-gray-200/80 dark:ring-gray-800/80 transition hover:-translate-y-0.5 hover:shadow-sm hover:text-accent"
            >
              <span aria-hidden>←</span>
              {t('backToHome')}
            </Link>
          </div>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/80 dark:bg-black/50 with-grain px-3 py-1 text-xs uppercase tracking-[0.2em] text-muted ring-1 ring-gray-200 dark:ring-gray-800">
            {t('meta.kicker')}
          </p>
          <h1 className="mt-4 font-display text-4xl md:text-5xl text-ink dark:text-white drop-shadow-sm">
            {t('title')}
          </h1>
          <p className="mt-3 max-w-2xl text-base md:text-lg text-muted">
            {t('lead')}
          </p>
          {listResult.totalPages > 1 ? (
            <p className="mt-2 text-sm text-muted">
              {t('pagination.pageOf', { page: listResult.currentPage, total: listResult.totalPages })}
            </p>
          ) : null}
        </header>

        {!hasContent ? (
          <section className="rounded-3xl bg-white/85 dark:bg-black/40 with-grain ring-1 ring-gray-200/80 dark:ring-gray-800/80 p-6 md:p-8 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.35)]">
            <p className="text-lg font-semibold text-ink dark:text-white">{t('empty.title')}</p>
            <p className="mt-2 text-muted">{t('empty.description')}</p>
            <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent">
              <Link href="/blog" locale="en" className="underline underline-offset-4">
                {t('empty.cta')}
              </Link>
            </div>
          </section>
        ) : (
          <>
            <section className="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
              {listResult.posts.map((post) => (
                <article
                  key={post.slug}
                  className="group relative overflow-hidden rounded-3xl bg-white/85 dark:bg-black/50 with-grain ring-1 ring-gray-200/80 dark:ring-gray-800/80 p-6 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.35)] transition hover:-translate-y-1 hover:shadow-[0_30px_80px_-50px_rgba(0,0,0,0.45)]"
                >
                  <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-accent font-semibold">
                      {post.title.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="rounded-full bg-ink/5 dark:bg-white/10 px-3 py-1 text-[11px] font-semibold text-ink/70 dark:text-white/80">
                      {formatDate(post.publishedAt, locale)}
                    </span>
                    <span className="text-ink/60 dark:text-white/70">
                      • {t('readingTime', { minutes: post.readingMinutes })}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    <h2 className="text-2xl font-display text-ink dark:text-white">
                      <Link
                        href={`/blog/${post.slug}`}
                        locale={locale}
                        className="transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        {post.title}
                      </Link>
                    </h2>
                    <p className="text-muted leading-relaxed line-clamp-3">{post.description}</p>
                  </div>

                  <div className="mt-6 flex items-center justify-between text-sm text-ink/70 dark:text-white/70">
                    <Link
                      href={`/blog/${post.slug}`}
                      locale={locale}
                      className="inline-flex items-center gap-2 font-semibold"
                    >
                      {t('readMore')}
                      <span aria-hidden className="transition group-hover:translate-x-1">→</span>
                    </Link>
                  </div>
                </article>
              ))}
            </section>

            {listResult.totalPages > 1 ? (
              <nav className="mt-10 flex items-center justify-between text-sm text-muted">
                <PaginationLink
                  locale={locale}
                  page={listResult.currentPage - 1}
                  disabled={listResult.currentPage <= 1}
                  label={t('pagination.previous')}
                />
                <span className="font-semibold text-ink/80 dark:text-white/80">
                  {t('pagination.pageOf', { page: listResult.currentPage, total: listResult.totalPages })}
                </span>
                <PaginationLink
                  locale={locale}
                  page={listResult.currentPage + 1}
                  disabled={listResult.currentPage >= listResult.totalPages}
                  label={t('pagination.next')}
                />
              </nav>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}

function PaginationLink({
  locale,
  page,
  disabled,
  label,
}: {
  locale: Locale;
  page: number;
  disabled: boolean;
  label: string;
}) {
  if (disabled) {
    return <span className="opacity-50">{label}</span>;
  }

  const href = page <= 1 ? '/blog' : `/blog/page/${page}`;

  return (
    <Link
      href={href}
      locale={locale}
      className="inline-flex items-center gap-2 rounded-full bg-ink/5 dark:bg-white/10 px-3 py-2 font-semibold text-ink/80 dark:text-white/80 ring-1 ring-ink/10 dark:ring-white/10 transition hover:-translate-y-0.5 hover:shadow-sm"
    >
      {label}
    </Link>
  );
}
