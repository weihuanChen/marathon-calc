import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

const DISALLOWED_PATHS = [
  '/_next/',
  '/api/',
  '/assets/',
  '/static/',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: DISALLOWED_PATHS,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
