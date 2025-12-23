import type { MetadataRoute } from 'next';

const DISALLOWED_PATHS = [
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
