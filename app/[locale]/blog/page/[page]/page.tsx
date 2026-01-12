import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { type Locale } from '@/i18n.config';
import { getAllPostsFromCMS, getLocalesWithBlogContent } from '@/lib/cms-blog';
import { SITE_URL } from '@/lib/site';
import { renderBlogList } from '../../page';

type Params = Promise<{ locale: Locale; page: string }>;

export const revalidate = 43200;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, page } = await params;
  const pageNumber = Number(page);
  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    return {};
  }

  const [t, listResult, localesWithContent] = await Promise.all([
    getTranslations({ locale, namespace: 'blog' }),
    getAllPostsFromCMS(locale, { page: pageNumber, perPage: 9 }),
    getLocalesWithBlogContent(),
  ]);

  if (listResult.total === 0 || pageNumber > listResult.totalPages) {
    return {
      title: t('meta.title'),
      description: t('meta.description'),
      robots: { index: false, follow: false },
    };
  }

  const canonicalPath = `${SITE_URL}${locale === 'en' ? '' : `/${locale}`}/blog/page/${pageNumber}`;
  const languages = localesWithContent.reduce<Record<string, string>>((acc, loc) => {
    const href = `${SITE_URL}${loc === 'en' ? '' : `/${loc}`}/blog/page/${pageNumber}`;
    acc[loc] = href;
    if (loc === 'en') {
      acc['x-default'] = href;
    }
    return acc;
  }, {});

  return {
    title: `${t('meta.title')} - ${t('pagination.pageTitle', { page: pageNumber })}`,
    description: t('meta.description'),
    alternates: {
      canonical: canonicalPath,
      ...(Object.keys(languages).length > 0 ? { languages } : {}),
    },
    robots: {
      index: listResult.total > 3,
      follow: true,
    },
  };
}

export default async function BlogPageWithPagination({ params }: { params: Params }) {
  const { locale, page } = await params;
  const pageNumber = Number(page);
  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    notFound();
  }

  const listResult = await getAllPostsFromCMS(locale, { page: pageNumber, perPage: 9 });
  if (listResult.total === 0 || pageNumber > listResult.totalPages) {
    notFound();
  }

  return renderBlogList(locale, pageNumber);
}
