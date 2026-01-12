import type { MetadataRoute } from 'next';
import { locales } from '@/i18n.config';
import { getAllPostsFromCMS, getLocalesForPost, getLocalesWithBlogContent, getPostBySlugFromCMS } from '@/lib/cms-blog';
import { SITE_URL } from '@/lib/site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  const staticPaths = ['', '/privacy-policy', '/support', '/user-service'];

  locales.forEach((locale) => {
    const prefix = locale === 'en' ? '' : `/${locale}`;
    staticPaths.forEach((path) => {
      const languages = buildLanguages(locales, (loc) => `${SITE_URL}${loc === 'en' ? '' : `/${loc}`}${path}`);
      entries.push({
        url: `${SITE_URL}${prefix}${path}`,
        alternates: { languages },
      });
    });
  });

  // 尝试获取博客内容，如果失败则只返回静态页面
  try {
    const localesWithPosts = await getLocalesWithBlogContent();
    const blogLocalesData = await Promise.all(
      localesWithPosts.map(async (locale) => {
        try {
          const result = await getAllPostsFromCMS(locale);
          return {
            locale,
            posts: result.posts || [],
          };
        } catch {
          return {
            locale,
            posts: [],
          };
        }
      }),
    );

    // Blog index pages: only include locales with more than 3 published, translated posts
    const localesWithIndex = blogLocalesData.filter(({ posts }) => posts.length > 3).map(({ locale }) => locale);

    blogLocalesData.forEach(({ locale, posts }) => {
      if (posts.length > 3) {
        const languages = buildLanguages(localesWithIndex, (loc) => `${SITE_URL}${loc === 'en' ? '' : `/${loc}`}/blog`);

        entries.push({
          url: `${SITE_URL}${locale === 'en' ? '' : `/${locale}`}/blog`,
          alternates: { languages },
        });
      }
    });

    // Blog detail pages: include only translated posts with enough content (>= 500 words)
    for (const { locale, posts } of blogLocalesData) {
      if (!Array.isArray(posts)) {
        continue;
      }
      for (const post of posts) {
        try {
          const detail = await getPostBySlugFromCMS(post.slug, locale);
          if (!detail || detail.wordCount < 500) {
            continue;
          }

          const availableLocales = await getLocalesForPost(post.slug);
          const languages = buildLanguages(availableLocales, (loc) => `${SITE_URL}${loc === 'en' ? '' : `/${loc}`}/blog/${post.slug}`);

          entries.push({
            url: `${SITE_URL}${locale === 'en' ? '' : `/${locale}`}/blog/${post.slug}`,
            lastModified: new Date(post.publishedAt),
            alternates: { languages },
          });
        } catch {
          // 跳过无法获取详情的文章
          continue;
        }
      }
    }
  } catch (error) {
    // 如果 CMS 不可用，只返回静态页面
    console.warn('CMS unavailable during sitemap generation, returning static pages only:', error);
  }

  return entries;
}

function buildLanguages(langs: readonly string[], buildHref: (locale: string) => string): Record<string, string> {
  const languages: Record<string, string> = {};
  langs.forEach((locale) => {
    const href = buildHref(locale);
    languages[locale] = href;
    if (locale === 'en') {
      languages['x-default'] = href;
    }
  });
  return languages;
}
