import type { MetadataRoute } from 'next';

const DISALLOWED_PATHS = [
  '/_next/',      // Next.js build output and static chunks
  '/static/',     // generic static asset bucket
  '/assets/',     // any compiled asset folder
  '/build/',      // build artifacts if exposed
  '/api/',        // API endpoints should not be indexed
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
  };
}
