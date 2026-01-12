import { unstable_cache as nextCache } from 'next/cache';
import { remark } from 'remark';
import html from 'remark-html';
import remarkGfm from 'remark-gfm';
import { type Locale, locales } from '@/i18n.config';
import { SITE_ID, directus, readDirectusItems, type PostTranslation } from './directus';

export interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

export interface BlogSummary {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  locale: Locale;
  readingMinutes: number;
}

export interface BlogPost extends BlogSummary {
  contentHtml: string;
  markdown: string;
  wordCount: number;
  headings: HeadingItem[];
}

export interface BlogListResult {
  posts: BlogSummary[];
  total: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
}

const disableBlogCache = process.env.DISABLE_BLOG_CACHE === 'true';
const LIST_REVALIDATE_SECONDS = 86400; // 24 hours
const DETAIL_REVALIDATE_SECONDS = 86400; // 24 hours

export async function getAllPostsFromCMS(
  locale: Locale,
  options?: { page?: number; perPage?: number },
): Promise<BlogListResult> {
  const page = Math.max(1, options?.page ?? 1);
  const perPage = Math.max(1, options?.perPage ?? 9);
  const posts = await getAllPostsFromCMSInternal(locale);
  const total = posts.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const sliceStart = (page - 1) * perPage;
  const sliceEnd = sliceStart + perPage;

  return {
    posts: posts.slice(sliceStart, sliceEnd),
    total,
    totalPages,
    currentPage: page,
    perPage,
  };
}

export async function getPostBySlugFromCMS(slug: string, locale: Locale): Promise<BlogPost | null> {
  const fetcher = async () => getPostBySlugFromCMSInternal(slug, locale);
  if (disableBlogCache) {
    return fetcher();
  }

  return nextCache(fetcher, ['directus-blog-detail', slug, locale], {
    revalidate: DETAIL_REVALIDATE_SECONDS,
    tags: ['posts', `post:${slug}`, `post:${slug}:${locale}`],
  })();
}

export async function getAllPostSlugsFromCMS(): Promise<Array<{ slug: string; locale: Locale }>> {
  const localized = await Promise.all(
    locales.map(async (locale) => {
      const posts = await getAllPostsFromCMSInternal(locale);
      return posts.map((post) => ({ slug: post.slug, locale }));
    }),
  );

  return localized.flat();
}

export async function getLocalesWithBlogContent(): Promise<Locale[]> {
  const results = await Promise.all(
    locales.map(async (locale) => {
      const posts = await getAllPostsFromCMSInternal(locale);
      return posts.length > 0 ? locale : null;
    }),
  );

  return results.filter((locale): locale is Locale => Boolean(locale));
}

export async function getLocalesForPost(slug: string): Promise<Locale[]> {
  const results = await Promise.all(
    locales.map(async (locale) => {
      const post = await getPostBySlugFromCMS(slug, locale);
      return post ? locale : null;
    }),
  );

  return results.filter((locale): locale is Locale => Boolean(locale));
}

async function getAllPostsFromCMSInternal(locale: Locale): Promise<BlogSummary[]> {
  const fetcher = async () => {
    try {
      const posts = await directus.request(
        readDirectusItems('posts', {
          fields: ['id', 'slug', 'title', 'description', 'published_at', 'content'],
          filter: {
            status: { _eq: 'published' },
            ...(SITE_ID ? { site_id: { _eq: SITE_ID } } : {}),
          },
          sort: ['-published_at'],
        }),
      );

      if (!posts || posts.length === 0) {
        return [];
      }

      const postIds = posts.map((post) => post.id);
      const translations = await directus.request(
        readDirectusItems('post_translation', {
          fields: ['id', 'post_id', 'language_code', 'title', 'description', 'content'],
          filter: {
            post_id: { _in: postIds },
            language_code: { _eq: locale },
          },
        }),
      );

      const translationMap = new Map<string, PostTranslation>();
      translations.forEach((translation) => {
        translationMap.set(translation.post_id, translation);
      });

      return posts
        .filter((post) => {
          if (locale === 'en') {
            return true;
          }
          return translationMap.has(post.id);
        })
        .map((post) => {
          const translation = translationMap.get(post.id);
          const title = translation?.title ?? post.title;
          const description = translation?.description ?? post.description;
          const contentForRead = translation?.content ?? translation?.description ?? post.description ?? '';
          const { readingMinutes } = analyzeContent(contentForRead);

          return {
            slug: post.slug,
            title,
            description,
            publishedAt: post.published_at,
            locale,
            readingMinutes,
          };
        });
    } catch {
      return [];
    }
  };

  if (disableBlogCache) {
    return fetcher();
  }

  return nextCache(fetcher, ['directus-blog-list', locale], {
    revalidate: LIST_REVALIDATE_SECONDS,
    tags: ['posts', `posts:${locale}`, `posts:${locale}:${SITE_ID}`],
  })();
}

async function getPostBySlugFromCMSInternal(slug: string, locale: Locale): Promise<BlogPost | null> {
  try {
    const posts = await directus.request(
      readDirectusItems('posts', {
        fields: ['id', 'slug', 'title', 'description', 'content', 'published_at'],
        filter: {
          slug: { _eq: slug },
          status: { _eq: 'published' },
          ...(SITE_ID ? { site_id: { _eq: SITE_ID } } : {}),
        },
        limit: 1,
      }),
    );

    if (!posts || posts.length === 0) {
      return null;
    }

    const post = posts[0];
    const translations =
      locale === 'en'
        ? await directus.request(
            readDirectusItems('post_translation', {
              fields: ['id', 'post_id', 'language_code', 'title', 'description', 'content'],
              filter: {
                post_id: { _eq: post.id },
              },
              limit: 1,
            }),
          )
        : await directus.request(
            readDirectusItems('post_translation', {
              fields: ['id', 'post_id', 'language_code', 'title', 'description', 'content'],
              filter: {
                post_id: { _eq: post.id },
                language_code: { _eq: locale },
              },
              limit: 1,
            }),
          );

    const translation = translations?.[0];
    if (!translation && locale !== 'en') {
      return null;
    }

    const markdown = translation?.content || post.content || '';
    const { readingMinutes, wordCount } = analyzeContent(markdown);
    const { html: contentHtml, headings } = await renderMarkdown(markdown);

    return {
      slug: post.slug,
      title: translation?.title ?? post.title,
      description: translation?.description ?? post.description,
      publishedAt: post.published_at,
      contentHtml,
      markdown,
      readingMinutes,
      wordCount,
      locale,
      headings,
    };
  } catch {
    return null;
  }
}

function analyzeContent(content: string): { readingMinutes: number; wordCount: number } {
  const words = content.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 200));
  return { readingMinutes, wordCount };
}

async function renderMarkdown(markdown: string): Promise<{ html: string; headings: HeadingItem[] }> {
  const headings: HeadingItem[] = [];
  const slugify = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  interface MarkdownNode {
    type?: string;
    value?: string;
    depth?: number;
    children?: MarkdownNode[];
    data?: {
      hProperties?: Record<string, unknown>;
    };
  }

  const addHeadingAnchors = () => (tree: MarkdownNode) => {
    const used = new Set<string>();

    const getText = (node: MarkdownNode | undefined): string => {
      if (!node) return '';
      if (node.type === 'text') return node.value || '';
      if (Array.isArray(node.children)) {
        return node.children.map(getText).join('');
      }
      return '';
    };

    const visit = (node: MarkdownNode) => {
      if (node.type === 'heading' && (node.depth === 2 || node.depth === 3)) {
        const raw = getText(node) || 'section';
        const base = slugify(raw) || 'section';
        let id = base;
        let count = 2;
        while (used.has(id)) {
          id = `${base}-${count}`;
          count += 1;
        }
        used.add(id);

        node.data = node.data || {};
        node.data.hProperties = { ...(node.data.hProperties || {}), id };
        headings.push({ id, text: raw, level: node.depth });
      }

      if (Array.isArray(node.children)) {
        node.children.forEach(visit);
      }
    };

    visit(tree);
  };

  const processed = await remark().use(remarkGfm).use(addHeadingAnchors).use(html).process(markdown);
  return { html: String(processed), headings };
}
