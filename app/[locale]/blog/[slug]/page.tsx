import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { type Locale } from '@/i18n.config';
import { Link } from '@/i18n/routing';
import {
  getAllPostSlugsFromCMS,
  getLocalesForPost,
  getPostBySlugFromCMS,
} from '@/lib/cms-blog';
import { SITE_URL } from '@/lib/site';
import { BlogSidebarToc } from '@/components/blog-sidebar-toc';

export const revalidate = 43200;

type Params = Promise<{ locale: Locale; slug: string }>;

export async function generateStaticParams() {
  const slugs = await getAllPostSlugsFromCMS();
  return slugs.map(({ slug, locale }) => ({ slug, locale }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const [post, availableLocales] = await Promise.all([
    getPostBySlugFromCMS(slug, locale),
    getLocalesForPost(slug),
  ]);

  const canonical = `${SITE_URL}${locale === 'en' ? '' : `/${locale}`}/blog/${slug}`;
  const languages = availableLocales.reduce<Record<string, string>>((acc, loc) => {
    const href = `${SITE_URL}${loc === 'en' ? '' : `/${loc}`}/blog/${slug}`;
    acc[loc] = href;
    if (loc === 'en') {
      acc['x-default'] = href;
    }
    return acc;
  }, {});

  if (!post) {
    return {
      title: 'Blog',
      description: '',
      alternates: {
        canonical,
        ...(Object.keys(languages).length > 0 ? { languages } : {}),
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const indexable = post.wordCount >= 500;

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical,
      ...(Object.keys(languages).length > 0 ? { languages } : {}),
    },
    robots: {
      index: indexable,
      follow: true,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: canonical,
      locale,
      type: 'article',
      publishedTime: post.publishedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  const [post, t] = await Promise.all([
    getPostBySlugFromCMS(slug, locale),
    getTranslations({ locale, namespace: 'blog' }),
  ]);

  if (!post) {
    notFound();
  }

  const isIndexable = post.wordCount >= 500;
  const canonical = `${SITE_URL}${locale === 'en' ? '' : `/${locale}`}/blog/${slug}`;
  const structuredData = isIndexable
    ? buildStructuredData({
        postTitle: post.title,
        description: post.description,
        publishedAt: post.publishedAt,
        canonical,
        locale,
      })
    : null;
  const tocItems = post.headings?.filter((heading) => heading.level === 2 || heading.level === 3) ?? [];

  return (
    <main className="min-h-screen bg-surface text-ink mesh-bg">
      <div className="relative w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
        <Link
          href="/blog"
          locale={locale}
          className="inline-flex items-center gap-2 text-sm font-semibold text-ink/70 dark:text-white/70 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
        >
          ← {t('backToList')}
        </Link>

        <header className="mt-8 mb-8 space-y-4">
          <p className="text-xs uppercase tracking-[0.25em] text-muted">{t('meta.kicker')}</p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-ink dark:text-white drop-shadow-sm leading-tight">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
            <span className="rounded-full bg-ink/5 dark:bg-white/10 px-4 py-1.5 text-ink/70 dark:text-white/70 font-medium">
              {formatDate(post.publishedAt, locale)}
            </span>
            <span aria-hidden className="text-ink/40 dark:text-white/40">•</span>
            <span className="text-ink/70 dark:text-white/70">{t('readingTime', { minutes: post.readingMinutes })}</span>
          </div>
        </header>

        {/* Main Layout: Article Content + Sidebar TOC */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 lg:gap-12">
          {/* Left Column: Article */}
          <div className="min-w-0">
            {/* Top CTA Card */}
            <aside className="mb-8">
              <div className="overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-700/60 bg-gradient-to-r from-orange-50/50 via-white to-white dark:from-orange-950/20 dark:via-gray-900 dark:to-gray-900 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.35)]">
                <div className="flex flex-col gap-4 p-6 md:p-7 lg:p-8 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <p className="text-sm uppercase tracking-[0.2em] text-gray-600 dark:text-gray-400">
                      {t('meta.kicker')}
                    </p>
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">
                      {t('cta.title')}
                    </h2>
                    <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 max-w-2xl">
                      {t('cta.description')}
                    </p>
                  </div>
                  <Link
                    href="/"
                    locale={locale}
                    className="inline-flex items-center justify-center rounded-full bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 text-sm font-semibold shadow-lg shadow-orange-600/30 hover:shadow-orange-600/40 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                  >
                    {t('cta.action')}
                  </Link>
                </div>
              </div>
            </aside>

            {/* Mobile TOC (shown only on small screens) */}
            {tocItems.length > 0 && (
              <nav className="mb-8 lg:hidden">
                <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700/60 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.35)] p-5">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <p className="text-xs uppercase tracking-[0.22em] font-semibold text-gray-700 dark:text-gray-300">
                      {t('toc.title')}
                    </p>
                  </div>
                  <ol className="space-y-2">
                    {tocItems.map((item) => (
                      <li key={item.id} className="group">
                        <a
                          href={`#${item.id}`}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-600 dark:text-orange-400">
                            {item.level === 2 ? 'H2' : 'H3'}
                          </span>
                          <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white line-clamp-2">
                            {item.text}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              </nav>
            )}

            {/* Article Content */}
            <article className="blog-content bg-white/95 dark:bg-gray-900/95 with-grain ring-1 ring-gray-200/80 dark:ring-gray-700/60 rounded-2xl p-6 md:p-8 lg:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.35)]">
              <div dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
            </article>

            {/* Bottom CTA Card */}
            <aside className="mt-10">
              <Link
                href="/"
                locale={locale}
                className="group block overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-700/60 bg-gradient-to-r from-orange-50/50 via-white to-white dark:from-orange-950/20 dark:via-gray-900 dark:to-gray-900 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
              >
                <div className="flex flex-col gap-4 p-6 md:p-7 lg:p-8 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <p className="text-sm uppercase tracking-[0.2em] text-gray-600 dark:text-gray-400">
                      {t('meta.kicker')}
                    </p>
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">
                      {t('cta.title')}
                    </h2>
                    <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 max-w-2xl">
                      {t('cta.description')}
                    </p>
                  </div>
                  <span className="inline-flex items-center justify-center rounded-full bg-orange-600 text-white px-6 py-3 text-sm font-semibold shadow-lg shadow-orange-600/30 transition group-hover:bg-orange-700">
                    {t('cta.action')}
                  </span>
                </div>
              </Link>
            </aside>
          </div>

          {/* Right Column: Sticky Sidebar TOC */}
          <BlogSidebarToc headings={tocItems} />
        </div>

        {structuredData ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
        ) : null}
      </div>
    </main>
  );
}

function formatDate(date: string, locale: Locale): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  } catch (error) {
    console.error('Error formatting post date:', error);
    return date;
  }
}

function buildStructuredData({
  postTitle,
  description,
  publishedAt,
  canonical,
  locale,
}: {
  postTitle: string;
  description: string;
  publishedAt: string;
  canonical: string;
  locale: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: postTitle,
    description,
    datePublished: publishedAt,
    dateModified: publishedAt,
    inLanguage: locale,
    mainEntityOfPage: canonical,
    url: canonical,
    author: {
      '@type': 'Organization',
      name: 'Marathon Pace Studio',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Marathon Pace Studio',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/og-image.png`,
      },
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: SITE_URL,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Blog',
          item: `${SITE_URL}/blog`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: postTitle,
          item: canonical,
        },
      ],
    },
  };
}
